import {
  and,
  arrayContains,
  desc,
  eq,
  gte,
  inArray,
  not,
  or,
  sql,
} from "drizzle-orm";
import { nanoid } from "nanoid";
import { db as globalDb } from "~/server/db";
import { notifications, user } from "~/server/db/schema";
import type {
  DeleteManyNotificationsInput,
  DeleteNotificationInput,
  ListNotificationsInput,
  MarkAllSeenInput,
  MarkSeenInput,
  SendNotificationInput,
  UpdateNotificationInput,
} from "./notification.schema";

import type { db as dbInstance } from "~/server/db";
type Db = typeof dbInstance;

function visibleTo(userId: string, userCreatedAt: Date) {
  return and(
    or(eq(notifications.to, "everyone"), eq(notifications.to, userId)),
    gte(notifications.createdAt, userCreatedAt),
  );
}

function unreadFor(userId: string) {
  return not(arrayContains(notifications.seenBy, [userId]));
}

const markSeenSql = (userId: string) => sql`
  CASE
    WHEN ${sql.raw(`'${userId}'`)} = ANY(seen_by)
      THEN seen_by
    ELSE array_append(seen_by, ${userId})
  END
`;

export function createNotificationsService(db: Db) {
  async function getUserCreatedAt(userId: string): Promise<Date> {
    const [row] = await db
      .select({ createdAt: user.createdAt })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!row) throw new Error(`User ${userId} not found`);
    return row.createdAt;
  }

  return {
    async send(input: SendNotificationInput) {
      const [row] = await db
        .insert(notifications)
        .values({
          id: nanoid(),
          title: input.title,
          message: input.message,
          to: input.to,
          seenBy: [],
          link: input.link ?? null,
          isLinkExternal: input.isLinkExternal ?? null,
        })
        .returning();

      return row!;
    },

    async list(input: ListNotificationsInput) {
      const { userId, unreadOnly, page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const userCreatedAt = userId ? await getUserCreatedAt(userId) : null;

      const conditions = [];
      if (userId && userCreatedAt) {
        conditions.push(visibleTo(userId, userCreatedAt));
        if (unreadOnly) conditions.push(unreadFor(userId));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, [countRow]] = await Promise.all([
        db
          .select({
            id: notifications.id,
            title: notifications.title,
            message: notifications.message,
            to: notifications.to,
            seenBy: notifications.seenBy,
            link: notifications.link,
            isLinkExternal: notifications.isLinkExternal,
            createdAt: notifications.createdAt,
            userEmail: user.email,
            userCode: user.userCode,
          })
          .from(notifications)
          .leftJoin(
            user,
            and(
              eq(notifications.to, user.id),
              not(eq(notifications.to, "everyone")),
            ),
          )
          .where(where)
          .orderBy(desc(notifications.createdAt))
          .limit(pageSize)
          .offset(offset),

        db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(notifications)
          .where(where),
      ]);

      const total = countRow?.count ?? 0;

      let unreadCount = 0;
      if (userId && userCreatedAt) {
        const [unreadRow] = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(notifications)
          .where(and(visibleTo(userId, userCreatedAt), unreadFor(userId)));
        unreadCount = unreadRow?.count ?? 0;
      }

      return {
        data: rows,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          unreadCount,
        },
      };
    },

    async getById(id: string) {
      const [row] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, id))
        .limit(1);
      return row ?? null;
    },

    async markSeen(input: MarkSeenInput): Promise<void> {
      const userCreatedAt = await getUserCreatedAt(input.userId);
      await db
        .update(notifications)
        .set({ seenBy: markSeenSql(input.userId) })
        .where(
          and(
            inArray(notifications.id, input.ids),
            visibleTo(input.userId, userCreatedAt),
          ),
        );
    },

    async markAllSeen(input: MarkAllSeenInput): Promise<void> {
      const userCreatedAt = await getUserCreatedAt(input.userId);
      await db
        .update(notifications)
        .set({ seenBy: markSeenSql(input.userId) })
        .where(
          and(visibleTo(input.userId, userCreatedAt), unreadFor(input.userId)),
        );
    },

    async update(input: UpdateNotificationInput) {
      const patch: Partial<typeof notifications.$inferInsert> = {};
      if (input.title !== undefined) patch.title = input.title;
      if (input.message !== undefined) patch.message = input.message;
      if (input.link !== undefined) patch.link = input.link;
      if (input.isLinkExternal !== undefined)
        patch.isLinkExternal = input.isLinkExternal;

      const [row] = await db
        .update(notifications)
        .set(patch)
        .where(eq(notifications.id, input.id))
        .returning();

      if (!row) throw new Error(`Notification ${input.id} not found`);
      return row;
    },

    async delete(input: DeleteNotificationInput): Promise<void> {
      await db.delete(notifications).where(eq(notifications.id, input.id));
    },

    async deleteMany(input: DeleteManyNotificationsInput): Promise<void> {
      await db
        .delete(notifications)
        .where(inArray(notifications.id, input.ids));
    },

    async deleteOlderThan(before: Date): Promise<number> {
      const result = await db
        .delete(notifications)
        .where(
          sql`${notifications.createdAt} < ${before.toISOString()}::timestamptz`,
        )
        .returning({ id: notifications.id });
      return result.length;
    },

    async unreadCount(userId: string): Promise<number> {
      const userCreatedAt = await getUserCreatedAt(userId);
      const [row] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(notifications)
        .where(and(visibleTo(userId, userCreatedAt), unreadFor(userId)));
      return row?.count ?? 0;
    },
  };
}

export const notificationsService = createNotificationsService(globalDb);
