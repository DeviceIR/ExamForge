"use client";

import * as React from "react";
import { useExamStore } from "@/store/exam-store";
import { importToQuestions, resolveCourse } from "@/lib/question-utils";
import { Button, Input, Textarea } from "@/components/ui";
import { useTranslation } from "@/i18n";
import { toast } from "sonner";
import type { Course, Difficulty, Question, QuestionType } from "@/types";

interface QuestionEditorProps {
  /** When set, the editor updates this question instead of creating a new one. */
  editQuestion?: Question;
  /** When set, course/set are fixed (adding into an existing set). */
  fixedCourse?: Course;
  fixedYear?: number;
  onSaved?: () => void;
  onCancel?: () => void;
}

function padOptions(opts: string[]): string[] {
  const next = [...opts];
  while (next.length < 4) next.push("");
  return next;
}

export function QuestionEditor({
  editQuestion,
  fixedCourse,
  fixedYear,
  onSaved,
  onCancel,
}: QuestionEditorProps) {
  const { t } = useTranslation();
  const courses = useExamStore((s) => s.courses);
  const addCourse = useExamStore((s) => s.addCourse);
  const upsertQuestions = useExamStore((s) => s.upsertQuestions);
  const updateQuestion = useExamStore((s) => s.updateQuestion);
  const questionsMap = useExamStore((s) => s.questions);

  const isEdit = Boolean(editQuestion);
  const locked = Boolean(fixedCourse) || isEdit;

  const [courseName, setCourseName] = React.useState(
    editQuestion
      ? courses.find((c) => c.id === editQuestion.courseId)?.name ?? ""
      : fixedCourse?.name ?? ""
  );
  const [setId, setSetId] = React.useState(
    String(editQuestion?.year ?? fixedYear ?? new Date().getFullYear())
  );
  const [prompt, setPrompt] = React.useState(editQuestion?.prompt ?? "");
  const [options, setOptions] = React.useState<string[]>(
    padOptions(editQuestion?.options.map((o) => o.text) ?? ["", "", "", ""])
  );
  const [correct, setCorrect] = React.useState<number>(
    typeof editQuestion?.correctAnswer === "number" ? editQuestion.correctAnswer : 0
  );
  const [topic, setTopic] = React.useState(editQuestion?.topic ?? "General");
  const [difficulty, setDifficulty] = React.useState<Difficulty>(
    editQuestion?.difficulty ?? "medium"
  );
  const type: QuestionType = editQuestion?.type ?? "single";

  const handleSave = () => {
    const filled = options.map((o) => o.trim()).filter(Boolean);
    if (!prompt.trim() || filled.length < 2) {
      toast.error(t("library.editInvalid"));
      return;
    }
    const safeCorrect = Math.min(correct, filled.length - 1);

    if (isEdit && editQuestion) {
      updateQuestion(editQuestion.id, {
        prompt: prompt.trim(),
        options: filled.map((text, j) => ({
          id: String.fromCharCode(97 + j),
          text,
        })),
        correctAnswer: safeCorrect,
        topic: topic.trim() || "General",
        difficulty,
      });
      toast.success(t("library.questionUpdated"));
      onSaved?.();
      return;
    }

    if (!courseName.trim()) {
      toast.error(t("library.editInvalid"));
      return;
    }

    const year = Number(setId) || new Date().getFullYear();
    let course: Course;
    if (fixedCourse) {
      course = fixedCourse;
    } else {
      const resolved = resolveCourse(courseName, courses);
      course = resolved.course;
      if (resolved.created) addCourse(course);
    }

    const existing = Object.values(questionsMap).filter(
      (q) => q.courseId === course.id && q.year === year
    );
    const number = existing.length
      ? Math.max(...existing.map((q) => q.number)) + 1
      : 1;

    const data = importToQuestions(
      {
        year,
        course: course.name,
        questions: [
          {
            number,
            prompt: prompt.trim(),
            options: filled,
            correctAnswer: safeCorrect,
            topic: topic.trim() || "General",
            difficulty,
            type,
          },
        ],
      },
      course.id
    );

    upsertQuestions(data);
    toast.success(t("library.questionAdded"));
    setPrompt("");
    setOptions(["", "", "", ""]);
    setCorrect(0);
    onSaved?.();
  };

  return (
    <div className="space-y-4">
      {!locked && (
        <p className="text-sm text-muted-foreground">{t("library.writeDesc")}</p>
      )}
      {!locked && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium">{t("library.textCourse")}</label>
            <Input value={courseName} onChange={(e) => setCourseName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">{t("library.textSet")}</label>
            <Input value={setId} onChange={(e) => setSetId(e.target.value)} />
          </div>
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium">{t("library.prompt")}</label>
        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium">{t("common.topic")}</label>
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">{t("common.difficulty")}</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="easy">{t("common.easy")}</option>
            <option value="medium">{t("common.medium")}</option>
            <option value="hard">{t("common.hard")}</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-xs font-medium">{t("library.options")}</label>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${editQuestion?.id ?? "new"}`}
                checked={correct === i}
                onChange={() => setCorrect(i)}
                className="size-4"
                title={t("library.correctAnswer")}
              />
              <Input
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.target.value;
                  setOptions(next);
                }}
                placeholder={`${t("common.option")} ${i + 1}`}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="gradient" className="flex-1" onClick={handleSave}>
          {isEdit ? t("common.save") : t("library.addQuestion")}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
      </div>
    </div>
  );
}
