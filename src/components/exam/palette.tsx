"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Bookmark, Flag } from "lucide-react";
import type { Attempt, Question, QuestionStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { useTranslation } from "@/i18n";

const STATUS_COLOR: Record<QuestionStatus, string> = {
  unseen: "bg-exam-unseen/20 text-muted-foreground border-border hover:bg-exam-unseen/30",
  visited: "bg-exam-visited/15 text-exam-visited border-exam-visited/30",
  answered: "bg-exam-answered/15 text-exam-answered border-exam-answered/40",
  review: "bg-exam-review/15 text-exam-review border-exam-review/40",
  danger: "bg-exam-danger/15 text-exam-danger border-exam-danger/40",
};

export function QuestionPalette({
  attempt,
  questions,
  current,
  onJump,
  showLegend = true,
}: {
  attempt: Attempt;
  questions: Question[];
  current: number;
  onJump: (i: number) => void;
  showLegend?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("palette.title")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {t("palette.total", { count: questions.length })}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-5">
        {questions.map((q, i) => {
          const st = attempt.states[q.id];
          const status: QuestionStatus = st?.markedForReview
            ? "review"
            : st?.answer != null
              ? "answered"
              : st?.visited
                ? "visited"
                : "unseen";
          const isCurrent = i === current;
          const bookmarked = st?.bookmarked;
          return (
            <Tooltip key={q.id}>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => onJump(i)}
                  whileTap={{ scale: 0.92 }}
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-lg border text-xs font-semibold transition-all",
                    STATUS_COLOR[status],
                    isCurrent &&
                      "ring-2 ring-primary ring-offset-1 ring-offset-background"
                  )}
                >
                  {i + 1}
                  {bookmarked && (
                    <Bookmark className="absolute -right-1 -top-1 size-2.5 fill-amber-500 text-amber-500" />
                  )}
                  {st?.markedForReview && (
                    <Flag className="absolute -left-1 -top-1 size-2.5 fill-exam-review text-exam-review" />
                  )}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Q{i + 1} · {status}
                {bookmarked ? " · bookmarked" : ""}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {showLegend && (
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
          <Legend color="bg-exam-unseen" label={t("palette.unseen")} />
          <Legend color="bg-exam-visited" label={t("palette.visited")} />
          <Legend color="bg-exam-answered" label={t("palette.answered")} />
          <Legend color="bg-exam-review" label={t("palette.review")} />
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("size-2.5 rounded-full", color)} />
      {label}
    </div>
  );
}

export function PaletteSummary({
  attempt,
  questions,
}: {
  attempt: Attempt;
  questions: Question[];
}) {
  const { t } = useTranslation();
  let answered = 0;
  let review = 0;
  let bookmarked = 0;
  let visited = 0;
  for (const q of questions) {
    const st = attempt.states[q.id];
    if (!st) continue;
    if (st.answer != null) answered++;
    if (st.markedForReview) review++;
    if (st.bookmarked) bookmarked++;
    if (st.visited) visited++;
  }
  const items = [
    { label: t("palette.answered"), value: answered, color: "text-exam-answered" },
    { label: t("palette.visited"), value: visited, color: "text-exam-visited" },
    { label: t("palette.review"), value: review, color: "text-exam-review" },
    { label: t("dashboard.bookmarks"), value: bookmarked, color: "text-amber-500" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-xl border border-border/60 bg-card/40 p-2 text-center"
        >
          <div className={cn("text-lg font-bold", it.color)}>{it.value}</div>
          <div className="text-[10px] text-muted-foreground">{it.label}</div>
        </div>
      ))}
    </div>
  );
}
