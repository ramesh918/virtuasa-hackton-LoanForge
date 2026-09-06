import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntakeController } from './controller/intake.controller.js';
import { IntakeService } from './service/intake.service.js';
import { INTAKE_REPOSITORY, SqliteIntakeRepository } from './repository/intake.repository.js';
import { Application } from './entity/application.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Application])],
  controllers: [IntakeController],
  providers: [IntakeService, { provide: INTAKE_REPOSITORY, useClass: SqliteIntakeRepository }],
  exports: [IntakeService],
})
export class IntakeModule {}
