import { describe, expect, it } from 'vitest';
import { EligibilityService } from './eligibility.service.js';
import { ApplicantRepository } from '../repository/applicant.repository.js';
import { BureauStubService, BureauPullResult } from './bureau-stub.service.js';
import { IntakeService } from '../../intake/service/intake.service.js';
import { UnderwritingService } from '../../underwriting/service/underwriting.service.js';
import { Application } from '../../intake/schema/application.schema.js';
import { Applicant } from '../schema/applicant.schema.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { Money } from '../../../domain/money.js';
import { EligibilityRejectionReason } from '../config/eligibility.config.js';

function fakeIntakeService(application: Application): { intake: IntakeService; store: Application } {
  const store = { ...application };
  const intake = { findById: async () => ({ ...store }) } as unknown as IntakeService;
  return { intake, store };
}

function fakeUnderwritingService(store: Application): UnderwritingService {
  return {
    transition: async (_id: string, state: ApplicationState) => {
      store.state = state;
      return { ...store };
    },
  } as unknown as UnderwritingService;
}

function fakeApplicantRepository(applicant: Applicant | null): ApplicantRepository {
  return { findByApplicantId: async () => applicant };
}

function fakeBureauStub(result: BureauPullResult): BureauStubService {
  return { pull: () => result } as unknown as BureauStubService;
}

function buildService(
  application: Application,
  applicant: Applicant | null,
  bureauResult: BureauPullResult,
): EligibilityService {
  const { intake, store } = fakeIntakeService(application);
  return new EligibilityService(
    intake,
    fakeUnderwritingService(store),
    fakeApplicantRepository(applicant),
    fakeBureauStub(bureauResult),
  );
}

const baseApplication: Application = {
  applicationId: 'app-1',
  applicantId: 'APP-0001',
  productId: 'PRD-PERSONAL',
  amount: '5000.00',
  tenureMonths: 12,
  purpose: 'home-improvement',
  income: '5000.00',
  employmentType: 'SALARIED',
  state: ApplicationState.SUBMITTED,
};

const baseApplicant: Applicant = {
  applicantId: 'APP-0001',
  name: 'Jordan Rivera',
  income: '5000.00',
  age: 34,
  employmentType: 'SALARIED',
  accountNumber: '4000123456781234',
};

const lowObligations: BureauPullResult = { creditScore: 720, existingMonthlyObligations: Money.of('500.00') };

describe('EligibilityService', () => {
  it('rejects applicant below minimum income with INELIGIBLE_INCOME [AC-02]', async () => {
    const application = { ...baseApplication, income: '1000.00' };
    const service = buildService(application, baseApplicant, lowObligations);

    const decision = await service.evaluate(application.applicationId);

    expect(decision).toMatchObject({ eligible: false, reason: EligibilityRejectionReason.INELIGIBLE_INCOME });
  });

  it('rejects applicant outside age band with INELIGIBLE_AGE [AC-02]', async () => {
    const applicant = { ...baseApplicant, age: 19 };
    const service = buildService(baseApplication, applicant, lowObligations);

    const decision = await service.evaluate(baseApplication.applicationId);

    expect(decision).toMatchObject({ eligible: false, reason: EligibilityRejectionReason.INELIGIBLE_AGE });
  });

  it('rejects ineligible employment type with INELIGIBLE_EMPLOYMENT [AC-02]', async () => {
    const application = { ...baseApplication, employmentType: 'UNEMPLOYED' };
    const service = buildService(application, baseApplicant, lowObligations);

    const decision = await service.evaluate(application.applicationId);

    expect(decision).toMatchObject({
      eligible: false,
      reason: EligibilityRejectionReason.INELIGIBLE_EMPLOYMENT,
    });
  });

  it('computes a credit score from the stubbed bureau pull [AC-03]', async () => {
    const service = buildService(baseApplication, baseApplicant, lowObligations);

    const decision = await service.evaluate(baseApplication.applicationId);

    expect(decision.eligible).toBe(true);
    expect(decision.creditScore).toBe(720);
  });

  it('auto-declines when DTI exceeds the configured ceiling with DTI_EXCEEDED [AC-03]', async () => {
    const highObligations: BureauPullResult = {
      creditScore: 650,
      existingMonthlyObligations: Money.of('4000.00'), // 4000/5000 = 0.8, well above the 0.45 ceiling
    };
    const service = buildService(baseApplication, baseApplicant, highObligations);

    const decision = await service.evaluate(baseApplication.applicationId);

    expect(decision).toMatchObject({ eligible: false, reason: EligibilityRejectionReason.DTI_EXCEEDED });
  });
});
