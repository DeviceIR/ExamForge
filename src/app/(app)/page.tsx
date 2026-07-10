"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Flame,
  Target,
  Trophy,
  Clock,
  TrendingUp,
  ChevronRight,
  Play,
  Award,
  BookOpen,
  Zap,
} from "lucide-react";
import { useExamStore } from "@/store/exam-store";
import { PageHeader, StatCard, SectionTitle, EmptyState } from "@/components/shared";
import { Button, Card, CardContent, Badge, Progress } from "@/components/ui";
import { formatDuration, todayKey } from "@/lib/utils";
import { useTranslation, formatLocalizedNumber } from "@/i18n";

export default function DashboardPage() {
  const courses = useExamStore((s) => s.courses);
  const attempts = useExamStore((s) => s.attempts);
  const results = useExamStore((s) => s.results);
  const activities = useExamStore((s) => s.activities);
  const bookmarks = useExamStore((s) => s.bookmarks);
  const settings = useExamStore((s) => s.settings);
  const questionsMap = useExamStore((s) => s.questions);
  const yearsForCourse = useExamStore((s) => s.yearsForCourse);
  const bestResultFor = useExamStore((s) => s.bestResultFor);
  const { t, language } = useTranslation();

  const finished = attempts.filter((a) => a.finished);
  const totalQuestions = finished.reduce(
    (sum, a) => sum + (results[a.id]?.total ?? 0),
    0
  );
  const totalCorrect = finished.reduce(
    (sum, a) => sum + (results[a.id]?.correct ?? 0),
    0
  );
  const totalStudy = finished.reduce(
    (sum, a) => sum + (results[a.id]?.timeUsed ?? 0),
    0
  );

  const percentages = finished
    .map((a) => results[a.id]?.percentage ?? 0)
    .filter((p) => p > 0);
  const avgScore = percentages.length
    ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
    : 0;
  const bestScore = percentages.length ? Math.max(...percentages) : 0;

  const streak = React.useMemo(() => computeStreak(activities), [activities]);
  const todayActivity = activities[todayKey()];

  const examSets = React.useMemo(() => {
    const sets: { courseId: string; courseName: string; year: number; count: number }[] = [];
    for (const c of courses) {
      for (const year of yearsForCourse(c.id)) {
        sets.push({
          courseId: c.id,
          courseName: c.name,
          year,
          count: Object.values(questionsMap).filter(
            (q) => q.courseId === c.id && q.year === year
          ).length,
        });
      }
    }
    return sets.sort((a, b) => b.year - a.year).slice(0, 12);
  }, [courses, questionsMap, yearsForCourse]);

  const primaryCourse = courses[0];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        icon={LayoutDashboard}
        actions={
          <Link href="/practice?mode=smart">
            <Button variant="gradient" className="gap-2">
              <Zap className="size-4" />
              {t("dashboard.smartStudy")}
            </Button>
          </Link>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="relative overflow-hidden border-primary/20">
          <div className="absolute inset-0 grid-bg opacity-40" />
          <CardContent className="relative grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:p-8">
            <div>
              <Badge variant="secondary" className="mb-3 gap-1.5">
                <Flame className="size-3 text-amber-500" />
                {t("dashboard.dayStreak", { count: streak.current })}
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                {t("dashboard.welcome")}{" "}
                <span className="gradient-text">{t("dashboard.heroTitle")}</span>
              </h2>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                {t("dashboard.heroDesc", {
                  correct: formatLocalizedNumber(totalCorrect, language),
                  sessions: formatLocalizedNumber(finished.length, language),
                })}
                {primaryCourse &&
                  ` ${t("dashboard.heroCourse", { course: primaryCourse.name })}`}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/exams">
                  <Button className="gap-2">
                    <Play className="size-4" />
                    {t("common.takeExam")}
                  </Button>
                </Link>
                <Link href="/practice">
                  <Button variant="outline" className="gap-2">
                    <Target className="size-4" />
                    {t("practice.title")}
                  </Button>
                </Link>
              </div>
              {settings.dailyGoal > 0 && (
                <div className="mt-5 max-w-sm">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t("dashboard.dailyGoal")}</span>
                    <span className="font-medium">
                      {formatLocalizedNumber(todayActivity?.questions ?? 0, language)} /{" "}
                      {formatLocalizedNumber(settings.dailyGoal, language)}
                    </span>
                  </div>
                  <Progress
                    value={((todayActivity?.questions ?? 0) / settings.dailyGoal) * 100}
                    indicatorClassName="bg-gradient-to-r from-primary to-fuchsia-500"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-3 rounded-2xl bg-card/60 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("dashboard.bestScore")}
                </span>
                <Trophy className="size-4 text-amber-500" />
              </div>
              <div className="text-4xl font-bold gradient-text">{bestScore.toFixed(0)}%</div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t("dashboard.avgScore")}</span>
                  <span className="font-medium text-foreground">{avgScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("dashboard.sessions")}</span>
                  <span className="font-medium text-foreground">{finished.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("dashboard.studyTime")}</span>
                  <span className="font-medium text-foreground">
                    {formatDuration(totalStudy)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("dashboard.totalAnswered")} value={totalQuestions} icon={Target} hint={`${totalCorrect} ${t("results.correct").toLowerCase()}`} accent="primary" delay={0.05} />
        <StatCard label={t("dashboard.currentStreak")} value={`${streak.current}d`} icon={Flame} hint={`${streak.longest}d`} accent="amber" delay={0.1} />
        <StatCard label={t("dashboard.accuracy")} value={`${avgScore}%`} icon={TrendingUp} accent="emerald" delay={0.15} />
        <StatCard label={t("dashboard.bookmarks")} value={bookmarks.length} icon={BookOpen} accent="violet" delay={0.2} />
      </div>

      <SectionTitle
        title={t("dashboard.examLibrary")}
        description={t("dashboard.examLibraryDesc")}
        action={
          <Link href="/exams">
            <Button variant="ghost" size="sm" className="gap-1">
              {t("dashboard.viewAll")} <ChevronRight className="size-4" />
            </Button>
          </Link>
        }
      />
      {examSets.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {examSets.map((set, i) => {
            const best = bestResultFor(set.courseId, set.year);
            return (
              <motion.div key={`${set.courseId}-${set.year}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                <Link href={`/exams/${set.courseId}/${set.year}`}>
                  <Card className="group h-full card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-[10px] text-muted-foreground">{set.courseName}</span>
                        {best ? (
                          <Badge variant="success" className="text-[10px]">{best.percentage.toFixed(0)}%</Badge>
                        ) : (
                          <span className="size-2 rounded-full bg-muted-foreground/20" />
                        )}
                      </div>
                      <div className="mt-2 text-xl font-bold">
                        {t("common.examSet")} {formatLocalizedNumber(set.year, language)}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {formatLocalizedNumber(set.count, language)} {t("common.questions")}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title={t("dashboard.noCourses")}
          description={t("dashboard.noCoursesHint")}
          action={
            <Link href="/import">
              <Button>{t("dashboard.goLibrary")}</Button>
            </Link>
          }
        />
      )}

      {finished.length > 0 && (
        <div className="mt-10">
          <SectionTitle
            title={t("dashboard.recentActivity")}
            action={
              <Link href="/statistics">
                <Button variant="ghost" size="sm" className="gap-1">
                  {t("dashboard.allStats")} <ChevronRight className="size-4" />
                </Button>
              </Link>
            }
          />
          <div className="space-y-2">
            {finished.slice(0, 5).map((a) => {
              const r = results[a.id];
              if (!r) return null;
              const course = courses.find((c) => c.id === a.courseId);
              return (
                <Link key={a.id} href={`/results/${a.id}`}>
                  <Card className="card-hover">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Award className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {course?.name ?? a.courseId} · {formatLocalizedNumber(a.year, language)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.startedAt).toLocaleString(language === "fa" ? "fa-IR" : undefined)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {formatDuration(r.timeUsed)}
                      </div>
                      <div className="text-lg font-bold">{r.percentage.toFixed(0)}%</div>
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

function computeStreak(activities: Record<string, { questions: number }>) {
  const days = Object.keys(activities).filter((d) => activities[d].questions > 0).sort();
  if (!days.length) return { current: 0, longest: 0 };
  let longest = 0;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = Math.round((new Date(days[i]).getTime() - new Date(days[i - 1]).getTime()) / 86_400_000);
    if (diff === 1) run++;
    else { longest = Math.max(longest, run); run = 1; }
  }
  longest = Math.max(longest, run);
  let current = 0;
  const today = new Date();
  for (let i = 0; i < 400; i++) {
    const key = new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    if (activities[key]?.questions > 0) current++;
    else if (i > 0) break;
  }
  return { current, longest: Math.max(longest, current) };
}
