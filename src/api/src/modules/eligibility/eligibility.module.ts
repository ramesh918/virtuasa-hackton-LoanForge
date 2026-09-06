import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntakeModule } from '../intake/intake.module.js';
import { UnderwritingModule } from '../underwriting/underwriting.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { Applicant, ApplicantSchema } from './schema/applicant.schema.js';
import { APPLICANT_REPOSITORY, MongoApplicantRepository } from './repository/applicant.repository.js';
import { BureauStubService } from './service/bureau-stub.service.js';
import { EligibilityService } from './service/eligibility.service.js';
import { EligibilityController } from './controller/eligibility.controller.js';

@Module({
  imports: [
    IntakeModule,
    UnderwritingModule,
    PricingModule,
    MongooseModule.forFeature([{ name: Applicant.name, schema: ApplicantSchema }]),
  ],
  controllers: [EligibilityController],
  providers: [
    BureauStubService,
    EligibilityService,
    { provide: APPLICANT_REPOSITORY, useClass: MongoApplicantRepository },
  ],
  exports: [EligibilityService],
})
export class EligibilityModule {}
