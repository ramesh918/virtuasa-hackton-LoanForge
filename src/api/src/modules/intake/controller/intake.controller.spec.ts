import { describe, expect, it } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { IntakeController } from './intake.controller.js';
import { IntakeService } from '../service/intake.service.js';
import { Application } from '../entity/application.entity.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { CreateApplicationDto } from '../dto/create-application.dto.js';

const ownedApplication: Application = {
  applicationId: 'app-1',
  applicantId: 'APP-0001',
  productId: 'PRD-PERSONAL',
  amount: '5000.00',
  tenureMonths: 12,
  purpose: 'home-improvement',
  income: '5200.00',
  employmentType: 'SALARIED',
  state: ApplicationState.SUBMITTED,
};

function fakeIntakeService(application: Application | null): IntakeService {
  return {
    findById: async () => application,
    submit: async (dto: CreateApplicationDto) => ({ ...ownedApplication, ...dto }),
  } as unknown as IntakeService;
}

describe('IntakeController [NFR-04]', () => {
  it('returns the application to the owning applicant', async () => {
    const controller = new IntakeController(fakeIntakeService(ownedApplication));
    const result = await controller.getById('app-1', { 'x-role': 'applicant', 'x-applicant-id': 'APP-0001' });
    expect(result).toEqual(ownedApplication);
  });

  it('rejects a different applicant requesting the same application', async () => {
    const controller = new IntakeController(fakeIntakeService(ownedApplication));
    await expect(
      controller.getById('app-1', { 'x-role': 'applicant', 'x-applicant-id': 'APP-0002' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows an underwriter to read any application', async () => {
    const controller = new IntakeController(fakeIntakeService(ownedApplication));
    const result = await controller.getById('app-1', { 'x-role': 'underwriter' });
    expect(result).toEqual(ownedApplication);
  });

  it('returns 404 for a nonexistent application', async () => {
    const controller = new IntakeController(fakeIntakeService(null));
    await expect(
      controller.getById('missing', { 'x-role': 'applicant', 'x-applicant-id': 'APP-0001' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an applicant submitting an application on behalf of another applicant', async () => {
    const controller = new IntakeController(fakeIntakeService(ownedApplication));
    const dto: CreateApplicationDto = {
      applicantId: 'APP-0002',
      productId: 'PRD-PERSONAL',
      amount: '1000.00',
      tenureMonths: 6,
      purpose: 'misc',
      income: '3000.00',
      employmentType: 'SALARIED',
    };
    expect(() =>
      controller.submit(dto, { 'x-role': 'applicant', 'x-applicant-id': 'APP-0001' }),
    ).toThrow(ForbiddenException);
  });
});
