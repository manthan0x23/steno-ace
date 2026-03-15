import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import {
  createAdminInvite,
  loginAdmin,
  logoutAdmin,
  registerAdminFromInvite,
} from "~/server/admin/auth";

export const authRouter = createTRPCRouter({
  /**
   * Get current admin (if any).
   * Uses adminProcedure so only a valid admin session can see this.
   */
  me: adminProcedure.query(({ ctx }) => {
    return ctx.admin;
  }),

  /**
   * Register a new admin using an invite token, name, username and password.
   * On success, creates a session cookie via admin auth.
   */
  register: publicProcedure
    .input(
      z.object({
        token: z.string(),
        name: z.string().min(1),
        username: z.string().min(3),
        password: z.string().min(6),
      }),
    )
    .mutation(async ({ input }) => {
      await registerAdminFromInvite(input);
      return { success: true };
    }),

  /**
   * Login admin with username/password; sets session cookie.
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      await loginAdmin(input);
      return { success: true };
    }),

  /**
   * Logout admin; clears session cookie.
   */
  logout: publicProcedure.mutation(async () => {
    await logoutAdmin();
    return { success: true };
  }),
});