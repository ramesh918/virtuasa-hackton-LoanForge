import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntakeModule } from '../intake/intake.module.js';
import { Offer, OfferSchema } from './schema/offer.schema.js';
import { PRICING_REPOSITORY, MongoPricingRepository } from './repository/pricing.repository.js';
import { PricingService } from './service/pricing.service.js';

@Module({
  imports: [IntakeModule, MongooseModule.forFeature([{ name: Offer.name, schema: OfferSchema }])],
  providers: [PricingService, { provide: PRICING_REPOSITORY, useClass: MongoPricingRepository }],
  exports: [PricingService],
})
export class PricingModule {}
