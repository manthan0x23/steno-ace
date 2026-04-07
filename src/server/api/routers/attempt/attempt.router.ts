import { createTRPCRouter, demoOrPaidUserProcedure } from "~/server/api/trpc";
import {
  createAttemptSchema,
  syncAttemptSchema,
  submitAttemptSchema,
  getAttemptSchema,
} from "./attempt.schema";
import { attemptService } from "./attempt.service";

export const attemptRouter = createTRPCRouter({
  create: demoOrPaidUserProcedure
    .input(createAttemptSchema)
    .mutation(({ input, ctx }) => attemptService.create(input, ctx.user.id)),

  sync: demoOrPaidUserProcedure
    .input(syncAttemptSchema)
    .mutation(({ input, ctx }) => attemptService.sync(input, ctx.user.id)),

  submit: demoOrPaidUserProcedure
    .input(submitAttemptSchema)
    .mutation(({ input, ctx }) => attemptService.submit(input, ctx.user)),

  getResume: demoOrPaidUserProcedure
    .input(getAttemptSchema)
    .query(({ input, ctx }) =>
      attemptService.getResume(input.attemptId, ctx.user.id),
    ),
});
