import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { getOptionalAuthUser, requireAuthUser } from '../auth/request-auth';
import { AvailabilitiesService } from './availabilities.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

const parseScope = (value?: string) => {
  if (value === undefined) return undefined;
  if (value !== 'owned') {
    throw new BadRequestException('Invalid scope');
  }
  return value;
};

@Controller('availabilities')
export class AvailabilitiesController {
  constructor(private readonly availabilitiesService: AvailabilitiesService) {}

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('scope') scope?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    const normalizedScope = parseScope(scope);
    const authUser = normalizedScope
      ? await requireAuthUser(req)
      : await getOptionalAuthUser(req);

    return this.availabilitiesService.findAll({
      scope: normalizedScope,
      authUser,
      serviceId,
    });
  }

  @Post()
  async create(@Body() body: CreateAvailabilityDto, @Req() req: Request) {
    return this.availabilitiesService.create(body, await requireAuthUser(req));
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAvailabilityDto,
    @Req() req: Request,
  ) {
    return this.availabilitiesService.update(
      id,
      body,
      await requireAuthUser(req),
    );
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.availabilitiesService.remove(id, await requireAuthUser(req));
  }
}
