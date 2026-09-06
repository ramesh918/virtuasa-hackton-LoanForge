import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateApplicationDto } from '../dto/create-application.dto.js';
import { Application } from '../schema/application.schema.js';
import { INTAKE_REPOSITORY } from '../repository/intake.repository.js';
import type { IntakeRepository } from '../repository/intake.repository.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { DuplicateApplicationException } from '../../../domain/exceptions.js';
import { Money } from '../../../domain/money.js';

/** AC-05: how far back to look for an active duplicate application. */
const DUPLICATE_WINDOW_DAYS = 30;

@Injectable()
export class IntakeService {
  constructor(@Inject(INTAKE_REPOSITORY) private readonly repository: IntakeRepository) {}

  async submit(dto: CreateApplicationDto): Promise<Application> {
    const sinceDate = new Date(Date.now() - DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const duplicate = await this.repository.findActiveByApplicantAndProduct(
      dto.applicantId,
      dto.productId,
      sinceDate,
    );
    if (duplicate) {
      throw new DuplicateApplicationException(dto.applicantId, dto.productId);
    }

    const application: Application = {
      applicationId: randomUUID(),
      applicantId: dto.applicantId,
      productId: dto.productId,
      amount: Money.of(dto.amount).toFixedString(),
      tenureMonths: dto.tenureMonths,
      purpose: dto.purpose,
      income: Money.of(dto.income).toFixedString(),
      employmentType: dto.employmentType,
      state: ApplicationState.SUBMITTED,
    };

    return this.repository.create(application);
  }

  async findById(applicationId: string): Promise<Application | null> {
    return this.repository.findByApplicationId(applicationId);
  }

  /**
   * Narrow, unguarded state write used by eligibility's auto-reject path. The full lifecycle
   * transition table and NFR-06 concurrency guard are formalized by the underwriting feature —
   * every caller of this method is expected to move to that state machine once it exists.
   */
  async updateState(applicationId: string, state: ApplicationState): Promise<Application> {
    const updated = await this.repository.updateState(applicationId, state);
    if (!updated) {
      throw new Error(`Application ${applicationId} not found`);
    }
    return updated;
  }
}
