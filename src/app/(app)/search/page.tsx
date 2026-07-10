"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search as SearchIcon,
  Filter,
  Bookmark,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { useExamStore } from "@/store/exam-store";
import { PageHeader, EmptyState, CodeBlock, Math as MathText } from "@/components/shared";
import { Card, CardContent, Badge, Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

const DIFFICULTY_BADGE = {
  easy: "success",
  medium: "warning",
  hard: "destructive",
} as const;

export default function SearchPage() {
  const { t } = useTranslation();
  const questions = useExamStore((s) => s.questions);
  const courses = useExamStore((s) => s.courses);
  const bookmarks = useExamStore((s) => s.bookmarks);
  const wrongCounts = useExamStore((s) => s.wrongCounts);
  const toggleBookmark = useExamStore((s) => s.toggleBookmark);

  const [query, setQuery] = React.useState("");
  const [course, setCourse] = React.useState("all");
  const [year, setYear] = React.useState("all");
  const [topic, setTopic] = React.useState("all");
  const [difficulty, setDifficulty] = React.useState("all");
  const [onlyBookmarked, setOnlyBookmarked] = React.useState(false);
  const [onlyWrong, setOnlyWrong] = React.useState(false);

  const all = React.useMemo(() => Object.values(questions), [questions]);

  const topics = React.useMemo(
    () => Array.from(new Set(all.map((q) => q.topic))).sort(),
    [all]
  );
  const years = React.useMemo(
    () => Array.from(new Set(all.map((q) => q.year))).sort((a, b) => b - a),
    [all]
  );

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((item) => {
        if (course !== "all" && item.courseId !== course) return false;
        if (year !== "all" && item.year !== Number(year)) return false;
        if (topic !== "all" && item.topic !== topic) return false;
        if (difficulty !== "all" && item.difficulty !== difficulty) return false;
        if (onlyBookmarked && !bookmarks.includes(item.id)) return false;
        if (onlyWrong && !(wrongCounts[item.id] > 0)) return false;
        if (q) {
          const hay = [
            item.prompt,
            item.topic,
            item.subtopic ?? "",
            ...(item.tags ?? []),
            ...item.options.map((o) => o.text),
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.year - b.year || a.number - b.number)
      .slice(0, 100);
  }, [all, query, course, year, topic, difficulty, onlyBookmarked, onlyWrong, bookmarks, wrongCounts]);

  const activeFilters =
    (course !== "all" ? 1 : 0) +
    (year !== "all" ? 1 : 0) +
    (topic !== "all" ? 1 : 0) +
    (difficulty !== "all" ? 1 : 0) +
    (onlyBookmarked ? 1 : 0) +
    (onlyWrong ? 1 : 0);

  const resetFilters = () => {
    setCourse("all");
    setYear("all");
    setTopic("all");
    setDifficulty("all");
    setOnlyBookmarked(false);
    setOnlyWrong(false);
  };

  return (
    <div className="mx-auto max-w-5xl" onKeyDown={(e) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    }}>
      <PageHeader
        title={t("search.title")}
        description={t("search.description")}
        icon={SearchIcon}
      />

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-input"
              autoFocus
              placeholder={t("search.placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 pl-10 pr-10 text-base"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XCircle className="size-4" />
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SelectField label={t("search.course")} value={course} onChange={setCourse}>
              <option value="all">{t("common.all")}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </SelectField>
            <SelectField label={t("analytics.set")} value={year} onChange={setYear}>
              <option value="all">{t("common.all")}</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </SelectField>
            <SelectField label={t("search.topic")} value={topic} onChange={setTopic}>
              <option value="all">{t("common.all")}</option>
              {topics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </SelectField>
            <SelectField label={t("search.difficulty")} value={difficulty} onChange={setDifficulty}>
              <option value="all">{t("common.all")}</option>
              <option value="easy">{t("common.easy")}</option>
              <option value="medium">{t("common.medium")}</option>
              <option value="hard">{t("common.hard")}</option>
            </SelectField>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <FilterPill active={onlyBookmarked} onClick={() => setOnlyBookmarked((v) => !v)} icon={Bookmark}>
              {t("search.bookmarked")}
            </FilterPill>
            <FilterPill active={onlyWrong} onClick={() => setOnlyWrong((v) => !v)} icon={XCircle}>
              {t("search.wrongBefore")}
            </FilterPill>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto gap-1 text-muted-foreground">
                <Filter className="size-3.5" /> {t("search.clearFilters")} ({activeFilters})
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              {results.length} {t("common.questions")}
            </span>
          </div>
        </CardContent>
      </Card>

      {results.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title={t("search.noResults")}
          description={t("search.clearFilters")}
          action={activeFilters > 0 ? <Button variant="outline" onClick={resetFilters}>{t("search.clearFilters")}</Button> : undefined}
        />
      ) : (
        <div className="space-y-2">
          {results.map((q, i) => {
            const bookmarked = bookmarks.includes(q.id);
            const wrong = wrongCounts[q.id] ?? 0;
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.3) }}
              >
                <Card className="card-hover">
                  <CardContent className="flex items-start gap-3 p-4">
                    <button
                      onClick={() => toggleBookmark(q.id)}
                      className={cn(
                        "mt-0.5 rounded-lg p-1 transition-colors hover:bg-accent",
                        bookmarked ? "text-amber-500" : "text-muted-foreground"
                      )}
                      title={t("search.bookmark")}
                    >
                      <Bookmark className={cn("size-4", bookmarked && "fill-amber-500")} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="font-mono text-[10px]">{q.year} · Q{q.number}</Badge>
                        <Badge variant="outline" className="text-[10px]">{q.topic}</Badge>
                        <Badge variant={DIFFICULTY_BADGE[q.difficulty]} className="text-[10px] capitalize">{q.difficulty}</Badge>
                        {wrong > 0 && (
                          <Badge variant="destructive" className="text-[10px]">×{wrong} {t("results.wrong").toLowerCase()}</Badge>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm font-medium">{q.prompt}</p>
                      {q.code && (
                        <div className="mt-1.5 text-xs opacity-80"><CodeBlock code={q.code.split("\n").slice(0, 2).join("\n") + "…"} /></div>
                      )}
                    </div>
                    <Link href={`/exams/${q.courseId}/${q.year}`} className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary">
                      <ChevronRight className="size-4" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {children}
      </select>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-accent"
      )}
    >
      <Icon className="size-3" />
      {children}
    </button>
  );
}
