import { describe, expect, it } from 'vitest';
import { IntakeService } from './intake.service.js';
import { IntakeRepository } from '../repository/intake.repository.js';
import { Application } from '../schema/application.schema.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { DuplicateApplicationException, InvalidTenureException } from '../../../domain/exceptions.js';
import { CreateApplicationDto } from '../dto/create-application.dto.js';

class FakeIntakeRepository implements IntakeRepository {
  applications: Application[] = [];

  async create(application: Application): Promise<Application> {
    this.applications.push(application);
    return application;
  }

  async findActiveByApplicantAndProduct(
    applicantId: string,
    productId: string,
    sinceDate: Date,
  ): Promise<Application | null> {
    return (
      this.applications.find(
        (app) =>
          app.applicantId === applicantId &&
          app.productId === productId &&
          app.state !== ApplicationState.REJECTED &&
          app.state !== ApplicationState.CLOSED,
      ) ?? null
    );
  }

  async findByApplicationId(applicationId: string): Promise<Application | null> {
    return this.applications.find((app) => app.applicationId === applicationId) ?? null;
  }
}

const validDto: CreateApplicationDto = {
  applicantId: 'APP-0001',
  productId: 'PRD-PERSONAL',
  amount: '5000.00',
  tenureMonths: 12,
  purpose: 'home-improvement',
  income: '5200.00',
  employmentType: 'SALARIED',
};

describe('IntakeService', () => {
  it('creates an application in SUBMITTED state with a unique application_id [AC-01]', async () => {
    const repository = new FakeIntakeRepository();
    const service = new IntakeService(repository);

    const application = await service.submit(validDto);

    expect(application.state).toBe(ApplicationState.SUBMITTED);
    expect(application.applicationId).toBeTruthy();

    const second = await service.submit({ ...validDto, applicantId: 'APP-0002' });
    expect(second.applicationId).not.toBe(application.applicationId);
  });

  it('rejects a duplicate active application for the same applicant+product within the window [AC-05]', async () => {
    const repository = new FakeIntakeRepository();
    const service = new IntakeService(repository);

    await service.submit(validDto);

    await expect(service.submit(validDto)).rejects.toBeInstanceOf(DuplicateApplicationException);
  });

  it('allows a new application when the prior one is REJECTED [AC-05]', async () => {
    const repository = new FakeIntakeRepository();
    const service = new IntakeService(repository);

    const first = await service.submit(validDto);
    first.state = ApplicationState.REJECTED;

    await expect(service.submit(validDto)).resolves.toMatchObject({ state: ApplicationState.SUBMITTED });
  });

  it('rejects an application with a non-positive tenure [AC-01]', async () => {
    const repository = new FakeIntakeRepository();
    const service = new IntakeService(repository);

    await expect(service.submit({ ...validDto, tenureMonths: 0 })).rejects.toBeInstanceOf(
      InvalidTenureException,
    );
    await expect(service.submit({ ...validDto, tenureMonths: -3 })).rejects.toBeInstanceOf(
      InvalidTenureException,
    );
  });
});
