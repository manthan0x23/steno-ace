import z from "zod";
import { adminProcedure, createTRPCRouter } from "../../trpc";
import { adminAuthRouter } from "./auth/auth.router";
import { inviteRouter } from "./invite/invite.router";
import { db } from "~/server/db";
import { and, eq, ilike, ne } from "drizzle-orm";
import { admin } from "~/server/db/schema";
import { comparePassword, hashPassword } from "~/server/lib/hash";
import { TRPCError } from "@trpc/server";

const editAdminInput = z.object({
  username: z.string().min(3).optional(),
  name: z.string().min(1).optional(),
  image: z.string().optional(),

  oldPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export const adminRouter = createTRPCRouter({
  auth: adminAuthRouter,
  invite: inviteRouter,

  checkUsernameAvailability: adminProcedure
    .input(
      z.object({
        username: z.string().min(3),
      }),
    )
    .query(async ({ input, ctx }) => {
      const existing = await db.query.admin.findFirst({
        where: and(
          ilike(admin.username, input.username),
          ne(admin.id, ctx.admin.id),
        ),
      });

      return {
        available: !existing,
      };
    }),

  edit: adminProcedure
    .input(editAdminInput)
    .mutation(async ({ input, ctx }) => {
      const adminId = ctx.admin.id;

      const current = await db.query.admin.findFirst({
        where: eq(admin.id, adminId),
      });

      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Admin not found",
        });
      }

      if (input.username) {
        const exists = await db.query.admin.findFirst({
          where: and(
            ilike(admin.username, input.username),
            ne(admin.id, adminId),
          ),
        });

        if (exists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Username already taken",
          });
        }
      }

      let newPasswordHash: string | undefined;

      if (input.oldPassword || input.newPassword) {
        if (!input.oldPassword || !input.newPassword) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Both old and new password required",
          });
        }

        const isValid = await comparePassword(
          input.oldPassword,
          current.passwordHash,
        );

        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Incorrect old password",
          });
        }

        newPasswordHash = await hashPassword(input.newPassword);
      }

      const updateData: Partial<typeof admin.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (input.username) updateData.username = input.username;
      if (input.name) updateData.name = input.name;
      if (input.image !== undefined) updateData.image = input.image;
      if (newPasswordHash) updateData.passwordHash = newPasswordHash;

      await db.update(admin).set(updateData).where(eq(admin.id, adminId));

      return {
        success: true,
      };
    }),
});
