import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const adminUser = pgTable("admin_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isSuper: boolean("is_super").$defaultFn(() => false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const adminSession = pgTable("admin_session", {
  id: text("id").primaryKey(),
  adminId: text("admin_id")
    .notNull()
    .references(() => adminUser.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const adminInvite = pgTable("admin_invite", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  createdByAdminId: text("created_by_admin_id")
    .notNull()
    .references(() => adminUser.id, { onDelete: "cascade" }),
  usedByAdminId: text("used_by_admin_id").references(() => adminUser.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const adminUserRelations = relations(adminUser, ({ many }) => ({
  sessions: many(adminSession),
  createdInvites: many(adminInvite, {
    relationName: "created_invites",
  }),
  acceptedInvites: many(adminInvite, {
    relationName: "accepted_invites",
  }),
}));

export const adminSessionRelations = relations(adminSession, ({ one }) => ({
  admin: one(adminUser, {
    fields: [adminSession.adminId],
    references: [adminUser.id],
  }),
}));

export const adminInviteRelations = relations(adminInvite, ({ one }) => ({
  createdBy: one(adminUser, {
    fields: [adminInvite.createdByAdminId],
    references: [adminUser.id],
    relationName: "created_invites",
  }),
  usedBy: one(adminUser, {
    fields: [adminInvite.usedByAdminId],
    references: [adminUser.id],
    relationName: "accepted_invites",
  }),
}));

