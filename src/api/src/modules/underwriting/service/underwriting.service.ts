import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import { IntakeService } from '../../intake/service/intake.service.js';
import { UNDERWRITING_REPOSITORY } from '../repository/underwriting.repository.js';
import type { UnderwritingRepository } from '../repository/underwriting.repository.js';
import { DECISION_REPOSITORY } from '../repository/decision.repository.js';
import type { DecisionRepository } from '../repository/decision.repository.js';
import { Decision, DecisionRecord } from '../entity/decision-record.entity.js';
import { assertTransitionAllowed } from './state-machine.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { TransitionConflictException } from '../../../domain/exceptions.js';
import { Application } from '../../intake/entity/application.entity.js';

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
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** AC-06, NFR-06: validated against the state machine, then applied as an atomic compare-and-set. */
  async transition(
    applicationId: string,
    toState: ApplicationState,
    manager?: EntityManager,
  ): Promise<Application> {
    const application = await this.intakeService.findById(applicationId);
    if (!application) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    assertTransitionAllowed(applicationId, application.state, toState);

    const updated = await this.repository.transition(applicationId, application.state, toState, manager);
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
    return this.dataSource.transaction(async (manager) => {
      const application = await this.transition(applicationId, toState, manager);
      const record: DecisionRecord = { applicationId, actor, decision, reason, timestamp: new Date() };
      await this.decisionRepository.record(record, manager);
      return application;
    });
  }

  /** AC-07: applications waiting on a human decision. */
  async getQueue(): Promise<Application[]> {
    return this.repository.findQueue([ApplicationState.UNDER_REVIEW, ApplicationState.MANUAL_REVIEW]);
  }
}
