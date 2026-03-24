import { createTRPCRouter, publicProcedure } from "../../trpc";
import { cronService } from "./crons.service";

export const cronRouter = createTRPCRouter({
  expireSubscription: publicProcedure.query(cronService.expireSubscriptions),

  sendExpiryReminders: publicProcedure.query(cronService.sendExpiryReminders),
});
