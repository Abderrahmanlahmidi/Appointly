import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { AuthUser } from '../auth/request-auth';
import { DRIZZLE } from '../db/drizzle.module';
import * as schema from '../db/schema';

type NotificationInsert = typeof schema.notifications.$inferInsert;

type CreateNotificationInput = {
  userId: number | null | undefined;
  title: string;
  message: string;
  type?: 'INFO' | 'ALERT' | 'REMINDER' | null;
  appointmentId?: number | null;
};

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async createMany(entries: CreateNotificationInput[]) {
    const values: NotificationInsert[] = entries
      .filter((entry) => entry.userId)
      .map((entry) => ({
        userId: entry.userId!,
        title: entry.title.trim(),
        message: entry.message.trim(),
        type: entry.type ?? 'INFO',
        appointmentId: entry.appointmentId ?? null,
      }));

    if (!values.length) {
      return [];
    }

    return this.db.insert(schema.notifications).values(values).returning();
  }

  async findMine(authUser: AuthUser) {
    return this.db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, authUser.id))
      .orderBy(desc(schema.notifications.createdAt));
  }

  async markRead(id: number, authUser: AuthUser) {
    const [updated] = await this.db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.notifications.id, id),
          eq(schema.notifications.userId, authUser.id),
        ),
      )
      .returning();

    if (!updated) {
      throw new NotFoundException('Notification not found');
    }

    return updated;
  }

  async markAllRead(authUser: AuthUser) {
    await this.db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.userId, authUser.id));

    return { success: true };
  }
}
