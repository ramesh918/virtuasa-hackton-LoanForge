import { describe, expect, it } from 'vitest';
import type { ClientSession } from 'mongoose';
import { UnderwritingService } from './underwriting.service.js';
import { UnderwritingRepository } from '../repository/underwriting.repository.js';
import { DecisionRepository } from '../repository/decision.repository.js';
import { Decision, DecisionRecord } from '../schema/decision-record.schema.js';
import { IntakeService } from '../../intake/service/intake.service.js';
import { Application } from '../../intake/schema/application.schema.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { InvalidApplicationStateException, TransitionConflictException } from '../../../domain/exceptions.js';

/**
 * In-memory double that mimics the real Mongo `findOneAndUpdate({ applicationId, state: fromState }, ...)`
 * compare-and-set: only one of two concurrent calls racing on the same `fromState` can win.
 */
function fakeUnderwritingRepository(initial: Application) {
  const store = { ...initial };
  const repository: UnderwritingRepository = {
    transition: async (applicationId, fromState, toState) => {
      if (store.state !== fromState) {
        return null;
      }
      store.state = toState;
      return { ...store };
    },
    findQueue: async (states) => (states.includes(store.state) ? [{ ...store }] : []),
  };
  return { repository, store };
}

function fakeDecisionRepository(): { repository: DecisionRepository; records: DecisionRecord[] } {
  const records: DecisionRecord[] = [];
  return {
    repository: {
      record: async (decision) => {
        records.push(decision);
        return decision;
      },
      findByApplicationId: async (applicationId) => records.filter((r) => r.applicationId === applicationId),
    },
    records,
  };
}

function fakeIntakeService(store: Application): IntakeService {
  return { findById: async () => ({ ...store }) } as unknown as IntakeService;
}

function fakeConnection() {
  return {
    startSession: async () => {
      const session = {
        withTransaction: async (fn: () => Promise<void>) => fn(),
        endSession: async () => {},
      } as unknown as ClientSession;
      return session;
    },
  } as unknown as import('mongoose').Connection;
}

const baseApplication: Application = {
  applicationId: 'app-1',
  applicantId: 'APP-0001',
  productId: 'PRD-PERSONAL',
  amount: '5000.00',
  tenureMonths: 12,
  purpose: 'home-improvement',
  income: '5000.00',
  employmentType: 'SALARIED',
  state: ApplicationState.SUBMITTED,
};

function buildService(initial: Application) {
  const { repository, store } = fakeUnderwritingRepository(initial);
  const { repository: decisionRepository, records } = fakeDecisionRepository();
  const service = new UnderwritingService(
    fakeIntakeService(store),
    repository,
    decisionRepository,
    fakeConnection(),
  );
  return { service, store, records };
}

describe('UnderwritingService', () => {
  it('enforces SUBMITTED -> UNDER_REVIEW -> APPROVED as a valid path [AC-06]', async () => {
    const { service, store } = buildService(baseApplication);

    await service.transition(baseApplication.applicationId, ApplicationState.UNDER_REVIEW);
    expect(store.state).toBe(ApplicationState.UNDER_REVIEW);

    await service.transition(baseApplication.applicationId, ApplicationState.APPROVED);
    expect(store.state).toBe(ApplicationState.APPROVED);
  });

  it('throws InvalidApplicationStateException on an illegal transition (SUBMITTED -> DISBURSED) [AC-06]', async () => {
    const { service, store } = buildService(baseApplication);

    await expect(
      service.transition(baseApplication.applicationId, ApplicationState.DISBURSED),
    ).rejects.toBeInstanceOf(InvalidApplicationStateException);
    expect(store.state).toBe(ApplicationState.SUBMITTED);
  });

  it('lets an underwriter approve from the queue and records actor+timestamp [AC-07]', async () => {
    const underReview = { ...baseApplication, state: ApplicationState.UNDER_REVIEW };
    const { service, store, records } = buildService(underReview);

    await service.decide(underReview.applicationId, 'underwriter-1', Decision.APPROVE, 'strong profile');

    expect(store.state).toBe(ApplicationState.APPROVED);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ actor: 'underwriter-1', decision: Decision.APPROVE });
    expect(records[0].timestamp).toBeInstanceOf(Date);
  });

  it('lets an underwriter request more info, moving the application to MANUAL_REVIEW [AC-07]', async () => {
    const underReview = { ...baseApplication, state: ApplicationState.UNDER_REVIEW };
    const { service, store } = buildService(underReview);

    await service.decide(underReview.applicationId, 'underwriter-1', Decision.REQUEST_INFO, 'need payslips');

    expect(store.state).toBe(ApplicationState.MANUAL_REVIEW);
  });

  it('under two concurrent decision requests, exactly one succeeds and the other conflicts [NFR-06]', async () => {
    const underReview = { ...baseApplication, state: ApplicationState.UNDER_REVIEW };
    const { service } = buildService(underReview);

    const results = await Promise.allSettled([
      service.decide(underReview.applicationId, 'underwriter-1', Decision.APPROVE, 'ok'),
      service.decide(underReview.applicationId, 'underwriter-2', Decision.DECLINE, 'ok'),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(TransitionConflictException);
  });
});
