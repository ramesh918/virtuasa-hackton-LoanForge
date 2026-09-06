import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { IntakeService } from '../../intake/service/intake.service.js';
import { PricingService } from '../../pricing/service/pricing.service.js';
import { UnderwritingService } from '../../underwriting/service/underwriting.service.js';
import { DISBURSEMENT_REPOSITORY } from '../repository/disbursement.repository.js';
import type { DisbursementRepository } from '../repository/disbursement.repository.js';
import { APPLICANT_ACCOUNT_REPOSITORY } from '../repository/applicant-account.repository.js';
import type { ApplicantAccountRepository } from '../repository/applicant-account.repository.js';
import { StubPayoutAdapter } from './stub-payout.adapter.js';
import { DisbursementRecord } from '../schema/disbursement-record.schema.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { Money } from '../../../domain/money.js';

@Injectable()
export class DisbursementService {
  private readonly logger = new Logger(DisbursementService.name);

  constructor(
    private readonly intakeService: IntakeService,
    private readonly pricingService: PricingService,
    private readonly underwritingService: UnderwritingService,
    @Inject(DISBURSEMENT_REPOSITORY) private readonly repository: DisbursementRepository,
    @Inject(APPLICANT_ACCOUNT_REPOSITORY) private readonly accountRepository: ApplicantAccountRepository,
    private readonly payoutAdapter: StubPayoutAdapter,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /**
   * AC-08: the APPROVED -> DISBURSED transition and the disbursement record insert happen in one
   * transaction, reusing underwriting's guarded compare-and-set — a second call on an already-disbursed
   * application fails at the state-machine check, never producing a second record.
   */
  async acceptOffer(applicationId: string): Promise<DisbursementRecord> {
    const application = await this.intakeService.findById(applicationId);
    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    const offer = await this.pricingService.getOffer(applicationId);
    if (!offer) {
      throw new Error(`No offer found for application ${applicationId}`);
    }

    const accountNumber = await this.accountRepository.findAccountNumber(application.applicantId);
    if (!accountNumber) {
      throw new Error(`No account on file for applicant ${application.applicantId}`);
    }

    const { payoutReference, maskedAccountReference } = this.payoutAdapter.pay(
      Money.of(application.amount),
      accountNumber,
    );

    const session = await this.connection.startSession();
    try {
      let record!: DisbursementRecord;
      await session.withTransaction(async () => {
        await this.underwritingService.transition(applicationId, ApplicationState.DISBURSED, session);
        record = {
          applicationId,
          amount: application.amount,
          tenureMonths: offer.tenureMonths,
          maskedAccountReference,
          payoutReference,
          disbursedAt: new Date(),
        };
        await this.repository.save(record, session);
      });
      this.logger.log(`Disbursed application ${applicationId} to ${maskedAccountReference}`);
      return record;
    } finally {
      await session.endSession();
    }
  }
}
