import {
    pgTable,
    text,
    varchar,
    timestamp,
    integer,
    primaryKey,
    serial,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';

const timestamps = {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
};

export const roleEnum = pgEnum('role_type', ['ADMIN', 'USER', 'PROVIDER']);
export const statusEnum = pgEnum('appointment_status', ['PENDING', 'CONFIRMED', 'CANCELLED']);
export const notificationTypeEnum = pgEnum('notification_type', ['INFO', 'ALERT', 'REMINDER']);

export const roles = pgTable('roles', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    ...timestamps,
});

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    firstName: varchar("firstname", { length: 255 }),
    lastName: varchar("lastname", { length: 255 }), 
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    password: text("password"),
    phone: varchar('phone', { length: 20 }),
    roleId: integer("role_id").references(() => roles.id),
    ...timestamps,
});

export const accounts = pgTable(
    "account",
    {
        userId: integer("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId]
        }),
    })
);

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").notNull().primaryKey(),
    userId: integer("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (vt) => ({
        compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    })
);


export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
}));