import { Body, Controller, Get, Headers, NotFoundException, Param, Post } from '@nestjs/common';
import { CreateApplicationDto } from '../dto/create-application.dto.js';
import { IntakeService } from '../service/intake.service.js';
import { assertCanAccessApplication, extractActor, Role } from '../../../common/roles.js';

@Controller('applications')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  // wires AC-01 submit flow
  @Post()
  submit(@Body() dto: CreateApplicationDto, @Headers() headers: Record<string, string>) {
    const actor = extractActor(headers);
    if (actor.role === Role.APPLICANT) {
      assertCanAccessApplication(actor, dto.applicantId);
    }
    return this.intakeService.submit(dto);
  }

  // NFR-04: an applicant may only read their own application's status.
  @Get(':id')
  async getById(@Param('id') applicationId: string, @Headers() headers: Record<string, string>) {
    const actor = extractActor(headers);
    const application = await this.intakeService.findById(applicationId);
    if (!application) {
      throw new NotFoundException();
    }
    assertCanAccessApplication(actor, application.applicantId);
    return application;
  }
}
