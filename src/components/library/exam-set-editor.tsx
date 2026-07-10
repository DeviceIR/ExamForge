"use client";

import * as React from "react";
import { ChevronLeft, Pencil, Trash2, Plus, CheckCircle2 } from "lucide-react";
import { useExamStore } from "@/store/exam-store";
import { Button, Card, CardContent, Badge } from "@/components/ui";
import { QuestionEditor } from "@/components/library/question-editor";
import { useTranslation, formatLocalizedNumber } from "@/i18n";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Course } from "@/types";

export function ExamSetEditor({
  course,
  year,
  onBack,
}: {
  course: Course;
  year: number;
  onBack: () => void;
}) {
  const { t, language, isRtl } = useTranslation();
  const questionsMap = useExamStore((s) => s.questions);
  const removeQuestion = useExamStore((s) => s.removeQuestion);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);

  const questions = React.useMemo(
    () =>
      Object.values(questionsMap)
        .filter((q) => q.courseId === course.id && q.year === year)
        .sort((a, b) => a.number - b.number),
    [questionsMap, course.id, year]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className={isRtl ? "size-4 rotate-180" : "size-4"} />
          {t("library.backToSets")}
        </button>
        <Button
          size="sm"
          variant="gradient"
          className="gap-1.5"
          onClick={() => {
            setAdding(true);
            setEditingId(null);
          }}
        >
          <Plus className="size-4" /> {t("library.addQuestion")}
        </Button>
      </div>

      <div>
        <h3 className="text-lg font-bold">
          {course.name} — {t("common.examSet")} {formatLocalizedNumber(year, language)}
        </h3>
        <p className="text-xs text-muted-foreground">
          {formatLocalizedNumber(questions.length, language)} {t("common.questions")}
        </p>
      </div>

      {adding && (
        <Card className="border-primary/30">
          <CardContent className="p-5">
            <p className="mb-3 text-sm font-semibold">{t("library.addQuestion")}</p>
            <QuestionEditor
              fixedCourse={course}
              fixedYear={year}
              onSaved={() => setAdding(false)}
              onCancel={() => setAdding(false)}
            />
          </CardContent>
        </Card>
      )}

      {questions.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">{t("library.emptySet")}</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardContent className="p-4">
                {editingId === q.id ? (
                  <QuestionEditor
                    editQuestion={q}
                    onSaved={() => setEditingId(null)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 font-mono">
                      {formatLocalizedNumber(q.number, language)}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{q.prompt}</p>
                      <div className="mt-2 grid gap-1 sm:grid-cols-2">
                        {q.options.map((opt, i) => {
                          const isCorrect = q.correctAnswer === i;
                          return (
                            <div
                              key={opt.id}
                              className={cn(
                                "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs",
                                isCorrect
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground"
                              )}
                            >
                              {isCorrect && <CheckCircle2 className="size-3 shrink-0" />}
                              <span className="truncate">{opt.text}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">{q.topic}</Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {t(`common.${q.difficulty}`)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditingId(q.id);
                          setAdding(false);
                        }}
                        title={t("common.save")}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-rose-500"
                        onClick={() => {
                          if (confirm(t("library.deleteQuestionConfirm"))) {
                            removeQuestion(q.id);
                            toast.success(t("library.questionDeleted"));
                          }
                        }}
                        title={t("common.delete")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
