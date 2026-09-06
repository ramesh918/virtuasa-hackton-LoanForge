import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../entity/offer.entity.js';

export interface PricingRepository {
  save(offer: Offer): Promise<Offer>;
  findByApplicationId(applicationId: string): Promise<Offer | null>;
}

export const PRICING_REPOSITORY = Symbol('PRICING_REPOSITORY');

@Injectable()
export class SqlitePricingRepository implements PricingRepository {
  constructor(@InjectRepository(Offer) private readonly repository: Repository<Offer>) {}

  async save(offer: Offer): Promise<Offer> {
    // applicationId is the primary key, so save() naturally upserts: an INSERT if no row with
    // that key exists yet, an UPDATE if one does (e.g. re-pricing after a MANUAL_REVIEW cycle).
    return this.repository.save(offer);
  }

  async findByApplicationId(applicationId: string): Promise<Offer | null> {
    return this.repository.findOne({ where: { applicationId } });
  }
}
