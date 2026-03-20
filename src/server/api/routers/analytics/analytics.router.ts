import { createTRPCRouter, adminProcedure, publicProcedure } from "../../trpc";
import { analyticsService } from "./analytics.service";
import {
  dateRangeSchema,
  getGlobalTopPerformersSchema,
  getTestStatsSchema,
  getUsersSchema,
} from "./analytics.schema";

export const analyticsRouter = createTRPCRouter({
  // 📊 Overview
  getPlatformOverview: adminProcedure.query(() => {
    return analyticsService.getPlatformOverview();
  }),

  // 📈 Growth
  getGrowthAnalytics: adminProcedure
    .input(dateRangeSchema.optional())
    .query(({ input }) => {
      return analyticsService.getGrowthAnalytics(input?.from, input?.to);
    }),

  // 🔥 Engagement
  getEngagementMetrics: adminProcedure.query(() => {
    return analyticsService.getEngagementMetrics();
  }),

  getTestStats: publicProcedure.input(getTestStatsSchema).query(({ input }) => {
    return analyticsService.getTestStats(input.testId);
  }),

  // 📄 Test Performance
  getTestPerformance: adminProcedure.query(() => {
    return analyticsService.getTestPerformance();
  }),

  // 🏆 Leaderboard
  getLeaderboardAnalytics: adminProcedure.query(() => {
    return analyticsService.getLeaderboardAnalytics();
  }),

  /**
   * 🔥 Global Leaderboard
   */
  getGlobalTopPerformers: publicProcedure
    .input(getGlobalTopPerformersSchema)
    .query(({ input }) => {
      return analyticsService.getGlobalTopPerformers(input);
    }),

  getUsers: adminProcedure.input(getUsersSchema).query(async ({ input }) => {
    return await analyticsService.getUsers(input);
  }),
});
