import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntakeModule } from '../intake/intake.module.js';
import { Application, ApplicationSchema } from '../intake/schema/application.schema.js';
import { DecisionRecord, DecisionRecordSchema } from './schema/decision-record.schema.js';
import { UNDERWRITING_REPOSITORY, MongoUnderwritingRepository } from './repository/underwriting.repository.js';
import { DECISION_REPOSITORY, MongoDecisionRepository } from './repository/decision.repository.js';
import { UnderwritingService } from './service/underwriting.service.js';
import { UnderwritingController } from './controller/underwriting.controller.js';

@Module({
  imports: [
    IntakeModule,
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: DecisionRecord.name, schema: DecisionRecordSchema },
    ]),
  ],
  controllers: [UnderwritingController],
  providers: [
    UnderwritingService,
    { provide: UNDERWRITING_REPOSITORY, useClass: MongoUnderwritingRepository },
    { provide: DECISION_REPOSITORY, useClass: MongoDecisionRepository },
  ],
  exports: [UnderwritingService],
})
export class UnderwritingModule {}
