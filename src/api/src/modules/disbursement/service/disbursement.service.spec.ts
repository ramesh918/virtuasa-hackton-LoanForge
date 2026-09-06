import { describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import type { ClientSession, Connection } from 'mongoose';
import { DisbursementService } from './disbursement.service.js';
import { DisbursementRepository } from '../repository/disbursement.repository.js';
import { ApplicantAccountRepository } from '../repository/applicant-account.repository.js';
import { StubPayoutAdapter } from './stub-payout.adapter.js';
import { IntakeService } from '../../intake/service/intake.service.js';
import { PricingService } from '../../pricing/service/pricing.service.js';
import { UnderwritingService } from '../../underwriting/service/underwriting.service.js';
import { Application } from '../../intake/schema/application.schema.js';
import { Offer } from '../../pricing/schema/offer.schema.js';
import { DisbursementRecord } from '../schema/disbursement-record.schema.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { InvalidApplicationStateException } from '../../../domain/exceptions.js';

const RAW_ACCOUNT_NUMBER = '4000123456781234';

function fakeIntakeService(application: Application): IntakeService {
  return { findById: async () => ({ ...application }) } as unknown as IntakeService;
}

function fakePricingService(offer: Offer): PricingService {
  return { getOffer: async () => ({ ...offer }) } as unknown as PricingService;
}

/** Mirrors underwriting's real guard: APPROVED -> DISBURSED succeeds once, fails on a repeat call. */
function fakeUnderwritingService(store: Application): UnderwritingService {
  return {
    transition: async (_id: string, toState: ApplicationState) => {
      if (store.state !== ApplicationState.APPROVED) {
        throw new InvalidApplicationStateException(store.applicationId, store.state, toState);
      }
      store.state = toState;
      return { ...store };
    },
  } as unknown as UnderwritingService;
}

function fakeDisbursementRepository(): { repository: DisbursementRepository; records: DisbursementRecord[] } {
  const records: DisbursementRecord[] = [];
  return {
    repository: {
      save: async (record) => {
        records.push(record);
        return record;
      },
      findByApplicationId: async (applicationId) => records.find((r) => r.applicationId === applicationId) ?? null,
    },
    records,
  };
}

function fakeApplicantAccountRepository(): ApplicantAccountRepository {
  return { findAccountNumber: async () => RAW_ACCOUNT_NUMBER };
}

function fakeConnection(): Connection {
  return {
    startSession: async () =>
      ({
        withTransaction: async (fn: () => Promise<void>) => fn(),
        endSession: async () => {},
      }) as unknown as ClientSession,
  } as unknown as Connection;
}

const baseApplication: Application = {
  applicationId: 'app-1',
  applicantId: 'APP-0001',
  productId: 'PRD-PERSONAL',
  amount: '5000.00',
  tenureMonths: 12,
  purpose: 'home-improvement',
  income: '5200.00',
  employmentType: 'SALARIED',
  state: ApplicationState.APPROVED,
};

const baseOffer: Offer = {
  applicationId: 'app-1',
  rateBandLabel: 'PRIME',
  annualRate: '0.10',
  emi: '439.58',
  tenureMonths: 12,
  totalPayable: '5274.96',
};

function buildService(application: Application) {
  const store = { ...application };
  const { repository: disbursementRepository, records } = fakeDisbursementRepository();
  const payoutAdapter = new StubPayoutAdapter();
  const payoutSpy = vi.spyOn(payoutAdapter, 'pay');

  const service = new DisbursementService(
    fakeIntakeService(store),
    fakePricingService(baseOffer),
    fakeUnderwritingService(store),
    disbursementRepository,
    fakeApplicantAccountRepository(),
    payoutAdapter,
    fakeConnection(),
  );

  return { service, store, records, payoutSpy };
}

describe('DisbursementService', () => {
  it('creates a disbursement record with amount, schedule, and masked account on accepted offer [AC-08]', async () => {
    const { service, records } = buildService(baseApplication);

    const record = await service.acceptOffer(baseApplication.applicationId);

    expect(record.amount).toBe('5000.00');
    expect(record.tenureMonths).toBe(12);
    expect(record.maskedAccountReference).toBe('****1234');
    expect(record.maskedAccountReference).not.toContain(RAW_ACCOUNT_NUMBER);
    expect(records).toHaveLength(1);
  });

  it('calls the stubbed payout adapter exactly once per accepted offer [AC-08]', async () => {
    const { service, payoutSpy } = buildService(baseApplication);

    await service.acceptOffer(baseApplication.applicationId);

    expect(payoutSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects a second accept-offer call on an already-disbursed application [AC-08]', async () => {
    const { service, store } = buildService(baseApplication);

    await service.acceptOffer(baseApplication.applicationId);
    expect(store.state).toBe(ApplicationState.DISBURSED);

    await expect(service.acceptOffer(baseApplication.applicationId)).rejects.toBeInstanceOf(
      InvalidApplicationStateException,
    );
  });

  it('never writes the raw account reference to logs [NFR-03]', async () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const { service } = buildService(baseApplication);

    await service.acceptOffer(baseApplication.applicationId);

    const loggedMessages = logSpy.mock.calls.map((call) => String(call[0]));
    expect(loggedMessages.some((message) => message.includes(RAW_ACCOUNT_NUMBER))).toBe(false);
    expect(loggedMessages.some((message) => message.includes('****1234'))).toBe(true);

    logSpy.mockRestore();
  });
});
