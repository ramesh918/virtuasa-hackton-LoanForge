import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { IntakeModule } from './modules/intake/intake.module.js';
import { EligibilityModule } from './modules/eligibility/eligibility.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI ?? 'mongodb://localhost:27117/loanforge'),
    IntakeModule,
    EligibilityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
