import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntakeModule } from '../intake/intake.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { UnderwritingModule } from '../underwriting/underwriting.module.js';
import { Applicant, ApplicantSchema } from '../eligibility/schema/applicant.schema.js';
import { DisbursementRecord, DisbursementRecordSchema } from './schema/disbursement-record.schema.js';
import {
  DISBURSEMENT_REPOSITORY,
  MongoDisbursementRepository,
} from './repository/disbursement.repository.js';
import {
  APPLICANT_ACCOUNT_REPOSITORY,
  MongoApplicantAccountRepository,
} from './repository/applicant-account.repository.js';
import { StubPayoutAdapter } from './service/stub-payout.adapter.js';
import { DisbursementService } from './service/disbursement.service.js';
import { DisbursementController } from './controller/disbursement.controller.js';

@Module({
  imports: [
    IntakeModule,
    PricingModule,
    UnderwritingModule,
    MongooseModule.forFeature([
      { name: DisbursementRecord.name, schema: DisbursementRecordSchema },
      { name: Applicant.name, schema: ApplicantSchema },
    ]),
  ],
  controllers: [DisbursementController],
  providers: [
    StubPayoutAdapter,
    DisbursementService,
    { provide: DISBURSEMENT_REPOSITORY, useClass: MongoDisbursementRepository },
    { provide: APPLICANT_ACCOUNT_REPOSITORY, useClass: MongoApplicantAccountRepository },
  ],
  exports: [DisbursementService],
})
export class DisbursementModule {}
