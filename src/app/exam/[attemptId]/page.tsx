"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useRouteParams } from "@/lib/use-route-params";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  X,
  Flag,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useExamStore } from "@/store/exam-store";
import { Button, Card, CardContent, Badge, Progress, Separator } from "@/components/ui";
import { ExamTimer, TimeWarningToast } from "@/components/exam/timer";
import { QuestionPalette, PaletteSummary } from "@/components/exam/palette";
import { QuestionCard } from "@/components/exam/question-card";
import { NoteDialog } from "@/components/exam/note-dialog";
import { SubmitDialog } from "@/components/exam/submit-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation, formatLocalizedNumber } from "@/i18n";

export default function ExamRunnerPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = useRouteParams(params);
  const router = useRouter();
  const { t, language } = useTranslation();

  const attempt = useExamStore((s) => s.attempts.find((a) => a.id === attemptId));
  const questionsMap = useExamStore((s) => s.questions);
  const updateQuestionState = useExamStore((s) => s.updateQuestionState);
  const recordVisit = useExamStore((s) => s.recordVisit);
  const submitAttempt = useExamStore((s) => s.submitAttempt);

  const [current, setCurrent] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [submitOpen, setSubmitOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const examContainerRef = React.useRef<HTMLDivElement>(null);
  const questionStartRef = React.useRef<number>(Date.now());

  const questions = React.useMemo(
    () =>
      attempt
        ? attempt.questionIds.map((id) => questionsMap[id]).filter(Boolean)
        : [],
    [attempt, questionsMap]
  );

  const timerReady = remaining !== null;

  // Initialise timer
  React.useEffect(() => {
    if (!attempt) return;
    if (attempt.duration > 0) {
      const elapsed = Math.floor((Date.now() - attempt.startedAt) / 1000);
      setRemaining(Math.max(0, attempt.duration - elapsed));
    } else {
      setRemaining(0);
    }
  }, [attempt]);

  // record current question visit + reset per-question timer
  React.useEffect(() => {
    if (!attempt || !questions[current]) return;
    recordVisit(attempt.id, questions[current].id);
    questionStartRef.current = Date.now();
  }, [current, attempt, questions, recordVisit]);

  // ticker
  React.useEffect(() => {
    if (!timerReady || !attempt || attempt.duration === 0 || paused || submitting) {
      return;
    }
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r == null || r <= 1) {
          clearInterval(interval);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerReady, attempt, paused, submitting]);

  // accumulate time spent on the current question when leaving / submitting
  const flushTime = React.useCallback(() => {
    if (!attempt || !questions[current]) return;
    const spent = Math.floor((Date.now() - questionStartRef.current) / 1000);
    if (spent > 0) {
      const prev = attempt.states[questions[current].id]?.timeSpent ?? 0;
      updateQuestionState(attempt.id, questions[current].id, {
        timeSpent: prev + spent,
      });
    }
    questionStartRef.current = Date.now();
  }, [attempt, current, questions, updateQuestionState]);

  const goTo = React.useCallback(
    (i: number) => {
      if (i < 0 || i >= questions.length) return;
      flushTime();
      setCurrent(i);
    },
    [questions.length, flushTime]
  );

  // ---- submit ----
  const handleSubmit = React.useCallback(() => {
    if (!attempt) return;
    setSubmitting(true);
    flushTime();
    setTimeout(() => {
      const result = submitAttempt(attempt.id);
      setSubmitting(false);
      setSubmitOpen(false);
      if (result) {
        toast.success(t("examRunner.submitSuccess"), {
          description: t("examRunner.submitScore", {
            score: result.percentage.toFixed(0),
          }),
        });
        router.push(`/results/${attempt.id}`);
      }
    }, 400);
  }, [attempt, flushTime, submitAttempt, router, t]);

  // auto-submit on expire (only after timer is initialised)
  React.useEffect(() => {
    if (
      timerReady &&
      remaining === 0 &&
      attempt &&
      attempt.duration > 0 &&
      !submitting
    ) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, timerReady]);

  // ---- keyboard shortcuts ----
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      switch (e.key) {
        case "ArrowRight":
        case "j":
          e.preventDefault();
          goTo(Math.min(current + 1, questions.length - 1));
          break;
        case "ArrowLeft":
        case "k":
          e.preventDefault();
          goTo(Math.max(current - 1, 0));
          break;
        case "m":
        case "M":
          if (attempt && questions[current]) {
            const st = attempt.states[questions[current].id];
            updateQuestionState(attempt.id, questions[current].id, {
              markedForReview: !st?.markedForReview,
            });
          }
          break;
        case "b":
        case "B":
          if (attempt && questions[current]) {
            const st = attempt.states[questions[current].id];
            updateQuestionState(attempt.id, questions[current].id, {
              bookmarked: !st?.bookmarked,
            });
          }
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "Escape":
          if (submitOpen) setSubmitOpen(false);
          if (noteOpen) setNoteOpen(false);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, goTo, attempt, questions, updateQuestionState, submitOpen, noteOpen]);

  // fullscreen tracking
  React.useEffect(() => {
    const onFs = () =>
      setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      examContainerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  // ---- guard ----
  if (!attempt || questions.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertCircle className="size-12 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold">{t("examRunner.notFound")}</h2>
        <p className="text-sm text-muted-foreground">{t("examRunner.notFoundDesc")}</p>
        <Link href="/">
          <Button>{t("examRunner.backDashboard")}</Button>
        </Link>
      </div>
    );
  }

  if (attempt.finished) {
    router.replace(`/results/${attempt.id}`);
    return null;
  }

  const q = questions[current];
  const state = attempt.states[q.id];
  const total = questions.length;

  // counters
  let answeredCount = 0;
  let reviewCount = 0;
  for (const qq of questions) {
    const st = attempt.states[qq.id];
    if (st?.answer != null) answeredCount++;
    if (st?.markedForReview) reviewCount++;
  }
  const progressPct = (answeredCount / total) * 100;

  return (
    <div ref={examContainerRef} className="flex min-h-screen flex-col bg-background">
      <TimeWarningToast
        message={warning}
        key={warning ?? "none"}
      />

      {/* top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur-xl">
        <Link href={`/exams/${attempt.courseId}/${attempt.year}`}>
          <Button variant="ghost" size="icon-sm" title="Exit">
            <X className="size-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {attempt.courseId.toUpperCase()} · {attempt.year}
          </Badge>
          <Badge variant={attempt.mode === "exam" ? "default" : "secondary"}>
            {attempt.mode}
          </Badge>
        </div>

        <div className="mx-auto hidden w-full max-w-sm md:block">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{formatLocalizedNumber(answeredCount, language)} {t("common.answered")}</span>
            <span>{formatLocalizedNumber(total - answeredCount, language)} {t("common.remaining")}</span>
          </div>
          <Progress
            value={progressPct}
            className="mt-1 h-1.5"
            indicatorClassName="bg-gradient-to-r from-primary to-emerald-500"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {attempt.duration > 0 && timerReady && (
            <ExamTimer
              remaining={remaining ?? attempt.duration}
              total={attempt.duration}
              ready
              paused={paused}
              onTogglePause={() => setPaused((p) => !p)}
              onWarning={(label) => {
                setWarning(`${label} left`);
                toast.warning(t("examRunner.timeWarning", { label }), {
                  description: t("examRunner.timeWarningDesc"),
                });
                setTimeout(() => setWarning(null), 3000);
              }}
              onExpire={() => {
                if (!submitting) handleSubmit();
              }}
            />
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleFullscreen}
            title="Fullscreen (F)"
          >
            {fullscreen ? (
              <Minimize className="size-4" />
            ) : (
              <Maximize className="size-4" />
            )}
          </Button>
          <Button
            variant="gradient"
            size="sm"
            className="gap-1.5"
            onClick={() => setSubmitOpen(true)}
          >
            <CheckCircle2 className="size-4" />
            {t("examRunner.submit")}
          </Button>
        </div>
      </header>

      {/* main split */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 p-4 lg:grid-cols-[1fr_320px] lg:p-6">
        {/* question column */}
        <div className="flex flex-col">
          <Card className="flex-1">
            <CardContent className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                <QuestionCard
                  key={q.id}
                  question={q}
                  state={state}
                  index={current}
                  total={total}
                  practice={attempt.mode === "practice"}
                  onAnswer={(ans) =>
                    updateQuestionState(attempt.id, q.id, {
                      answer: ans,
                      status: ans == null ? "visited" : "answered",
                    })
                  }
                  onToggleBookmark={() =>
                    updateQuestionState(attempt.id, q.id, {
                      bookmarked: !state.bookmarked,
                    })
                  }
                  onToggleReview={() =>
                    updateQuestionState(attempt.id, q.id, {
                      markedForReview: !state.markedForReview,
                    })
                  }
                  onToggleNote={() => setNoteOpen(true)}
                />
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* nav buttons */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
            >
              <ChevronLeft className="size-4" /> {t("common.previous")}
            </Button>
            <div className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
              <kbd className="rounded border bg-muted px-1.5 py-0.5">←</kbd>
              <kbd className="rounded border bg-muted px-1.5 py-0.5">→</kbd>
              navigate
              <span className="mx-1">·</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5">M</kbd>
              mark
              <span className="mx-1">·</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5">B</kbd>
              bookmark
            </div>
            {current === total - 1 ? (
              <Button
                variant="gradient"
                className="gap-1.5"
                onClick={() => setSubmitOpen(true)}
              >
                <CheckCircle2 className="size-4" /> {t("examRunner.submitExam")}
              </Button>
            ) : (
              <Button className="gap-1.5" onClick={() => goTo(current + 1)}>
                {t("common.next")} <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* sidebar */}
        <aside className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-4">
              <PaletteSummary attempt={attempt} questions={questions} />
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="p-4">
              <QuestionPalette
                attempt={attempt}
                questions={questions}
                current={current}
                onJump={goTo}
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* dialogs */}
      <NoteDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        value={state.note ?? ""}
        onSave={(note) => {
          updateQuestionState(attempt.id, q.id, { note });
          setNoteOpen(false);
          toast.success(t("examRunner.noteSaved"));
        }}
        questionLabel={`Q${current + 1}`}
      />
      <SubmitDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        total={total}
        answered={answeredCount}
        review={reviewCount}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
