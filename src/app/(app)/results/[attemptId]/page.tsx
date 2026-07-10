"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useRouteParams } from "@/lib/use-route-params";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  Clock,
  Zap,
  TrendingUp,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Bookmark,
  Flag,
  ChevronLeft,
  Download,
  RotateCcw,
  Brain,
  Gauge,
  Award,
  AlertCircle,
} from "lucide-react";
import { useExamStore } from "@/store/exam-store";
import { getQuestionOutcome } from "@/lib/result";
import { Button, Card, CardContent, Badge, Progress, Separator, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { PageHeader, StatCard, EmptyState, SectionTitle, CodeBlock, Math as MathText } from "@/components/shared";
import {
  OutcomePie,
  TopicRadar,
  TopicBar,
  DifficultyChart,
} from "@/components/charts";
import { formatDuration } from "@/lib/utils";
import { toCSV } from "@/lib/importers";
import { toast } from "sonner";
import { useTranslation } from "@/i18n";

export default function ResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = useRouteParams(params);
  const router = useRouter();
  const { t } = useTranslation();

  const attempt = useExamStore((s) => s.attempts.find((a) => a.id === attemptId));
  const result = useExamStore((s) => s.results[attemptId]);
  const questionsMap = useExamStore((s) => s.questions);
  const course = useExamStore((s) =>
    attempt ? s.courses.find((c) => c.id === attempt.courseId) : undefined
  );

  if (!attempt || !result) {
    return (
      <EmptyState
        icon={Award}
        title={t("results.notFound")}
        description={t("results.notFoundDesc")}
        action={
          <Link href="/">
            <Button>{t("results.backHome")}</Button>
          </Link>
        }
      />
    );
  }

  const questions = attempt.questionIds
    .map((id) => questionsMap[id])
    .filter(Boolean);

  // topic breakdown for charts
  const topicRows = Object.entries(result.byTopic)
    .map(([topic, s]) => ({
      topic,
      correct: s.correct,
      wrong: s.wrong,
      skipped: s.skipped,
      total: s.total,
      pct: s.total ? (s.correct / s.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const radarData = topicRows.slice(0, 8).map((t) => ({
    topic: t.topic.length > 12 ? t.topic.slice(0, 11) + "…" : t.topic,
    score: Math.round(t.pct),
  }));

  const difficultyData = (["easy", "medium", "hard"] as const).map((d) => ({
    difficulty: t(`common.${d}`),
    correct: result.byDifficulty[d].correct,
    wrong: result.byDifficulty[d].wrong,
  }));

  const strongestTopics = [...topicRows]
    .filter((t) => t.total > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);
  const weakestTopics = [...topicRows]
    .filter((t) => t.total > 0)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);

  const exportCSV = () => {
    const rows: (string | number)[][] = [
      ["#", "Topic", "Difficulty", "Your Answer", "Correct", "Outcome", "Time(s)"],
    ];
    questions.forEach((q, i) => {
      const st = attempt.states[q.id];
      const outcome = getQuestionOutcome(q, attempt);
      const yourAns =
        st?.answer == null
          ? "—"
          : Array.isArray(st.answer)
            ? st.answer.map((a) => q.options[a]?.text).join("; ")
            : q.options[st.answer]?.text ?? "?";
      const correctAns = Array.isArray(q.correctAnswer)
        ? q.correctAnswer.map((a) => q.options[a]?.text).join("; ")
        : q.options[q.correctAnswer as number]?.text;
      rows.push([
        i + 1,
        q.topic,
        q.difficulty,
        String(yourAns),
        String(correctAns),
        outcome,
        st?.timeSpent ?? 0,
      ]);
    });
    const blob = new Blob([toCSV(rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `results-${attempt.courseId}-${attempt.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("results.csvExported"));
  };

  const fastestQ = result.fastestId ? questionsMap[result.fastestId] : null;
  const slowestQ = result.slowestId ? questionsMap[result.slowestId] : null;
  const passed = result.percentage >= 50;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={attempt.mode === "exam" ? `/exams/${attempt.courseId}/${attempt.year}` : "/practice"}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {attempt.mode === "exam" ? t("common.back") : t("nav.practice")}
      </Link>

      {/* hero score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Card className="relative overflow-hidden">
          <div
            className={`absolute inset-0 ${
              passed ? "bg-emerald-500/10" : "bg-amber-500/10"
            }`}
          />
          <div className="absolute -right-32 -top-32 size-96 rounded-full bg-primary/15 blur-3xl" />
          <CardContent className="relative grid items-center gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:p-8">
            <div className="relative flex size-40 items-center justify-center">
              <svg className="size-40 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="10"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={passed ? "#10b981" : "hsl(var(--primary))"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 52 * (1 - result.percentage / 100),
                  }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold gradient-text">
                  {result.percentage.toFixed(0)}%
                </span>
                <span className="text-[10px] uppercase text-muted-foreground">
                  {t("results.score")}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{course?.name ?? attempt.courseId}</Badge>
                <Badge variant="outline">{attempt.year}</Badge>
                <Badge variant={passed ? "success" : "warning"}>
                  {passed ? t("results.passed") : t("results.keepPracticing")}
                </Badge>
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {result.correct} / {result.total} {t("results.correct").toLowerCase()}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(attempt.startedAt).toLocaleString()} ·{" "}
                {formatDuration(result.timeUsed)} {t("results.timeUsed").toLowerCase()}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={exportCSV} variant="outline" size="sm" className="gap-1.5">
                  <Download className="size-4" /> {t("results.exportCsv")}
                </Button>
                <Link href={`/exams/${attempt.courseId}/${attempt.year}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <RotateCcw className="size-4" /> {t("results.retake")}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:grid-cols-1 md:gap-3">
              <ScorePill
                icon={CheckCircle2}
                label={t("results.correct")}
                value={result.correct}
                tone="emerald"
              />
              <ScorePill
                icon={XCircle}
                label={t("results.wrong")}
                value={result.wrong}
                tone="rose"
              />
              <ScorePill
                icon={MinusCircle}
                label={t("results.skipped")}
                value={result.skipped}
                tone="muted"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* key stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("results.accuracy")} value={`${result.accuracy.toFixed(0)}%`} icon={Target} hint={t("common.answered")} accent="emerald" delay={0.05} />
        <StatCard label={t("results.completion")} value={`${result.completionRate.toFixed(0)}%`} icon={Gauge} hint={t("common.answered")} accent="blue" delay={0.1} />
        <StatCard label={t("results.avgTime")} value={formatDuration(result.avgTimePerQuestion)} icon={Clock} hint={t("common.questions")} accent="amber" delay={0.15} />
        <StatCard label={t("results.score")} value={result.score.toFixed(1)} icon={Trophy} hint={t("common.total")} accent="primary" delay={0.2} />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">{t("results.overview")}</TabsTrigger>
          <TabsTrigger value="topics">{t("results.byTopic")}</TabsTrigger>
          <TabsTrigger value="review">{t("results.review")}</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <SectionTitle title={t("results.performance")} />
                <OutcomePie correct={result.correct} wrong={result.wrong} skipped={result.skipped} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <SectionTitle title={t("results.difficultyBreakdown")} />
                <DifficultyChart data={difficultyData} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {fastestQ && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <Zap className="size-4" />
                    <span className="text-xs font-semibold uppercase">{t("results.avgTime")}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium">{fastestQ.prompt}</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-500">
                    {formatDuration(attempt.states[fastestQ.id]?.timeSpent ?? 0)}
                  </p>
                </CardContent>
              </Card>
            )}
            {slowestQ && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 text-amber-500">
                    <Clock className="size-4" />
                    <span className="text-xs font-semibold uppercase">{t("results.avgTime")}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium">{slowestQ.prompt}</p>
                  <p className="mt-2 text-2xl font-bold text-amber-500">
                    {formatDuration(attempt.states[slowestQ.id]?.timeSpent ?? 0)}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {strongestTopics.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <SectionTitle title={t("results.topicMastery")} description={t("results.byTopic")} />
                <div className="grid gap-3 md:grid-cols-3">
                  {strongestTopics.map((t) => (
                    <div key={t.topic} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="text-sm font-medium">{t.topic}</div>
                      <div className="mt-1 text-lg font-bold text-emerald-500">{t.pct.toFixed(0)}%</div>
                      <Progress value={t.pct} className="mt-2 h-1" indicatorClassName="bg-emerald-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TOPICS */}
        <TabsContent value="topics" className="mt-6 space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <SectionTitle title={t("results.topicMastery")} description={t("results.byTopic")} />
                <TopicRadar data={radarData} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <SectionTitle title={t("analytics.toughestSet")} description={t("results.reviewAnswers")} />
                <div className="space-y-2">
                  {weakestTopics.map((t) => (
                    <div key={t.topic} className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{t.topic}</div>
                        <Progress value={t.pct} className="mt-1.5 h-1" indicatorClassName="bg-rose-500" />
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-rose-500">{t.pct.toFixed(0)}%</div>
                        <div className="text-[10px] text-muted-foreground">{t.correct}/{t.total}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-5">
              <SectionTitle title={t("results.byTopic")} description={`${t("results.correct")} / ${t("results.wrong")} / ${t("results.skipped")}`} />
              <TopicBar data={topicRows} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* REVIEW */}
        <TabsContent value="review" className="mt-6 space-y-3">
          <SectionTitle title={t("results.reviewAnswers")} />
          {questions.map((q, i) => {
            const outcome = getQuestionOutcome(q, attempt);
            const st = attempt.states[q.id];
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <OutcomeIcon outcome={outcome} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="font-mono">Q{i + 1}</Badge>
                          <Badge variant="outline">{q.topic}</Badge>
                          <Badge variant="outline" className="text-muted-foreground">{q.difficulty}</Badge>
                          {st?.bookmarked && (
                            <Badge variant="warning" className="gap-1"><Bookmark className="size-3 fill-amber-500" /></Badge>
                          )}
                          {st?.markedForReview && (
                            <Badge variant="warning" className="gap-1"><Flag className="size-3 fill-amber-500" /> {t("palette.review")}</Badge>
                          )}
                          <span className="ml-auto text-xs text-muted-foreground">
                            {formatDuration(st?.timeSpent ?? 0)}
                          </span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed">{q.prompt}</p>
                        {q.code && <div className="mt-2"><CodeBlock code={q.code} /></div>}
                        {q.math && <div className="mt-2"><MathText display>{q.math}</MathText></div>}

                        <div className="mt-3 grid gap-1.5">
                          {q.options.map((opt, oi) => {
                            const isCorrect = Array.isArray(q.correctAnswer)
                              ? q.correctAnswer.includes(oi)
                              : q.correctAnswer === oi;
                            const isYour = Array.isArray(st?.answer)
                              ? st?.answer.includes(oi)
                              : st?.answer === oi;
                            return (
                              <div
                                key={opt.id}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                                  isCorrect
                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                    : isYour
                                      ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                      : "border-border text-muted-foreground"
                                }`}
                              >
                                <span className="font-mono text-xs">
                                  {String.fromCharCode(65 + oi)}.
                                </span>
                                <span className="flex-1">{opt.text}</span>
                                {isCorrect && <CheckCircle2 className="size-4 text-emerald-500" />}
                                {isYour && !isCorrect && <XCircle className="size-4 text-rose-500" />}
                                {isYour && (
                                  <Badge variant="outline" className="text-[9px]">{t("results.you")}</Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
                            <span className="font-semibold text-primary">{t("results.explanation")} </span>
                            {q.explanation}
                          </div>
                        )}
                        {st?.note && (
                          <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
                            <span className="font-semibold">{t("results.yourNote")} </span>
                            {st.note}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScorePill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: "emerald" | "rose" | "muted";
}) {
  const tones = {
    emerald: "text-emerald-500 bg-emerald-500/10",
    rose: "text-rose-500 bg-rose-500/10",
    muted: "text-muted-foreground bg-muted",
  };
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/50 px-3 py-2">
      <div className={`flex size-8 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="size-4" />
      </div>
      <div>
        <div className="text-lg font-bold leading-none">{value}</div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function OutcomeIcon({
  outcome,
}: {
  outcome: "correct" | "wrong" | "skipped" | "ungraded";
}) {
  if (outcome === "correct")
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
        <CheckCircle2 className="size-5" />
      </div>
    );
  if (outcome === "wrong")
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-500">
        <XCircle className="size-5" />
      </div>
    );
  if (outcome === "ungraded")
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
        <AlertCircle className="size-5" />
      </div>
    );
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      <MinusCircle className="size-5" />
    </div>
  );
}
