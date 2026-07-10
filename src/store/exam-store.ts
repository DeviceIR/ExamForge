"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Attempt,
  AttemptResult,
  Course,
  CourseId,
  DayActivity,
  Question,
  QuestionState,
  Settings,
} from "@/types";
import { computeResult } from "@/lib/result";
import { uid } from "@/lib/utils";

const STORAGE_KEY = "exam-platform:v2";

// -------------------- store shape --------------------

interface ExamState {
  hydrated: boolean;
  courses: Course[];
  /** Map of questionId -> question. */
  questions: Record<string, Question>;
  attempts: Attempt[];
  results: Record<string, AttemptResult>;
  /** Bookmarked question ids (separate from per-attempt bookmarks). */
  bookmarks: string[];
  /** Wrong-history: questionId -> times answered wrong. */
  wrongCounts: Record<string, number>;
  /** Topic-level weak/strong tracking across all attempts. */
  topicStats: Record<string, { correct: number; wrong: number; skipped: number }>;
  settings: Settings;
  activities: Record<string, DayActivity>;

  // ---- actions ----
  setHydrated: () => void;
  addCourse: (c: Course) => void;
  removeCourse: (courseId: CourseId) => void;
  removeExamSet: (courseId: CourseId, year: number) => void;
  upsertQuestions: (qs: Question[]) => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  removeQuestion: (id: string) => void;
  getExamQuestions: (courseId: CourseId, year: number) => Question[];
  hasExam: (courseId: CourseId, year: number) => boolean;
  yearsForCourse: (courseId: CourseId) => number[];

  startAttempt: (
    courseId: CourseId,
    year: number,
    mode: "exam" | "practice",
    questionIds?: string[],
    duration?: number
  ) => string;
  getAttempt: (id: string) => Attempt | undefined;
  updateQuestionState: (attemptId: string, qid: string, patch: Partial<QuestionState>) => void;
  recordVisit: (attemptId: string, qid: string) => void;
  submitAttempt: (attemptId: string) => AttemptResult | undefined;
  deleteAttempt: (attemptId: string) => void;

