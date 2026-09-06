import { Controller, Headers, NotFoundException, Param, Patch } from '@nestjs/common';
import { DisbursementService } from '../service/disbursement.service.js';
import { IntakeService } from '../../intake/service/intake.service.js';
import { assertCanAccessApplication, extractActor } from '../../../common/roles.js';

@Controller('applications')
export class DisbursementController {
  constructor(
    private readonly disbursementService: DisbursementService,
    private readonly intakeService: IntakeService,
  ) {}

  // NFR-04: only the owning applicant may accept their own offer.
  @Patch(':id/accept-offer')
  async acceptOffer(@Param('id') applicationId: string, @Headers() headers: Record<string, string>) {
    const actor = extractActor(headers);
    const application = await this.intakeService.findById(applicationId);
    if (!application) {
      throw new NotFoundException();
    }
    assertCanAccessApplication(actor, application.applicantId);
    return this.disbursementService.acceptOffer(applicationId);
  }
}
