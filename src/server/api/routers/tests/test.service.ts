import { db } from "~/server/db";
import { tests } from "~/server/db/schema/tests";
import { eq, desc } from "drizzle-orm";
import type {
  CreateTestInput,
  GetTestInput,
  ListTestsInput,
  UpdateTestInput,
} from "./test.schema";

const PAGE_SIZE = 20;

export const testService = {
  async create(input: CreateTestInput, adminId: string) {
    const [test] = await db
      .insert(tests)
      .values({
        ...input,
        adminId,
      })
      .returning();

    return test;
  },

  async update(input: UpdateTestInput) {
    const existing = await db.query.tests.findFirst({
      where: eq(tests.id, input.id),
    });

    if (!existing) throw new Error("Test not found");

    if (existing.status === "active" && input.status !== "active") {
      throw new Error("Active tests cannot be modified");
    }

    const { id, ...rest } = input;

    const [updated] = await db
      .update(tests)
      .set(rest)
      .where(eq(tests.id, id))
      .returning();

    return updated;
  },

  async delete(input: GetTestInput) {
    await db.delete(tests).where(eq(tests.id, input.id));
    return { success: true };
  },

  async list(input: ListTestsInput) {
    const offset = (input.page - 1) * PAGE_SIZE;

    const data = await db.query.tests.findMany({
      limit: PAGE_SIZE,
      offset,
      orderBy: desc(tests.createdAt),
    });

    return {
      data,
      page: input.page,
      pageSize: PAGE_SIZE,
    };
  },

  async getById(input: GetTestInput) {
    const test = await db.query.tests.findFirst({
      where: eq(tests.id, input.id),
    });

    if (!test) throw new Error("Test not found");

    return test;
  },
};
