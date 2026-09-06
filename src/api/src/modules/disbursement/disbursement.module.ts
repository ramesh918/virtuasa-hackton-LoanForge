import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntakeModule } from '../intake/intake.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { UnderwritingModule } from '../underwriting/underwriting.module.js';
import { Applicant } from '../eligibility/entity/applicant.entity.js';
import { DisbursementRecord } from './entity/disbursement-record.entity.js';
import {
  DISBURSEMENT_REPOSITORY,
  SqliteDisbursementRepository,
} from './repository/disbursement.repository.js';
import {
  APPLICANT_ACCOUNT_REPOSITORY,
  SqliteApplicantAccountRepository,
} from './repository/applicant-account.repository.js';
import { StubPayoutAdapter } from './service/stub-payout.adapter.js';
import { DisbursementService } from './service/disbursement.service.js';
import { DisbursementController } from './controller/disbursement.controller.js';

@Module({
  imports: [
    IntakeModule,
    PricingModule,
    UnderwritingModule,
    TypeOrmModule.forFeature([DisbursementRecord, Applicant]),
  ],
  controllers: [DisbursementController],
  providers: [
    StubPayoutAdapter,
    DisbursementService,
    { provide: DISBURSEMENT_REPOSITORY, useClass: SqliteDisbursementRepository },
    { provide: APPLICANT_ACCOUNT_REPOSITORY, useClass: SqliteApplicantAccountRepository },
  ],
  exports: [DisbursementService],
})
export class DisbursementModule {}
