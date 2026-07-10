"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  Shuffle,
  Clock,
  Target,
  Zap,
  AlertCircle,
  Bookmark,
  RefreshCw,
  Layers,
  TrendingDown,
  Sparkles,
  Play,
} from "lucide-react";
import { useExamStore } from "@/store/exam-store";
import { PageHeader, SectionTitle } from "@/components/shared";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Switch,
  Separator,
} from "@/components/ui";
import { shuffle } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "@/i18n";

type Mode =
  | "random"
  | "weak"
  | "wrong"
  | "bookmarked"
  | "topic"
  | "year"
  | "smart";

const MODES: Array<{
  id: Mode;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    id: "smart",
    icon: Sparkles,
    color: "from-violet-500/15 to-fuchsia-500/10 text-violet-500",
  },
  {
    id: "random",
    icon: Shuffle,
    color: "from-primary/15 to-primary/5 text-primary",
  },
  {
    id: "weak",
    icon: TrendingDown,
    color: "from-rose-500/15 to-rose-500/5 text-rose-500",
  },
  {
    id: "wrong",
    icon: AlertCircle,
    color: "from-amber-500/15 to-amber-500/5 text-amber-500",
  },
  {
    id: "bookmarked",
    icon: Bookmark,
    color: "from-blue-500/15 to-blue-500/5 text-blue-500",
  },
  {
    id: "topic",
    icon: Layers,
    color: "from-emerald-500/15 to-emerald-500/5 text-emerald-500",
  },
];

function PracticePageWrapperInner() {
  const { t } = useTranslation();
  return (
    <React.Suspense fallback={<div className="p-8">{t("practice.loading")}</div>}>
      <PracticePage />
    </React.Suspense>
  );
}

export default function PracticePageWrapper() {
  return <PracticePageWrapperInner />;
}

function PracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const initialMode = (searchParams.get("mode") as Mode) || null;

  const questionsMap = useExamStore((s) => s.questions);
  const courses = useExamStore((s) => s.courses);
  const topicStats = useExamStore((s) => s.topicStats);
  const wrongCounts = useExamStore((s) => s.wrongCounts);
  const bookmarks = useExamStore((s) => s.bookmarks);
  const startAttempt = useExamStore((s) => s.startAttempt);
  const settings = useExamStore((s) => s.settings);

  const [selectedMode, setSelectedMode] = React.useState<Mode | null>(initialMode);
  const [count, setCount] = React.useState(10);
  const [timed, setTimed] = React.useState(false);
  const [duration, setDuration] = React.useState(15);
  const [selectedCourse, setSelectedCourse] = React.useState<string>("all");
  const [selectedTopic, setSelectedTopic] = React.useState<string>("all");
  const [selectedYear, setSelectedYear] = React.useState<string>("all");

  const allQuestions = React.useMemo(
    () => Object.values(questionsMap),
    [questionsMap]
  );

  const topics = React.useMemo(
    () => Array.from(new Set(allQuestions.map((q) => q.topic))).sort(),
    [allQuestions]
  );
  const years = React.useMemo(
    () => Array.from(new Set(allQuestions.map((q) => q.year))).sort((a, b) => b - a),
    [allQuestions]
  );

  const filtered = React.useMemo(() => {
    let pool = allQuestions;
    if (selectedCourse !== "all")
      pool = pool.filter((q) => q.courseId === selectedCourse);
    if (selectedYear !== "all")
      pool = pool.filter((q) => q.year === Number(selectedYear));

    if (selectedMode === "smart" || selectedMode === "weak") {
      // rank topics by worst performance
      const ranked = Object.entries(topicStats)
        .map(([t, s]) => {
          const total = s.correct + s.wrong;
          const rate = total ? s.correct / total : 1;
          return { t, rate, attempts: total };
        })
        .sort((a, b) => a.rate - b.rate);
      const weakTopics = ranked.slice(0, 5).map((r) => r.t);
      pool = pool.filter((q) => weakTopics.includes(q.topic));
      if (selectedMode === "smart") pool = shuffle(pool);
    } else if (selectedMode === "wrong") {
      pool = pool.filter((q) => (wrongCounts[q.id] ?? 0) > 0);
    } else if (selectedMode === "bookmarked") {
      pool = pool.filter((q) => bookmarks.includes(q.id));
    } else if (selectedMode === "topic") {
      if (selectedTopic !== "all")
        pool = pool.filter((q) => q.topic === selectedTopic);
      pool = shuffle(pool);
    } else if (selectedMode === "random" || selectedMode === "year") {
      pool = shuffle(pool);
    }
    return pool;
  }, [
    allQuestions,
    selectedMode,
    selectedCourse,
    selectedYear,
    selectedTopic,
    topicStats,
    wrongCounts,
    bookmarks,
  ]);

  const preview = filtered.slice(0, count);
  const willUse = preview.length;

  const handleStart = () => {
    if (willUse === 0) {
      toast.error(t("practice.noMatch"), {
        description: t("practice.noMatchDesc"),
      });
      return;
    }
    // practice attempts use a synthetic "year" 0
    const id = startAttempt(
      selectedCourse !== "all" ? selectedCourse : (courses[0]?.id ?? "cs"),
      0,
      "practice",
      preview.map((q) => q.id),
      timed ? duration * 60 : 0
    );
    router.push(`/exam/${id}`);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={t("practice.title")}
        description={t("practice.description")}
        icon={Brain}
      />

      {/* Mode picker */}
      <SectionTitle title={t("practice.chooseMode")} />
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((m) => {
          const active = selectedMode === m.id;
          const Icon = m.icon;
          return (
            <motion.button
              key={m.id}
              onClick={() => setSelectedMode(m.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all ${
                active
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className={`mb-3 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${m.color}`}>
                <Icon className="size-6" />
              </div>
              <h3 className="font-semibold">{t(`practice.modes.${m.id}`)}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t(`practice.modes.${m.id}Desc`)}
              </p>
              {active && (
                <Badge className="absolute right-3 top-3" variant="default">
                  {t("practice.selected")}
                </Badge>
              )}
            </motion.button>
          );
        })}
      </div>

      {selectedMode && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_300px]">
              <div className="space-y-5">
                <h3 className="font-semibold">{t("practice.configure")}</h3>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Field label={t("common.course")}>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="all">{t("common.all")}</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("analytics.set")}>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="all">{t("common.all")}</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {selectedMode === "topic" && (
                    <Field label={t("common.topic")}>
                      <select
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      >
                        <option value="all">{t("common.all")}</option>
                        {topics.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                </div>

                <Separator />

                {/* Count */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium">{t("practice.countLabel")}</label>
                    <Badge variant="secondary" className="font-mono">{count}</Badge>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {willUse} {t("common.questions")}
                  </p>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{t("practice.timedLabel")}</div>
                      <div className="text-xs text-muted-foreground">
                        {t("settings.timerDesc")}
                      </div>
                    </div>
                  </div>
                  <Switch checked={timed} onCheckedChange={setTimed} />
                </div>
                {timed && (
                  <Field label={t("settings.defaultDuration")}>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </Field>
                )}
              </div>

              {/* summary / start */}
              <div className="flex flex-col rounded-2xl bg-gradient-to-br from-primary/10 to-fuchsia-500/5 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Zap className="size-4 text-primary" />
                  <span className="text-sm font-semibold">{t("practice.sessionSummary")}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <Row label={t("practice.chooseMode")} value={t(`practice.modes.${selectedMode}`)} />
                  <Row label={t("common.questions")} value={`${willUse}`} />
                  <Row label={t("practice.timedLabel")} value={timed ? `${duration} ${t("common.minutes")}` : "—"} />
                </div>
                <Button
                  variant="gradient"
                  size="lg"
                  className="mt-4 gap-2"
                  onClick={handleStart}
                  disabled={willUse === 0}
                >
                  <Play className="size-4" />
                  {t("practice.start")}
                </Button>
                {willUse === 0 && (
                  <p className="mt-2 text-center text-xs text-amber-500">
                    {t("practice.noMatch")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Today's recommendation */}
      {selectedMode === "smart" && Object.keys(topicStats).length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Card className="border-violet-500/20">
            <CardContent className="p-5">
              <SectionTitle
                title={t("practice.recommendedFocus")}
                description={t("practice.modes.smartDesc")}
              />
              <div className="space-y-2">
                {Object.entries(topicStats)
                  .map(([t, s]) => {
                    const total = s.correct + s.wrong;
                    return { t, rate: total ? Math.round((s.correct / total) * 100) : null };
                  })
                  .filter((x) => x.rate !== null)
                  .sort((a, b) => (a.rate ?? 100) - (b.rate ?? 100))
                  .slice(0, 5)
                  .map((x) => (
                    <div
                      key={x.t}
                      className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
                    >
                      <Target className="size-4 text-rose-500" />
                      <span className="flex-1 text-sm font-medium">{x.t}</span>
                      <Badge variant={x.rate! < 50 ? "destructive" : "warning"}>
                        {x.rate}% {t("results.correct").toLowerCase()}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
