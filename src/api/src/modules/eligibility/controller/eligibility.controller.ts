import { Controller, Headers, NotFoundException, Param, Patch } from '@nestjs/common';
import { EligibilityService } from '../service/eligibility.service.js';
import { PricingService } from '../../pricing/service/pricing.service.js';
import { UnderwritingService } from '../../underwriting/service/underwriting.service.js';
import { IntakeService } from '../../intake/service/intake.service.js';
import { ApplicationState } from '../../../domain/application-state.js';
import { assertCanAccessApplication, extractActor } from '../../../common/roles.js';

/**
 * The single orchestration entry point for "what happens right after intake" — see
 * specs/eligibility_spec.md's "Orchestration entry point" section. Without this, an application
 * never moves past SUBMITTED and the underwriter queue never receives anything.
 */
@Controller('applications')
export class EligibilityController {
  constructor(
    private readonly eligibilityService: EligibilityService,
    private readonly pricingService: PricingService,
    private readonly underwritingService: UnderwritingService,
    private readonly intakeService: IntakeService,
  ) {}

  @Patch(':id/evaluate')
  async evaluate(@Param('id') applicationId: string, @Headers() headers: Record<string, string>) {
    const actor = extractActor(headers);
    const application = await this.intakeService.findById(applicationId);
    if (!application) {
      throw new NotFoundException();
    }
    assertCanAccessApplication(actor, application.applicantId);

    const decision = await this.eligibilityService.evaluate(applicationId);

    if (decision.eligible && decision.creditScore !== undefined) {
      await this.pricingService.priceApplication(applicationId, decision.creditScore);
      await this.underwritingService.transition(applicationId, ApplicationState.UNDER_REVIEW);
    }

    return decision;
  }
}
