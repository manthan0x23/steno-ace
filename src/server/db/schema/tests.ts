import { index, pgEnum } from "drizzle-orm/pg-core";
import { pgTable, text, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { admin } from "./admin";
import { user } from "./user";
import { nanoid } from "nanoid";

export const testTypeEnum = pgEnum("test_type", ["legal", "general"]);

export const testStatusEnum = pgEnum("test_status", ["draft", "active"]);

export const attemptTypeEnum = pgEnum("attempt_type", ["real", "practice"]);

export const tests = pgTable("tests", {
  id: text("id")
    .$defaultFn(() => nanoid(8))
    .primaryKey(),

  title: text("title").notNull(),

  type: testTypeEnum("type").notNull(),

  audioKey: text("audio_key"),

  matter: text("matter").notNull(),
  outline: text("outline").notNull(),
  explanation: text("explanation").notNull(),

  breakSeconds: integer("break_seconds").notNull(),
  writtenDurationSeconds: integer("written_duration_seconds").notNull(),
  dictationSeconds: integer("dictation_duration_seconds").notNull(),

  status: testStatusEnum("status").notNull().default("draft"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  adminId: text("admin_id")
    .notNull()
    .default("system")
    .references(() => admin.id, {
      onDelete: "set default",
    }),
});

export const testAttempts = pgTable(
  "test_attempts",
  {
    id: text("id")
      .$defaultFn(() => nanoid(8))
      .primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    testId: text("test_id")
      .notNull()
      .references(() => tests.id, { onDelete: "cascade" }),

    type: attemptTypeEnum("type").notNull(),

    score: integer("score"),
    answer: text("answer"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userTestIdx: index("idx_user_test").on(table.userId, table.testId),

    userTestTypesIdx: index("idx_user_type").on(table.userId, table.type),
  }),
);
