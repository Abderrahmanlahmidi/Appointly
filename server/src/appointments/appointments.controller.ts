import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { requireAuthUser } from '../auth/request-auth';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async findAll(@Req() req: Request) {
    return this.appointmentsService.findAll(await requireAuthUser(req));
  }

  @Post()
  async create(@Body() body: CreateAppointmentDto, @Req() req: Request) {
    return this.appointmentsService.create(body, await requireAuthUser(req));
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAppointmentStatusDto,
    @Req() req: Request,
  ) {
    return this.appointmentsService.updateStatus(
      id,
      body,
      await requireAuthUser(req),
    );
  }
}
