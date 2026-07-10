import type { QuestionImport } from "@/lib/importers";

/**
 * Parse plain-text exam files. Supports blocks like:
 *
 * 1. Question prompt here?
 * A) option one
 * B) option two
 * C) option three
 * D) option four
 * Answer: B
 */
export function parseQuestionsText(
  text: string,
  meta?: { course?: string; year?: number }
): QuestionImport {
  const blocks = text
    .split(/\n(?=\d+[\.\)]\s)/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (!blocks.length) {
    throw new Error("No questions found. Start each question with a number like '1.'");
  }

  const questions: QuestionImport["questions"] = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const head = lines[0];
    const numMatch = head.match(/^(\d+)[\.\)]\s*(.*)$/);
    if (!numMatch) continue;

    const number = Number(numMatch[1]);
    let prompt = numMatch[2].trim();
    const options: string[] = [];
    let correctAnswer: number | undefined;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const optMatch = line.match(/^([A-Da-d]|[1-4])[\.\)]\s*(.+)$/);
      const ansMatch = line.match(/^answer\s*[:：]\s*([A-Da-d1-4])/i);

      if (ansMatch) {
        correctAnswer = letterToIndex(ansMatch[1]);
      } else if (optMatch) {
        options.push(optMatch[2].trim());
      } else if (!prompt) {
        prompt = line;
      } else if (options.length === 0) {
        prompt += " " + line;
      }
    }

    if (!prompt || options.length < 2) {
      throw new Error(`Question ${number}: needs a prompt and at least 2 options`);
    }

    questions.push({
      number,
      prompt,
      options,
      correctAnswer,
      type: "single",
      difficulty: "medium",
      topic: "General",
      estimatedTime: 60,
    });
  }

  if (!questions.length) {
    throw new Error("Could not parse any questions from the text");
  }

  return {
    year: meta?.year ?? new Date().getFullYear(),
    course: meta?.course ?? "My Course",
    questions,
  };
}

function letterToIndex(raw: string): number {
  const c = raw.toUpperCase();
  if (c >= "A" && c <= "D") return c.charCodeAt(0) - 65;
  const n = Number(c);
  return Number.isFinite(n) ? n - 1 : 0;
}
