"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Trophy,
  Target,
  ArrowUp,
  ArrowDown,
  Activity,
} from "lucide-react";
import { useExamStore } from "@/store/exam-store";
import { PageHeader, StatCard, EmptyState, SectionTitle } from "@/components/shared";
import { Card, CardContent, Badge } from "@/components/ui";
import { YearTrendChart, TopicRadar } from "@/components/charts";
import Link from "next/link";
import { Button } from "@/components/ui";
import { useTranslation } from "@/i18n";

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const attempts = useExamStore((s) => s.attempts);
  const results = useExamStore((s) => s.results);
  const topicStats = useExamStore((s) => s.topicStats);
  const courses = useExamStore((s) => s.courses);

  const finished = attempts.filter(
    (a) => a.finished && a.mode === "exam" && results[a.id]
  );

  if (finished.length === 0) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title={t("analytics.title")}
          description={t("analytics.description")}
          icon={BarChart3}
        />
        <EmptyState
          icon={BarChart3}
          title={t("analytics.empty")}
          description={t("analytics.empty")}
          action={
            <Link href="/exams">
              <Button>{t("common.takeExam")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Year trend (best per year)
  const yearMap = new Map<number, number[]>();
  for (const a of finished) {
    const r = results[a.id]!;
    if (!yearMap.has(a.year)) yearMap.set(a.year, []);
    yearMap.get(a.year)!.push(r.percentage);
  }
  const yearTrend = Array.from(yearMap.entries())
    .map(([year, arr]) => ({
      year: String(year),
      score: Math.round(Math.max(...arr)),
    }))
    .sort((a, b) => Number(a.year) - Number(b.year));

  // Topic radar (cross-all)
  const radarData = Object.entries(topicStats)
    .map(([topic, s]) => {
      const total = s.correct + s.wrong + s.skipped;
      return {
        topic: topic.length > 12 ? topic.slice(0, 11) + "…" : topic,
        score: total ? Math.round((s.correct / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const best = [...yearTrend].sort((a, b) => b.score - a.score)[0];
  const worst = [...yearTrend].sort((a, b) => a.score - b.score)[0];
  const avg = Math.round(
    finished.reduce((s, a) => s + results[a.id]!.percentage, 0) / finished.length
  );

  // Improvement (first half vs second half by date)
  const sorted = [...finished].sort((a, b) => a.startedAt - b.startedAt);
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);
  let improvement = 0;
  if (firstHalf.length && secondHalf.length) {
    const f = firstHalf.reduce((s, a) => s + results[a.id]!.percentage, 0) / firstHalf.length;
    const sec = secondHalf.reduce((s, a) => s + results[a.id]!.percentage, 0) / secondHalf.length;
    improvement = Math.round(sec - f);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t("analytics.title")}
        description={t("analytics.description")}
        icon={BarChart3}
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("analytics.avgScore")} value={`${avg}%`} icon={Activity} hint={`${finished.length} ${t("analytics.attempts").toLowerCase()}`} accent="primary" delay={0.05} />
        <StatCard label={t("analytics.bestSet")} value={best ? `${best.year}` : "—"} icon={Trophy} hint={best ? `${best.score}%` : ""} accent="emerald" delay={0.1} />
        <StatCard label={t("analytics.toughestSet")} value={worst ? `${worst.year}` : "—"} icon={Target} hint={worst ? `${worst.score}%` : ""} accent="rose" delay={0.15} />
        <StatCard
          label={t("dashboard.avgScore")}
          value={`${improvement >= 0 ? "+" : ""}${improvement}%`}
          icon={improvement >= 0 ? ArrowUp : ArrowDown}
          hint={t("analytics.avg")}
          accent={improvement >= 0 ? "emerald" : "rose"}
          delay={0.2}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-5">
              <SectionTitle title={t("analytics.bySet")} description={t("analytics.best")} />
              {yearTrend.length > 1 ? (
                <YearTrendChart data={yearTrend} />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {t("analytics.empty")}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-5">
              <SectionTitle title={t("results.topicMastery")} description={t("analytics.description")} />
              <TopicRadar data={radarData} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Year comparison table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
        <Card>
          <CardContent className="p-5">
            <SectionTitle title={t("analytics.bySet")} description={t("analytics.attempts")} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">{t("analytics.set")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("analytics.attempts")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("analytics.best")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("analytics.avg")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("results.performance")}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(yearMap.entries())
                    .sort((a, b) => b[0] - a[0])
                    .map(([year, arr]) => {
                      const bestY = Math.round(Math.max(...arr));
                      const avgY = Math.round(
                        arr.reduce((s, n) => s + n, 0) / arr.length
                      );
                      return (
                        <tr key={year} className="border-b border-border/40 last:border-0">
                          <td className="py-2.5 pr-4 font-mono font-semibold">{year}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{arr.length}</td>
                          <td className="py-2.5 pr-4 font-bold text-emerald-500">{bestY}%</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{avgY}%</td>
                          <td className="py-2.5 pr-4 w-1/3">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500"
                                style={{ width: `${bestY}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
