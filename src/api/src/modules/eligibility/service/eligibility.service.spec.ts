import { describe, expect, it } from 'vitest';
import { EligibilityService } from './eligibility.service.js';
import { ApplicantRepository } from '../repository/applicant.repository.js';
import { BureauStubService, BureauPullResult } from './bureau-stub.service.js';
import { IntakeService } from '../../intake/service/intake.service.js';
import { Application } from '../../intake/schema/application.schema.js';
import { Applicant } from '../schema/applicant.schema.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { Money } from '../../../domain/money.js';
import { EligibilityRejectionReason } from '../config/eligibility.config.js';

function fakeIntakeService(application: Application): IntakeService {
  const store = { ...application };
  return {
    findById: async () => ({ ...store }),
    updateState: async (_id: string, state: ApplicationState) => {
      store.state = state;
      return { ...store };
    },
  } as unknown as IntakeService;
}

function fakeApplicantRepository(applicant: Applicant | null): ApplicantRepository {
  return { findByApplicantId: async () => applicant };
}

function fakeBureauStub(result: BureauPullResult): BureauStubService {
  return { pull: () => result } as unknown as BureauStubService;
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
};

const lowObligations: BureauPullResult = { creditScore: 720, existingMonthlyObligations: Money.of('500.00') };

describe('EligibilityService', () => {
  it('rejects applicant below minimum income with INELIGIBLE_INCOME [AC-02]', async () => {
    const application = { ...baseApplication, income: '1000.00' };
    const service = new EligibilityService(
      fakeIntakeService(application),
      fakeApplicantRepository(baseApplicant),
      fakeBureauStub(lowObligations),
    );

    const decision = await service.evaluate(application.applicationId);

    expect(decision).toMatchObject({ eligible: false, reason: EligibilityRejectionReason.INELIGIBLE_INCOME });
  });

  it('rejects applicant outside age band with INELIGIBLE_AGE [AC-02]', async () => {
    const applicant = { ...baseApplicant, age: 19 };
    const service = new EligibilityService(
      fakeIntakeService(baseApplication),
      fakeApplicantRepository(applicant),
      fakeBureauStub(lowObligations),
    );

    const decision = await service.evaluate(baseApplication.applicationId);

    expect(decision).toMatchObject({ eligible: false, reason: EligibilityRejectionReason.INELIGIBLE_AGE });
  });

  it('rejects ineligible employment type with INELIGIBLE_EMPLOYMENT [AC-02]', async () => {
    const application = { ...baseApplication, employmentType: 'UNEMPLOYED' };
    const service = new EligibilityService(
      fakeIntakeService(application),
      fakeApplicantRepository(baseApplicant),
      fakeBureauStub(lowObligations),
    );

    const decision = await service.evaluate(application.applicationId);

    expect(decision).toMatchObject({
      eligible: false,
      reason: EligibilityRejectionReason.INELIGIBLE_EMPLOYMENT,
    });
  });

  it('computes a credit score from the stubbed bureau pull [AC-03]', async () => {
    const service = new EligibilityService(
      fakeIntakeService(baseApplication),
      fakeApplicantRepository(baseApplicant),
      fakeBureauStub(lowObligations),
    );

    const decision = await service.evaluate(baseApplication.applicationId);

    expect(decision.eligible).toBe(true);
    expect(decision.creditScore).toBe(720);
  });

  it('auto-declines when DTI exceeds the configured ceiling with DTI_EXCEEDED [AC-03]', async () => {
    const highObligations: BureauPullResult = {
      creditScore: 650,
      existingMonthlyObligations: Money.of('4000.00'), // 4000/5000 = 0.8, well above the 0.45 ceiling
    };
    const service = new EligibilityService(
      fakeIntakeService(baseApplication),
      fakeApplicantRepository(baseApplicant),
      fakeBureauStub(highObligations),
    );

    const decision = await service.evaluate(baseApplication.applicationId);

    expect(decision).toMatchObject({ eligible: false, reason: EligibilityRejectionReason.DTI_EXCEEDED });
  });
});
