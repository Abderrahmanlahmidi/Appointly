import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { type AuthUser, isAdminUser } from '../auth/request-auth';
import {
  buildUserName,
  formatDateValue,
  formatTimeValue,
  isPastSlot,
  normalizeOptionalText,
  parseAppointmentStatus,
  parsePositiveInteger,
} from '../common/domain.utils';
import { DRIZZLE } from '../db/drizzle.module';
import * as schema from '../db/schema';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

type AppointmentInsert = typeof schema.appointments.$inferInsert;

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getAppointmentById(id: number) {
    const [appointment] = await this.db
      .select()
      .from(schema.appointments)
      .where(eq(schema.appointments.id, id));

    return appointment;
  }

  private async getBookableService(serviceId: number) {
    const [service] = await this.db
      .select({
        id: schema.services.id,
        title: schema.services.title,
        price: schema.services.price,
        status: schema.services.status,
        approvalStatus: schema.services.approvalStatus,
        providerId: schema.services.providerId,
        categoryId: schema.services.categoryId,
      })
      .from(schema.services)
      .where(eq(schema.services.id, serviceId));

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.status !== 'ACTIVE' || service.approvalStatus !== 'APPROVED') {
      throw new BadRequestException('This service cannot be booked right now');
    }

    if (service.categoryId) {
      const [category] = await this.db
        .select({ status: schema.categories.status })
        .from(schema.categories)
        .where(eq(schema.categories.id, service.categoryId));

      if (category?.status !== 'APPROVED') {
        throw new BadRequestException(
          'This service cannot be booked right now',
        );
      }
    }

    return service;
  }

  private async buildAppointmentViewModel(
    appointment: typeof schema.appointments.$inferSelect,
  ) {
    const [service] = appointment.serviceId
      ? await this.db
          .select({
            id: schema.services.id,
            title: schema.services.title,
            categoryId: schema.services.categoryId,
          })
          .from(schema.services)
          .where(eq(schema.services.id, appointment.serviceId))
      : [];

    const [availability] = appointment.availabilityId
      ? await this.db
          .select({
            id: schema.availabilities.id,
            date: schema.availabilities.date,
            startTime: schema.availabilities.startTime,
            endTime: schema.availabilities.endTime,
          })
          .from(schema.availabilities)
          .where(eq(schema.availabilities.id, appointment.availabilityId))
      : [];

    const userIds = [appointment.clientId, appointment.providerId].filter(
      (value): value is number => Boolean(value),
    );
    const users = userIds.length
      ? await this.db
          .select({
            id: schema.users.id,
            firstName: schema.users.firstName,
            lastName: schema.users.lastName,
            email: schema.users.email,
          })
          .from(schema.users)
          .where(inArray(schema.users.id, userIds))
      : [];

    const userMap = new Map(users.map((user) => [user.id, user]));

    const category = service?.categoryId
      ? await this.db
          .select({ id: schema.categories.id, name: schema.categories.name })
          .from(schema.categories)
          .where(eq(schema.categories.id, service.categoryId))
          .then((rows) => rows[0] ?? null)
      : null;

    const client = appointment.clientId
      ? (userMap.get(appointment.clientId) ?? null)
      : null;
    const provider = appointment.providerId
      ? (userMap.get(appointment.providerId) ?? null)
      : null;

    return {
      ...appointment,
      serviceTitle: service?.title ?? null,
      categoryId: category?.id ?? null,
      categoryName: category?.name ?? null,
      date: formatDateValue(availability?.date),
      startTime: formatTimeValue(availability?.startTime),
      endTime: formatTimeValue(availability?.endTime),
      clientName: client ? buildUserName(client) : null,
      clientEmail: client?.email ?? null,
      providerName: provider ? buildUserName(provider) : null,
      providerEmail: provider?.email ?? null,
    };
  }

  async findAll(authUser: AuthUser) {
    const baseQuery = this.db.select().from(schema.appointments);

    const appointments = isAdminUser(authUser)
      ? await baseQuery.orderBy(desc(schema.appointments.createdAt))
      : authUser.role === 'PROVIDER'
        ? await baseQuery
            .where(eq(schema.appointments.providerId, authUser.id))
            .orderBy(desc(schema.appointments.createdAt))
        : await baseQuery
            .where(eq(schema.appointments.clientId, authUser.id))
            .orderBy(desc(schema.appointments.createdAt));

    return Promise.all(
      appointments.map((appointment) =>
        this.buildAppointmentViewModel(appointment),
      ),
    );
  }

  async create(values: CreateAppointmentDto, authUser: AuthUser) {
    if (isAdminUser(authUser)) {
      throw new ForbiddenException('Admins cannot create appointments');
    }

    const serviceId = parsePositiveInteger(values?.serviceId, 'Service');
    const availabilityId = parsePositiveInteger(
      values?.availabilityId,
      'Availability',
    );
    const note = normalizeOptionalText(values?.note) ?? null;
    const service = await this.getBookableService(serviceId);

    if (!service.providerId) {
      throw new BadRequestException('This service is not linked to a provider');
    }

    if (service.providerId === authUser.id) {
      throw new ForbiddenException('You cannot book your own service');
    }

    const created = await this.db.transaction(async (tx) => {
      const [availability] = await tx
        .select()
        .from(schema.availabilities)
        .where(
          and(
            eq(schema.availabilities.id, availabilityId),
            eq(schema.availabilities.serviceId, serviceId),
          ),
        );

      if (!availability) {
        throw new NotFoundException('Availability not found');
      }

      if (isPastSlot(availability.date, availability.startTime)) {
        throw new BadRequestException('This time slot is no longer available');
      }

      if (availability.isBooked) {
        throw new BadRequestException('This time slot has already been booked');
      }

      const [bookedAvailability] = await tx
        .update(schema.availabilities)
        .set({ isBooked: true })
        .where(
          and(
            eq(schema.availabilities.id, availabilityId),
            eq(schema.availabilities.isBooked, false),
          ),
        )
        .returning();

      if (!bookedAvailability) {
        throw new BadRequestException('This time slot has already been booked');
      }

      const [activeAppointment] = await tx
        .select({ id: schema.appointments.id })
        .from(schema.appointments)
        .where(
          and(
            eq(schema.appointments.availabilityId, availabilityId),
            sql`${schema.appointments.status} <> 'CANCELLED'`,
          ),
        );

      if (activeAppointment) {
        throw new BadRequestException('This time slot has already been booked');
      }

      const insertValues: AppointmentInsert = {
        serviceId,
        availabilityId,
        clientId: authUser.id,
        providerId: service.providerId,
        totalPrice: String(service.price),
        note,
        status: 'PENDING',
      };

      const [appointment] = await tx
        .insert(schema.appointments)
        .values(insertValues)
        .returning();

      return {
        appointment,
        availability: bookedAvailability,
      };
    });

    await this.notificationsService.createMany([
      {
        userId: authUser.id,
        appointmentId: created.appointment.id,
        title: 'Appointment created',
        message: `Your appointment for ${service.title} on ${formatDateValue(created.availability.date)} at ${formatTimeValue(created.availability.startTime)} is pending confirmation.`,
        type: 'INFO',
      },
      {
        userId: service.providerId,
        appointmentId: created.appointment.id,
        title: 'New appointment request',
        message: `A new appointment request was made for ${service.title} on ${formatDateValue(created.availability.date)} at ${formatTimeValue(created.availability.startTime)}.`,
        type: 'ALERT',
      },
    ]);

    return this.buildAppointmentViewModel(created.appointment);
  }

  async updateStatus(
    id: number,
    values: UpdateAppointmentStatusDto,
    authUser: AuthUser,
  ) {
    const nextStatus = parseAppointmentStatus(values?.status);
    const existing = await this.getAppointmentById(id);

    if (!existing) {
      throw new NotFoundException('Appointment not found');
    }

    const isProviderOwner = existing.providerId === authUser.id;
    const isClientOwner = existing.clientId === authUser.id;
    const isAdmin = isAdminUser(authUser);

    if (!isAdmin && !isProviderOwner && !isClientOwner) {
      throw new NotFoundException('Appointment not found');
    }

    if (isClientOwner && nextStatus !== 'CANCELLED') {
      throw new ForbiddenException('Clients can only cancel appointments');
    }

    if (existing.status === 'CANCELLED' && nextStatus !== 'CANCELLED') {
      throw new BadRequestException(
        'Cancelled appointments cannot be moved back to an active state',
      );
    }

    if (existing.status === nextStatus) {
      return this.buildAppointmentViewModel(existing);
    }

    const updated = await this.db.transaction(async (tx) => {
      const [appointment] = await tx
        .update(schema.appointments)
        .set({ status: nextStatus })
        .where(eq(schema.appointments.id, id))
        .returning();

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (
        nextStatus === 'CANCELLED' &&
        existing.availabilityId &&
        existing.status !== 'CANCELLED'
      ) {
        await tx
          .update(schema.availabilities)
          .set({ isBooked: false })
          .where(eq(schema.availabilities.id, existing.availabilityId));
      }

      return appointment;
    });

    const viewModel = await this.buildAppointmentViewModel(updated);
    const notificationTitle =
      nextStatus === 'CONFIRMED'
        ? 'Appointment confirmed'
        : nextStatus === 'CANCELLED'
          ? 'Appointment cancelled'
          : 'Appointment updated';

    const notificationMessage =
      nextStatus === 'CONFIRMED'
        ? `Your appointment for ${viewModel.serviceTitle} on ${viewModel.date} at ${viewModel.startTime} has been confirmed.`
        : nextStatus === 'CANCELLED'
          ? `Your appointment for ${viewModel.serviceTitle} on ${viewModel.date} at ${viewModel.startTime} has been cancelled.`
          : `Your appointment for ${viewModel.serviceTitle} on ${viewModel.date} at ${viewModel.startTime} was updated.`;

    await this.notificationsService.createMany([
      {
        userId: updated.clientId,
        appointmentId: updated.id,
        title: notificationTitle,
        message: notificationMessage,
        type: nextStatus === 'CANCELLED' ? 'ALERT' : 'INFO',
      },
      {
        userId: updated.providerId,
        appointmentId: updated.id,
        title: notificationTitle,
        message: notificationMessage,
        type: nextStatus === 'CANCELLED' ? 'ALERT' : 'INFO',
      },
    ]);

    return viewModel;
  }
}
