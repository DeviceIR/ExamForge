import { describe, it, expect } from "vitest";
import {
  parseAnswerKeyJSON,
  parseAnswerKeyCSV,
  parseQuestionsJSON,
  parseQuestionsCSV,
  applyAnswerKey,
  toCSV,
} from "@/lib/importers";
import type { Question } from "@/types";

function q(number: number): Question {
  return {
    id: `c-1-${number}`,
    number,
    courseId: "c",
    year: 1,
    type: "single",
    prompt: `Q${number}`,
    options: [
      { id: "a", text: "1" },
      { id: "b", text: "2" },
      { id: "c", text: "3" },
      { id: "d", text: "4" },
    ],
    difficulty: "medium",
    topic: "General",
    estimatedTime: 60,
  };
}

describe("parseAnswerKeyJSON", () => {
  it("parses a valid key", () => {
    const key = parseAnswerKeyJSON(
      JSON.stringify({ year: 1, course: "Math", questions: [{ id: 1, answer: 3 }] })
    );
    expect(key.questions).toEqual([{ id: 1, answer: 3 }]);
  });

  it("throws on missing year", () => {
    expect(() => parseAnswerKeyJSON(JSON.stringify({ course: "x", questions: [] }))).toThrow();
  });
});

describe("parseAnswerKeyCSV", () => {
  it("parses header + rows", () => {
    const key = parseAnswerKeyCSV("question,answer\n1,3\n2,1");
    expect(key.questions).toEqual([
      { id: 1, answer: 3 },
      { id: 2, answer: 1 },
    ]);
  });
});

describe("applyAnswerKey", () => {
  it("maps 1-based answers to 0-based indexes", () => {
    const questions = [q(1), q(2)];
    const res = applyAnswerKey(
      { year: 1, course: "c", questions: [{ id: 1, answer: 3 }, { id: 2, answer: 1 }] },
      questions
    );
    expect(res.updated).toBe(2);
    expect(res.missing).toBe(0);
    expect(questions[0].correctAnswer).toBe(2); // 3 -> index 2
    expect(questions[1].correctAnswer).toBe(0); // 1 -> index 0
  });

  it("counts unmatched entries", () => {
    const res = applyAnswerKey(
      { year: 1, course: "c", questions: [{ id: 99, answer: 1 }] },
      [q(1)]
    );
    expect(res.updated).toBe(0);
    expect(res.missing).toBe(1);
  });
});

describe("parseQuestionsJSON", () => {
  it("parses questions with defaults", () => {
    const data = parseQuestionsJSON(
      JSON.stringify({
        year: 1,
        course: "Math",
        questions: [{ prompt: "2+2?", options: ["3", "4"], correctAnswer: 1 }],
      })
    );
    expect(data.questions[0].difficulty).toBe("medium");
    expect(data.questions[0].topic).toBe("General");
  });

  it("throws when a question has <2 options", () => {
    expect(() =>
      parseQuestionsJSON(
        JSON.stringify({ year: 1, course: "x", questions: [{ prompt: "q", options: ["a"] }] })
      )
    ).toThrow();
  });
});

describe("parseQuestionsCSV", () => {
  it("parses option columns and 1-based answer", () => {
    const csv = "number,prompt,optionA,optionB,optionC,optionD,answer\n1,What?,a,b,c,d,2";
    const data = parseQuestionsCSV(csv);
    expect(data.questions[0].options).toEqual(["a", "b", "c", "d"]);
    expect(data.questions[0].correctAnswer).toBe(1); // 2 -> index 1
  });
});

describe("toCSV", () => {
  it("escapes cells with commas and quotes", () => {
    const csv = toCSV([["a", "b,c", 'quote"d']]);
    expect(csv).toBe('a,"b,c","quote""d"');
  });
});
