import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { subscription } from "./subscription";
import { admin } from "./admin";

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userCode: text("user_code")
      .$defaultFn(() => {
        const num = Math.floor(10000 + Math.random() * 90000);
        return "SD" + num;
      })
      .notNull()
      .unique(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified")
      .$defaultFn(() => false)
      .notNull(),
    phone: text("phone"),
    image: text("profile_url"),
    gender: text("gender"),

    isDemo: boolean("is_demo").default(false),
    demoExpiresAt: timestamp("demo_expires_at"),
    demoRevoked: boolean("demo_revoked").default(false),
    demoNote: text("demo_note"),
    demoCreatedByAdminId: text("demo_created_by_admin_id").references(
      () => admin.id,
      { onDelete: "set null" },
    ),

    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index("is_demo_idx_users").on(t.isDemo)],
);

export const device = pgTable(
  "device",
  {
    id: text("id").primaryKey(),

    userId: text("user_id")
      .notNull()
      .unique() // ← one device per user
      .references(() => user.id, { onDelete: "cascade" }),

    deviceId: text("device_id").notNull(),

    deviceName: text("device_name"),

    /** Raw user-agent string for debugging */
    userAgent: text("user_agent"),

    ipAddress: text("ip_address"),

    lastLoginAt: timestamp("last_login_at")
      .$defaultFn(() => new Date())
      .notNull(),

    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),

    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("device_user_id_idx").on(t.userId),
    index("device_device_id_idx").on(t.deviceId),
  ],
);

export const deviceRelations = relations(device, ({ one }) => ({
  user: one(user, { fields: [device.userId], references: [user.id] }),
}));

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(), // unique() already creates an index
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("session_token_expires_idx").on(t.token, t.expiresAt),

    index("session_user_id_idx").on(t.userId),

    index("session_expires_at_idx").on(t.expiresAt),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (t) => [
    index("account_provider_account_idx").on(t.providerId, t.accountId),

    index("account_user_id_idx").on(t.userId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  },
  (t) => [
    index("verification_identifier_expires_idx").on(t.identifier, t.expiresAt),

    index("verification_expires_at_idx").on(t.expiresAt),
  ],
);

// Relations unchanged
export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
  subscriptions: many(subscription),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));
