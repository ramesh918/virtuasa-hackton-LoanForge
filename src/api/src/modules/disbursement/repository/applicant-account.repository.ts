import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Applicant } from '../../eligibility/entity/applicant.entity.js';

/** Read-only lookup against the applicants table eligibility owns — disbursement never writes to it. */
export interface ApplicantAccountRepository {
  findAccountNumber(applicantId: string): Promise<string | null>;
}

export const APPLICANT_ACCOUNT_REPOSITORY = Symbol('APPLICANT_ACCOUNT_REPOSITORY');

@Injectable()
export class SqliteApplicantAccountRepository implements ApplicantAccountRepository {
  constructor(@InjectRepository(Applicant) private readonly repository: Repository<Applicant>) {}

  async findAccountNumber(applicantId: string): Promise<string | null> {
    const applicant = await this.repository.findOne({ where: { applicantId } });
    return applicant?.accountNumber ?? null;
  }
}
