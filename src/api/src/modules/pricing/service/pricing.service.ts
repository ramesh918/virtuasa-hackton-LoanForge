import { Inject, Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { IntakeService } from '../../intake/service/intake.service.js';
import { PRICING_REPOSITORY } from '../repository/pricing.repository.js';
import type { PricingRepository } from '../repository/pricing.repository.js';
import { RATE_BANDS, RateBand } from '../config/rate-bands.config.js';
import { Offer } from '../schema/offer.schema.js';
import { Money } from '../../../domain/money.js';

@Injectable()
export class PricingService {
  constructor(
    private readonly intakeService: IntakeService,
    @Inject(PRICING_REPOSITORY) private readonly repository: PricingRepository,
  ) {}

  /** AC-04: first (highest) threshold the score clears — RATE_BANDS is ordered descending. */
  assignRateBand(creditScore: number): RateBand {
    const band = RATE_BANDS.find((candidate) => creditScore >= candidate.minScore);
    return band ?? RATE_BANDS[RATE_BANDS.length - 1];
  }

  /**
   * AC-04, NFR-01: standard EMI formula, fixed-point throughout, per
   * .claude/skills/emi-calculator/SKILL.md. Never touches native `number` arithmetic.
   */
  computeEmi(principal: Money, annualRate: Decimal, tenureMonths: number): Money {
    const monthlyRate = annualRate.dividedBy(12);
    const growth = monthlyRate.plus(1).pow(tenureMonths);
    const numerator = principal.toDecimal().times(monthlyRate).times(growth);
    const denominator = growth.minus(1);
    return Money.of(numerator.dividedBy(denominator));
  }

  async priceApplication(applicationId: string, creditScore: number): Promise<Offer> {
    const application = await this.intakeService.findById(applicationId);
    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    const band = this.assignRateBand(creditScore);
    const annualRate = new Decimal(band.annualRate);
    const principal = Money.of(application.amount);
    const emi = this.computeEmi(principal, annualRate, application.tenureMonths);
    const totalPayable = emi.times(application.tenureMonths);

    const offer: Offer = {
      applicationId,
      rateBandLabel: band.label,
      annualRate: band.annualRate,
      emi: emi.toFixedString(),
      tenureMonths: application.tenureMonths,
      totalPayable: totalPayable.toFixedString(),
    };

    return this.repository.save(offer);
  }

  async getOffer(applicationId: string): Promise<Offer | null> {
    return this.repository.findByApplicationId(applicationId);
  }
}
