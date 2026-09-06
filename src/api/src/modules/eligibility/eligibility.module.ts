import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntakeModule } from '../intake/intake.module.js';
import { UnderwritingModule } from '../underwriting/underwriting.module.js';
import { Applicant, ApplicantSchema } from './schema/applicant.schema.js';
import { APPLICANT_REPOSITORY, MongoApplicantRepository } from './repository/applicant.repository.js';
import { BureauStubService } from './service/bureau-stub.service.js';
import { EligibilityService } from './service/eligibility.service.js';

@Module({
  imports: [
    IntakeModule,
    UnderwritingModule,
    MongooseModule.forFeature([{ name: Applicant.name, schema: ApplicantSchema }]),
  ],
  providers: [
    BureauStubService,
    EligibilityService,
    { provide: APPLICANT_REPOSITORY, useClass: MongoApplicantRepository },
  ],
  exports: [EligibilityService],
})
export class EligibilityModule {}
