"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  Flag,
  Lightbulb,
  FileText,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";
import type { Question, QuestionState } from "@/types";
import { cn } from "@/lib/utils";
import { Button, Badge } from "@/components/ui";
import { Math, CodeBlock } from "@/components/shared";
import { localizeQuestion, useTranslation, formatLocalizedNumber } from "@/i18n";

const DIFFICULTY_BADGE = {
  easy: "success",
  medium: "warning",
  hard: "destructive",
} as const;

export function QuestionCard({
  question: questionProp,
  state,
  index,
  total,
  onAnswer,
  onToggleBookmark,
  onToggleReview,
  onToggleNote,
  practice = false,
}: {
  question: Question;
  state: QuestionState;
  index: number;
  total: number;
  onAnswer: (answer: number | number[] | null) => void;
  onToggleBookmark: () => void;
  onToggleReview: () => void;
  onToggleNote: () => void;
  practice?: boolean;
}) {
  const { t, language } = useTranslation();
  const question = localizeQuestion(questionProp, language);
  const isMultiple = question.type === "multiple";
  const selected = state.answer;
  const [showHint, setShowHint] = React.useState(false);

  const isSelected = (i: number) =>
    Array.isArray(selected) ? selected.includes(i) : selected === i;

  const handleSelect = (i: number) => {
    if (isMultiple) {
      const cur = Array.isArray(selected) ? selected : [];
      const next = cur.includes(i)
        ? cur.filter((x) => x !== i)
        : [...cur, i].sort((a, b) => a - b);
      onAnswer(next.length ? next : null);
    } else {
      onAnswer(i);
    }
  };

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col"
    >
      {/* meta row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-mono">
          {formatLocalizedNumber(index + 1, language)} / {formatLocalizedNumber(total, language)}
        </Badge>
        <Badge variant="outline">{question.topic}</Badge>
        {question.subtopic && (
          <Badge variant="outline" className="text-muted-foreground">
            {question.subtopic}
          </Badge>
        )}
        <Badge variant={DIFFICULTY_BADGE[question.difficulty]} className="capitalize">
          {question.difficulty}
        </Badge>
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          ~{question.estimatedTime}s
        </Badge>
        {isMultiple && (
          <Badge variant="outline" className="text-primary">
            {t("questionCard.multipleAnswers")}
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleBookmark}
            className={cn(
              state.bookmarked &&
                "text-amber-500 hover:text-amber-500"
            )}
            title={t("questionCard.bookmarkTitle")}
          >
            <Bookmark
              className={cn("size-4", state.bookmarked && "fill-amber-500")}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleReview}
            className={cn(
              state.markedForReview &&
                "text-exam-review hover:text-exam-review"
            )}
            title={t("questionCard.reviewTitle")}
          >
            <Flag
              className={cn(
                "size-4",
                state.markedForReview && "fill-exam-review"
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleNote}
            title={t("questionCard.noteTitle")}
          >
            <FileText className="size-4" />
          </Button>
        </div>
      </div>

      {/* prompt */}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {question.context && (
          <p className="rounded-xl border border-border/60 bg-muted/40 p-3 text-sm italic text-muted-foreground">
            {question.context}
          </p>
        )}
        <p className="text-lg font-medium leading-relaxed">
          {question.prompt}
        </p>
      </div>

      {question.image && (
        <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.image}
            alt="Question"
            className="max-h-80 w-full object-contain bg-muted/30"
          />
        </div>
      )}

      {question.math && (
        <div className="my-3">
          <Math display>{question.math}</Math>
        </div>
      )}

      {question.code && (
        <div className="my-3">
          <CodeBlock code={question.code} language="code" />
        </div>
      )}

      {question.hint && (
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-amber-600"
            onClick={() => setShowHint((s) => !s)}
          >
            <Lightbulb className="size-3.5" />
            {showHint ? t("questionCard.hideHint") : t("questionCard.showHint")}
          </Button>
          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-300"
              >
                {question.hint}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* options */}
      <div className="mt-5 grid gap-2.5">
        {question.options.map((opt, i) => {
          const sel = isSelected(i);
          const letter = String.fromCharCode(65 + i);
          return (
            <motion.button
              key={opt.id}
              onClick={() => handleSelect(i)}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "group flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-all",
                sel
                  ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                  : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors",
                  sel
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-primary/10"
                )}
              >
                {isMultiple && sel ? "✓" : letter}
              </span>
              <div className="flex-1">
                {opt.image && (
                  <div className="mb-1 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={opt.image}
                      alt="Option"
                      className="max-h-40 object-contain"
                    />
                  </div>
                )}
                <span className="text-sm leading-relaxed">{opt.text}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {!practice && state.answer != null && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAnswer(null)}
            className="text-muted-foreground"
          >
            {t("questionCard.clearAnswer")}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export { ImageIcon, ChevronRight };
