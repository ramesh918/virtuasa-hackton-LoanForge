import { describe, expect, it } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { assertCanAccessApplication, assertUnderwriter, extractActor, Role } from './roles.js';

describe('extractActor', () => {
  it('reads role and applicantId from headers', () => {
    const actor = extractActor({ 'x-role': 'applicant', 'x-applicant-id': 'APP-0001' });
    expect(actor).toEqual({ role: 'applicant', applicantId: 'APP-0001' });
  });
});

describe('assertUnderwriter [NFR-04]', () => {
  it('allows an underwriter actor', () => {
    expect(() => assertUnderwriter({ role: Role.UNDERWRITER, applicantId: undefined })).not.toThrow();
  });

  it('rejects an applicant actor', () => {
    expect(() => assertUnderwriter({ role: Role.APPLICANT, applicantId: 'APP-0001' })).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a missing role', () => {
    expect(() => assertUnderwriter({ role: undefined, applicantId: undefined })).toThrow(ForbiddenException);
  });
});

describe('assertCanAccessApplication [NFR-04]', () => {
  it('allows an underwriter to access any application', () => {
    expect(() =>
      assertCanAccessApplication({ role: Role.UNDERWRITER, applicantId: undefined }, 'APP-0002'),
    ).not.toThrow();
  });

  it('allows an applicant to access their own application', () => {
    expect(() =>
      assertCanAccessApplication({ role: Role.APPLICANT, applicantId: 'APP-0001' }, 'APP-0001'),
    ).not.toThrow();
  });

  it('rejects an applicant accessing another applicant\'s application', () => {
    expect(() =>
      assertCanAccessApplication({ role: Role.APPLICANT, applicantId: 'APP-0001' }, 'APP-0002'),
    ).toThrow(ForbiddenException);
  });

  it('rejects a request with no role at all', () => {
    expect(() =>
      assertCanAccessApplication({ role: undefined, applicantId: 'APP-0001' }, 'APP-0001'),
    ).toThrow(ForbiddenException);
  });
});
