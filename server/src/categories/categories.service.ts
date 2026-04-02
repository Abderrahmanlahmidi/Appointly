import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  type AuthUser,
  isAdminUser,
  requireAdminUser,
} from '../auth/request-auth';
import {
  buildUserName,
  normalizeOptionalText,
  parseApprovalStatus,
  parseRequiredText,
} from '../common/domain.utils';
import { DRIZZLE } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ModerateCategoryDto } from './dto/moderate-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type CategoryInsert = typeof schema.categories.$inferInsert;
type CategoryRow = {
  category: typeof schema.categories.$inferSelect;
  owner: {
    id: number | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
};

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getAdminUserIds(excludeUserId?: number) {
    const adminUsers = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .innerJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(eq(schema.roles.name, 'ADMIN'));

    return adminUsers
      .map((entry) => entry.id)
      .filter((id) => id !== excludeUserId);
  }

  private serializeCategoryRow(row: CategoryRow) {
    return {
      ...row.category,
      ownerName: buildUserName(row.owner ?? undefined),
      ownerEmail: row.owner?.email ?? null,
      isOwnedByCurrentUser: false,
    };
  }

  private async getCategoryRowById(id: number) {
    const [row] = await this.db
      .select({
        category: schema.categories,
        owner: {
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          email: schema.users.email,
        },
      })
      .from(schema.categories)
      .leftJoin(schema.users, eq(schema.categories.userId, schema.users.id))
      .where(eq(schema.categories.id, id));

    return row;
  }

  private async ensureCategoryNameAvailable(name: string, excludeId?: number) {
    const normalizedName = name.toLowerCase();
    const exclusion = excludeId
      ? sql` and ${schema.categories.id} <> ${excludeId}`
      : sql``;
    const [existing] = await this.db
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(
        sql`lower(${schema.categories.name}) = ${normalizedName}${exclusion}`,
      );

    if (existing) {
      throw new BadRequestException('A category with this name already exists');
    }
  }

  async findAll(
    scope?: 'owned' | 'mine' | 'all' | 'service-options',
    authUser?: AuthUser | null,
  ) {
    const baseQuery = this.db
      .select({
        category: schema.categories,
        owner: {
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          email: schema.users.email,
        },
      })
      .from(schema.categories)
      .leftJoin(schema.users, eq(schema.categories.userId, schema.users.id));

    let rows: CategoryRow[];
    if (scope === 'owned' || scope === 'mine') {
      rows = await baseQuery
        .where(eq(schema.categories.userId, authUser!.id))
        .orderBy(desc(schema.categories.createdAt));
    } else if (scope === 'service-options') {
      rows = await baseQuery
        .where(
          or(
            eq(schema.categories.status, 'APPROVED'),
            eq(schema.categories.userId, authUser!.id),
          ),
        )
        .orderBy(desc(schema.categories.createdAt));
    } else if (scope === 'all') {
      requireAdminUser(authUser as AuthUser);
      rows = await baseQuery.orderBy(desc(schema.categories.createdAt));
    } else {
      rows = await baseQuery
        .where(eq(schema.categories.status, 'APPROVED'))
        .orderBy(desc(schema.categories.createdAt));
    }

    return rows.map((row) => ({
      ...this.serializeCategoryRow(row),
      isOwnedByCurrentUser: authUser
        ? row.category.userId === authUser.id
        : false,
    }));
  }

  async findOne(id: number, authUser?: AuthUser | null) {
    const row = await this.getCategoryRowById(id);
    if (!row?.category) {
      throw new NotFoundException('Category not found');
    }

    const canAccess =
      row.category.status === 'APPROVED' ||
      row.category.userId === authUser?.id ||
      isAdminUser(authUser);

    if (!canAccess) {
      throw new NotFoundException('Category not found');
    }

    return {
      ...this.serializeCategoryRow(row),
      isOwnedByCurrentUser: authUser
        ? row.category.userId === authUser.id
        : false,
    };
  }

  async create(values: CreateCategoryDto, authUser: AuthUser) {
    const name = parseRequiredText(values?.name, 'Name');
    await this.ensureCategoryNameAvailable(name);

    const description = normalizeOptionalText(values.description);
    const insertValues: CategoryInsert = {
      name,
      userId: authUser.id,
      ...(description !== undefined ? { description } : {}),
    };

    const [created] = await this.db
      .insert(schema.categories)
      .values(insertValues)
      .returning();

    const adminUserIds = await this.getAdminUserIds(authUser.id);

    await this.notificationsService.createMany([
      {
        userId: authUser.id,
        title: 'Category request submitted',
        message: `Your category "${name}" was submitted for admin review.`,
        type: 'INFO',
      },
      ...adminUserIds.map((adminId) => ({
        userId: adminId,
        title: 'New category request',
        message: `A new category "${name}" was submitted and is waiting for review.`,
        type: 'ALERT' as const,
      })),
    ]);

    const row = await this.getCategoryRowById(created.id);
    return row
      ? {
          ...this.serializeCategoryRow(row),
          isOwnedByCurrentUser: true,
        }
      : created;
  }

  async update(id: number, values: UpdateCategoryDto, authUser: AuthUser) {
    const existingRow = await this.getCategoryRowById(id);
    if (!existingRow?.category) {
      throw new NotFoundException('Category not found');
    }

    const isAdmin = isAdminUser(authUser);
    const isOwner = existingRow.category.userId === authUser.id;
    if (!isAdmin && !isOwner) {
      throw new NotFoundException('Category not found');
    }

    const updates: Partial<CategoryInsert> = {};

    if (Object.prototype.hasOwnProperty.call(values, 'name')) {
      const name = parseRequiredText(values?.name, 'Name');
      await this.ensureCategoryNameAvailable(name, id);
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

    if (!isAdmin) {
      updates.status = 'PENDING';
      updates.moderatedByUserId = null;
      updates.moderationNote = null;
    }

    const [updated] = await this.db
      .update(schema.categories)
      .set(updates)
      .where(eq(schema.categories.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException('Category not found');
    }

    if (!isAdmin) {
      const adminUserIds = await this.getAdminUserIds(authUser.id);
      await this.notificationsService.createMany([
        {
          userId: authUser.id,
          title: 'Category resubmitted',
          message: `Your category "${updated.name}" was updated and sent back for admin review.`,
          type: 'INFO',
        },
        ...adminUserIds.map((adminId) => ({
          userId: adminId,
          title: 'Category updated for review',
          message: `The category "${updated.name}" was updated and needs a new review.`,
          type: 'ALERT' as const,
        })),
      ]);
    }

    const row = await this.getCategoryRowById(updated.id);
    return row
      ? {
          ...this.serializeCategoryRow(row),
          isOwnedByCurrentUser: row.category.userId === authUser.id,
        }
      : updated;
  }

  async moderate(id: number, values: ModerateCategoryDto, authUser: AuthUser) {
    const adminUser = requireAdminUser(authUser);
    const existingRow = await this.getCategoryRowById(id);

    if (!existingRow?.category) {
      throw new NotFoundException('Category not found');
    }

    const status = parseApprovalStatus(values?.status);
    const moderationNote =
      normalizeOptionalText(values?.moderationNote) ?? null;

    const [updated] = await this.db
      .update(schema.categories)
      .set({
        status,
        moderationNote,
        moderatedByUserId: status === 'PENDING' ? null : adminUser.id,
      })
      .where(eq(schema.categories.id, id))
      .returning();

    if (status === 'REJECTED') {
      await this.db
        .update(schema.services)
        .set({
          approvalStatus: 'REJECTED',
          moderatedByUserId: adminUser.id,
          moderationNote:
            moderationNote ??
            'Service category was rejected by an administrator.',
        })
        .where(eq(schema.services.categoryId, id));
    }

    await this.notificationsService.createMany([
      {
        userId: existingRow.category.userId,
        title:
          status === 'APPROVED'
            ? 'Category approved'
            : status === 'REJECTED'
              ? 'Category rejected'
              : 'Category review updated',
        message:
          status === 'APPROVED'
            ? `Your category "${existingRow.category.name}" is now approved and available for use.`
            : status === 'REJECTED'
              ? `Your category "${existingRow.category.name}" was rejected.${moderationNote ? ` Note: ${moderationNote}` : ''}`
              : `Your category "${existingRow.category.name}" was moved back to pending review.`,
        type: status === 'REJECTED' ? 'ALERT' : 'INFO',
      },
    ]);

    const row = await this.getCategoryRowById(updated.id);
    return row
      ? {
          ...this.serializeCategoryRow(row),
          isOwnedByCurrentUser: row.category.userId === authUser.id,
        }
      : updated;
  }

  async remove(id: number, authUser: AuthUser) {
    const existingRow = await this.getCategoryRowById(id);
    if (!existingRow?.category) {
      throw new NotFoundException('Category not found');
    }

    const isAdmin = isAdminUser(authUser);
    const isOwner = existingRow.category.userId === authUser.id;
    if (!isAdmin && !isOwner) {
      throw new NotFoundException('Category not found');
    }

    const [linkedService] = await this.db
      .select({ id: schema.services.id })
      .from(schema.services)
      .where(eq(schema.services.categoryId, id));

    if (linkedService) {
      throw new BadRequestException(
        'This category cannot be deleted while services are still assigned to it',
      );
    }

    const [deleted] = await this.db
      .delete(schema.categories)
      .where(eq(schema.categories.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException('Category not found');
    }

    return deleted;
  }
}
