import { describe, expect, it } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { UnderwritingController } from './underwriting.controller.js';
import { UnderwritingService } from '../service/underwriting.service.js';
import { Decision } from '../schema/decision-record.schema.js';

function fakeUnderwritingService(): UnderwritingService {
  return {
    getQueue: async () => [{ applicationId: 'app-1' }],
    decide: async () => ({ applicationId: 'app-1', state: 'APPROVED' }),
  } as unknown as UnderwritingService;
}

describe('UnderwritingController [NFR-04]', () => {
  it('rejects an applicant-role caller from the review queue', async () => {
    const controller = new UnderwritingController(fakeUnderwritingService());
    expect(() => controller.getQueue({ 'x-role': 'applicant', 'x-applicant-id': 'APP-0001' })).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a request with no role at all from the review queue', () => {
    const controller = new UnderwritingController(fakeUnderwritingService());
    expect(() => controller.getQueue({})).toThrow(ForbiddenException);
  });

  it('allows an underwriter to read the review queue', async () => {
    const controller = new UnderwritingController(fakeUnderwritingService());
    const result = await controller.getQueue({ 'x-role': 'underwriter' });
    expect(result).toEqual([{ applicationId: 'app-1' }]);
  });

  it('rejects an applicant-role caller from recording a decision', () => {
    const controller = new UnderwritingController(fakeUnderwritingService());
    expect(() =>
      controller.decide(
        'app-1',
        { actor: 'someone', decision: Decision.APPROVE, reason: 'x' },
        { 'x-role': 'applicant', 'x-applicant-id': 'APP-0001' },
      ),
    ).toThrow(ForbiddenException);
  });
});
