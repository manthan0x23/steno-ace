import { z } from "zod";

export const createTestSchema = z.object({
  title: z.string().min(1),

  type: z.enum(["legal", "general"]),

  audioKey: z.string(),

  matter: z.string(),
  outline: z.string().nullable().default(null),
  explanation: z.string(),

  breakSeconds: z.number().int().nonnegative(),
  writtenDurationSeconds: z.number().int().positive(),
  dictationSeconds: z.number().int().nonnegative(),

  status: z.enum(["draft", "active"]).default("draft"),
});

export const updateTestSchema = createTestSchema.extend({
  id: z.string().uuid(),
  status: z.enum(["draft", "active"]).optional(),
});

export const getTestSchema = z.object({
  id: z.string().uuid(),
});

export const listTestsSchema = z.object({
  page: z.number().int().min(1).default(1),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  type: z.enum(["legal", "general", "all"]).default("all"),
  status: z.enum(["active", "draft", "all"]).default("all"),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;
export type UpdateTestInput = z.infer<typeof updateTestSchema>;
export type ListTestsInput = z.infer<typeof listTestsSchema>;
export type GetTestInput = z.infer<typeof getTestSchema>;
