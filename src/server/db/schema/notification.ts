import { pgTable, text, timestamp, index, boolean } from "drizzle-orm/pg-core";

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),

    title: text("title").notNull(),
    message: text("message").notNull(),

    to: text("to").notNull(),

    seenBy: text("seen_by")
      .array()
      .$defaultFn(() => []),

    link: text("link"),
    isLinkExternal: boolean("is_link_external"),

    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => ({
    toIdx: index("notif_to_idx").on(t.to),

    createdAtIdx: index("notif_created_at_idx").on(t.createdAt),
  }),
);
