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
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

const parseOptionalId = (value?: string, label = 'id') => {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new BadRequestException(`Invalid ${label}`);
  }
  return parsed;
};

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll(@Query('providerId') providerId?: string) {
    return this.servicesService.findAll(
      parseOptionalId(providerId, 'providerId'),
    );
  }

  @Get(':id/details')
  findOneWithCreator(
    @Param('id', ParseIntPipe) id: number,
    @Query('providerId') providerId?: string,
  ) {
    return this.servicesService.findOneWithCreator(
      id,
      parseOptionalId(providerId, 'providerId'),
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('providerId') providerId?: string,
  ) {
    return this.servicesService.findOne(
      id,
      parseOptionalId(providerId, 'providerId'),
    );
  }

  @Post()
  create(@Body() body: CreateServiceDto) {
    return this.servicesService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateServiceDto,
    @Query('providerId') providerId?: string,
  ) {
    return this.servicesService.update(
      id,
      body,
      parseOptionalId(providerId, 'providerId'),
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('providerId') providerId?: string,
  ) {
    return this.servicesService.remove(
      id,
      parseOptionalId(providerId, 'providerId'),
    );
  }
}
