// ─── attempt.service.ts ──────────────────────────────────────────────────────
import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { testAttempts, tests } from "~/server/db/schema";
import type {
  CreateAttemptInput,
  SyncAttemptInput,
  SubmitAttemptInput,
} from "./attempt.schema";
import R2Service from "~/server/services/r2.service";

export const attemptService = {
  /**
   * Create a new attempt row and return it.
   * For assessment: enforce one-per-user-per-test.
   */
  async create(input: CreateAttemptInput, userId: string) {
    const test = await db.query.tests.findFirst({
      where: eq(tests.id, input.testId),
    });
    if (!test) throw new Error("Test not found");
    if (test.status !== "active") throw new Error("Test is not active");

    // First attempt ever = assessment, all subsequent = practice
    const prior = await db.query.testAttempts.findFirst({
      where: and(
        eq(testAttempts.userId, userId),
        eq(testAttempts.testId, input.testId),
      ),
    });

    const type = prior ? "practice" : "assessment";

    const [attempt] = await db
      .insert(testAttempts)
      .values({
        userId,
        testId: input.testId,
        type,
        stage: "audio",
        // stageStartedAt is intentionally null here.
        // The client sets it via sync() once the 3-second countdown finishes
        // and audio actually begins. This prevents the countdown from eating
        // into the dictation timer on resume.
        stageStartedAt: null,
      })
      .returning();

    return attempt!;
  },

  /**
   * Lightweight sync — called on debounce / stage transitions.
   */
  async sync(input: SyncAttemptInput, userId: string) {
    const attempt = await db.query.testAttempts.findFirst({
      where: and(
        eq(testAttempts.id, input.attemptId),
        eq(testAttempts.userId, userId),
      ),
    });
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.isSubmitted) throw new Error("Attempt already submitted");

    const patch: Partial<typeof testAttempts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.audioProgressSeconds !== undefined)
      patch.audioProgressSeconds = input.audioProgressSeconds;
    if (input.answerDraft !== undefined) patch.answerDraft = input.answerDraft;
    if (input.stage !== undefined) {
      patch.stage = input.stage;
      patch.stageStartedAt = new Date();
    }
    if (input.breakSkipped !== undefined) patch.breakSkipped = input.breakSkipped;
    // Stamp stageStartedAt only when audio truly begins (post-countdown)
    if (input.markAudioStarted && !attempt.stageStartedAt) {
      patch.stageStartedAt = new Date();
    }

    await db
      .update(testAttempts)
      .set(patch)
      .where(eq(testAttempts.id, input.attemptId));

    return { ok: true };
  },

  /**
   * Final submission.
   */
  async submit(input: SubmitAttemptInput, userId: string) {
    const attempt = await db.query.testAttempts.findFirst({
      where: and(
        eq(testAttempts.id, input.attemptId),
        eq(testAttempts.userId, userId),
      ),
    });
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.isSubmitted) return attempt; // idempotent

    const [updated] = await db
      .update(testAttempts)
      .set({
        answerFinal: input.answerFinal,
        isSubmitted: true,
        submittedAt: new Date(),
        stage: "submitted",
        updatedAt: new Date(),
      })
      .where(eq(testAttempts.id, input.attemptId))
      .returning();

    return updated;
  },

  /**
   * Resume data — returns attempt + test for the test page to hydrate from.
   * Calculates how much time is left in the current stage.
   */
  async getResume(attemptId: string, userId: string) {
    const attempt = await db.query.testAttempts.findFirst({
      where: and(
        eq(testAttempts.id, attemptId),
        eq(testAttempts.userId, userId),
      ),
      with: { test: true },
    });
    if (!attempt) throw new Error("Attempt not found");

    const now = Date.now();
    const stageStarted = attempt.stageStartedAt?.getTime() ?? null;

    let secondsLeft = 0;

    if (attempt.stage === "audio") {
      if (stageStarted === null) {
        // Countdown hasn't finished yet — full duration remains
        secondsLeft = attempt.test.dictationSeconds;
      } else {
        // Resume from last synced audio progress position
        const progress = attempt.audioProgressSeconds ?? 0;
        secondsLeft = Math.max(0, attempt.test.dictationSeconds - progress);
      }
    } else if (attempt.stage === "break") {
      const elapsedSeconds = stageStarted
        ? Math.floor((now - stageStarted) / 1000)
        : 0;
      secondsLeft = Math.max(0, attempt.test.breakSeconds - elapsedSeconds);
    } else if (attempt.stage === "writing") {
      const elapsedSeconds = stageStarted
        ? Math.floor((now - stageStarted) / 1000)
        : 0;
      secondsLeft = Math.max(
        0,
        attempt.test.writtenDurationSeconds - elapsedSeconds,
      );
    }

    const elapsedSeconds = stageStarted
      ? Math.floor((now - stageStarted) / 1000)
      : 0;

    return {
      attempt,
      test: {...attempt.test, audioUrl: R2Service.getPublicUrl(attempt.test.audioKey) },
      secondsLeft,
      elapsedSeconds,
    };
  },
};