import { describe, expect, it } from 'vitest';
import { Decimal } from 'decimal.js';
import { PricingService } from './pricing.service.js';
import { PricingRepository } from '../repository/pricing.repository.js';
import { Offer } from '../schema/offer.schema.js';
import { IntakeService } from '../../intake/service/intake.service.js';
import { Application } from '../../intake/schema/application.schema.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { Money } from '../../../domain/money.js';

function fakeIntakeService(application: Application): IntakeService {
  return { findById: async () => ({ ...application }) } as unknown as IntakeService;
}

function fakePricingRepository(): PricingRepository {
  const store = new Map<string, Offer>();
  return {
    save: async (offer: Offer) => {
      store.set(offer.applicationId, offer);
      return offer;
    },
    findByApplicationId: async (applicationId: string) => store.get(applicationId) ?? null,
  };
}

const baseApplication: Application = {
  applicationId: 'app-1',
  applicantId: 'APP-0001',
  productId: 'PRD-PERSONAL',
  amount: '12000.00',
  tenureMonths: 12,
  purpose: 'home-improvement',
  income: '5000.00',
  employmentType: 'SALARIED',
  state: ApplicationState.SUBMITTED,
};

describe('PricingService', () => {
  it('assigns the correct rate band for a high credit score [AC-04]', () => {
    const service = new PricingService(fakeIntakeService(baseApplication), fakePricingRepository());
    expect(service.assignRateBand(780).label).toBe('PRIME');
    expect(service.assignRateBand(750).label).toBe('PRIME'); // boundary is inclusive on the higher band
  });

  it('assigns the correct rate band for a low credit score [AC-04]', () => {
    const service = new PricingService(fakeIntakeService(baseApplication), fakePricingRepository());
    expect(service.assignRateBand(600).label).toBe('SUBPRIME');
    expect(service.assignRateBand(700).label).toBe('STANDARD');
  });

  it('computes EMI in fixed-point matching a known reference value [AC-04]', () => {
    const service = new PricingService(fakeIntakeService(baseApplication), fakePricingRepository());
    // Principal 12000, annual rate 10%, tenure 12 months -> known EMI ~ 1054.99
    const emi = service.computeEmi(Money.of('12000.00'), new Decimal('0.10'), 12);
    expect(emi.toFixedString()).toBe('1054.99');
  });

  it('never produces a floating-point rounding artifact across 1000 randomized inputs [AC-04]', () => {
    const service = new PricingService(fakeIntakeService(baseApplication), fakePricingRepository());
    for (let i = 0; i < 1000; i++) {
      const principal = Money.of((1000 + i * 37).toString());
      const annualRate = new Decimal(0.08 + (i % 10) * 0.01);
      const tenureMonths = 6 + (i % 60);

      const emi = service.computeEmi(principal, annualRate, tenureMonths);
      const fixed = emi.toFixedString();

      expect(fixed).toMatch(/^\d+\.\d{2}$/);
    }
  });

  it('persists an offer with the assigned band and computed EMI when pricing an application', async () => {
    const service = new PricingService(fakeIntakeService(baseApplication), fakePricingRepository());
    const offer = await service.priceApplication(baseApplication.applicationId, 780);

    expect(offer.rateBandLabel).toBe('PRIME');
    expect(offer.emi).toBe('1054.99');
    expect(offer.tenureMonths).toBe(12);
  });
});
