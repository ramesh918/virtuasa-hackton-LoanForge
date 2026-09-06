import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application, ApplicationDocument } from '../schema/application.schema.js';
import { isActiveState } from '../../../domain/application-state.js';

export interface IntakeRepository {
  create(application: Application): Promise<Application>;
  findActiveByApplicantAndProduct(
    applicantId: string,
    productId: string,
    sinceDate: Date,
  ): Promise<Application | null>;
  findByApplicationId(applicationId: string): Promise<Application | null>;
}

export const INTAKE_REPOSITORY = Symbol('INTAKE_REPOSITORY');

@Injectable()
export class MongoIntakeRepository implements IntakeRepository {
  constructor(@InjectModel(Application.name) private readonly model: Model<ApplicationDocument>) {}

  async create(application: Application): Promise<Application> {
    const created = await this.model.create(application);
    return created.toObject();
  }

  async findActiveByApplicantAndProduct(
    applicantId: string,
    productId: string,
    sinceDate: Date,
  ): Promise<Application | null> {
    const candidates = await this.model
      .find({ applicantId, productId, createdAt: { $gte: sinceDate } })
      .lean()
      .exec();
    return candidates.find((candidate) => isActiveState(candidate.state)) ?? null;
  }

  async findByApplicationId(applicationId: string): Promise<Application | null> {
    return this.model.findOne({ applicationId }).lean().exec();
  }
}
