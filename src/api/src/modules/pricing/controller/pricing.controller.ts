import { Controller, Get, Headers, NotFoundException, Param } from '@nestjs/common';
import { PricingService } from '../service/pricing.service.js';
import { IntakeService } from '../../intake/service/intake.service.js';
import { assertCanAccessApplication, extractActor } from '../../../common/roles.js';

@Controller('applications')
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    private readonly intakeService: IntakeService,
  ) {}

  // wires the "view offer (rate, EMI, schedule)" applicant flow — NFR-04 ownership enforced.
  @Get(':id/offer')
  async getOffer(@Param('id') applicationId: string, @Headers() headers: Record<string, string>) {
    const actor = extractActor(headers);
    const application = await this.intakeService.findById(applicationId);
    if (!application) {
      throw new NotFoundException();
    }
    assertCanAccessApplication(actor, application.applicantId);

    const offer = await this.pricingService.getOffer(applicationId);
    if (!offer) {
      throw new NotFoundException();
    }
    return offer;
  }
}
