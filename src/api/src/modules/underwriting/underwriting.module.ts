import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntakeModule } from '../intake/intake.module.js';
import { Application } from '../intake/entity/application.entity.js';
import { DecisionRecord } from './entity/decision-record.entity.js';
import {
  UNDERWRITING_REPOSITORY,
  SqliteUnderwritingRepository,
} from './repository/underwriting.repository.js';
import { DECISION_REPOSITORY, SqliteDecisionRepository } from './repository/decision.repository.js';
import { UnderwritingService } from './service/underwriting.service.js';
import { UnderwritingController } from './controller/underwriting.controller.js';

@Module({
  imports: [IntakeModule, TypeOrmModule.forFeature([Application, DecisionRecord])],
  controllers: [UnderwritingController],
  providers: [
    UnderwritingService,
    { provide: UNDERWRITING_REPOSITORY, useClass: SqliteUnderwritingRepository },
    { provide: DECISION_REPOSITORY, useClass: SqliteDecisionRepository },
  ],
  exports: [UnderwritingService],
})
export class UnderwritingModule {}
