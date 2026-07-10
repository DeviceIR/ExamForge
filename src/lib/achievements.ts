import type { Achievement, Attempt, AttemptResult } from "@/types";

export interface AchieveInput {
  attempts: Attempt[];
  results: Record<string, AttemptResult>;
  totalCorrect: number;
  totalQuestions: number;
  currentStreak: number;
  longestStreak: number;
  bookmarkCount: number;
}

export function computeAchievements(input: AchieveInput): Achievement[] {
  const {
    attempts,
    results,
    totalQuestions,
    longestStreak,
    bookmarkCount,
  } = input;

  const finished = attempts.filter((a) => a.finished);
  const percentages = finished.map((a) => results[a.id]?.percentage ?? 0);
  const bestScore = percentages.length ? Math.max(...percentages) : 0;
  const perfectCount = percentages.filter((p) => p >= 100).length;
  const accuracyValues = finished.map((a) => results[a.id]?.accuracy ?? 0);
  const bestAccuracy = accuracyValues.length ? Math.max(...accuracyValues) : 0;

  const make = (
    id: string,
    icon: string,
    unlocked: boolean,
    progress?: number
  ): Achievement => ({
    id,
    title: "",
    description: "",
    icon,
    unlocked,
    progress,
  });

  return [
    make("firstExam", "Sparkles", finished.length >= 1, clamp(finished.length, 0, 1)),
    make("perfect", "Star", perfectCount >= 1, clamp(bestScore / 100, 0, 1)),
    make("streak3", "Flame", longestStreak >= 3, clamp(longestStreak / 3, 0, 1)),
    make("streak7", "Flame", longestStreak >= 7, clamp(longestStreak / 7, 0, 1)),
    make("questions50", "Target", totalQuestions >= 50, clamp(totalQuestions / 50, 0, 1)),
    make("questions200", "Trophy", totalQuestions >= 200, clamp(totalQuestions / 200, 0, 1)),
    make("accuracy80", "Crosshair", bestAccuracy >= 80, clamp(bestAccuracy / 80, 0, 1)),
    make("exams5", "GraduationCap", finished.length >= 5, clamp(finished.length / 5, 0, 1)),
    make("exams10", "Zap", finished.length >= 10, clamp(finished.length / 10, 0, 1)),
    make("bookmark10", "Bookmark", bookmarkCount >= 10, clamp(bookmarkCount / 10, 0, 1)),
  ];
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
