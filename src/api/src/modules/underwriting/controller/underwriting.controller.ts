import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UnderwritingService } from '../service/underwriting.service.js';
import { Decision } from '../schema/decision-record.schema.js';

class DecisionDto {
  actor!: string;
  decision!: Decision;
  reason!: string;
}

@Controller()
export class UnderwritingController {
  constructor(private readonly underwritingService: UnderwritingService) {}

  @Get('queue')
  getQueue() {
    return this.underwritingService.getQueue();
  }

  @Patch('applications/:id/decision')
  decide(@Param('id') applicationId: string, @Body() dto: DecisionDto) {
    return this.underwritingService.decide(applicationId, dto.actor, dto.decision, dto.reason);
  }
}
