import { describe, expect, it } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DisbursementController } from './disbursement.controller.js';
import { DisbursementService } from '../service/disbursement.service.js';
import { IntakeService } from '../../intake/service/intake.service.js';
import { Application } from '../../intake/schema/application.schema.js';
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

function buildController(application: Application | null) {
  const disbursementService = {
    acceptOffer: async () => ({ applicationId: 'app-1', maskedAccountReference: '****1234' }),
  } as unknown as DisbursementService;
  const intakeService = { findById: async () => application } as unknown as IntakeService;
  return new DisbursementController(disbursementService, intakeService);
}

describe('DisbursementController [NFR-04]', () => {
  it('lets the owning applicant accept their own offer', async () => {
    const controller = buildController(ownedApplication);
    const result = await controller.acceptOffer('app-1', {
      'x-role': 'applicant',
      'x-applicant-id': 'APP-0001',
    });
    expect(result).toMatchObject({ applicationId: 'app-1' });
  });

  it('rejects a different applicant accepting the offer', async () => {
    const controller = buildController(ownedApplication);
    await expect(
      controller.acceptOffer('app-1', { 'x-role': 'applicant', 'x-applicant-id': 'APP-0002' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns 404 for a nonexistent application', async () => {
    const controller = buildController(null);
    await expect(
      controller.acceptOffer('missing', { 'x-role': 'applicant', 'x-applicant-id': 'APP-0001' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
