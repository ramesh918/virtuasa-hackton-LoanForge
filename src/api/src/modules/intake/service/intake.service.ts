import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateApplicationDto } from '../dto/create-application.dto.js';
import { Application } from '../entity/application.entity.js';
import { INTAKE_REPOSITORY } from '../repository/intake.repository.js';
import type { IntakeRepository } from '../repository/intake.repository.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { DuplicateApplicationException, InvalidTenureException } from '../../../domain/exceptions.js';
import { Money } from '../../../domain/money.js';

/** AC-05: how far back to look for an active duplicate application. */
const DUPLICATE_WINDOW_DAYS = 30;

@Injectable()
export class IntakeService {
  constructor(@Inject(INTAKE_REPOSITORY) private readonly repository: IntakeRepository) {}

  async submit(dto: CreateApplicationDto): Promise<Application> {
    if (dto.tenureMonths <= 0) {
      throw new InvalidTenureException(dto.tenureMonths);
    }

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
}
