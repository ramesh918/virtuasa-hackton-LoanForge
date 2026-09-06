import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EligibilityController } from './eligibility.controller.js';
import { EligibilityService, EligibilityDecision } from '../service/eligibility.service.js';
import { PricingService } from '../../pricing/service/pricing.service.js';
import { UnderwritingService } from '../../underwriting/service/underwriting.service.js';
import { IntakeService } from '../../intake/service/intake.service.js';
import { Application } from '../../intake/schema/application.schema.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { EligibilityRejectionReason } from '../config/eligibility.config.js';

const ownedApplication: Application = {
  applicationId: 'app-1',
  applicantId: 'APP-0001',
  productId: 'PRD-PERSONAL',
  amount: '5000.00',
  tenureMonths: 12,
  purpose: 'home-improvement',
  income: '5200.00',
  employmentType: 'SALARIED',
  state: ApplicationState.SUBMITTED,
};

function buildController(decision: EligibilityDecision, application: Application | null = ownedApplication) {
  const eligibilityService = { evaluate: vi.fn().mockResolvedValue(decision) } as unknown as EligibilityService;
  const pricingService = { priceApplication: vi.fn() } as unknown as PricingService;
  const underwritingService = { transition: vi.fn() } as unknown as UnderwritingService;
  const intakeService = { findById: async () => application } as unknown as IntakeService;

  const controller = new EligibilityController(
    eligibilityService,
    pricingService,
    underwritingService,
    intakeService,
  );
  return { controller, pricingService, underwritingService };
}

describe('EligibilityController (orchestration)', () => {
  it('prices and moves an eligible application to UNDER_REVIEW', async () => {
    const decision: EligibilityDecision = { eligible: true, creditScore: 720, dti: '0.2000' };
    const { controller, pricingService, underwritingService } = buildController(decision);

    const result = await controller.evaluate('app-1', { 'x-role': 'applicant', 'x-applicant-id': 'APP-0001' });

    expect(result).toEqual(decision);
    expect(pricingService.priceApplication).toHaveBeenCalledWith('app-1', 720);
    expect(underwritingService.transition).toHaveBeenCalledWith('app-1', ApplicationState.UNDER_REVIEW);
  });

  it('does not price or transition an ineligible application', async () => {
    const decision: EligibilityDecision = {
      eligible: false,
      reason: EligibilityRejectionReason.INELIGIBLE_INCOME,
    };
    const { controller, pricingService, underwritingService } = buildController(decision);

    const result = await controller.evaluate('app-1', { 'x-role': 'applicant', 'x-applicant-id': 'APP-0001' });

    expect(result).toEqual(decision);
    expect(pricingService.priceApplication).not.toHaveBeenCalled();
    expect(underwritingService.transition).not.toHaveBeenCalled();
  });

  it('rejects a different applicant triggering evaluation [NFR-04]', async () => {
    const { controller } = buildController({ eligible: true, creditScore: 720 });

    await expect(
      controller.evaluate('app-1', { 'x-role': 'applicant', 'x-applicant-id': 'APP-0002' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns 404 for a nonexistent application', async () => {
    const { controller } = buildController({ eligible: true, creditScore: 720 }, null);

    await expect(
      controller.evaluate('missing', { 'x-role': 'applicant', 'x-applicant-id': 'APP-0001' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
