
import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { db as globalDb } from "~/server/db";
import { hallOfFame } from "~/server/db/schema";
import R2Service from "~/server/services/r2.service";
import { nanoid } from "nanoid";
 
import type { db as DbInstance } from "~/server/db";
type Db = typeof DbInstance;
 
export type HofEntry = {
  id:         string;
  name:       string;
  photoKey:   string | null;
  department: string;
  batch:      string | null;
  note:       string | null;
  createdAt:  Date;
};
 
function resolvePhoto(key: string | null) {
  return key ? R2Service.getPublicUrl(key) : null;
}
 
export function createHofService(db: Db) {
  return {
 
    async list(opts?: { department?: string; search?: string; page?: number; limit?: number }) {
      const { department, search, page = 0, limit = 50 } = opts ?? {};
 
      const conditions = [];
      if (department) conditions.push(eq(hallOfFame.department, department));
      if (search)     conditions.push(ilike(hallOfFame.name, `%${search}%`));
 
      const where = conditions.length > 0 ? and(...conditions) : undefined;
 
      const [rows, [countRow]] = await Promise.all([
        db.select().from(hallOfFame)
          .where(where)
          .orderBy(desc(hallOfFame.createdAt))
          .limit(limit)
          .offset(page * limit),
 
        db.select({ count: sql<number>`cast(count(*) as int)` })
          .from(hallOfFame)
          .where(where),
      ]);
 
      // Distinct departments for filter tabs
      const deptRows = await db
        .selectDistinct({ department: hallOfFame.department })
        .from(hallOfFame)
        .orderBy(asc(hallOfFame.department));
 
      return {
        data: rows.map((r) => ({ ...r, photoUrl: resolvePhoto(r.photoKey) })),
        total:       countRow?.count ?? 0,
        totalPages:  Math.ceil((countRow?.count ?? 0) / limit),
        page,
        departments: deptRows.map((d) => d.department),
      };
    },
 
    async create(input: {
      name: string; department: string;
      photoKey?: string; batch?: string; note?: string;
    }, adminId: string) {
      const [row] = await db.insert(hallOfFame).values({
        id:         nanoid(8),
        name:       input.name,
        department: input.department,
        photoKey:   input.photoKey ?? null,
        batch:      input.batch ?? null,
        note:       input.note ?? null,
        addedById:  adminId,
        createdAt:  new Date(),
        updatedAt:  new Date(),
      }).returning();
 
      return { ...row!, photoUrl: resolvePhoto(row!.photoKey) };
    },
 
    async update(id: string, input: {
      name?: string; department?: string;
      photoKey?: string | null; batch?: string | null; note?: string | null;
    }) {
      const patch: Partial<typeof hallOfFame.$inferInsert> = { updatedAt: new Date() };
      if (input.name       !== undefined) patch.name       = input.name;
      if (input.department !== undefined) patch.department = input.department;
      if (input.photoKey   !== undefined) patch.photoKey   = input.photoKey;
      if (input.batch      !== undefined) patch.batch      = input.batch;
      if (input.note       !== undefined) patch.note       = input.note;
 
      const [row] = await db.update(hallOfFame).set(patch)
        .where(eq(hallOfFame.id, id))
        .returning();
 
      if (!row) throw new Error("Entry not found");
      return { ...row, photoUrl: resolvePhoto(row.photoKey) };
    },
 
    async delete(id: string) {
      const [row] = await db.delete(hallOfFame)
        .where(eq(hallOfFame.id, id))
        .returning({ photoKey: hallOfFame.photoKey });
      return row ?? null;
    },
  };
}
 
export const hofService = createHofService(globalDb);