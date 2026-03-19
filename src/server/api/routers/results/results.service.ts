import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { results, testAttempts } from "~/server/db/schema";
import R2Service from "~/server/services/r2.service";
import { scoringEngine } from "~/server/services/scoring.service";

export const resultService = {
  async getResult(attemptId: string, userId: string) {
    const attempt = await db.query.testAttempts.findFirst({
      where: and(
        eq(testAttempts.id, attemptId),
        eq(testAttempts.userId, userId),
      ),
      with: { test: true },
    });

    if (!attempt) throw new Error("Attempt not found");
    if (!attempt.isSubmitted) throw new Error("Attempt not yet submitted");

    const result = await db.query.results.findFirst({
      where: eq(results.attemptId, attempt.id),
    });

    if (!result) throw new Error("Result not found");

    const diff = scoringEngine.compare(
      attempt.test.matter,
      attempt.answerFinal ?? "",
    );

    return {
      attempt: {
        id: attempt.id,
        type: attempt.type,
        submittedAt: attempt.submittedAt,
        answerFinal: attempt.answerFinal,
      },
      test: {
        id: attempt.test.id,
        title: attempt.test.title,
        type: attempt.test.type,
        matter: attempt.test.matter,
        outline: attempt.test.outline,
        audioUrl: R2Service.getPublicUrl(attempt.test.audioKey),
      },
      result: {
        score: result.score,
        wpm: result.wpm,
        accuracy: result.accuracy,
        mistakes: result.mistakes ?? 0,
      },
      diff,
    };
  },
};
