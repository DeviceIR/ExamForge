import { describe, it, expect } from "vitest";
import { computeResult, getQuestionOutcome, isQuestionCorrect } from "@/lib/result";
import type { Attempt, Question, QuestionState } from "@/types";

function makeQuestion(
  number: number,
  correctAnswer: number | number[] | undefined,
  extra: Partial<Question> = {}
): Question {
  return {
    id: `c-1-${number}`,
    number,
    courseId: "c",
    year: 1,
    type: Array.isArray(correctAnswer) ? "multiple" : "single",
    prompt: `Q${number}`,
    options: [
      { id: "a", text: "1" },
      { id: "b", text: "2" },
      { id: "c", text: "3" },
      { id: "d", text: "4" },
    ],
    correctAnswer,
    difficulty: "medium",
    topic: "General",
    estimatedTime: 60,
    ...extra,
  };
}

function state(patch: Partial<QuestionState>): QuestionState {
  return {
    status: "answered",
    answer: null,
    markedForReview: false,
    bookmarked: false,
    timeSpent: 0,
    visited: true,
    ...patch,
  };
}

function makeAttempt(questions: Question[], answers: (number | number[] | null)[], times: number[] = []): {
  attempt: Attempt;
  byId: Record<string, Question>;
} {
  const byId: Record<string, Question> = {};
  const states: Record<string, QuestionState> = {};
  questions.forEach((q, i) => {
    byId[q.id] = q;
    states[q.id] = state({ answer: answers[i] ?? null, timeSpent: times[i] ?? 0 });
  });
  const attempt: Attempt = {
    id: "att-1",
    examKey: "c:1:exam:att-1",
    courseId: "c",
    year: 1,
    mode: "exam",
    startedAt: Date.now(),
    duration: 600,
    states,
    questionIds: questions.map((q) => q.id),
    finished: false,
  };
  return { attempt, byId };
}

describe("computeResult", () => {
  it("counts correct, wrong, and skipped", () => {
    const qs = [makeQuestion(1, 0), makeQuestion(2, 1), makeQuestion(3, 2)];
    const { attempt, byId } = makeAttempt(qs, [0, 3, null]);
    const r = computeResult(attempt, byId);
    expect(r.correct).toBe(1);
    expect(r.wrong).toBe(1);
    expect(r.skipped).toBe(1);
    expect(r.answered).toBe(2);
    expect(r.total).toBe(3);
  });

  it("computes percentage and accuracy", () => {
    const qs = [makeQuestion(1, 0), makeQuestion(2, 0), makeQuestion(3, 0), makeQuestion(4, 0)];
    const { attempt, byId } = makeAttempt(qs, [0, 0, 1, null]);
    const r = computeResult(attempt, byId);
    // 2 correct of 4 total -> 50%
    expect(r.percentage).toBe(50);
    // 2 correct of 3 answered -> 66.7%
    expect(r.accuracy).toBeCloseTo(66.7, 1);
    expect(r.completionRate).toBe(75);
  });

  it("applies negative marking to the score", () => {
    const qs = [makeQuestion(1, 0), makeQuestion(2, 0), makeQuestion(3, 0)];
    const { attempt, byId } = makeAttempt(qs, [0, 1, 1]);
    const r = computeResult(attempt, byId, 0.25);
    // 1 correct - 2 wrong * 0.25 = 0.5
    expect(r.score).toBe(0.5);
  });

  it("treats questions without a key as ungraded (not wrong)", () => {
    const qs = [makeQuestion(1, undefined)];
    const { attempt, byId } = makeAttempt(qs, [2]);
    const r = computeResult(attempt, byId);
    expect(r.correct).toBe(0);
    expect(r.wrong).toBe(0);
    expect(r.answered).toBe(1);
  });

  it("handles multiple-answer questions", () => {
    const qs = [makeQuestion(1, [0, 2])];
    const { attempt, byId } = makeAttempt(qs, [[2, 0]]);
    const r = computeResult(attempt, byId);
    expect(r.correct).toBe(1);
  });

  it("tracks fastest and slowest answered questions", () => {
    const qs = [makeQuestion(1, 0), makeQuestion(2, 0)];
    const { attempt, byId } = makeAttempt(qs, [0, 0], [10, 40]);
    const r = computeResult(attempt, byId);
    expect(r.fastestId).toBe(qs[0].id);
    expect(r.slowestId).toBe(qs[1].id);
  });
});

describe("getQuestionOutcome", () => {
  it("returns correct/wrong/skipped/ungraded", () => {
    const correct = makeQuestion(1, 0);
    const wrong = makeQuestion(2, 0);
    const ungraded = makeQuestion(3, undefined);
    const skipped = makeQuestion(4, 0);
    const { attempt } = makeAttempt([correct, wrong, ungraded, skipped], [0, 1, 0, null]);
    expect(getQuestionOutcome(correct, attempt)).toBe("correct");
    expect(getQuestionOutcome(wrong, attempt)).toBe("wrong");
    expect(getQuestionOutcome(ungraded, attempt)).toBe("ungraded");
    expect(getQuestionOutcome(skipped, attempt)).toBe("skipped");
  });
});

describe("isQuestionCorrect", () => {
  it("returns null when no key is present", () => {
    expect(isQuestionCorrect(makeQuestion(1, undefined), 1)).toBeNull();
  });
  it("returns false for null answers", () => {
    expect(isQuestionCorrect(makeQuestion(1, 0), null)).toBe(false);
  });
});
