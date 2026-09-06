import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { ClientSession, Connection } from 'mongoose';
import { IntakeService } from '../../intake/service/intake.service.js';
import { UNDERWRITING_REPOSITORY } from '../repository/underwriting.repository.js';
import type { UnderwritingRepository } from '../repository/underwriting.repository.js';
import { DECISION_REPOSITORY } from '../repository/decision.repository.js';
import type { DecisionRepository } from '../repository/decision.repository.js';
import { Decision, DecisionRecord } from '../schema/decision-record.schema.js';
import { assertTransitionAllowed } from './state-machine.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { TransitionConflictException } from '../../../domain/exceptions.js';
import { Application } from '../../intake/schema/application.schema.js';

const DECISION_TO_STATE: Record<Decision, ApplicationState> = {
  [Decision.APPROVE]: ApplicationState.APPROVED,
  [Decision.DECLINE]: ApplicationState.REJECTED,
  [Decision.REQUEST_INFO]: ApplicationState.MANUAL_REVIEW,
};

@Injectable()
export class UnderwritingService {
  constructor(
    private readonly intakeService: IntakeService,
    @Inject(UNDERWRITING_REPOSITORY) private readonly repository: UnderwritingRepository,
    @Inject(DECISION_REPOSITORY) private readonly decisionRepository: DecisionRepository,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /** AC-06, NFR-06: validated against the state machine, then applied as an atomic compare-and-set. */
  async transition(
    applicationId: string,
    toState: ApplicationState,
    session?: ClientSession,
  ): Promise<Application> {
    const application = await this.intakeService.findById(applicationId);
    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    assertTransitionAllowed(applicationId, application.state, toState);

    const updated = await this.repository.transition(applicationId, application.state, toState, session);
    if (!updated) {
      throw new TransitionConflictException(applicationId, application.state);
    }
    return updated;
  }

  /** AC-07: state transition and decision record persist together or not at all. */
  async decide(
    applicationId: string,
    actor: string,
    decision: Decision,
    reason: string,
  ): Promise<Application> {
    const toState = DECISION_TO_STATE[decision];
    const session = await this.connection.startSession();
    try {
      let application!: Application;
      await session.withTransaction(async () => {
        application = await this.transition(applicationId, toState, session);
        const record: DecisionRecord = { applicationId, actor, decision, reason, timestamp: new Date() };
        await this.decisionRepository.record(record, session);
      });
      return application;
    } finally {
      await session.endSession();
    }
  }

  /** AC-07: applications waiting on a human decision. */
  async getQueue(): Promise<Application[]> {
    return this.repository.findQueue([ApplicationState.UNDER_REVIEW, ApplicationState.MANUAL_REVIEW]);
  }
}
