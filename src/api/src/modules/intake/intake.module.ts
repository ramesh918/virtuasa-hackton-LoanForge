import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntakeController } from './controller/intake.controller.js';
import { IntakeService } from './service/intake.service.js';
import { INTAKE_REPOSITORY, MongoIntakeRepository } from './repository/intake.repository.js';
import { Application, ApplicationSchema } from './schema/application.schema.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }])],
  controllers: [IntakeController],
  providers: [IntakeService, { provide: INTAKE_REPOSITORY, useClass: MongoIntakeRepository }],
  exports: [IntakeService],
})
export class IntakeModule {}
