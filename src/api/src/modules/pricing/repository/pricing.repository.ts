import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Offer, OfferDocument } from '../schema/offer.schema.js';

export interface PricingRepository {
  save(offer: Offer): Promise<Offer>;
  findByApplicationId(applicationId: string): Promise<Offer | null>;
}

export const PRICING_REPOSITORY = Symbol('PRICING_REPOSITORY');

@Injectable()
export class MongoPricingRepository implements PricingRepository {
  constructor(@InjectModel(Offer.name) private readonly model: Model<OfferDocument>) {}

  async save(offer: Offer): Promise<Offer> {
    const saved = await this.model.findOneAndUpdate({ applicationId: offer.applicationId }, offer, {
      upsert: true,
      returnDocument: 'after',
    });
    return saved!.toObject();
  }

  async findByApplicationId(applicationId: string): Promise<Offer | null> {
    return this.model.findOne({ applicationId }).lean().exec();
  }
}
