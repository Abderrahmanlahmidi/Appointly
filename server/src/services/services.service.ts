import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import {
  type AuthUser,
  isAdminUser,
  requireAdminUser,
  requireProviderUser,
} from '../auth/request-auth';
import {
  buildUserName,
  normalizeOptionalText,
  parseApprovalStatus,
  parseOptionalId,
  parsePositiveInteger,
  parsePositivePrice,
  parseRequiredText,
} from '../common/domain.utils';
import { DRIZZLE } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { ModerateServiceDto } from './dto/moderate-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

type ServiceInsert = typeof schema.services.$inferInsert;
type ServiceStatus = 'ACTIVE' | 'INACTIVE';
type ServiceRow = {
  service: typeof schema.services.$inferSelect;
  category: {
    id: number | null;
    name: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  } | null;
  provider: {
    id: number | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    image: string | null;
  } | null;
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

  private serializeServiceRow(row: ServiceRow) {
    return {
      ...row.service,
      categoryName: row.category?.name ?? null,
      categoryStatus: row.category?.status ?? null,
      providerName: buildUserName(row.provider ?? undefined),
      providerEmail: row.provider?.email ?? null,
    };
  }

  private isPubliclyVisible(row: ServiceRow) {
    const categoryApproved =
      row.service.categoryId === null || row.category?.status === 'APPROVED';

    return (
      row.service.status === 'ACTIVE' &&
      row.service.approvalStatus === 'APPROVED' &&
      categoryApproved
    );
  }

  private async getServiceRowById(id: number) {
    const [row] = await this.db
      .select({
        service: schema.services,
        category: {
          id: schema.categories.id,
          name: schema.categories.name,
          status: schema.categories.status,
        },
        provider: {
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          email: schema.users.email,
          image: schema.users.image,
        },
      })
      .from(schema.services)
      .leftJoin(
        schema.categories,
        eq(schema.services.categoryId, schema.categories.id),
      )
      .leftJoin(schema.users, eq(schema.services.providerId, schema.users.id))
      .where(eq(schema.services.id, id));

    return row;
  }

  private async ensureCategoryAvailableForProvider(
    categoryId: number,
    providerId: number,
  ): Promise<number> {
    const [category] = await this.db
      .select({
        id: schema.categories.id,
        userId: schema.categories.userId,
        status: schema.categories.status,
      })
      .from(schema.categories)
      .where(eq(schema.categories.id, categoryId));

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    const canUseCategory =
      category.status === 'APPROVED' || category.userId === providerId;

    if (!canUseCategory) {
      throw new BadRequestException(
        'Only approved categories or your own submitted categories can be assigned',
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

    return this.ensureCategoryAvailableForProvider(categoryId, providerId);
  }

  async findAll(scope?: 'owned' | 'all', authUser?: AuthUser | null) {
    if (scope === 'owned') {
      const providerUser = requireProviderUser(authUser as AuthUser);
      const rows = await this.db
        .select({
          service: schema.services,
          category: {
            id: schema.categories.id,
            name: schema.categories.name,
            status: schema.categories.status,
          },
          provider: {
            id: schema.users.id,
            firstName: schema.users.firstName,
            lastName: schema.users.lastName,
            email: schema.users.email,
            image: schema.users.image,
          },
        })
        .from(schema.services)
        .leftJoin(
          schema.categories,
          eq(schema.services.categoryId, schema.categories.id),
        )
        .leftJoin(schema.users, eq(schema.services.providerId, schema.users.id))
        .where(eq(schema.services.providerId, providerUser.id))
        .orderBy(desc(schema.services.createdAt));

      return rows.map((row) => ({
        ...this.serializeServiceRow(row),
        canManage: true,
      }));
    }

    if (scope === 'all') {
      requireAdminUser(authUser as AuthUser);
      const rows = await this.db
        .select({
          service: schema.services,
          category: {
            id: schema.categories.id,
            name: schema.categories.name,
            status: schema.categories.status,
          },
          provider: {
            id: schema.users.id,
            firstName: schema.users.firstName,
            lastName: schema.users.lastName,
            email: schema.users.email,
            image: schema.users.image,
          },
        })
        .from(schema.services)
        .leftJoin(
          schema.categories,
          eq(schema.services.categoryId, schema.categories.id),
        )
        .leftJoin(schema.users, eq(schema.services.providerId, schema.users.id))
        .orderBy(desc(schema.services.createdAt));

      return rows.map((row) => ({
        ...this.serializeServiceRow(row),
        canManage: true,
      }));
    }

    const rows = await this.db
      .select({
        service: schema.services,
        category: {
          id: schema.categories.id,
          name: schema.categories.name,
          status: schema.categories.status,
        },
        provider: {
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          email: schema.users.email,
          image: schema.users.image,
        },
      })
      .from(schema.services)
      .leftJoin(
        schema.categories,
        eq(schema.services.categoryId, schema.categories.id),
      )
      .leftJoin(schema.users, eq(schema.services.providerId, schema.users.id))
      .where(
        and(
          eq(schema.services.status, 'ACTIVE'),
          eq(schema.services.approvalStatus, 'APPROVED'),
        ),
      )
      .orderBy(desc(schema.services.createdAt));

    return rows
      .filter((row) => this.isPubliclyVisible(row))
      .map((row) => ({
        ...this.serializeServiceRow(row),
        canManage: false,
      }));
  }

  async findOne(id: number, authUser?: AuthUser | null) {
    const row = await this.getServiceRowById(id);
    if (!row?.service) {
      throw new NotFoundException('Service not found');
    }

    const isOwner = row.service.providerId === authUser?.id;
    const canAccess =
      isOwner || isAdminUser(authUser) || this.isPubliclyVisible(row);

    if (!canAccess) {
      throw new NotFoundException('Service not found');
    }

    return {
      ...this.serializeServiceRow(row),
      canManage: Boolean(isOwner || isAdminUser(authUser)),
    };
  }

  async findOneWithCreator(id: number, authUser?: AuthUser | null) {
    const row = await this.getServiceRowById(id);
    if (!row?.service) {
      throw new NotFoundException('Service not found');
    }

    const isOwner = row.service.providerId === authUser?.id;
    const canAccess =
      isOwner || isAdminUser(authUser) || this.isPubliclyVisible(row);

    if (!canAccess) {
      throw new NotFoundException('Service not found');
    }

    const createdBy = row.provider?.id
      ? {
          ...row.provider,
          name: buildUserName(row.provider),
        }
      : null;

    return {
      ...this.serializeServiceRow(row),
      createdBy,
    };
  }

  async create(values: CreateServiceDto, authUser: AuthUser) {
    const providerUser = requireProviderUser(authUser);
    const title = parseRequiredText(values?.title, 'Title');
    const duration = parsePositiveInteger(values?.duration, 'Duration');
    const price = parsePositivePrice(values?.price);
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

    const adminUserIds = await this.getAdminUserIds(providerUser.id);

    await this.notificationsService.createMany([
      {
        userId: providerUser.id,
        title: 'Service submitted',
        message: `Your service "${title}" was created and sent for admin review.`,
        type: 'INFO',
      },
      ...adminUserIds.map((adminId) => ({
        userId: adminId,
        title: 'New service submission',
        message: `A new service "${title}" was submitted and is waiting for review.`,
        type: 'ALERT' as const,
      })),
    ]);

    const row = await this.getServiceRowById(created.id);
    return row
      ? {
          ...this.serializeServiceRow(row),
          canManage: true,
        }
      : created;
  }

  async update(id: number, values: UpdateServiceDto, authUser: AuthUser) {
    const providerUser = requireProviderUser(authUser);
    const existingRow = await this.getServiceRowById(id);
    if (
      !existingRow?.service ||
      existingRow.service.providerId !== providerUser.id
    ) {
      throw new NotFoundException('Service not found');
    }

    const updates: Partial<ServiceInsert> = {};

    if (Object.prototype.hasOwnProperty.call(values, 'title')) {
      const title = parseRequiredText(values?.title, 'Title');
      updates.title = title;
    }

    if (Object.prototype.hasOwnProperty.call(values, 'description')) {
      const description = normalizeOptionalText(values.description);
      if (description !== undefined) {
        updates.description = description;
      }
    }

    if (Object.prototype.hasOwnProperty.call(values, 'duration')) {
      updates.duration = parsePositiveInteger(values?.duration, 'Duration');
    }

    if (Object.prototype.hasOwnProperty.call(values, 'price')) {
      updates.price = parsePositivePrice(values?.price);
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

    updates.approvalStatus = 'PENDING';
    updates.moderatedByUserId = null;
    updates.moderationNote = null;

    const [updated] = await this.db
      .update(schema.services)
      .set(updates)
      .where(eq(schema.services.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException('Service not found');
    }

    const adminUserIds = await this.getAdminUserIds(providerUser.id);
    await this.notificationsService.createMany([
      {
        userId: providerUser.id,
        title: 'Service resubmitted',
        message: `Your service "${updated.title}" was updated and sent back for admin review.`,
        type: 'INFO',
      },
      ...adminUserIds.map((adminId) => ({
        userId: adminId,
        title: 'Service updated for review',
        message: `The service "${updated.title}" was updated and needs a new review.`,
        type: 'ALERT' as const,
      })),
    ]);

    const row = await this.getServiceRowById(updated.id);
    return row
      ? {
          ...this.serializeServiceRow(row),
          canManage: true,
        }
      : updated;
  }

  async moderate(id: number, values: ModerateServiceDto, authUser: AuthUser) {
    const adminUser = requireAdminUser(authUser);
    const existingRow = await this.getServiceRowById(id);

    if (!existingRow?.service) {
      throw new NotFoundException('Service not found');
    }

    const approvalStatus = parseApprovalStatus(values?.approvalStatus);
    const moderationNote =
      normalizeOptionalText(values?.moderationNote) ?? null;

    if (approvalStatus === 'APPROVED' && existingRow.service.categoryId) {
      if (existingRow.category?.status !== 'APPROVED') {
        throw new BadRequestException(
          'A service can only be approved after its category is approved',
        );
      }
    }

    const [updated] = await this.db
      .update(schema.services)
      .set({
        approvalStatus,
        moderationNote,
        moderatedByUserId: approvalStatus === 'PENDING' ? null : adminUser.id,
      })
      .where(eq(schema.services.id, id))
      .returning();

    await this.notificationsService.createMany([
      {
        userId: existingRow.service.providerId,
        title:
          approvalStatus === 'APPROVED'
            ? 'Service approved'
            : approvalStatus === 'REJECTED'
              ? 'Service rejected'
              : 'Service review updated',
        message:
          approvalStatus === 'APPROVED'
            ? `Your service "${existingRow.service.title}" is now approved and visible to clients.`
            : approvalStatus === 'REJECTED'
              ? `Your service "${existingRow.service.title}" was rejected.${moderationNote ? ` Note: ${moderationNote}` : ''}`
              : `Your service "${existingRow.service.title}" was moved back to pending review.`,
        type: approvalStatus === 'REJECTED' ? 'ALERT' : 'INFO',
      },
    ]);

    const row = await this.getServiceRowById(updated.id);
    return row
      ? {
          ...this.serializeServiceRow(row),
          canManage: true,
        }
      : updated;
  }

  async remove(id: number, authUser: AuthUser) {
    const row = await this.getServiceRowById(id);
    if (!row?.service) {
      throw new NotFoundException('Service not found');
    }

    const isOwner = row.service.providerId === authUser.id;
    if (!isOwner && !isAdminUser(authUser)) {
      throw new NotFoundException('Service not found');
    }

    const [linkedAvailability] = await this.db
      .select({ id: schema.availabilities.id })
      .from(schema.availabilities)
      .where(eq(schema.availabilities.serviceId, id));

    if (linkedAvailability) {
      throw new BadRequestException(
        'This service cannot be deleted while availability slots exist',
      );
    }

    const [linkedAppointment] = await this.db
      .select({ id: schema.appointments.id })
      .from(schema.appointments)
      .where(eq(schema.appointments.serviceId, id));

    if (linkedAppointment) {
      throw new BadRequestException(
        'This service cannot be deleted while appointments exist',
      );
    }

    const [deleted] = await this.db
      .delete(schema.services)
      .where(eq(schema.services.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException('Service not found');
    }

    return deleted;
  }
}
