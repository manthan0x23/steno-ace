import z from "zod";
import { createTRPCRouter, paidUserProcedure } from "../../trpc";
import { resultService } from "./results.service";

export const resultRouter = createTRPCRouter({
  getResult: paidUserProcedure
    .input(
      z.object({
        attemptId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await resultService.getResult(
        input.attemptId,
        ctx.user.id,
      );
    }),
});
