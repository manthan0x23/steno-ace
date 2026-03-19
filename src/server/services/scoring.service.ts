import { diffArrays } from "diff";

export type DiffType = "correct" | "replace" | "insert" | "delete";

export type DiffToken = {
  original?: string;
  typed?: string;
  type: DiffType;
};

function tokenize(text: string): string[] {
  return text.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? [];
}

export default class ScoringEngine {
  compare(original: string, typed: string): DiffToken[] {
    const A = tokenize(original);
    const B = tokenize(typed);

    const parts = diffArrays(A, B);

    const raw: DiffToken[] = [];

    // Step 1: build raw diff
    for (const part of parts) {
      if (!part.added && !part.removed) {
        for (const tok of part.value as string[]) {
          raw.push({ original: tok, typed: tok, type: "correct" });
        }
      } else if (part.removed) {
        for (const tok of part.value as string[]) {
          raw.push({ original: tok, type: "delete" });
        }
      } else if (part.added) {
        for (const tok of part.value as string[]) {
          raw.push({ typed: tok, type: "insert" });
        }
      }
    }

    // Step 2: merge delete + insert → replace
    const final: DiffToken[] = [];

    let i = 0;
    while (i < raw.length) {
      const curr = raw[i];
      const next = raw[i + 1];

      if (curr?.type === "delete" && next?.type === "insert") {
        final.push({
          original: curr.original,
          typed: next.typed,
          type: "replace",
        });
        i += 2;
      } else {
        if (curr) final.push(curr);
        i++;
      }
    }

    return final;
  }

  evaluate(original: string, typed: string, durationSeconds: number) {
    const diff = this.compare(original, typed);

    let mistakes = 0;

    for (const d of diff) {
      if (d.type !== "correct") mistakes++;
    }

    const total = tokenize(original).length;
    const correct = Math.max(0, total - mistakes);

    const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
    const wpm = Math.max(0, Math.round(correct / (durationSeconds / 60)));

    return {
      mistakes,
      accuracy,
      wpm,
      score: correct,
      diff,
    };
  }
}

export const scoringEngine = new ScoringEngine();
