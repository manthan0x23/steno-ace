import { z } from "zod";

import { createTRPCRouter, paidProcedure, protectedProcedure } from "~/server/api/trpc";
import { posts } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";

export const postsRouter = createTRPCRouter({
  /**
   * Get user's latest post
   */
  getLatest: paidProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.query.posts.findFirst({
      where: eq(posts.createdById, ctx.session.user.id),
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });

    return post ?? null;
  }),

  /**
   * Create a new post (requires subscription)
   */
  create: paidProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(posts).values({
        name: input.name,
        createdById: ctx.session.user.id,
      });
    }),

  /**
   * Get all posts by user
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userPosts = await ctx.db.query.posts.findMany({
      where: eq(posts.createdById, ctx.session.user.id),
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
    });

    return userPosts;
  }),

  /**
   * Get post by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.query.posts.findFirst({
        where: and(
          eq(posts.id, input.id),
          eq(posts.createdById, ctx.session.user.id)
        ),
      });

      return post;
    }),
});