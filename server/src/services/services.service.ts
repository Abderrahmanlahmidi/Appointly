import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

type ServiceInsert = typeof schema.services.$inferInsert;

type ServiceStatus = 'ACTIVE' | 'INACTIVE';

const normalizeOptionalText = (value?: string | null) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const parseRequiredId = (value: unknown, label: string) => {
  const id = Number(value);
  if (!Number.isFinite(id) || id <= 0) {
    throw new BadRequestException(`${label} is required`);
  }
  return id;
};

const parseOptionalId = (value: unknown, label: string) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const id = Number(value);
  if (!Number.isFinite(id) || id <= 0) {
    throw new BadRequestException(`Invalid ${label}`);
  }
  return id;
};

const parseDuration = (value: unknown) => {
  const duration = Number(value);
  if (
    !Number.isFinite(duration) ||
    !Number.isInteger(duration) ||
    duration <= 0
  ) {
    throw new BadRequestException('Duration must be a positive integer');
  }
  return duration;
};

const parsePrice = (value: unknown) => {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) {
    throw new BadRequestException('Price must be a positive number');
  }
  return price.toFixed(2);
};

const parseStatus = (value?: string | null) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = String(value).trim().toUpperCase();
  if (normalized !== 'ACTIVE' && normalized !== 'INACTIVE') {
    throw new BadRequestException('Invalid status');
  }
  return normalized as ServiceStatus;
};

@Injectable()
export class ServicesService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async findAll(providerId?: number) {
    if (providerId) {
      return this.db
        .select()
        .from(schema.services)
        .where(eq(schema.services.providerId, providerId));
    }

    return this.db.select().from(schema.services);
  }

  async findOne(id: number, providerId?: number) {
    const whereClause = providerId
      ? and(
          eq(schema.services.id, id),
          eq(schema.services.providerId, providerId),
        )
      : eq(schema.services.id, id);

    const [service] = await this.db
      .select()
      .from(schema.services)
      .where(whereClause);

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async findOneWithCreator(id: number, providerId?: number) {
    const whereClause = providerId
      ? and(
          eq(schema.services.id, id),
          eq(schema.services.providerId, providerId),
        )
      : eq(schema.services.id, id);

    const [row] = await this.db
      .select({
        service: schema.services,
        creator: {
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          email: schema.users.email,
          image: schema.users.image,
        },
      })
      .from(schema.services)
      .leftJoin(schema.users, eq(schema.services.providerId, schema.users.id))
      .where(whereClause);

    if (!row?.service) {
      throw new NotFoundException('Service not found');
    }

    const createdBy = row.creator?.id
      ? {
          ...row.creator,
          name:
            `${row.creator.firstName ?? ''} ${row.creator.lastName ?? ''}`.trim() ||
            null,
        }
      : null;

    return {
      ...row.service,
      createdBy,
    };
  }

  async create(values: CreateServiceDto) {
    const title = values?.title?.trim();
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    const providerId = parseRequiredId(values?.providerId, 'Provider id');
    const duration = parseDuration(values?.duration);
    const price = parsePrice(values?.price);
    const status = parseStatus(values?.status ?? undefined);
    const categoryId = parseOptionalId(values?.categoryId, 'categoryId');
    const description = normalizeOptionalText(values.description);

    const insertValues: ServiceInsert = {
      title,
      providerId,
      duration,
      price,
      ...(status ? { status } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(description !== undefined ? { description } : {}),
    };

    const [created] = await this.db
      .insert(schema.services)
      .values(insertValues)
      .returning();

    return created;
  }

  async update(id: number, values: UpdateServiceDto, providerId?: number) {
    const updates: Partial<ServiceInsert> = {};

    if (Object.prototype.hasOwnProperty.call(values, 'title')) {
      const title = values?.title?.trim();
      if (!title) {
        throw new BadRequestException('Title is required');
      }
      updates.title = title;
    }

    if (Object.prototype.hasOwnProperty.call(values, 'description')) {
      const description = normalizeOptionalText(values.description);
      if (description !== undefined) {
        updates.description = description;
      }
    }

    if (Object.prototype.hasOwnProperty.call(values, 'duration')) {
      updates.duration = parseDuration(values?.duration);
    }

    if (Object.prototype.hasOwnProperty.call(values, 'price')) {
      updates.price = parsePrice(values?.price);
    }

    if (Object.prototype.hasOwnProperty.call(values, 'status')) {
      const status = parseStatus(values?.status ?? undefined);
      if (status !== undefined && status !== null) {
        updates.status = status;
      }
    }

    if (Object.prototype.hasOwnProperty.call(values, 'categoryId')) {
      const categoryId = parseOptionalId(values?.categoryId, 'categoryId');
      if (categoryId !== undefined) {
        updates.categoryId = categoryId;
      }
    }

    if (Object.prototype.hasOwnProperty.call(values, 'providerId')) {
      updates.providerId = parseRequiredId(values?.providerId, 'Provider id');
    }

    if (!Object.keys(updates).length) {
      throw new BadRequestException('No valid fields to update');
    }

    const ownerId = providerId
      ? parseRequiredId(providerId, 'providerId')
      : null;
    const whereClause = ownerId
      ? and(eq(schema.services.id, id), eq(schema.services.providerId, ownerId))
      : eq(schema.services.id, id);

    const [updated] = await this.db
      .update(schema.services)
      .set(updates)
      .where(whereClause)
      .returning();

    if (!updated) {
      throw new NotFoundException('Service not found');
    }

    return updated;
  }

  async remove(id: number, providerId?: number) {
    const ownerId = providerId
      ? parseRequiredId(providerId, 'providerId')
      : null;
    const whereClause = ownerId
      ? and(eq(schema.services.id, id), eq(schema.services.providerId, ownerId))
      : eq(schema.services.id, id);

    const [deleted] = await this.db
      .delete(schema.services)
      .where(whereClause)
      .returning();

    if (!deleted) {
      throw new NotFoundException('Service not found');
    }

    return deleted;
  }
}
