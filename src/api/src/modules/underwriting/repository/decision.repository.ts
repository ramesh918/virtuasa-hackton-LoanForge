import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { DecisionRecord } from '../entity/decision-record.entity.js';

/** AC-07, NFR-02: insert-only — deliberately exposes no update or delete method. */
export interface DecisionRepository {
  record(decision: DecisionRecord, manager?: EntityManager): Promise<DecisionRecord>;
  findByApplicationId(applicationId: string): Promise<DecisionRecord[]>;
}

export const DECISION_REPOSITORY = Symbol('DECISION_REPOSITORY');

@Injectable()
export class SqliteDecisionRepository implements DecisionRepository {
  constructor(
    @InjectRepository(DecisionRecord) private readonly repository: Repository<DecisionRecord>,
  ) {}

  async record(decision: DecisionRecord, manager?: EntityManager): Promise<DecisionRecord> {
    const repo = manager ? manager.getRepository(DecisionRecord) : this.repository;
    return repo.save(decision);
  }

  async findByApplicationId(applicationId: string): Promise<DecisionRecord[]> {
    return this.repository.find({ where: { applicationId }, order: { timestamp: 'ASC' } });
  }
}
