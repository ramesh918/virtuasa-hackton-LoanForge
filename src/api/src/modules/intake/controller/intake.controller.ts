import { Body, Controller, Post } from '@nestjs/common';
import { CreateApplicationDto } from '../dto/create-application.dto.js';
import { IntakeService } from '../service/intake.service.js';

@Controller('applications')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Post()
  submit(@Body() dto: CreateApplicationDto) {
    return this.intakeService.submit(dto);
  }
}
