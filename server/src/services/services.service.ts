import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { type AuthUser, requireProviderUser } from '../auth/request-auth';
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

const isProviderUser = (authUser?: AuthUser | null) =>
  authUser && authUser.role === 'PROVIDER' ? authUser : null;

@Injectable()
export class ServicesService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  private async ensureOwnedCategory(
    categoryId: number,
    providerId: number,
  ): Promise<number> {
    const [category] = await this.db
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.id, categoryId),
          eq(schema.categories.userId, providerId),
        ),
      );

    if (!category) {
      throw new BadRequestException(
        'Category must belong to the authenticated provider',
      );
    }

    return category.id;
  }

  private async resolveCategoryId(
    value: unknown,
    providerId: number,
  ): Promise<number | null | undefined> {
    const categoryId = parseOptionalId(value, 'categoryId');

    if (categoryId === undefined || categoryId === null) {
      return categoryId;
    }

    return this.ensureOwnedCategory(categoryId, providerId);
  }

  async findAll(scope?: 'owned', authUser?: AuthUser | null) {
    if (scope === 'owned') {
      const providerUser = requireProviderUser(authUser as AuthUser);
      return this.db
        .select()
        .from(schema.services)
        .where(eq(schema.services.providerId, providerUser.id));
    }

    return this.db
      .select()
      .from(schema.services)
      .where(eq(schema.services.status, 'ACTIVE'));
  }

  async findOne(id: number, authUser?: AuthUser | null) {
    const providerUser = isProviderUser(authUser);
    const [ownedService] = providerUser
      ? await this.db
          .select()
          .from(schema.services)
          .where(
            and(
              eq(schema.services.id, id),
              eq(schema.services.providerId, providerUser.id),
            ),
          )
      : [];

    const [service] =
      ownedService !== undefined
        ? [ownedService]
        : await this.db
            .select()
            .from(schema.services)
            .where(
              and(
                eq(schema.services.id, id),
                eq(schema.services.status, 'ACTIVE'),
              ),
            );

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async findOneWithCreator(id: number, authUser?: AuthUser | null) {
    const providerUser = isProviderUser(authUser);
    const [ownedRow] = providerUser
      ? await this.db
          .select({
            service: schema.services,
            creator: {
              id: schema.users.id,
              firstName: schema.users.firstName,
              lastName: schema.users.lastName,
              image: schema.users.image,
            },
          })
          .from(schema.services)
          .leftJoin(
            schema.users,
            eq(schema.services.providerId, schema.users.id),
          )
          .where(
            and(
              eq(schema.services.id, id),
              eq(schema.services.providerId, providerUser.id),
            ),
          )
      : [];

    const [row] =
      ownedRow !== undefined
        ? [ownedRow]
        : await this.db
            .select({
              service: schema.services,
              creator: {
                id: schema.users.id,
                firstName: schema.users.firstName,
                lastName: schema.users.lastName,
                image: schema.users.image,
              },
            })
            .from(schema.services)
            .leftJoin(
              schema.users,
              eq(schema.services.providerId, schema.users.id),
            )
            .where(
              and(
                eq(schema.services.id, id),
                eq(schema.services.status, 'ACTIVE'),
              ),
            );

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

  async create(values: CreateServiceDto, authUser: AuthUser) {
    const providerUser = requireProviderUser(authUser);
    const title = values?.title?.trim();
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    const duration = parseDuration(values?.duration);
    const price = parsePrice(values?.price);
    const status = parseStatus(values?.status ?? undefined);
    const categoryId = await this.resolveCategoryId(
      values?.categoryId,
      providerUser.id,
    );
    const description = normalizeOptionalText(values.description);

    const insertValues: ServiceInsert = {
      title,
      providerId: providerUser.id,
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

  async update(id: number, values: UpdateServiceDto, authUser: AuthUser) {
    const providerUser = requireProviderUser(authUser);
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
      const categoryId = await this.resolveCategoryId(
        values?.categoryId,
        providerUser.id,
      );
      if (categoryId !== undefined) {
        updates.categoryId = categoryId;
      }
    }

    if (!Object.keys(updates).length) {
      throw new BadRequestException('No valid fields to update');
    }

    const whereClause = and(
      eq(schema.services.id, id),
      eq(schema.services.providerId, providerUser.id),
    );

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

  async remove(id: number, authUser: AuthUser) {
    const providerUser = requireProviderUser(authUser);
    const whereClause = and(
      eq(schema.services.id, id),
      eq(schema.services.providerId, providerUser.id),
    );

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
