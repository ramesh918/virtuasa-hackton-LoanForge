import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Applicant, ApplicantDocument } from '../../eligibility/schema/applicant.schema.js';

/** Read-only lookup against the applicants collection eligibility owns — disbursement never writes to it. */
export interface ApplicantAccountRepository {
  findAccountNumber(applicantId: string): Promise<string | null>;
}

export const APPLICANT_ACCOUNT_REPOSITORY = Symbol('APPLICANT_ACCOUNT_REPOSITORY');

@Injectable()
export class MongoApplicantAccountRepository implements ApplicantAccountRepository {
  constructor(@InjectModel(Applicant.name) private readonly model: Model<ApplicantDocument>) {}

  async findAccountNumber(applicantId: string): Promise<string | null> {
    const applicant = await this.model.findOne({ applicantId }).lean().exec();
    return applicant?.accountNumber ?? null;
  }
}
