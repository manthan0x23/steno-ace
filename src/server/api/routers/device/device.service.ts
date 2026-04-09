import { eq } from "drizzle-orm";
import { db as globalDb } from "~/server/db";
import { device } from "~/server/db/schema";
import type { db as DbInstance } from "~/server/db";

type Db = typeof DbInstance;

export interface CreateDeviceInput {
  userId: string;
  deviceId: string;
  deviceName?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface UpdateDeviceInput {
  userId: string;
  deviceId?: string | null;
  deviceName?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export function createDeviceService(db: Db) {
  return {
    
    async create(input: CreateDeviceInput) {
      const existing = await db.query.device.findFirst({
        where: eq(device.userId, input.userId),
      });

      if (existing) {
        throw new Error("A device is already registered for this user.");
      }

      const now = new Date();

      const [row] = await db
        .insert(device)
        .values({
          id: crypto.randomUUID(),
          userId: input.userId,
          deviceId: input.deviceId,
          deviceName: input.deviceName ?? null,
          userAgent: input.userAgent ?? null,
          ipAddress: input.ipAddress ?? null,
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return row!;
    },

 
    async update(input: UpdateDeviceInput) {
      const existing = await db.query.device.findFirst({
        where: eq(device.userId, input.userId),
      });

      if (!existing) {
        throw new Error("No device found for this user.");
      }

      const now = new Date();

      const [row] = await db
        .update(device)
        .set({
          ...(input.deviceId != null && { deviceId: input.deviceId }),
          ...(input.deviceName !== undefined && { deviceName: input.deviceName }),
          ...(input.userAgent !== undefined && { userAgent: input.userAgent }),
          ...(input.ipAddress !== undefined && { ipAddress: input.ipAddress }),
          lastLoginAt: now,
          updatedAt: now,
        })
        .where(eq(device.userId, input.userId))
        .returning();

      return row!;
    },

    /**
     * Fetch the device record for a user. Returns null if none exists.
     */
    async get(userId: string) {
      const row = await db.query.device.findFirst({
        where: eq(device.userId, userId),
      });

      return row ?? null;
    },

    /**
     * Delete the device record for a user (e.g. on logout / account deletion).
     */
    async delete(userId: string) {
      await db.delete(device).where(eq(device.userId, userId));
      return { ok: true };
    },
  };
}

export const deviceService = createDeviceService(globalDb);