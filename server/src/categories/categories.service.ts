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
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type CategoryInsert = typeof schema.categories.$inferInsert;

const normalizeOptionalText = (value?: string | null) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async findAll(scope?: 'owned', authUser?: AuthUser | null) {
    if (scope === 'owned') {
      const providerUser = requireProviderUser(authUser as AuthUser);
      return this.db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.userId, providerUser.id));
    }

    return this.db.select().from(schema.categories);
  }

  async findOne(id: number, authUser?: AuthUser | null) {
    const providerUser =
      authUser && authUser.role === 'PROVIDER' ? authUser : null;
    const whereClause = providerUser
      ? and(
          eq(schema.categories.id, id),
          eq(schema.categories.userId, providerUser.id),
        )
      : eq(schema.categories.id, id);

    const [category] = await this.db
      .select()
      .from(schema.categories)
      .where(whereClause);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(values: CreateCategoryDto, authUser: AuthUser) {
    const providerUser = requireProviderUser(authUser);
    const name = values?.name?.trim();
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    const description = normalizeOptionalText(values.description);
    const insertValues: CategoryInsert = {
      name,
      userId: providerUser.id,
      ...(description !== undefined ? { description } : {}),
    };

    const [created] = await this.db
      .insert(schema.categories)
      .values(insertValues)
      .returning();

    return created;
  }

  async update(id: number, values: UpdateCategoryDto, authUser: AuthUser) {
    const providerUser = requireProviderUser(authUser);
    const updates: Partial<CategoryInsert> = {};

    if (Object.prototype.hasOwnProperty.call(values, 'name')) {
      const name = values?.name?.trim();
      if (!name) {
        throw new BadRequestException('Name is required');
      }
      updates.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(values, 'description')) {
      const description = normalizeOptionalText(values.description);
      if (description !== undefined) {
        updates.description = description;
      }
    }

    if (!Object.keys(updates).length) {
      throw new BadRequestException('No valid fields to update');
    }

    const whereClause = and(
      eq(schema.categories.id, id),
      eq(schema.categories.userId, providerUser.id),
    );

    const [updated] = await this.db
      .update(schema.categories)
      .set(updates)
      .where(whereClause)
      .returning();

    if (!updated) {
      throw new NotFoundException('Category not found');
    }

    return updated;
  }

  async remove(id: number, authUser: AuthUser) {
    const providerUser = requireProviderUser(authUser);
    const whereClause = and(
      eq(schema.categories.id, id),
      eq(schema.categories.userId, providerUser.id),
    );

    const [deleted] = await this.db
      .delete(schema.categories)
      .where(whereClause)
      .returning();

    if (!deleted) {
      throw new NotFoundException('Category not found');
    }

    return deleted;
  }
}
