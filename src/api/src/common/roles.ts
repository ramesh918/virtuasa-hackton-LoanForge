import { ForbiddenException } from '@nestjs/common';

/** NFR-04: role separation is enforced at the controller boundary, not in the UI. */
export const Role = {
  APPLICANT: 'applicant',
  UNDERWRITER: 'underwriter',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface RequestActor {
  role: Role | undefined;
  applicantId: string | undefined;
}

function firstValue(header: string | string[] | undefined): string | undefined {
  return Array.isArray(header) ? header[0] : header;
}

/** Stub auth for this hackathon's scope: role and applicant identity travel as headers. */
export function extractActor(headers: Record<string, string | string[] | undefined>): RequestActor {
  return {
    role: firstValue(headers['x-role']) as Role | undefined,
    applicantId: firstValue(headers['x-applicant-id']),
  };
}

function forbidden(message: string): never {
  throw new ForbiddenException({ reason: 'ROLE_VIOLATION', message });
}

/** Underwriter-only endpoints (review queue, decisions). */
export function assertUnderwriter(actor: RequestActor): void {
  if (actor.role !== Role.UNDERWRITER) {
    forbidden('Underwriter role required');
  }
}

/**
 * NFR-04: an applicant may only access their own application; underwriters may access any
 * application (staff oversight is not an ownership violation).
 */
export function assertCanAccessApplication(actor: RequestActor, applicantId: string): void {
  if (actor.role === Role.UNDERWRITER) {
    return;
  }
  if (actor.role === Role.APPLICANT && actor.applicantId === applicantId) {
    return;
  }
  forbidden('Not authorized to access this application');
}
