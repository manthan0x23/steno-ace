// ─── server/schema/notifications.schema.ts ───────────────────────────────────

import { z } from "zod";

// ─── shared primitives ────────────────────────────────────────────────────────

/** "everyone" broadcasts to all users; any other string is treated as a userId */
export const NotificationRecipient = z.union([
  z.literal("everyone"),
  z.string().min(1),
]);

// ─── send ─────────────────────────────────────────────────────────────────────

export const SendNotificationSchema = z.object({
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(1000),
  /** userId  OR  "everyone" */
  to: NotificationRecipient,
  link: z.string().url().optional(),
  isLinkExternal: z.boolean().optional(),
});

export type SendNotificationInput = z.infer<typeof SendNotificationSchema>;

// ─── list (paginated) ─────────────────────────────────────────────────────────

export const ListNotificationsSchema = z.object({
  /** omit when calling from admin — returns every notification */
  userId: z.string().min(1).optional(),
  /** filter to unseen only */
  unreadOnly: z.boolean().optional().default(false),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});

export type ListNotificationsInput = z.infer<typeof ListNotificationsSchema>;

// ─── mark as seen ─────────────────────────────────────────────────────────────

export const MarkSeenSchema = z.object({
  /** notification ids to mark as seen */
  ids: z.array(z.string().min(1)).min(1),
  userId: z.string().min(1),
});

export type MarkSeenInput = z.infer<typeof MarkSeenSchema>;

/** Mark ALL unread as seen for a user */
export const MarkAllSeenSchema = z.object({
  userId: z.string().min(1),
});

export type MarkAllSeenInput = z.infer<typeof MarkAllSeenSchema>;

// ─── update ───────────────────────────────────────────────────────────────────

export const UpdateNotificationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120).optional(),
  message: z.string().min(1).max(1000).optional(),
  link: z.string().url().nullable().optional(),
  isLinkExternal: z.boolean().optional(),
});

export type UpdateNotificationInput = z.infer<typeof UpdateNotificationSchema>;

// ─── delete ───────────────────────────────────────────────────────────────────

export const DeleteNotificationSchema = z.object({
  id: z.string().min(1),
});

export type DeleteNotificationInput = z.infer<typeof DeleteNotificationSchema>;

export const DeleteManyNotificationsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export type DeleteManyNotificationsInput = z.infer<
  typeof DeleteManyNotificationsSchema
>;

// ─── output shapes ────────────────────────────────────────────────────────────

export const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  to: z.string(),
  seenBy: z.array(z.string()),
  link: z.string().nullable(),
  isLinkExternal: z.boolean().nullable(),
  createdAt: z.date(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const PaginatedNotificationsSchema = z.object({
  data: z.array(NotificationSchema),
  meta: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
    unreadCount: z.number(),
  }),
});

export type PaginatedNotifications = z.infer<
  typeof PaginatedNotificationsSchema
>;