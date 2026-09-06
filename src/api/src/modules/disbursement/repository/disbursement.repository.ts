import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ClientSession } from 'mongoose';
import { DisbursementRecord, DisbursementRecordDocument } from '../schema/disbursement-record.schema.js';

/** AC-08, NFR-02: insert-only — deliberately exposes no update or delete method. */
export interface DisbursementRepository {
  save(record: DisbursementRecord, session?: ClientSession): Promise<DisbursementRecord>;
  findByApplicationId(applicationId: string): Promise<DisbursementRecord | null>;
}

export const DISBURSEMENT_REPOSITORY = Symbol('DISBURSEMENT_REPOSITORY');

@Injectable()
export class MongoDisbursementRepository implements DisbursementRepository {
  constructor(
    @InjectModel(DisbursementRecord.name) private readonly model: Model<DisbursementRecordDocument>,
  ) {}

  async save(record: DisbursementRecord, session?: ClientSession): Promise<DisbursementRecord> {
    const [created] = await this.model.create([record], { session });
    return created.toObject();
  }

  async findByApplicationId(applicationId: string): Promise<DisbursementRecord | null> {
    return this.model.findOne({ applicationId }).lean().exec();
  }
}
