import { describe, expect, it } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PricingController } from './pricing.controller.js';
import { PricingService } from '../service/pricing.service.js';
import { IntakeService } from '../../intake/service/intake.service.js';
import { Application } from '../../intake/entity/application.entity.js';
import { Offer } from '../entity/offer.entity.js';
import { ApplicationState } from '../../../domain/application-state.js';

const ownedApplication: Application = {
  applicationId: 'app-1',
  applicantId: 'APP-0001',
  productId: 'PRD-PERSONAL',
  amount: '5000.00',
  tenureMonths: 12,
  purpose: 'home-improvement',
  income: '5200.00',
  employmentType: 'SALARIED',
  state: ApplicationState.APPROVED,
};

const offer: Offer = {
  applicationId: 'app-1',
  rateBandLabel: 'PRIME',
  annualRate: '0.10',
  emi: '439.58',
  tenureMonths: 12,
  totalPayable: '5274.96',
};

function buildController(application: Application | null, existingOffer: Offer | null) {
  const pricingService = { getOffer: async () => existingOffer } as unknown as PricingService;
  const intakeService = { findById: async () => application } as unknown as IntakeService;
  return new PricingController(pricingService, intakeService);
}

describe('PricingController [NFR-04]', () => {
  it('returns the offer to the owning applicant', async () => {
    const controller = buildController(ownedApplication, offer);
    const result = await controller.getOffer('app-1', {
      'x-role': 'applicant',
      'x-applicant-id': 'APP-0001',
    });
    expect(result).toEqual(offer);
  });

  it('rejects a different applicant requesting the offer', async () => {
    const controller = buildController(ownedApplication, offer);
    await expect(
      controller.getOffer('app-1', { 'x-role': 'applicant', 'x-applicant-id': 'APP-0002' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns 404 when no offer has been priced yet', async () => {
    const controller = buildController(ownedApplication, null);
    await expect(
      controller.getOffer('app-1', { 'x-role': 'applicant', 'x-applicant-id': 'APP-0001' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
