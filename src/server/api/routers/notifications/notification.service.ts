// ─── server/services/notifications.service.ts ────────────────────────────────

import {
  and,
  arrayContains,
  desc,
  eq,
  inArray,
  not,
  or,
  sql,
} from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "~/server/db";
import { notifications } from "~/server/db/schema";
import type {
  DeleteManyNotificationsInput,
  DeleteNotificationInput,
  ListNotificationsInput,
  MarkAllSeenInput,
  MarkSeenInput,
  PaginatedNotifications,
  SendNotificationInput,
  UpdateNotificationInput,
  Notification,
} from "./notification.schema";

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * A notification is "visible" to a userId when:
 *   to = "everyone"  OR  to = userId
 */
function visibleTo(userId: string) {
  return or(eq(notifications.to, "everyone"), eq(notifications.to, userId));
}

/**
 * A notification is "unread" for a userId when their id is NOT in seenBy[].
 * Drizzle exposes arrayContains; we negate it.
 */
function unreadFor(userId: string) {
  return not(arrayContains(notifications.seenBy, [userId]));
}

// ─── service ──────────────────────────────────────────────────────────────────

export const notificationsService = {
  // ── send ────────────────────────────────────────────────────────────────────

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

  // ── list (paginated) ────────────────────────────────────────────────────────

  /**
   * When `userId` is provided, returns only notifications visible to that user.
   * When omitted (admin), returns all notifications.
   */
  async list(input: ListNotificationsInput) {
    const { userId, unreadOnly, page, pageSize } = input;
    const offset = (page - 1) * pageSize;

    // Build WHERE clauses
    const conditions = [];

    if (userId) {
      conditions.push(visibleTo(userId));
      if (unreadOnly) {
        conditions.push(unreadFor(userId));
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Run data + count in parallel
    const [rows, [countRow]] = await Promise.all([
      db
        .select()
        .from(notifications)
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

    // Unread count (always scoped to the user if provided, else 0)
    let unreadCount = 0;
    if (userId) {
      const [unreadRow] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(notifications)
        .where(and(visibleTo(userId), unreadFor(userId)));
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

  // ── get by id ───────────────────────────────────────────────────────────────

  async getById(id: string) {
    const [row] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);
    return row ?? null;
  },

  // ── mark as seen ────────────────────────────────────────────────────────────

  /**
   * Appends userId to seenBy[] for each notification (idempotent — the DB
   * array_append only adds if not already present via a CASE guard).
   */
  async markSeen(input: MarkSeenInput): Promise<void> {
    await db
      .update(notifications)
      .set({
        // Append userId only when it isn't already in the array
        seenBy: sql`
          CASE
            WHEN ${sql.raw(`'${input.userId}'`)} = ANY(seen_by)
              THEN seen_by
            ELSE array_append(seen_by, ${input.userId})
          END
        `,
      })
      .where(
        and(
          inArray(notifications.id, input.ids),
          // Only mark notifications actually visible to this user
          visibleTo(input.userId),
        ),
      );
  },

  /** Mark every unread notification visible to userId as seen */
  async markAllSeen(input: MarkAllSeenInput): Promise<void> {
    await db
      .update(notifications)
      .set({
        seenBy: sql`
          CASE
            WHEN ${sql.raw(`'${input.userId}'`)} = ANY(seen_by)
              THEN seen_by
            ELSE array_append(seen_by, ${input.userId})
          END
        `,
      })
      .where(and(visibleTo(input.userId), unreadFor(input.userId)));
  },

  // ── update ──────────────────────────────────────────────────────────────────

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

  // ── delete ──────────────────────────────────────────────────────────────────

  async delete(input: DeleteNotificationInput): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, input.id));
  },

  async deleteMany(input: DeleteManyNotificationsInput): Promise<void> {
    await db.delete(notifications).where(inArray(notifications.id, input.ids));
  },

  /** Hard-delete all notifications older than `before` date */
  async deleteOlderThan(before: Date): Promise<number> {
    const result = await db
      .delete(notifications)
      .where(
        sql`${notifications.createdAt} < ${before.toISOString()}::timestamptz`,
      )
      .returning({ id: notifications.id });
    return result.length;
  },

  // ── unread count (lightweight) ───────────────────────────────────────────────

  async unreadCount(userId: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(notifications)
      .where(and(visibleTo(userId), unreadFor(userId)));
    return row?.count ?? 0;
  },
};
