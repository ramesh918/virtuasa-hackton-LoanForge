import { ApplicationState } from '../../../domain/application-state.js';
import { InvalidApplicationStateException } from '../../../domain/exceptions.js';

/** AC-06: the full lifecycle. SUBMITTED -> REJECTED covers eligibility's automatic decline path. */
export const ALLOWED_TRANSITIONS: Record<ApplicationState, ApplicationState[]> = {
  [ApplicationState.SUBMITTED]: [ApplicationState.UNDER_REVIEW, ApplicationState.REJECTED],
  [ApplicationState.UNDER_REVIEW]: [
    ApplicationState.APPROVED,
    ApplicationState.REJECTED,
    ApplicationState.MANUAL_REVIEW,
  ],
  [ApplicationState.MANUAL_REVIEW]: [ApplicationState.APPROVED, ApplicationState.REJECTED],
  [ApplicationState.APPROVED]: [ApplicationState.DISBURSED, ApplicationState.CLOSED],
  [ApplicationState.REJECTED]: [],
  [ApplicationState.DISBURSED]: [ApplicationState.CLOSED],
  [ApplicationState.CLOSED]: [],
};

export function assertTransitionAllowed(
  applicationId: string,
  from: ApplicationState,
  to: ApplicationState,
): void {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new InvalidApplicationStateException(applicationId, from, to);
  }
}
