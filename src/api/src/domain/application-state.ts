export const ApplicationState = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  DISBURSED: 'DISBURSED',
  CLOSED: 'CLOSED',
} as const;

export type ApplicationState = (typeof ApplicationState)[keyof typeof ApplicationState];

/** States in which an application is still "active" for duplicate-detection purposes (AC-05). */
const INACTIVE_STATES: ApplicationState[] = [ApplicationState.REJECTED, ApplicationState.CLOSED];

export function isActiveState(state: ApplicationState): boolean {
  return !INACTIVE_STATES.includes(state);
}
