import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ClientSession } from 'mongoose';
import { Application, ApplicationDocument } from '../../intake/schema/application.schema.js';
import { ApplicationState } from '../../../domain/application-state.js';

export interface UnderwritingRepository {
  /**
   * NFR-06: atomic compare-and-set — only succeeds if the document is still in `fromState`.
   * Returns null when a concurrent request already moved it elsewhere.
   */
  transition(
    applicationId: string,
    fromState: ApplicationState,
    toState: ApplicationState,
    session?: ClientSession,
  ): Promise<Application | null>;
  findQueue(states: ApplicationState[]): Promise<Application[]>;
}

export const UNDERWRITING_REPOSITORY = Symbol('UNDERWRITING_REPOSITORY');

@Injectable()
export class MongoUnderwritingRepository implements UnderwritingRepository {
  constructor(@InjectModel(Application.name) private readonly model: Model<ApplicationDocument>) {}

  async transition(
    applicationId: string,
    fromState: ApplicationState,
    toState: ApplicationState,
    session?: ClientSession,
  ): Promise<Application | null> {
    return this.model
      .findOneAndUpdate(
        { applicationId, state: fromState },
        { $set: { state: toState } },
        { returnDocument: 'after', session },
      )
      .lean()
      .exec();
  }

  async findQueue(states: ApplicationState[]): Promise<Application[]> {
    return this.model
      .find({ state: { $in: states } })
      .lean()
      .exec();
  }
}
