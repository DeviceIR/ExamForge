import type {
  Attempt,
  AttemptResult,
  Difficulty,
  Question,
  TopicStat,
} from "@/types";

const EMPTY_STAT: TopicStat = { total: 0, correct: 0, wrong: 0, skipped: 0 };

function stat(acc: TopicStat, fn: (s: TopicStat) => void) {
  const c = { ...acc };
  fn(c);
  return c;
}

function isCorrect(q: Question, answer: number | number[] | null): boolean | null {
  if (answer == null) return false;
  if (q.correctAnswer == null) return null; // no key — not gradable
  if (Array.isArray(q.correctAnswer)) {
    if (!Array.isArray(answer)) return false;
    if (answer.length !== q.correctAnswer.length) return false;
    const a = [...answer].sort();
    const c = [...q.correctAnswer].sort();
    return a.every((v, i) => v === c[i]);
  }
  return !Array.isArray(answer) && answer === q.correctAnswer;
}

/**
 * Compute a full result snapshot from an attempt + the questions it used.
 */
export function computeResult(
  attempt: Attempt,
  questionsById: Record<string, Question>,
  negativeMarkingValue = 0
): AttemptResult {
  const byTopic: Record<string, TopicStat> = {};
  const byDifficulty: Record<Difficulty, TopicStat> = {
    easy: { ...EMPTY_STAT },
    medium: { ...EMPTY_STAT },
    hard: { ...EMPTY_STAT },
  };

  let answered = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let totalTime = 0;
  let fastestId: string | undefined;
  let slowestId: string | undefined;
  let fastestTime = Infinity;
  let slowestTime = -1;

  for (const qid of attempt.questionIds) {
    const q = questionsById[qid];
    if (!q) continue;

    const st = attempt.states[qid];
    const ans = st?.answer ?? null;
    const isAns = ans != null;

    const topic = q.topic || "General";
    byTopic[topic] = byTopic[topic] ?? { ...EMPTY_STAT };
    byTopic[topic].total++;

    byDifficulty[q.difficulty].total++;

    const time = st?.timeSpent ?? 0;
    totalTime += time;

    if (!isAns) {
      skipped++;
      byTopic[topic].skipped++;
      byDifficulty[q.difficulty].skipped++;
    } else {
      answered++;
      const ok = isCorrect(q, ans);
      if (ok === null) {
        // Question has no answer key — answered but not scored
      } else if (ok) {
        correct++;
        byTopic[topic].correct++;
        byDifficulty[q.difficulty].correct++;
      } else {
        wrong++;
        byTopic[topic].wrong++;
        byDifficulty[q.difficulty].wrong++;
      }
      if (time > 0) {
        if (time < fastestTime) {
          fastestTime = time;
          fastestId = qid;
        }
        if (time > slowestTime) {
          slowestTime = time;
          slowestId = qid;
        }
      }
    }
  }

  const total = attempt.questionIds.length;
  const score = correct - wrong * negativeMarkingValue;
  const percentage = total > 0 ? (correct / total) * 100 : 0;
  const accuracy = answered > 0 ? (correct / answered) * 100 : 0;
  const completionRate = total > 0 ? (answered / total) * 100 : 0;

  return {
    attemptId: attempt.id,
    total,
    answered,
    correct,
    wrong,
    skipped,
    score: Number(score.toFixed(2)),
    percentage: Number(percentage.toFixed(1)),
    accuracy: Number(accuracy.toFixed(1)),
    completionRate: Number(completionRate.toFixed(1)),
    timeUsed: totalTime,
    avgTimePerQuestion: total > 0 ? Math.round(totalTime / total) : 0,
    fastestId,
    slowestId,
    byTopic,
    byDifficulty,
  };
}

export function getQuestionOutcome(
  q: Question,
  attempt: Attempt
): "correct" | "wrong" | "skipped" | "ungraded" {
  const st = attempt.states[q.id];
  const ans = st?.answer ?? null;
  if (ans == null) return "skipped";
  const ok = isCorrect(q, ans);
  if (ok === null) return "ungraded";
  return ok ? "correct" : "wrong";
}

export function isQuestionCorrect(
  q: Question,
  answer: number | number[] | null
): boolean | null {
  return isCorrect(q, answer);
}
