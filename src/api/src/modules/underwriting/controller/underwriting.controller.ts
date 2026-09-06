import { Body, Controller, Get, Headers, Param, Patch } from '@nestjs/common';
import { UnderwritingService } from '../service/underwriting.service.js';
import { Decision } from '../entity/decision-record.entity.js';
import { assertUnderwriter, extractActor } from '../../../common/roles.js';

class DecisionDto {
  actor!: string;
  decision!: Decision;
  reason!: string;
}

@Controller()
export class UnderwritingController {
  constructor(private readonly underwritingService: UnderwritingService) {}

  // NFR-04: the review queue is underwriter-only.
  @Get('queue')
  getQueue(@Headers() headers: Record<string, string>) {
    assertUnderwriter(extractActor(headers));
    return this.underwritingService.getQueue();
  }

  // wires AC-07 decision flow — underwriter-only.
  @Patch('applications/:id/decision')
  decide(
    @Param('id') applicationId: string,
    @Body() dto: DecisionDto,
    @Headers() headers: Record<string, string>,
  ) {
    assertUnderwriter(extractActor(headers));
    return this.underwritingService.decide(applicationId, dto.actor, dto.decision, dto.reason);
  }
}
