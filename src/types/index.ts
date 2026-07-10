// ============================================================
// Domain Types — Exam Platform
// ============================================================

export type ID = string;

export type CourseId = ID;

export type AppLanguage = "fa" | "en";

export interface QuestionI18n {
  prompt?: string;
  options?: string[];
  topic?: string;
  explanation?: string;
}

export interface Course {
  id: CourseId;
  name: string;
  slug: string;
  /** Tailwind-friendly accent key: "violet" | "blue" | "emerald" | ... */
  color: string;
  icon?: string;
  description?: string;
}

export type Difficulty = "easy" | "medium" | "hard";

export type QuestionType = "single" | "multiple" | "truefalse";

/** A single option within a question. */
export interface QuestionOption {
  id: string; // "a" | "b" | "c" | "d" | "1" ...
  text: string;
  /** Optional image URL for image-based options. */
  image?: string;
}

/**
 * A question. `correctAnswer` may be omitted for imported sets where the
 * answer key is provided separately (matching by question id).
 */
export interface Question {
  id: ID;
  /** Local id within an exam (1..N). */
  number: number;
  courseId: CourseId;
  year: number;
  type: QuestionType;
  prompt: string;
  /** Optional image shown above options. */
  image?: string;
  /** Optional code block. */
  code?: string;
  /** Optional math expression rendered with KaTeX. */
  math?: string;
  /** Optional long description / context. */
  context?: string;
  options: QuestionOption[];
  /** For single/truefalse: index into options. For multiple: array of indexes. */
  correctAnswer?: number | number[];
  /** Per-locale overrides for bilingual question content. */
  i18n?: Partial<Record<AppLanguage, QuestionI18n>>;
  /** Optional explanation shown on review. */
  explanation?: string;
  /** Optional hint. */
  hint?: string;
  difficulty: Difficulty;
  /** Estimated seconds to solve. */
  estimatedTime: number;
  topic: string;
  subtopic?: string;
  tags?: string[];
}

export interface ExamMeta {
  year: number;
  courseId: CourseId;
  title: string;
  /** Total duration in seconds. */
  duration: number;
  /** Number of questions. */
  questionCount: number;
  /** Negative marking penalty per wrong answer (0 disables). */
  negativeMarking?: number;
}

export interface AnswerKeyEntry {
  id: number;
  answer: number;
}

export interface AnswerKey {
  year: number;
  course: string;
  questions: AnswerKeyEntry[];
}

// ============================================================
// Runtime / Attempt state
// ============================================================

export type QuestionStatus =
  | "unseen"
  | "visited"
  | "answered"
  | "review"
  | "danger";

export interface QuestionState {
  status: QuestionStatus;
  /** Selected option index(es) — null when cleared / unanswered. */
  answer: number | number[] | null;
  /** Whether marked for review. */
  markedForReview: boolean;
  /** Whether bookmarked. */
  bookmarked: boolean;
  /** Seconds spent on this question across visits. */
  timeSpent: number;
  /** Personal note. */
  note?: string;
  visited: boolean;
}

export interface Attempt {
  id: ID;
  examKey: string; // `${courseId}:${year}`
  courseId: CourseId;
  year: number;
  mode: "exam" | "practice";
  startedAt: number;
  submittedAt?: number;
  duration: number; // configured duration seconds
  /** Per-question-id state. */
  states: Record<ID, QuestionState>;
  /** Snapshot of questions used (for practice / random sets). */
  questionIds: ID[];
  finished: boolean;
}

export interface AttemptResult {
  attemptId: ID;
  total: number;
  answered: number;
  correct: number;
  wrong: number;
  skipped: number;
  score: number; // raw correct - wrong*penalty
  percentage: number; // 0..100
  accuracy: number; // correct/answered *100
  completionRate: number; // answered/total *100
  timeUsed: number; // seconds
  avgTimePerQuestion: number;
  fastestId?: ID;
  slowestId?: ID;
  /** Topic -> { correct, wrong, skipped } */
  byTopic: Record<string, TopicStat>;
  /** Difficulty -> { correct, wrong, skipped } */
  byDifficulty: Record<Difficulty, TopicStat>;
}

export interface TopicStat {
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
}

// ============================================================
// Settings & Gamification
// ============================================================

export interface Settings {
  negativeMarking: boolean;
  negativeMarkingValue: number;
  timerEnabled: boolean;
  defaultExamDuration: number; // minutes
  darkMode: "light" | "dark" | "system";
  fontSize: "sm" | "md" | "lg";
  questionSize: "sm" | "md" | "lg";
  animations: boolean;
  language: AppLanguage;
  dailyGoal: number; // questions per day
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number; // 0..1
}

export interface DayActivity {
  date: string; // YYYY-MM-DD
  questions: number;
  correct: number;
  studySeconds: number;
}
