import { describe, it, expect } from "vitest";
import { parseQuestionsText } from "@/lib/text-parser";

describe("parseQuestionsText", () => {
  const sample = `1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
Answer: B

2. 2 + 2 = ?
A) 3
B) 4
C) 5
Answer: B`;

  it("parses multiple question blocks", () => {
    const result = parseQuestionsText(sample, { course: "Geo", year: 2 });
    expect(result.questions).toHaveLength(2);
    expect(result.course).toBe("Geo");
    expect(result.year).toBe(2);
  });

  it("extracts prompt, options and correct answer index", () => {
    const { questions } = parseQuestionsText(sample);
    expect(questions[0].prompt).toBe("What is the capital of France?");
    expect(questions[0].options).toEqual(["London", "Paris", "Berlin", "Madrid"]);
    // "Answer: B" -> index 1
    expect(questions[0].correctAnswer).toBe(1);
  });

  it("supports numeric answers and variable option counts", () => {
    const { questions } = parseQuestionsText(sample);
    expect(questions[1].options).toHaveLength(3);
    expect(questions[1].correctAnswer).toBe(1);
  });

  it("throws when there are no numbered questions", () => {
    expect(() => parseQuestionsText("just some text")).toThrow();
  });

  it("throws when a question has fewer than 2 options", () => {
    expect(() =>
      parseQuestionsText("1. Lonely question?\nA) only one\nAnswer: A")
    ).toThrow();
  });

  it("defaults course and year when meta is omitted", () => {
    const result = parseQuestionsText("1. Q?\nA) a\nB) b\nAnswer: A");
    expect(result.course).toBe("My Course");
    expect(typeof result.year).toBe("number");
  });
});
