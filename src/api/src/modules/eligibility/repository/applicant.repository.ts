import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Applicant, ApplicantDocument } from '../schema/applicant.schema.js';

export interface ApplicantRepository {
  findByApplicantId(applicantId: string): Promise<Applicant | null>;
}

export const APPLICANT_REPOSITORY = Symbol('APPLICANT_REPOSITORY');

@Injectable()
export class MongoApplicantRepository implements ApplicantRepository {
  constructor(@InjectModel(Applicant.name) private readonly model: Model<ApplicantDocument>) {}

  async findByApplicantId(applicantId: string): Promise<Applicant | null> {
    return this.model.findOne({ applicantId }).lean().exec();
  }
}
