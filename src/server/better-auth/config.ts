import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { env } from "~/env";
import { db } from "~/server/db";
import type { admin, adminSession } from "../db/schema";
import { emailService } from "../services/mail.service";
import { comparePassword, hashPassword } from "../lib/hash";
import { redisService } from "../services/redis.service";
import { deviceService } from "../api/routers/device/device.service";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEVICE_ID_HEADER = "x-device-id";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract device-id from the raw request headers attached to the better-auth
 * request object. better-auth exposes `request` on hook context as a standard
 * `Request` (Fetch API).
 */
function getDeviceId(request: Request | undefined): string | null {
  if (!request) return null;
  return request.headers.get(DEVICE_ID_HEADER) ?? null;
}

function getUserAgent(request: Request | undefined): string | null {
  return request?.headers.get("user-agent") ?? null;
}

function getIpAddress(request: Request | undefined): string | null {
  return (
    request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request?.headers.get("x-real-ip") ??
    null
  );
}

// ---------------------------------------------------------------------------
// Auth config
// ---------------------------------------------------------------------------

export const auth = betterAuth({
  ...(env.BETTER_AUTH_SECRET && { secret: env.BETTER_AUTH_SECRET }),
  trustedOrigins: [
    "http://localhost:3000",
    "https://stenodexter.com",
    "https://www.stenodexter.com",
  ],
  database: drizzleAdapter(db, { provider: "pg" }),
  baseURL: env.BETTER_AUTH_BASE_URL,

  user: {
    additionalFields: {
      userCode: { type: "string", required: false },
      isDemo: { type: "boolean", required: false },
      demoExpiresAt: { type: "date", required: false },
      demoRevoked: { type: "boolean", required: false, defaultValue: false },
      demoNote: { type: "string", required: false, defaultValue: null },
      demoCreatedByAdminId: {
        type: "string",
        required: false,
        defaultValue: null,
      },
    },
  },

  // -------------------------------------------------------------------------
  // Database hooks — single choke point for ALL login methods
  // -------------------------------------------------------------------------

  databaseHooks: {
    session: {
      create: {
        /**
         * Fires after better-auth has validated credentials / OAuth token but
         * BEFORE the session row is written.
         *
         * Throwing here aborts the login and returns a 401 to the client.
         */
        before: async (session, ctx) => {
          const request = ctx?.request as Request | undefined;
          const deviceId = getDeviceId(request);
          const userId = session.userId;

          console.log(deviceId, userId);

          const existing = await deviceService.get(userId);

          if (!existing) {
            if (!deviceId) {
              throw new APIError("UNAUTHORIZED", { message: "DEVICE_MISSING" });
            }

            await deviceService.create({
              userId,
              deviceId,
              userAgent: getUserAgent(request),
              ipAddress: getIpAddress(request),
            });

            return { data: session };
          }

          if (!deviceId || existing.deviceId !== deviceId) {
            throw new APIError("UNAUTHORIZED", {
              message: "DEVICE_MISMATCH",
            });
          }

          void deviceService.update({
            userId,
            userAgent: getUserAgent(request),
            ipAddress: getIpAddress(request),
          });

          return { data: session };
        },
      },
    },
  },

  // -------------------------------------------------------------------------
  // Email & password
  // -------------------------------------------------------------------------

  emailAndPassword: {
    enabled: true,

    password: {
      async hash(password) {
        return await hashPassword(password);
      },
      async verify(data) {
        return await comparePassword(data.password, data.hash);
      },
    },

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

  // -------------------------------------------------------------------------
  // Email verification
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Social providers
  // -------------------------------------------------------------------------

  socialProviders: {
    google: {
      clientId: env.BETTER_AUTH_GOOGLE_CLIENT_ID,
      clientSecret: env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
      redirectURI: `${env.BETTER_AUTH_BASE_URL}/api/auth/callback/google`,
    },
  },

  // -------------------------------------------------------------------------
  // Advanced / rate limiting
  // -------------------------------------------------------------------------

  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: env.BETTER_AUTH_BASE_URL.startsWith("https://"),
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    customRules: {
      "/api/auth/sign-in/email": { window: 60, max: 10 },
      "/api/auth/sign-up/email": { window: 60, max: 5 },
      "/api/auth/forget-password": { window: 60, max: 5 },
      "/api/auth/reset-password": { window: 60, max: 5 },
      "/api/auth/verify-email": { window: 60, max: 10 },
      "/api/auth/sign-in/social": { window: 60, max: 10 },
    },
    storage: "secondary-storage",
  },

  secondaryStorage: {
    async get(key: string) {
      try {
        return await redisService.get<string>(key);
      } catch {
        return null;
      }
    },
    async set(key, value, ttlSec) {
      try {
        await redisService.set(key, value, ttlSec);
      } catch {}
    },
    async delete(key: string) {
      try {
        await redisService.del(key);
      } catch {}
    },
  },
});

export type UserSession = typeof auth.$Infer.Session;
export type AuthUser = UserSession["user"];
export type AdminSession = {
  admin: typeof admin.$inferSelect;
  session: typeof adminSession.$inferSelect;
} | null;
