import { z } from "zod";

export const createDemoUserSchema = z.object({
  expiresAt: z.date().optional(), // null = never expires
  note: z.string().max(500).optional(), // internal admin note
});

export const editDemoUserSchema = z.object({
  id: z.string(),

  expiresAt: z.date().nullable().optional(), // null = remove expiry
  note: z.string().max(500).nullable().optional(),
});

export const revokeDemoUserSchema = z.object({
  id: z.string(),
});

export const listDemoUsersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(), // search by name or email
  status: z.enum(["all", "active", "expired", "revoked"]).default("all"),
});

export const getDemoUserSchema = z.object({
  id: z.string(),
});

export type CreateDemoUserInput = z.infer<typeof createDemoUserSchema>;
export type EditDemoUserInput = z.infer<typeof editDemoUserSchema>;
export type RevokeDemoUserInput = z.infer<typeof revokeDemoUserSchema>;
export type ListDemoUsersInput = z.infer<typeof listDemoUsersSchema>;
