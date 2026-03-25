import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { env } from "~/env";
import { db } from "~/server/db";
import type { admin, adminSession } from "../db/schema";
import { emailService } from "../services/mail.service";

export const auth = betterAuth({
  ...(env.BETTER_AUTH_SECRET && { secret: env.BETTER_AUTH_SECRET }),
  trustedOrigins: [env.BETTER_AUTH_BASE_URL, "http://localhost:3000"],
  database: drizzleAdapter(db, { provider: "pg" }),
  baseURL: env.BETTER_AUTH_BASE_URL,

  emailAndPassword: {
    enabled: true,

    sendResetPassword: async ({ user, url }) => {
      await emailService.sendEmail({
        to: user.email,
        subject: "Steno Dexter — Reset your password",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px;margin:auto;">
            <h2>Reset your password</h2>
            <p>Click below to set a new password. This link expires in 1 hour.</p>
            <a href="${url}"
               style="display:inline-block;margin-top:16px;padding:10px 18px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">
              Reset Password →
            </a>
            <p style="margin-top:20px;color:#666;font-size:13px;">
              If you didn't request this, ignore this email.
            </p>
            <p>— Team</p>
          </div>
        `,
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await emailService.sendEmail({
        to: user.email,
        subject: "Steno Dexter — Verify your email",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px;margin:auto;">
            <h2>Verify your email</h2>
            <p>Click below to confirm your email address.</p>
            <a href="${url}"
               style="display:inline-block;margin-top:16px;padding:10px 18px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">
              Verify Email →
            </a>
            <p style="margin-top:20px;color:#666;font-size:13px;">
              If you didn't create an account, ignore this.
            </p>
            <p>— Team</p>
          </div>
        `,
      });
    },
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
  },

  socialProviders: {
    google: {
      clientId: env.BETTER_AUTH_GOOGLE_CLIENT_ID,
      clientSecret: env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
      redirectURI: `${env.BETTER_AUTH_BASE_URL}/api/auth/callback/google`,
    },
  },

  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: env.BETTER_AUTH_BASE_URL.startsWith("https://"),
    },
  },
});

export type UserSession = typeof auth.$Infer.Session;
export type AdminSession = {
  admin: typeof admin.$inferSelect;
  session: typeof adminSession.$inferSelect;
} | null;
