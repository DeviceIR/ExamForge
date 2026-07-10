import type { Course, Question } from "@/types";
import type { QuestionImport } from "@/lib/importers";
import { uid } from "@/lib/utils";

export function slugifyCourseId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
  return base || uid("course");
}

export function resolveCourse(
  courseName: string,
  courses: Course[]
): { course: Course; created: boolean } {
  const existing = courses.find(
    (c) => c.name.toLowerCase() === courseName.trim().toLowerCase()
  );
  if (existing) return { course: existing, created: false };

  const id = slugifyCourseId(courseName);
  const uniqueId = courses.some((c) => c.id === id) ? uid(id) : id;
  return {
    course: {
      id: uniqueId,
      name: courseName.trim(),
      slug: uniqueId,
      color: "violet",
      icon: "BookOpen",
      description: "",
    },
    created: true,
  };
}

export function importToQuestions(
  data: QuestionImport,
  courseId: string
): Question[] {
  return data.questions.map((q, i) => {
    const number = q.number ?? q.id ?? i + 1;
    const id = `${courseId}-${data.year}-${number}`;
    return {
      id,
      number,
      courseId,
      year: data.year,
      type: q.type ?? "single",
      prompt: q.prompt,
      options: q.options.map((text, j) => ({
        id: String.fromCharCode(97 + j),
        text,
      })),
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty ?? "medium",
      topic: q.topic ?? "General",
      subtopic: q.subtopic,
      explanation: q.explanation,
      hint: q.hint,
      tags: q.tags,
      image: q.image,
      code: q.code,
      math: q.math,
      estimatedTime: q.estimatedTime ?? 60,
    };
  });
}
