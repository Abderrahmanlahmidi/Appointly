import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { type AuthUser, requireProviderUser } from '../auth/request-auth';
import {
  ensureValidTimeRange,
  formatDateValue,
  formatTimeValue,
  isPastSlot,
  parseDateInput,
  parseOptionalId,
  parsePositiveInteger,
  parseTimeInput,
  toDateOnly,
} from '../common/domain.utils';
import { DRIZZLE } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

type AvailabilityInsert = typeof schema.availabilities.$inferInsert;

type OwnedAvailabilityRow = {
  availability: typeof schema.availabilities.$inferSelect;
  service: {
    id: number | null;
    title: string | null;
    providerId: number | null;
    status: 'ACTIVE' | 'INACTIVE' | null;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
    categoryId: number | null;
  };
};

@Injectable()
export class AvailabilitiesService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  private serializeAvailability(
    row: OwnedAvailabilityRow,
    appointmentStatus?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | null,
  ) {
    return {
      ...row.availability,
      date: formatDateValue(row.availability.date),
      startTime: formatTimeValue(row.availability.startTime),
      endTime: formatTimeValue(row.availability.endTime),
      serviceTitle: row.service.title,
      providerId: row.service.providerId,
      appointmentStatus: appointmentStatus ?? null,
      isPast: isPastSlot(row.availability.date, row.availability.startTime),
    };
  }

  private async getOwnedAvailabilityRow(id: number, providerId: number) {
    const [row] = await this.db
      .select({
        availability: schema.availabilities,
        service: {
          id: schema.services.id,
          title: schema.services.title,
          providerId: schema.services.providerId,
          status: schema.services.status,
          approvalStatus: schema.services.approvalStatus,
          categoryId: schema.services.categoryId,
        },
      })
      .from(schema.availabilities)
      .innerJoin(
        schema.services,
        eq(schema.availabilities.serviceId, schema.services.id),
      )
      .where(
        and(
          eq(schema.availabilities.id, id),
          eq(schema.services.providerId, providerId),
        ),
      );

    return row;
  }

  private async getServiceForProvider(serviceId: number, providerId: number) {
    const [service] = await this.db
      .select({
        id: schema.services.id,
        title: schema.services.title,
        providerId: schema.services.providerId,
      })
      .from(schema.services)
      .where(
        and(
          eq(schema.services.id, serviceId),
          eq(schema.services.providerId, providerId),
        ),
      );

    if (!service) {
      throw new BadRequestException('Service not found for this provider');
    }

    return service;
  }

  private async ensureNoOverlap(
    providerId: number,
    date: string,
    startTime: string,
    endTime: string,
    excludeAvailabilityId?: number,
  ) {
    const exclusion = excludeAvailabilityId
      ? sql` and ${schema.availabilities.id} <> ${excludeAvailabilityId}`
      : sql``;

    const [overlap] = await this.db
      .select({ id: schema.availabilities.id })
      .from(schema.availabilities)
      .innerJoin(
        schema.services,
        eq(schema.availabilities.serviceId, schema.services.id),
      )
      .where(
        sql`${schema.services.providerId} = ${providerId}
          and ${schema.availabilities.date} = ${date}
          and ${schema.availabilities.startTime} < ${endTime}
          and ${schema.availabilities.endTime} > ${startTime}${exclusion}`,
      );

    if (overlap) {
      throw new BadRequestException(
        'This slot overlaps with another availability for the provider',
      );
    }
  }

  private async ensureNoActiveAppointment(availabilityId: number) {
    const [activeAppointment] = await this.db
      .select({ id: schema.appointments.id })
      .from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.availabilityId, availabilityId),
          sql`${schema.appointments.status} <> 'CANCELLED'`,
        ),
      );

    if (activeAppointment) {
      throw new BadRequestException(
        'This slot already has an active appointment and cannot be changed',
      );
    }
  }

  private async getActiveAppointmentStatusMap(availabilityIds: number[]) {
    if (!availabilityIds.length) {
      return new Map<number, 'PENDING' | 'CONFIRMED' | 'CANCELLED'>();
    }

    const rows = await this.db
      .select({
        availabilityId: schema.appointments.availabilityId,
        status: schema.appointments.status,
      })
      .from(schema.appointments)
      .where(
        and(
          inArray(schema.appointments.availabilityId, availabilityIds),
          sql`${schema.appointments.status} <> 'CANCELLED'`,
        ),
      );

    return new Map(
      rows
        .filter((row) => row.availabilityId)
        .map((row) => [row.availabilityId!, row.status ?? 'PENDING']),
    );
  }

  async findAll({
    scope,
    authUser,
    serviceId,
  }: {
    scope?: 'owned';
    authUser?: AuthUser | null;
    serviceId?: string;
  }) {
    const parsedServiceId = parseOptionalId(serviceId, 'serviceId');

    if (scope === 'owned') {
      const providerUser = requireProviderUser(authUser as AuthUser);
      const baseQuery = this.db
        .select({
          availability: schema.availabilities,
          service: {
            id: schema.services.id,
            title: schema.services.title,
            providerId: schema.services.providerId,
            status: schema.services.status,
            approvalStatus: schema.services.approvalStatus,
            categoryId: schema.services.categoryId,
          },
        })
        .from(schema.availabilities)
        .innerJoin(
          schema.services,
          eq(schema.availabilities.serviceId, schema.services.id),
        );

      const rows = parsedServiceId
        ? await baseQuery.where(
            and(
              eq(schema.services.providerId, providerUser.id),
              eq(schema.services.id, parsedServiceId),
            ),
          )
        : await baseQuery.where(
            eq(schema.services.providerId, providerUser.id),
          );

      const appointmentStatusMap = await this.getActiveAppointmentStatusMap(
        rows.map((row) => row.availability.id),
      );

      return rows.map((row) =>
        this.serializeAvailability(
          row,
          appointmentStatusMap.get(row.availability.id) ?? null,
        ),
      );
    }

    if (!parsedServiceId) {
      throw new BadRequestException('serviceId is required');
    }

    const [service] = await this.db
      .select({
        id: schema.services.id,
        status: schema.services.status,
        approvalStatus: schema.services.approvalStatus,
        categoryId: schema.services.categoryId,
      })
      .from(schema.services)
      .where(eq(schema.services.id, parsedServiceId));

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.status !== 'ACTIVE' || service.approvalStatus !== 'APPROVED') {
      throw new NotFoundException('Service not found');
    }

    if (service.categoryId) {
      const [category] = await this.db
        .select({ status: schema.categories.status })
        .from(schema.categories)
        .where(eq(schema.categories.id, service.categoryId));

      if (category?.status !== 'APPROVED') {
        throw new NotFoundException('Service not found');
      }
    }

    const rows = await this.db
      .select({
        availability: schema.availabilities,
        service: {
          id: schema.services.id,
          title: schema.services.title,
          providerId: schema.services.providerId,
          status: schema.services.status,
          approvalStatus: schema.services.approvalStatus,
          categoryId: schema.services.categoryId,
        },
      })
      .from(schema.availabilities)
      .innerJoin(
        schema.services,
        eq(schema.availabilities.serviceId, schema.services.id),
      )
      .where(eq(schema.availabilities.serviceId, parsedServiceId));

    return rows
      .filter(
        (row) =>
          !row.availability.isBooked &&
          !isPastSlot(row.availability.date, row.availability.startTime),
      )
      .map((row) => this.serializeAvailability(row))
      .sort((first, second) => {
        const firstKey = `${first.date} ${first.startTime}`;
        const secondKey = `${second.date} ${second.startTime}`;
        return firstKey.localeCompare(secondKey);
      });
  }

  async create(values: CreateAvailabilityDto, authUser: AuthUser) {
    const providerUser = requireProviderUser(authUser);
    const serviceId = parsePositiveInteger(values?.serviceId, 'Service');
    const date = parseDateInput(values?.date);
    const startTime = parseTimeInput(values?.startTime, 'Start time');
    const endTime = parseTimeInput(values?.endTime, 'End time');
    ensureValidTimeRange(startTime, endTime);

    if (isPastSlot(date, startTime)) {
      throw new BadRequestException('Availability must be in the future');
    }

    await this.getServiceForProvider(serviceId, providerUser.id);
    await this.ensureNoOverlap(providerUser.id, date, startTime, endTime);

    const insertValues: AvailabilityInsert = {
      serviceId,
      date: toDateOnly(date),
      startTime,
      endTime,
    };

    const [created] = await this.db
      .insert(schema.availabilities)
      .values(insertValues)
      .returning();

    const row = await this.getOwnedAvailabilityRow(created.id, providerUser.id);
    return row ? this.serializeAvailability(row) : created;
  }

  async update(id: number, values: UpdateAvailabilityDto, authUser: AuthUser) {
    const providerUser = requireProviderUser(authUser);
    const existingRow = await this.getOwnedAvailabilityRow(id, providerUser.id);

    if (!existingRow?.availability) {
      throw new NotFoundException('Availability not found');
    }

    await this.ensureNoActiveAppointment(id);

    const serviceId = Object.prototype.hasOwnProperty.call(values, 'serviceId')
      ? parsePositiveInteger(values?.serviceId, 'Service')
      : existingRow.availability.serviceId!;
    const date = Object.prototype.hasOwnProperty.call(values, 'date')
      ? parseDateInput(values?.date)
      : formatDateValue(existingRow.availability.date)!;
    const startTime = Object.prototype.hasOwnProperty.call(values, 'startTime')
      ? parseTimeInput(values?.startTime, 'Start time')
      : existingRow.availability.startTime;
    const endTime = Object.prototype.hasOwnProperty.call(values, 'endTime')
      ? parseTimeInput(values?.endTime, 'End time')
      : existingRow.availability.endTime;

    ensureValidTimeRange(startTime, endTime);

    if (isPastSlot(date, startTime)) {
      throw new BadRequestException('Availability must be in the future');
    }

    await this.getServiceForProvider(serviceId, providerUser.id);
    await this.ensureNoOverlap(providerUser.id, date, startTime, endTime, id);

    const [updated] = await this.db
      .update(schema.availabilities)
      .set({
        serviceId,
        date: toDateOnly(date),
        startTime,
        endTime,
      })
      .where(eq(schema.availabilities.id, id))
      .returning();

    const row = await this.getOwnedAvailabilityRow(updated.id, providerUser.id);
    return row ? this.serializeAvailability(row) : updated;
  }

  async remove(id: number, authUser: AuthUser) {
    const providerUser = requireProviderUser(authUser);
    const existingRow = await this.getOwnedAvailabilityRow(id, providerUser.id);

    if (!existingRow?.availability) {
      throw new NotFoundException('Availability not found');
    }

    await this.ensureNoActiveAppointment(id);

    const [deleted] = await this.db
      .delete(schema.availabilities)
      .where(eq(schema.availabilities.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException('Availability not found');
    }

    return deleted;
  }
}
