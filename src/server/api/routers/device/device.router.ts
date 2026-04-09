import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { deviceService } from "./device.service";

export const deviceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        deviceId: z.string().min(1),
        deviceName: z.string().max(200).nullish(),
        userAgent: z.string().max(500).nullish(),
        ipAddress: z.string().max(100).nullish(),
      }),
    )
    .mutation(({ input, ctx }) =>
      deviceService.create({
        userId: ctx.user.id,
        deviceId: input.deviceId,
        deviceName: input.deviceName ?? null,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
      }),
    ),

  update: protectedProcedure
    .input(
      z.object({
        deviceId: z.string().min(1).nullish(),
        deviceName: z.string().max(200).nullish(),
        userAgent: z.string().max(500).nullish(),
        ipAddress: z.string().max(100).nullish(),
      }),
    )
    .mutation(({ input, ctx }) =>
      deviceService.update({
        userId: ctx.user.id,
        deviceId: input.deviceId ?? null,
        deviceName: input.deviceName ?? null,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
      }),
    ),

  get: protectedProcedure.query(({ ctx }) => deviceService.get(ctx.user.id)),

  // ── Admin ──────────────────────────────────────────────────────────────────
  adminGet: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => deviceService.get(input.userId)),

  adminDelete: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ input }) => deviceService.delete(input.userId)),
});
