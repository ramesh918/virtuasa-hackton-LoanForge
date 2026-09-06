import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Applicant } from '../entity/applicant.entity.js';

export interface ApplicantRepository {
  findByApplicantId(applicantId: string): Promise<Applicant | null>;
}

export const APPLICANT_REPOSITORY = Symbol('APPLICANT_REPOSITORY');

@Injectable()
export class SqliteApplicantRepository implements ApplicantRepository {
  constructor(@InjectRepository(Applicant) private readonly repository: Repository<Applicant>) {}

  async findByApplicantId(applicantId: string): Promise<Applicant | null> {
    return this.repository.findOne({ where: { applicantId } });
  }
}
