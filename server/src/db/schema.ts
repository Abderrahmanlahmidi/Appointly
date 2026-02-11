import {
  pgTable,
  text,
  varchar,
  boolean,
  doublePrecision,
  integer,
  timestamp,
  pgEnum,
  serial,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { AdapterAccount } from 'next-auth/adapters';

export const roleEnum = pgEnum('role_type', ['ADMIN', 'USER', 'PROVIDER']);
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
  ...timestamps,
});

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  price: doublePrecision('price').notNull(),
  duration: integer('duration').notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  ...timestamps,
});

export const availabilities = pgTable('availabilities', {
  id: serial('id').primaryKey(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  isBooked: boolean('is_booked').default(false),
  ...timestamps,
});

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  dateTime: timestamp('date_time').notNull(),
  status: statusEnum('status').default('PENDING'),
  totalPrice: doublePrecision('total_price').notNull(),
  availabilityId: integer('availability_id').references(
    () => availabilities.id,
  ),
  userId: integer('user_id').references(() => users.id),
  serviceId: integer('service_id').references(() => services.id),
  ...timestamps,
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type'),
  isRead: boolean('is_read').default(false),
  userId: integer('user_id').references(() => users.id),
  ...timestamps,
});

export const chatbotLogs = pgTable('chatbot_logs', {
  id: serial('id').primaryKey(),
  userMessage: text('user_message').notNull(),
  detectedIntent: varchar('detected_intent', { length: 255 }),
  response: text('response').notNull(),
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
  appointments: many(appointments),
  notifications: many(notifications),
}));

export const serviceRelations = relations(services, ({ one }) => ({
  category: one(categories, {
    fields: [services.categoryId],
    references: [categories.id],
  }),
}));

export const appointmentRelations = relations(appointments, ({ one }) => ({
  user: one(users, { fields: [appointments.userId], references: [users.id] }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  availability: one(availabilities, {
    fields: [appointments.availabilityId],
    references: [availabilities.id],
  }),
}));
