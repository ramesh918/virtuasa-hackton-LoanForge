import { Controller, Param, Patch } from '@nestjs/common';
import { DisbursementService } from '../service/disbursement.service.js';

@Controller('applications')
export class DisbursementController {
  constructor(private readonly disbursementService: DisbursementService) {}

  @Patch(':id/accept-offer')
  acceptOffer(@Param('id') applicationId: string) {
    return this.disbursementService.acceptOffer(applicationId);
  }
}
