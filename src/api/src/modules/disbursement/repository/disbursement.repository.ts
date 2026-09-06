import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { DisbursementRecord } from '../entity/disbursement-record.entity.js';

/** AC-08, NFR-02: insert-only — deliberately exposes no update or delete method. */
export interface DisbursementRepository {
  save(record: DisbursementRecord, manager?: EntityManager): Promise<DisbursementRecord>;
  findByApplicationId(applicationId: string): Promise<DisbursementRecord | null>;
}

export const DISBURSEMENT_REPOSITORY = Symbol('DISBURSEMENT_REPOSITORY');

@Injectable()
export class SqliteDisbursementRepository implements DisbursementRepository {
  constructor(
    @InjectRepository(DisbursementRecord) private readonly repository: Repository<DisbursementRecord>,
  ) {}

  async save(record: DisbursementRecord, manager?: EntityManager): Promise<DisbursementRecord> {
    const repo = manager ? manager.getRepository(DisbursementRecord) : this.repository;
    return repo.save(record);
  }

  async findByApplicationId(applicationId: string): Promise<DisbursementRecord | null> {
    return this.repository.findOne({ where: { applicationId } });
  }
}
