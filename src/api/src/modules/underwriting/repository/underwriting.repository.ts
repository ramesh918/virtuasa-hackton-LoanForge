import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { Application } from '../../intake/entity/application.entity.js';
import { ApplicationState } from '../../../domain/application-state.js';

export interface UnderwritingRepository {
  /**
   * NFR-06: atomic compare-and-set — only succeeds if the row is still in `fromState`.
   * Returns null when a concurrent request already moved it elsewhere.
   */
  transition(
    applicationId: string,
    fromState: ApplicationState,
    toState: ApplicationState,
    manager?: EntityManager,
  ): Promise<Application | null>;
  findQueue(states: ApplicationState[]): Promise<Application[]>;
}

export const UNDERWRITING_REPOSITORY = Symbol('UNDERWRITING_REPOSITORY');

@Injectable()
export class SqliteUnderwritingRepository implements UnderwritingRepository {
  constructor(@InjectRepository(Application) private readonly repository: Repository<Application>) {}

  async transition(
    applicationId: string,
    fromState: ApplicationState,
    toState: ApplicationState,
    manager?: EntityManager,
  ): Promise<Application | null> {
    const repo = manager ? manager.getRepository(Application) : this.repository;

    // Atomic compare-and-set: the UPDATE only touches a row if it's still in `fromState`. If a
    // concurrent request already moved it, `affected` is 0 — the same guarantee Mongo's
    // findOneAndUpdate gave us, achieved here via a WHERE-guarded UPDATE.
    const result = await repo
      .createQueryBuilder()
      .update(Application)
      .set({ state: toState })
      .where('applicationId = :applicationId AND state = :fromState', { applicationId, fromState })
      .execute();

    if (!result.affected) {
      return null;
    }
    return repo.findOne({ where: { applicationId } });
  }

  async findQueue(states: ApplicationState[]): Promise<Application[]> {
    return this.repository.find({ where: { state: In(states) } });
  }
}
