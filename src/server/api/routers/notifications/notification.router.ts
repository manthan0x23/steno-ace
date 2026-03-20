// ─── server/routers/notifications.router.ts ──────────────────────────────────
//
// Procedures:
//
//   ADMIN only (adminProcedure):
//     notifications.send          — create & broadcast a notification
//     notifications.listAll       — paginated list of all notifications
//     notifications.update        — edit title / message / link
//     notifications.delete        — delete one
//     notifications.deleteMany    — bulk delete
//     notifications.deleteOlderThan — purge old records
//
//   USER (protectedProcedure):
//     notifications.list          — paginated, scoped to calling user
//     notifications.unreadCount   — lightweight badge count
//     notifications.markSeen      — mark specific ids as read
//     notifications.markAllSeen   — mark all as read

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { notificationsService } from "./notification.service";
import {
  SendNotificationSchema,
  ListNotificationsSchema,
  MarkSeenSchema,
  MarkAllSeenSchema,
  UpdateNotificationSchema,
  DeleteNotificationSchema,
  DeleteManyNotificationsSchema,
} from "./notification.schema";

export const notificationsRouter = createTRPCRouter({
  // ── admin: send ─────────────────────────────────────────────────────────────

  send: adminProcedure
    .input(SendNotificationSchema)
    .mutation(async ({ input }) => {
      return notificationsService.send(input);
    }),

  // ── admin: list all ─────────────────────────────────────────────────────────

  listAll: adminProcedure
    .input(ListNotificationsSchema.omit({ userId: true, unreadOnly: true }))
    .query(async ({ input }) => {
      return notificationsService.list({
        ...input,
        unreadOnly: false,
      });
    }),

  // ── admin: update ───────────────────────────────────────────────────────────

  update: adminProcedure
    .input(UpdateNotificationSchema)
    .mutation(async ({ input }) => {
      return notificationsService.update(input);
    }),

  // ── admin: delete one ────────────────────────────────────────────────────────

  delete: adminProcedure
    .input(DeleteNotificationSchema)
    .mutation(async ({ input }) => {
      // Verify it exists first so we surface a clean 404
      const existing = await notificationsService.getById(input.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Notification ${input.id} not found`,
        });
      }
      await notificationsService.delete(input);
    }),

  // ── admin: bulk delete ───────────────────────────────────────────────────────

  deleteMany: adminProcedure
    .input(DeleteManyNotificationsSchema)
    .mutation(async ({ input }) => {
      await notificationsService.deleteMany(input);
    }),

  // ── admin: purge old records ─────────────────────────────────────────────────

  deleteOlderThan: adminProcedure
    .input(z.object({ before: z.date() }))
    .mutation(async ({ input }) => {
      const deleted = await notificationsService.deleteOlderThan(input.before);
      return { deleted };
    }),

  // ── user: list (own + everyone) ──────────────────────────────────────────────

  list: protectedProcedure
    .input(
      ListNotificationsSchema
        // userId is inferred from session — client must not supply it
        .omit({ userId: true }),
    )
    .query(async ({ input, ctx }) => {
      return notificationsService.list({
        ...input,
        userId: ctx.user.id,
      });
    }),

  // ── user: unread count (for badge) ───────────────────────────────────────────

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await notificationsService.unreadCount(ctx.user.id);
    return { count };
  }),

  // ── user: mark specific notifications as seen ─────────────────────────────────

  markSeen: protectedProcedure
    .input(MarkSeenSchema.omit({ userId: true }))
    .mutation(async ({ input, ctx }) => {
      await notificationsService.markSeen({
        ...input,
        userId: ctx.user.id,
      });
    }),

  // ── user: mark all as seen ────────────────────────────────────────────────────

  markAllSeen: protectedProcedure.mutation(async ({ ctx }) => {
    await notificationsService.markAllSeen({
      userId: ctx.user.id,
    });
  }),
});
