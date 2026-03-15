import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  /**
   * Get current user profile
   */
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.session.user;
  }),

  /**
   * Check if user has active subscription
   */
  hasSubscription: protectedProcedure.query(async ({ ctx }) => {
    // This would typically check the subscription table
    // For now, returning false as placeholder
    return false;
  }),

  /**
   * Get user's subscription status
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    // This would fetch from subscription table
    // For now, returning null as placeholder
    return null;
  }),
});