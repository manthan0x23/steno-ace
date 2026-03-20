import z from "zod";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../../trpc";
import { userService } from "./user.service";
import {
  adminDateRangeSchema,
  adminTestWiseSchema,
  dateRangeSchema,
  getAttemptsAdminSchema,
  getProgressSeriesSchema,
  heatmapAdminSchema,
  heatmapSchema,
  testWiseInputSchema,
  userIdSchema,
} from "./user.schema";
import { db } from "~/server/db";
import R2Service from "~/server/services/r2.service";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => ctx.user),

  getUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const user = await db.query.user.findFirst({
        columns: {
          email: true,
          name: true,
          image: true,
          gender: true,
          phone: true,
        },
        where: (u, { eq }) => eq(u.id, input.userId),
      });

      return {
        ...user,
        profilePicUrl: user?.image ? R2Service.getPublicUrl(user.image) : null,
      };
    }),

  // ── Report ──
  getReport: protectedProcedure
    .input(
      z
        .object({ type: z.enum(["assessment", "practice"]).optional() })
        .optional(),
    )
    .query(({ ctx, input }) => userService.getReport(ctx.user.id, input?.type)),

  getReportAdmin: adminProcedure
    .input(userIdSchema)
    .query(({ input }) => userService.getReport(input.userId, input.type)),

  // ── Progress ──
  getProgress: protectedProcedure
    .input(dateRangeSchema.optional())
    .query(({ ctx, input }) =>
      userService.getProgress(ctx.user.id, input?.from, input?.to, input?.type),
    ),

  getProgressAdmin: adminProcedure
    .input(adminDateRangeSchema.optional())
    .query(({ input }) =>
      userService.getProgress(
        input?.userId!,
        input?.from,
        input?.to,
        input?.type,
      ),
    ),

  // ── Personal Bests ──
  getPersonalBests: protectedProcedure
    .input(
      z
        .object({ type: z.enum(["assessment", "practice"]).optional() })
        .optional(),
    )
    .query(({ ctx, input }) =>
      userService.getPersonalBests(ctx.user.id, input?.type),
    ),

  getPersonalBestsAdmin: adminProcedure
    .input(userIdSchema)
    .query(({ input }) =>
      userService.getPersonalBests(input.userId, input.type),
    ),

  // ── Test-Wise Performance ──
  getTestWisePerformance: protectedProcedure
    .input(testWiseInputSchema.optional())
    .query(({ ctx, input }) =>
      userService.getTestWisePerformance(
        ctx.user.id,
        input?.limit,
        input?.type,
      ),
    ),

  getTestWisePerformanceAdmin: adminProcedure
    .input(adminTestWiseSchema.optional())
    .query(({ input }) =>
      userService.getTestWisePerformance(
        input?.userId!,
        input?.limit,
        input?.type,
      ),
    ),

  // ── Progress Series (chart) ──
  getProgressSeries: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(200).default(60),
          type: z.enum(["assessment", "practice"]).optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) =>
      userService.getProgressSeries(ctx.user.id, input?.limit, input?.type),
    ),

  getProgressSeriesAdmin: adminProcedure
    .input(getProgressSeriesSchema)
    .query(({ input }) =>
      userService.getProgressSeries(input.userId!, input.limit, input.type),
    ),

  // ── Paginated Attempts ──
  getAttemptsPaginated: protectedProcedure
    .input(
      z
        .object({
          page: z.number().min(0).default(0),
          limit: z.number().min(1).max(100).default(15),
          testId: z.string().optional(),
          type: z.enum(["assessment", "practice"]).optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) =>
      userService.getAttemptsPaginated(
        ctx.user.id,
        input?.page,
        input?.limit,
        input?.type,
        input?.testId,
      ),
    ),

  getAttemptsPaginatedAdmin: adminProcedure
    .input(getAttemptsAdminSchema)
    .query(({ input }) =>
      userService.getAttemptsPaginated(
        input.userId,
        input.page,
        input.limit,
        input.type,
      ),
    ),

  getHeatmap: protectedProcedure
    .input(heatmapSchema)
    .query(({ ctx, input }) =>
      userService.getHeatmap(
        ctx.user.id,
        input.from,
        input.to,
        input.includePractice,
      ),
    ),

  getHeatmapAdmin: adminProcedure
    .input(heatmapAdminSchema)
    .query(({ input }) =>
      userService.getHeatmap(
        input.userId,
        input.from,
        input.to,
        input.includePractice,
      ),
    ),
});
