import {
  pgTable,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  pgEnum,
  serial,
  primaryKey,
  date,
  time,
  numeric,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { AdapterAccount } from '@auth/core/adapters';

export const roleEnum = pgEnum('role_type', ['ADMIN', 'USER', 'PROVIDER']);
export const approvalStatusEnum = pgEnum('approval_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);
export const statusEnum = pgEnum('appointment_status', [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
]);
export const notificationTypeEnum = pgEnum('notification_type', [
  'INFO',
  'ALERT',
  'REMINDER',
]);
export const serviceStatusEnum = pgEnum('service_status', [
  'ACTIVE',
  'INACTIVE',
]);

const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ...timestamps,
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('firstname', { length: 255 }),
  lastName: varchar('lastname', { length: 255 }),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique().notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'),
  phone: varchar('phone', { length: 20 }),
  roleId: integer('role_id').references(() => roles.id),
  ...timestamps,
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: approvalStatusEnum('status').default('PENDING').notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  moderatedByUserId: integer('moderated_by_user_id').references(() => users.id),
  moderationNote: text('moderation_note'),
  ...timestamps,
});

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  duration: integer('duration').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  status: serviceStatusEnum('status').default('ACTIVE').notNull(),
  approvalStatus: approvalStatusEnum('approval_status')
    .default('PENDING')
    .notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  providerId: integer('provider_id').references(() => users.id),
  moderatedByUserId: integer('moderated_by_user_id').references(() => users.id),
  moderationNote: text('moderation_note'),
  ...timestamps,
});

export const availabilities = pgTable('availabilities', {
  id: serial('id').primaryKey(),
  date: date('date', { mode: 'date' }).notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  isBooked: boolean('is_booked').default(false),
  serviceId: integer('service_id').references(() => services.id),
  ...timestamps,
});

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  status: statusEnum('status').default('PENDING'),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  note: text('note'),
  availabilityId: integer('availability_id').references(
    () => availabilities.id,
  ),
  serviceId: integer('service_id').references(() => services.id),
  clientId: integer('client_id').references(() => users.id),
  providerId: integer('provider_id').references(() => users.id),
  ...timestamps,
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type'),
  isRead: boolean('is_read').default(false),
  userId: integer('user_id').references(() => users.id),
  appointmentId: integer('appointment_id').references(() => appointments.id),
  ...timestamps,
});

export const chatbotLogs = pgTable('chatbot_logs', {
  id: serial('id').primaryKey(),
  userMessage: text('user_message').notNull(),
  botResponse: text('bot_response').notNull(),
  userId: integer('user_id').references(() => users.id),
  ...timestamps,
});

export const accounts = pgTable(
  'account',
  {
    userId: integer('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').notNull().primaryKey(),
  userId: integer('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  appointments: many(appointments, { relationName: 'clientAppointments' }),
  providedAppointments: many(appointments, {
    relationName: 'providerAppointments',
  }),
  notifications: many(notifications),
  categories: many(categories),
  services: many(services, { relationName: 'providerServices' }),
  chatbotLogs: many(chatbotLogs),
}));

export const categoryRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  moderatedBy: one(users, {
    fields: [categories.moderatedByUserId],
    references: [users.id],
  }),
  services: many(services),
}));

export const serviceRelations = relations(services, ({ one, many }) => ({
  category: one(categories, {
    fields: [services.categoryId],
    references: [categories.id],
  }),
  provider: one(users, {
    fields: [services.providerId],
    references: [users.id],
    relationName: 'providerServices',
  }),
  moderatedBy: one(users, {
    fields: [services.moderatedByUserId],
    references: [users.id],
  }),
  availabilities: many(availabilities),
  appointments: many(appointments),
}));

export const availabilityRelations = relations(
  availabilities,
  ({ one, many }) => ({
    service: one(services, {
      fields: [availabilities.serviceId],
      references: [services.id],
    }),
    appointments: many(appointments),
  }),
);

export const appointmentRelations = relations(appointments, ({ one }) => ({
  client: one(users, {
    fields: [appointments.clientId],
    references: [users.id],
    relationName: 'clientAppointments',
  }),
  provider: one(users, {
    fields: [appointments.providerId],
    references: [users.id],
    relationName: 'providerAppointments',
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  availability: one(availabilities, {
    fields: [appointments.availabilityId],
    references: [availabilities.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  appointment: one(appointments, {
    fields: [notifications.appointmentId],
    references: [appointments.id],
  }),
}));
