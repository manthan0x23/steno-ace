import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

import {
  createTestSchema,
  updateTestSchema,
  getTestSchema,
  listTestsSchema,
} from "./test.schema";

import { testService } from "./test.service";

export const testRouter = createTRPCRouter({
  create: adminProcedure.input(createTestSchema).mutation(({ input, ctx }) => {
    return testService.create(input, ctx.admin.id);
  }),

  update: adminProcedure.input(updateTestSchema).mutation(({ input }) => {
    return testService.update(input);
  }),

  delete: adminProcedure.input(getTestSchema).mutation(({ input }) => {
    return testService.delete(input);
  }),

  list: publicProcedure.input(listTestsSchema).query(({ input }) => {
    return testService.list(input);
  }),

  get: publicProcedure.input(getTestSchema).query(({ input }) => {
    return testService.getById(input);
  }),
});
