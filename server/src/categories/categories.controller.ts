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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const parseScope = (value?: string) => {
  if (value === undefined) return undefined;
  if (value !== 'owned') {
    throw new BadRequestException('Invalid scope');
  }
  return value;
};

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Req() req: Request, @Query('scope') scope?: string) {
    const normalizedScope = parseScope(scope);
    const authUser =
      normalizedScope === 'owned' ? await requireAuthUser(req) : null;

    return this.categoriesService.findAll(normalizedScope, authUser);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.categoriesService.findOne(id, await getOptionalAuthUser(req));
  }

  @Post()
  async create(@Body() body: CreateCategoryDto, @Req() req: Request) {
    return this.categoriesService.create(body, await requireAuthUser(req));
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCategoryDto,
    @Req() req: Request,
  ) {
    return this.categoriesService.update(id, body, await requireAuthUser(req));
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.categoriesService.remove(id, await requireAuthUser(req));
  }
}
