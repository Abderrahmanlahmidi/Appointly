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
import { ModerateServiceDto } from './dto/moderate-service.dto';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

const parseScope = (value?: string) => {
  if (value === undefined) return undefined;
  if (value !== 'owned' && value !== 'all') {
    throw new BadRequestException('Invalid scope');
  }
  return value;
};

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async findAll(@Req() req: Request, @Query('scope') scope?: string) {
    const normalizedScope = parseScope(scope);
    const authUser = normalizedScope ? await requireAuthUser(req) : null;

    return this.servicesService.findAll(normalizedScope, authUser);
  }

  @Get(':id/details')
  async findOneWithCreator(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    return this.servicesService.findOneWithCreator(
      id,
      await getOptionalAuthUser(req),
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.servicesService.findOne(id, await getOptionalAuthUser(req));
  }

  @Post()
  async create(@Body() body: CreateServiceDto, @Req() req: Request) {
    return this.servicesService.create(body, await requireAuthUser(req));
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateServiceDto,
    @Req() req: Request,
  ) {
    return this.servicesService.update(id, body, await requireAuthUser(req));
  }

  @Patch(':id/moderate')
  async moderate(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ModerateServiceDto,
    @Req() req: Request,
  ) {
    return this.servicesService.moderate(id, body, await requireAuthUser(req));
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.servicesService.remove(id, await requireAuthUser(req));
  }
}