  toggleBookmark: (qid: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;

  bestResultFor: (courseId: CourseId, year: number) => AttemptResult | undefined;
  attemptsForExam: (courseId: CourseId, year: number) => Attempt[];
}

const defaultSettings: Settings = {
  negativeMarking: false,
  negativeMarkingValue: 0.25,
  timerEnabled: true,
  defaultExamDuration: 90,
  darkMode: "system",
  fontSize: "md",
  questionSize: "md",
  animations: true,
  language: "fa",
  dailyGoal: 20,
};

function emptyState(qs?: Partial<QuestionState>): QuestionState {
  return {
    status: "unseen",
    answer: null,
    markedForReview: false,
    bookmarked: false,
    timeSpent: 0,
    visited: false,
    ...qs,
  };
}

function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function bumpActivity(
  activities: Record<string, DayActivity>,
  day: string,
  patch: Partial<DayActivity>
): Record<string, DayActivity> {
  const prev = activities[day] ?? {
    date: day,
    questions: 0,
    correct: 0,
    studySeconds: 0,
  };
  return {
    ...activities,
    [day]: {
      ...prev,
      questions: prev.questions + (patch.questions ?? 0),
      correct: prev.correct + (patch.correct ?? 0),
      studySeconds: prev.studySeconds + (patch.studySeconds ?? 0),
    },
  };
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      courses: [],
      questions: {},
      attempts: [],
      results: {},
      bookmarks: [],
      wrongCounts: {},
      topicStats: {},
      settings: defaultSettings,
      activities: {},

      setHydrated: () => set({ hydrated: true }),

      addCourse: (c) =>
        set((s) => {
          if (s.courses.some((x) => x.id === c.id)) return s;
          return { courses: [...s.courses, c] };
        }),

      removeCourse: (courseId) =>
        set((s) => {
          const questions = { ...s.questions };
          for (const id of Object.keys(questions)) {
            if (questions[id]?.courseId === courseId) delete questions[id];
          }
          const qids = new Set(Object.keys(questions));
          return {
            courses: s.courses.filter((c) => c.id !== courseId),
            questions,
            bookmarks: s.bookmarks.filter((id) => qids.has(id)),
          };
        }),

      removeExamSet: (courseId, year) =>
        set((s) => {
          const questions = { ...s.questions };
          for (const id of Object.keys(questions)) {
            const q = questions[id];
            if (q?.courseId === courseId && q.year === year) delete questions[id];
          }
          const qids = new Set(Object.keys(questions));
          return {
            questions,
            bookmarks: s.bookmarks.filter((id) => qids.has(id)),
          };
        }),

      upsertQuestions: (qs) =>
        set((s) => {
          const questions = { ...s.questions };
          for (const q of qs) questions[q.id] = { ...questions[q.id], ...q };
          return { questions };
        }),

      updateQuestion: (id, patch) =>
        set((s) => {
          const existing = s.questions[id];
          if (!existing) return s;
          return {
            questions: { ...s.questions, [id]: { ...existing, ...patch } },
          };
        }),

      removeQuestion: (id) =>
        set((s) => {
          if (!s.questions[id]) return s;
          const questions = { ...s.questions };
          delete questions[id];
          return {
            questions,
            bookmarks: s.bookmarks.filter((b) => b !== id),
          };
        }),

      getExamQuestions: (courseId, year) =>
        Object.values(get().questions)
          .filter((q) => q.courseId === courseId && q.year === year)
          .sort((a, b) => a.number - b.number),

      hasExam: (courseId, year) =>
        Object.values(get().questions).some(
          (q) => q.courseId === courseId && q.year === year
        ),

      yearsForCourse: (courseId) => {
        const years = new Set<number>();
        for (const q of Object.values(get().questions)) {
          if (q.courseId === courseId) years.add(q.year);
        }
        return Array.from(years).sort((a, b) => b - a);
      },

      startAttempt: (courseId, year, mode, questionIds, duration) => {
        const id = uid("att");
        let qids = questionIds;
        if (!qids) {
          qids = get()
            .getExamQuestions(courseId, year)
            .map((q) => q.id);
        }
        const states: Record<string, QuestionState> = {};
        for (const qid of qids) states[qid] = emptyState();

        const attempt: Attempt = {
          id,
          examKey: `${courseId}:${year}:${mode}:${id}`,
          courseId,
          year,
          mode,
          startedAt: Date.now(),
          duration:
            duration ??
            (mode === "exam" ? get().settings.defaultExamDuration * 60 : 0),
          states,
          questionIds: qids,
          finished: false,
        };
        set((s) => ({ attempts: [attempt, ...s.attempts] }));
        return id;
      },

      getAttempt: (id) => get().attempts.find((a) => a.id === id),

      updateQuestionState: (attemptId, qid, patch) =>
        set((s) => ({
          attempts: s.attempts.map((a) =>
            a.id === attemptId
              ? {
                  ...a,
                  states: {
                    ...a.states,
                    [qid]: { ...a.states[qid], ...patch },
                  },
                }
              : a
          ),
        })),

      recordVisit: (attemptId, qid) =>
        set((s) => {
          const a = s.attempts.find((x) => x.id === attemptId);
          if (!a) return s;
          const cur = a.states[qid];
          if (!cur || cur.visited) return s;
          return {
            attempts: s.attempts.map((x) =>
              x.id === attemptId
                ? {
                    ...x,
                    states: {
                      ...x.states,
                      [qid]: { ...cur, visited: true, status: "visited" },
                    },
                  }
                : x
            ),
          };
        }),

      submitAttempt: (attemptId) => {
        const state = get();
        const attempt = state.attempts.find((a) => a.id === attemptId);
        if (!attempt) return undefined;
        if (attempt.finished) return state.results[attemptId];

        const penalty = state.settings.negativeMarking
          ? state.settings.negativeMarkingValue
          : 0;
        const result = computeResult(attempt, state.questions, penalty);

        const finished: Attempt = {
          ...attempt,
          finished: true,
          submittedAt: Date.now(),
        };

        // update aggregates
        const wrongCounts = { ...state.wrongCounts };
        const topicStats = { ...state.topicStats };
        let correctToday = 0;
        for (const qid of attempt.questionIds) {
          const q = state.questions[qid];
          if (!q) continue;
          const ts = result.byTopic[q.topic] ?? {
            correct: 0,
            wrong: 0,
            skipped: 0,
          };
          const topicPrev = topicStats[q.topic] ?? {
            correct: 0,
            wrong: 0,
            skipped: 0,
          };
          topicStats[q.topic] = {
            correct: topicPrev.correct + ts.correct,
            wrong: topicPrev.wrong + ts.wrong,
            skipped: topicPrev.skipped + ts.skipped,
          };

          const st = attempt.states[qid];
          if (st?.answer == null) continue;
          if (q.correctAnswer == null) continue;
          const ok =
            (Array.isArray(q.correctAnswer)
              ? false
              : st.answer === q.correctAnswer) ||
            (Array.isArray(q.correctAnswer) && Array.isArray(st.answer)
              ? JSON.stringify([...q.correctAnswer].sort()) ===
                JSON.stringify([...st.answer].sort())
              : false);
          if (ok) {
            correctToday++;
          } else {
            wrongCounts[qid] = (wrongCounts[qid] ?? 0) + 1;
          }
        }

        const day = todayStr(new Date(attempt.startedAt));
        const activities = bumpActivity(state.activities, day, {
          questions: attempt.questionIds.length,
          correct: correctToday,
          studySeconds: result.timeUsed,
        });

        set({
          attempts: state.attempts.map((a) => (a.id === attemptId ? finished : a)),
          results: { ...state.results, [attemptId]: result },
          wrongCounts,
          topicStats,
          activities,
        });
        return result;
      },

      deleteAttempt: (attemptId) =>
        set((s) => {
          const { [attemptId]: _r, ...results } = s.results;
          return {
            attempts: s.attempts.filter((a) => a.id !== attemptId),
            results,
          };
        }),

      toggleBookmark: (qid) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(qid)
            ? s.bookmarks.filter((x) => x !== qid)
            : [...s.bookmarks, qid],
        })),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      resetAll: () =>
        set({
          courses: [],
          questions: {},
          attempts: [],
          results: {},
          bookmarks: [],
          wrongCounts: {},
          topicStats: {},
          activities: {},
          settings: defaultSettings,
        }),

      bestResultFor: (courseId, year) => {
        const list = get()
          .attempts.filter(
            (a) =>
              a.courseId === courseId &&
              a.year === year &&
              a.finished &&
              a.mode === "exam"
          )
          .map((a) => get().results[a.id])
          .filter(Boolean) as AttemptResult[];
        if (!list.length) return undefined;
        return list.reduce((best, r) =>
          r.percentage > best.percentage ? r : best
        );
      },

      attemptsForExam: (courseId, year) =>
        get().attempts.filter(
          (a) => a.courseId === courseId && a.year === year
        ),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        courses: s.courses,
        questions: s.questions,
        attempts: s.attempts,
        results: s.results,
        bookmarks: s.bookmarks,
        wrongCounts: s.wrongCounts,
        topicStats: s.topicStats,
        settings: s.settings,
        activities: s.activities,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
