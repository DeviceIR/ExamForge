"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Flame,
  Target,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  Zap,
  Star,
  Crown,
  Crosshair,
  GraduationCap,
  Sparkles,
  Bookmark,
} from "lucide-react";
import { useExamStore } from "@/store/exam-store";
import { PageHeader, StatCard, EmptyState, SectionTitle } from "@/components/shared";
import { Card, CardContent, Badge, Progress } from "@/components/ui";
import { ActivityHeatmap } from "@/components/charts";
import { computeAchievements } from "@/lib/achievements";
import { formatDuration, todayKey } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui";
import { useTranslation } from "@/i18n";

const ACHIEVE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Target,
  Trophy,
  Star,
  Flame,
  Calendar,
  Crosshair,
  GraduationCap,
  Zap,
  Crown,
  Bookmark,
};

export default function StatisticsPage() {
  const { t } = useTranslation();
  const attempts = useExamStore((s) => s.attempts);
  const results = useExamStore((s) => s.results);
  const activities = useExamStore((s) => s.activities);
  const bookmarks = useExamStore((s) => s.bookmarks);

  const finished = attempts.filter((a) => a.finished && results[a.id]);
  const totalQuestions = finished.reduce((s, a) => s + results[a.id]!.total, 0);
  const totalCorrect = finished.reduce((s, a) => s + results[a.id]!.correct, 0);
  const totalStudy = finished.reduce((s, a) => s + results[a.id]!.timeUsed, 0);
  const percentages = finished.map((a) => results[a.id]!.percentage);
  const avg = percentages.length
    ? percentages.reduce((a, b) => a + b, 0) / percentages.length
    : 0;
  const best = percentages.length ? Math.max(...percentages) : 0;
  const worst = percentages.length ? Math.min(...percentages) : 0;

  // streak
  const streak = React.useMemo(() => computeStreak(activities), [activities]);

  // heatmap (last ~119 days, GitHub-style)
  const heatmap = React.useMemo(() => buildHeatmap(activities), [activities]);

  // weekly/monthly activity counts
  const last7 = React.useMemo(() => sumRange(activities, 7), [activities]);
  const last30 = React.useMemo(() => sumRange(activities, 30), [activities]);

  const achievements = React.useMemo(
    () =>
      computeAchievements({
        attempts,
        results,
        totalCorrect,
        totalQuestions,
        currentStreak: streak.current,
        longestStreak: streak.longest,
        bookmarkCount: bookmarks.length,
      }),
    [attempts, results, totalCorrect, totalQuestions, streak, bookmarks.length]
  );
  const unlocked = achievements.filter((a) => a.unlocked).length;

  if (finished.length === 0) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader title={t("statistics.title")} description={t("statistics.description")} icon={Trophy} />
        <EmptyState
          icon={Trophy}
          title={t("statistics.empty")}
          description={t("statistics.empty")}
          action={<Link href="/exams"><Button>{t("common.takeExam")}</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t("statistics.title")}
        description={t("statistics.description")}
        icon={Trophy}
      />

      {/* top stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("statistics.questionsSolved")} value={totalQuestions} icon={Target} hint={`${totalCorrect} ${t("results.correct").toLowerCase()}`} accent="primary" delay={0.05} />
        <StatCard label={t("statistics.hoursStudied")} value={formatDuration(totalStudy)} icon={Clock} accent="amber" delay={0.1} />
        <StatCard label={t("dashboard.currentStreak")} value={`${streak.current}d`} icon={Flame} hint={t("dashboard.dayStreak", { count: streak.longest })} accent="rose" delay={0.15} />
        <StatCard label={t("statistics.achievements")} value={`${unlocked}/${achievements.length}`} icon={Award} accent="violet" delay={0.2} />
      </div>

      {/* score band */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="mb-6">
          <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
            <ScoreBand label={t("dashboard.bestScore")} value={best} icon={Trophy} tone="emerald" />
            <ScoreBand label={t("dashboard.avgScore")} value={avg} icon={TrendingUp} tone="primary" />
            <ScoreBand label={t("analytics.toughestSet")} value={worst} icon={TrendingUp} tone="rose" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity heatmap */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
        <Card>
          <CardContent className="p-5">
            <SectionTitle
              title={t("statistics.activityHeatmap")}
              description={`${last30.questions} ${t("common.questions")} · ${last7.questions}`}
              action={
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {t("statistics.less")}
                  <span className="size-2.5 rounded-[3px] bg-muted" />
                  <span className="size-2.5 rounded-[3px] bg-emerald-500/30" />
                  <span className="size-2.5 rounded-[3px] bg-emerald-500/55" />
                  <span className="size-2.5 rounded-[3px] bg-emerald-500/75" />
                  <span className="size-2.5 rounded-[3px] bg-emerald-500" />
                  {t("statistics.more")}
                </div>
              }
            />
            <ActivityHeatmap days={heatmap} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SectionTitle title={t("statistics.achievements")} description={`${unlocked} / ${achievements.length}`} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {achievements.map((a, i) => {
            const Icon = ACHIEVE_ICONS[a.icon] ?? Award;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.03 }}
              >
                <Card
                  className={`relative overflow-hidden h-full ${
                    a.unlocked ? "border-amber-500/30" : "opacity-70"
                  }`}
                >
                  <CardContent className="p-4 text-center">
                    <div
                      className={`mx-auto flex size-12 items-center justify-center rounded-2xl ${
                        a.unlocked
                          ? "bg-gradient-to-br from-amber-400/20 to-amber-500/10 text-amber-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-6" />
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-tight">{t(`achievements.${a.id}.title`)}</p>
                    <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
                      {t(`achievements.${a.id}.desc`)}
                    </p>
                    {!a.unlocked && a.progress != null && a.progress > 0 && (
                      <div className="mt-2">
                        <Progress value={a.progress * 100} className="h-1" indicatorClassName="bg-amber-500" />
                        <span className="mt-0.5 block text-[9px] text-muted-foreground">
                          {Math.round(a.progress * 100)}%
                        </span>
                      </div>
                    )}
                    {a.unlocked && (
                      <Badge variant="warning" className="mt-2 gap-1 text-[9px]">
                        <CheckCircle2 className="size-2.5" /> {t("statistics.unlocked")}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function ScoreBand({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "primary" | "rose";
}) {
  const tones = {
    emerald: "text-emerald-500 bg-emerald-500/10",
    primary: "text-primary bg-primary/10",
    rose: "text-rose-500 bg-rose-500/10",
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`flex size-11 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value.toFixed(0)}%</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function computeStreak(activities: Record<string, any>) {
  const days = Object.keys(activities).filter((d) => activities[d].questions > 0).sort();
  if (!days.length) return { current: 0, longest: 0 };
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = Math.round((+new Date(days[i]) - +new Date(days[i - 1])) / 86400000);
    if (diff === 1) {
      run++;
      longest = Math.max(longest, run);
    } else run = 1;
  }
  let current = 0;
  const today = new Date();
  for (let i = 0; i < 400; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    if (activities[key]?.questions > 0) current++;
    else if (i > 0) break;
  }
  return { current, longest: Math.max(longest, current) };
}

function buildHeatmap(activities: Record<string, any>) {
  const days: Array<{ date: string; count: number; level: number }> = [];
  const today = new Date();
  // start from 16 weeks ago, aligned to week
  const start = new Date(today.getTime() - 16 * 7 * 86400000);
  for (let i = 0; i < 16 * 7; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    if (d > today) break;
    const key = d.toISOString().slice(0, 10);
    const count = activities[key]?.questions ?? 0;
    const level =
      count === 0 ? 0 : count < 5 ? 1 : count < 15 ? 2 : count < 30 ? 3 : 4;
    days.push({ date: key, count, level });
  }
  return days;
}

function sumRange(activities: Record<string, any>, n: number) {
  const today = new Date();
  let questions = 0;
  let correct = 0;
  let studySeconds = 0;
  for (let i = 0; i < n; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const a = activities[key];
    if (a) {
      questions += a.questions ?? 0;
      correct += a.correct ?? 0;
      studySeconds += a.studySeconds ?? 0;
    }
  }
  return { questions, correct, studySeconds };
}
