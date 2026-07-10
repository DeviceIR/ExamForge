"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Library,
  ChevronRight,
  Clock,
  Layers,
  Trophy,
  Cpu,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { useExamStore } from "@/store/exam-store";
import { PageHeader, EmptyState } from "@/components/shared";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import { useTranslation, formatLocalizedNumber } from "@/i18n";

const ICONS: Record<string, any> = {
  Cpu,
  BookOpen,
  GraduationCap,
};

export default function ExamsPage() {
  const courses = useExamStore((s) => s.courses);
  const yearsForCourse = useExamStore((s) => s.yearsForCourse);
  const getExamQuestions = useExamStore((s) => s.getExamQuestions);
  const bestResultFor = useExamStore((s) => s.bestResultFor);
  const attemptsForExam = useExamStore((s) => s.attemptsForExam);
  const { t, language } = useTranslation();

  if (!courses.length || courses.every((c) => yearsForCourse(c.id).length === 0)) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title={t("exams.title")}
          description={t("exams.description")}
          icon={Library}
        />
        <EmptyState
          icon={Library}
          title={t("exams.noYears")}
          description={t("exams.importHint")}
          action={
            <Link href="/import">
              <Button>{t("nav.library")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t("exams.title")}
        description={t("exams.description")}
        icon={Library}
      />

      <div className="space-y-8">
        {courses.map((course, ci) => {
          const years = yearsForCourse(course.id);
          const Icon = ICONS[course.icon ?? ""] ?? BookOpen;
          const totalQ = years.reduce(
            (sum, y) => sum + getExamQuestions(course.id, y).length,
            0
          );
          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.08, duration: 0.4 }}
            >
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-fuchsia-500/10 text-primary">
                      <Icon className="size-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{course.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {course.description}
                      </p>
                    </div>
                  </div>
                  <div className="hidden gap-4 text-right sm:flex">
                    <div>
                      <div className="text-sm font-semibold">{years.length}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">
                        {t("common.year")}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{totalQ}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">
                        {t("common.questions")}
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                    {years.map((year, yi) => {
                      const qs = getExamQuestions(course.id, year);
                      const best = bestResultFor(course.id, year);
                      const attempts = attemptsForExam(course.id, year).filter(
                        (a) => a.finished
                      );
                      return (
                        <Link key={year} href={`/exams/${course.id}/${year}`}>
                          <Card className="group h-full card-hover">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {formatLocalizedNumber(qs.length, language)} {t("common.questions")}
                                </span>
                                {best ? (
                                  <Badge variant="success" className="text-[10px]">
                                    {best.percentage.toFixed(0)}%
                                  </Badge>
                                ) : (
                                  <span className="size-2 rounded-full bg-muted-foreground/20" />
                                )}
                              </div>
                              <div className="mt-2 text-xl font-bold tracking-tight">
                                {formatLocalizedNumber(year, language)}
                              </div>
                              <div className="mt-1 text-[11px] text-muted-foreground">
                                {attempts.length > 0
                                  ? t("exams.attempts", { count: attempts.length })
                                  : t("exams.notAttempted")}
                              </div>
                              <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                                {t("exams.open")} <ChevronRight className="size-3" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
