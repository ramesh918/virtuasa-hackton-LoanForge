import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { IntakeModule } from './modules/intake/intake.module.js';
import { EligibilityModule } from './modules/eligibility/eligibility.module.js';
import { PricingModule } from './modules/pricing/pricing.module.js';
import { UnderwritingModule } from './modules/underwriting/underwriting.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27117/loanforge?replicaSet=rs0&directConnection=true',
    ),
    IntakeModule,
    EligibilityModule,
    PricingModule,
    UnderwritingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
