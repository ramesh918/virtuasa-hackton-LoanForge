import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Application } from '../entity/application.entity.js';
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
export class SqliteIntakeRepository implements IntakeRepository {
  constructor(@InjectRepository(Application) private readonly repository: Repository<Application>) {}

  async create(application: Application): Promise<Application> {
    return this.repository.save(application);
  }

  async findActiveByApplicantAndProduct(
    applicantId: string,
    productId: string,
    sinceDate: Date,
  ): Promise<Application | null> {
    const candidates = await this.repository.find({
      where: { applicantId, productId, createdAt: MoreThanOrEqual(sinceDate) },
    });
    return candidates.find((candidate) => isActiveState(candidate.state)) ?? null;
  }

  async findByApplicationId(applicationId: string): Promise<Application | null> {
    return this.repository.findOne({ where: { applicationId } });
  }
}
