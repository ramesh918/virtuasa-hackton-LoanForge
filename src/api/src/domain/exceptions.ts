import { ConflictException, UnprocessableEntityException } from '@nestjs/common';

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
