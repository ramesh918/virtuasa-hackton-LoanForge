import { BadRequestException, ConflictException, UnprocessableEntityException } from '@nestjs/common';

/** AC-05: a second active application exists for the same applicant+product within the window. */
export class DuplicateApplicationException extends ConflictException {
  constructor(applicantId: string, productId: string) {
    super({
      reason: 'DUPLICATE_APPLICATION',
      message: `An active application already exists for applicant ${applicantId} and product ${productId}`,
    });
  }
}

/** AC-06: an application state transition outside the allowed table was attempted. */
export class InvalidApplicationStateException extends UnprocessableEntityException {
  constructor(applicationId: string, from: string, to: string) {
    super({
      reason: 'INVALID_STATE_TRANSITION',
      message: `Application ${applicationId} cannot transition from ${from} to ${to}`,
    });
  }
}

/** AC-01: tenure must be a positive number of months — see risk_pricing_spec.md's edge cases. */
export class InvalidTenureException extends BadRequestException {
  constructor(tenureMonths: number) {
    super({
      reason: 'INVALID_TENURE',
      message: `Tenure must be a positive number of months, got ${tenureMonths}`,
    });
  }
}

/** NFR-06: a concurrent request already moved the application out of the expected state. */
export class TransitionConflictException extends ConflictException {
  constructor(applicationId: string, expectedState: string) {
    super({
      reason: 'TRANSITION_CONFLICT',
      message: `Application ${applicationId} was no longer in state ${expectedState} when the transition was applied`,
    });
  }
}
