"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useRouteParams } from "@/lib/use-route-params";
import {
  Clock,
  ListChecks,
  Trophy,
  Play,
  ChevronLeft,
  Award,
  Calendar,
  TrendingUp,
  Target,
  Pencil,
} from "lucide-react";
import { useExamStore } from "@/store/exam-store";
import type { AttemptResult } from "@/types";
import { Button, Card, CardContent, Badge, Separator } from "@/components/ui";
import { EmptyState } from "@/components/shared";
import { formatDuration } from "@/lib/utils";
import { useTranslation, formatLocalizedNumber } from "@/i18n";

export default function ExamStartPage({
  params,
}: {
  params: Promise<{ courseId: string; year: string }>;
}) {
  const { courseId, year } = useRouteParams(params);
  const yearNum = Number(year);
  const router = useRouter();
  const { t, language, isRtl } = useTranslation();

  const course = useExamStore((s) => s.courses.find((c) => c.id === courseId));
  const questionsMap = useExamStore((s) => s.questions);
  const allAttempts = useExamStore((s) => s.attempts);
  const results = useExamStore((s) => s.results);
  const settings = useExamStore((s) => s.settings);
  const startAttempt = useExamStore((s) => s.startAttempt);

  const questions = React.useMemo(
    () =>
      Object.values(questionsMap)
        .filter((q) => q.courseId === courseId && q.year === yearNum)
        .sort((a, b) => a.number - b.number),
    [questionsMap, courseId, yearNum]
  );

  const attempts = React.useMemo(
    () => allAttempts.filter((a) => a.courseId === courseId && a.year === yearNum && a.finished),
    [allAttempts, courseId, yearNum]
  );

  const best = React.useMemo((): AttemptResult | undefined => {
    const list = allAttempts
      .filter((a) => a.courseId === courseId && a.year === yearNum && a.finished && a.mode === "exam")
      .map((a) => results[a.id])
      .filter(Boolean) as AttemptResult[];
    if (!list.length) return undefined;
    return list.reduce((top, r) => (r.percentage > top.percentage ? r : top));
  }, [allAttempts, results, courseId, yearNum]);

  if (!course) {
    return (
      <EmptyState
        icon={Target}
        title={t("exams.startPage.courseNotFound")}
        description={t("exams.startPage.courseNotFoundDesc")}
        action={
          <Link href="/exams">
            <Button>{t("exams.startPage.backToLibrary")}</Button>
          </Link>
        }
      />
    );
  }

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title={t("exams.startPage.noQuestions")}
        description={t("exams.startPage.noQuestionsDesc", {
          course: course.name,
          set: formatLocalizedNumber(yearNum, language),
        })}
        action={
          <Link href="/import">
            <Button>{t("exams.startPage.goLibrary")}</Button>
          </Link>
        }
      />
    );
  }

  const durationMin = settings.defaultExamDuration;
  const handleStart = () => {
    const id = startAttempt(courseId, yearNum, "exam");
    router.push(`/exam/${id}`);
  };

  const avgPct = attempts.length
    ? attempts.reduce((s, a) => s + (results[a.id]?.percentage ?? 0), 0) / attempts.length
    : 0;

  const BackIcon = ChevronLeft;

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/exams" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <BackIcon className={isRtl ? "size-4 rotate-180" : "size-4"} />
        {t("exams.startPage.backToLibrary")}
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="relative overflow-hidden border-primary/20">
          <CardContent className="relative grid gap-8 p-6 md:grid-cols-[1.5fr_1fr] md:p-8">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{course.name}</Badge>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="size-3" />
                  {t("common.examSet")} {formatLocalizedNumber(yearNum, language)}
                </Badge>
              </div>
              <h1 className="mt-3 text-3xl font-bold">
                {t("exams.startPage.title", {
                  course: course.name,
                  set: formatLocalizedNumber(yearNum, language),
                })}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{t("exams.startPage.desc")}</p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <StatBox icon={ListChecks} value={questions.length} label={t("exams.startPage.questions")} language={language} />
                <StatBox icon={Clock} value={durationMin} label={t("exams.startPage.duration")} suffix={` ${t("common.minutes")}`} language={language} />
                <StatBox icon={TrendingUp} value={attempts.length} label={t("exams.startPage.attempts")} language={language} />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button size="lg" variant="gradient" className="gap-2" onClick={handleStart}>
                  <Play className="size-4" /> {t("exams.startPage.startExam")}
                </Button>
                <Link href={`/practice?course=${courseId}&year=${yearNum}`}>
                  <Button size="lg" variant="outline" className="gap-2">
                    <Target className="size-4" /> {t("exams.startPage.practiceMode")}
                  </Button>
                </Link>
                <Link href={`/import?tab=manage&course=${courseId}&set=${yearNum}`}>
                  <Button size="lg" variant="ghost" className="gap-2">
                    <Pencil className="size-4" /> {t("exams.startPage.editSet")}
                  </Button>
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{t("exams.startPage.keyboardTip")}</p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl bg-card/60 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Trophy className="size-4 text-amber-500" />
                  {t("exams.startPage.bestResult")}
                </span>
                {best && <Badge variant="success">{t("exams.startPage.personalBest")}</Badge>}
              </div>
              {best ? (
                <>
                  <div className="text-5xl font-bold gradient-text">{best.percentage.toFixed(0)}%</div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <MiniStat label={t("exams.startPage.correct")} value={best.correct} color="emerald" language={language} />
                    <MiniStat label={t("exams.startPage.wrong")} value={best.wrong} color="rose" language={language} />
                    <MiniStat label={t("exams.startPage.skipped")} value={best.skipped} language={language} />
                  </div>
                  <Separator />
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <Row label={t("exams.startPage.accuracy")} value={`${best.accuracy.toFixed(0)}%`} />
                    <Row label={t("exams.startPage.avgTimePerQ")} value={formatDuration(best.avgTimePerQuestion)} />
                    <Row label={t("exams.startPage.allAttemptsAvg")} value={`${avgPct.toFixed(0)}%`} />
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                  <Award className="size-10 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("exams.startPage.noAttemptsYet")}
                    <br />
                    {t("exams.startPage.beFirst")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {attempts.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("exams.startPage.previousAttempts")}
          </h2>
          <div className="space-y-2">
            {attempts.map((a) => {
              const r = results[a.id];
              if (!r) return null;
              return (
                <Link key={a.id} href={`/results/${a.id}`}>
                  <Card className="card-hover">
                    <CardContent className="flex items-center gap-4 p-4">
                      <Award className="size-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {new Date(a.startedAt).toLocaleString(language === "fa" ? "fa-IR" : undefined)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatLocalizedNumber(r.correct, language)} {t("results.correct").toLowerCase()}
                        </p>
                      </div>
                      <div className="text-xl font-bold">{r.percentage.toFixed(0)}%</div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ icon: Icon, value, label, suffix = "", language }: any) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 p-4">
      <Icon className="size-5 text-primary" />
      <div className="mt-2 text-2xl font-bold">{formatLocalizedNumber(value, language)}{suffix}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function MiniStat({ label, value, color, language }: any) {
  const bg = color === "emerald" ? "bg-emerald-500/10" : color === "rose" ? "bg-rose-500/10" : "bg-muted";
  const text = color === "emerald" ? "text-emerald-500" : color === "rose" ? "text-rose-500" : "";
  return (
    <div className={`rounded-lg p-2 ${bg}`}>
      <div className={`font-bold ${text}`}>{formatLocalizedNumber(value, language)}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
