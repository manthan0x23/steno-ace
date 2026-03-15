import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { createAdminInvite } from "~/server/admin/auth";

export const inviteRouter = createTRPCRouter({
  /**
   * Super-admin only: create an invite token.
   * Uses the server/admin/auth guard internally.
   */
  createInvite: adminProcedure.mutation(async () => {
    const invite = await createAdminInvite();
    return invite;
  }),
});