import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntakeModule } from '../intake/intake.module.js';
import { UnderwritingModule } from '../underwriting/underwriting.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { Applicant } from './entity/applicant.entity.js';
import { APPLICANT_REPOSITORY, SqliteApplicantRepository } from './repository/applicant.repository.js';
import { BureauStubService } from './service/bureau-stub.service.js';
import { EligibilityService } from './service/eligibility.service.js';
import { EligibilityController } from './controller/eligibility.controller.js';

@Module({
  imports: [IntakeModule, UnderwritingModule, PricingModule, TypeOrmModule.forFeature([Applicant])],
  controllers: [EligibilityController],
  providers: [
    BureauStubService,
    EligibilityService,
    { provide: APPLICANT_REPOSITORY, useClass: SqliteApplicantRepository },
  ],
  exports: [EligibilityService],
})
export class EligibilityModule {}
