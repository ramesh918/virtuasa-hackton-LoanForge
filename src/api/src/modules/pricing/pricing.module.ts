import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntakeModule } from '../intake/intake.module.js';
import { Offer } from './entity/offer.entity.js';
import { PRICING_REPOSITORY, SqlitePricingRepository } from './repository/pricing.repository.js';
import { PricingService } from './service/pricing.service.js';
import { PricingController } from './controller/pricing.controller.js';

@Module({
  imports: [IntakeModule, TypeOrmModule.forFeature([Offer])],
  controllers: [PricingController],
  providers: [PricingService, { provide: PRICING_REPOSITORY, useClass: SqlitePricingRepository }],
  exports: [PricingService],
})
export class PricingModule {}
