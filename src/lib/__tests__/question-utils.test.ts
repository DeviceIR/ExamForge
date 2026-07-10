import { describe, it, expect } from "vitest";
import {
  slugifyCourseId,
  resolveCourse,
  importToQuestions,
} from "@/lib/question-utils";
import type { Course } from "@/types";

describe("slugifyCourseId", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyCourseId("My Great Course")).toBe("my-great-course");
  });
  it("strips punctuation", () => {
    expect(slugifyCourseId("Math 101!")).toBe("math-101");
  });
});

describe("resolveCourse", () => {
  const courses: Course[] = [
    { id: "math", name: "Math", slug: "math", color: "violet" },
  ];

  it("returns existing course when name matches (case-insensitive)", () => {
    const { course, created } = resolveCourse("math", courses);
    expect(created).toBe(false);
    expect(course.id).toBe("math");
  });

  it("creates a new course when name is new", () => {
    const { course, created } = resolveCourse("Physics", courses);
    expect(created).toBe(true);
    expect(course.name).toBe("Physics");
    expect(course.id).toBe("physics");
  });
});

describe("importToQuestions", () => {
  it("maps import data to Question objects with stable ids", () => {
    const qs = importToQuestions(
      {
        year: 2,
        course: "Math",
        questions: [
          { number: 1, prompt: "2+2?", options: ["3", "4"], correctAnswer: 1 },
        ],
      },
      "math"
    );
    expect(qs).toHaveLength(1);
    expect(qs[0].id).toBe("math-2-1");
    expect(qs[0].options.map((o) => o.text)).toEqual(["3", "4"]);
    expect(qs[0].correctAnswer).toBe(1);
    expect(qs[0].courseId).toBe("math");
    expect(qs[0].year).toBe(2);
  });

  it("falls back to positional numbering", () => {
    const qs = importToQuestions(
      { year: 1, course: "X", questions: [{ prompt: "q", options: ["a", "b"] }] },
      "x"
    );
    expect(qs[0].number).toBe(1);
    expect(qs[0].id).toBe("x-1-1");
  });
});
