import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ClientSession } from 'mongoose';
import { DecisionRecord, DecisionRecordDocument } from '../schema/decision-record.schema.js';

/** AC-07, NFR-02: insert-only — deliberately exposes no update or delete method. */
export interface DecisionRepository {
  record(decision: DecisionRecord, session?: ClientSession): Promise<DecisionRecord>;
  findByApplicationId(applicationId: string): Promise<DecisionRecord[]>;
}

export const DECISION_REPOSITORY = Symbol('DECISION_REPOSITORY');

@Injectable()
export class MongoDecisionRepository implements DecisionRepository {
  constructor(
    @InjectModel(DecisionRecord.name) private readonly model: Model<DecisionRecordDocument>,
  ) {}

  async record(decision: DecisionRecord, session?: ClientSession): Promise<DecisionRecord> {
    const [created] = await this.model.create([decision], { session });
    return created.toObject();
  }

  async findByApplicationId(applicationId: string): Promise<DecisionRecord[]> {
    return this.model.find({ applicationId }).sort({ timestamp: 1 }).lean().exec();
  }
}
