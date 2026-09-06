import { Inject, Injectable } from '@nestjs/common';
import { IntakeService } from '../../intake/service/intake.service.js';
import { UnderwritingService } from '../../underwriting/service/underwriting.service.js';
import { APPLICANT_REPOSITORY } from '../repository/applicant.repository.js';
import type { ApplicantRepository } from '../repository/applicant.repository.js';
import { BureauStubService } from './bureau-stub.service.js';
import { eligibilityConfig, EligibilityRejectionReason } from '../config/eligibility.config.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { Money } from '../../../domain/money.js';

export interface EligibilityDecision {
  eligible: boolean;
  reason?: EligibilityRejectionReason;
  creditScore?: number;
  dti?: string;
}

@Injectable()
export class EligibilityService {
  constructor(
    private readonly intakeService: IntakeService,
    private readonly underwritingService: UnderwritingService,
    @Inject(APPLICANT_REPOSITORY) private readonly applicantRepository: ApplicantRepository,
    private readonly bureauStub: BureauStubService,
  ) {}

  async evaluate(applicationId: string): Promise<EligibilityDecision> {
    const application = await this.intakeService.findById(applicationId);
    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    const applicant = await this.applicantRepository.findByApplicantId(application.applicantId);

    // AC-02: income, then age, then employment — fixed priority order for a deterministic reason.
    if (Money.of(application.income).isLessThan(Money.of(eligibilityConfig.MIN_INCOME))) {
      return this.reject(applicationId, EligibilityRejectionReason.INELIGIBLE_INCOME);
    }

    const age = applicant?.age;
    if (age === undefined || age < eligibilityConfig.MIN_AGE || age > eligibilityConfig.MAX_AGE) {
      return this.reject(applicationId, EligibilityRejectionReason.INELIGIBLE_AGE);
    }

    if (
      !(eligibilityConfig.ELIGIBLE_EMPLOYMENT_TYPES as readonly string[]).includes(
        application.employmentType,
      )
    ) {
      return this.reject(applicationId, EligibilityRejectionReason.INELIGIBLE_EMPLOYMENT);
    }

    // AC-03: stubbed bureau pull + DTI ceiling.
    const { creditScore, existingMonthlyObligations } = this.bureauStub.pull(application.applicantId);
    const dti = existingMonthlyObligations.dividedBy(Money.of(application.income).toDecimal());

    if (dti.toDecimal().greaterThan(eligibilityConfig.DTI_CEILING)) {
      return this.reject(applicationId, EligibilityRejectionReason.DTI_EXCEEDED, creditScore, dti);
    }

    return { eligible: true, creditScore, dti: dti.toFixedString(4) };
  }

  private async reject(
    applicationId: string,
    reason: EligibilityRejectionReason,
    creditScore?: number,
    dti?: Money,
  ): Promise<EligibilityDecision> {
    await this.underwritingService.transition(applicationId, ApplicationState.REJECTED);
    return { eligible: false, reason, creditScore, dti: dti?.toFixedString(4) };
  }
}
