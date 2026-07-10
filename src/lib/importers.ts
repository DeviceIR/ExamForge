import type { AnswerKey, AnswerKeyEntry, Question } from "@/types";

// ============================================================
// Answer key importers
// ============================================================

export function parseAnswerKeyJSON(text: string): AnswerKey {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object")
    throw new Error("Invalid JSON: expected an object");
  if (typeof data.year !== "number") throw new Error("Missing numeric 'year'");
  if (typeof data.course !== "string") throw new Error("Missing 'course'");
  if (!Array.isArray(data.questions))
    throw new Error("Missing 'questions' array");

  const questions: AnswerKeyEntry[] = data.questions.map(
    (q: any, i: number) => {
      if (typeof q.id !== "number")
        throw new Error(`Question ${i}: missing numeric 'id'`);
      if (typeof q.answer !== "number")
        throw new Error(`Question ${q.id}: missing numeric 'answer'`);
      return { id: q.id, answer: q.answer };
    }
  );

  return { year: data.year, course: data.course, questions };
}

export function parseAnswerKeyCSV(text: string): AnswerKey {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) throw new Error("CSV is empty");

  // detect header
  const first = lines[0].toLowerCase();
  let start = 0;
  let course = "Imported";
  let year = new Date().getFullYear();
  if (first.includes("question") && first.includes("answer")) {
    start = 1;
    const headerCols = first.split(",").map((s) => s.trim());
    if (headerCols.length >= 3) {
      const ci = headerCols.findIndex((c) => c.includes("course"));
      const yi = headerCols.findIndex((c) => c.includes("year"));
      const row = lines[0].split(",").map((s) => s.trim());
      if (ci >= 0) course = row[ci] || course;
      if (yi >= 0 && row[yi]) year = Number(row[yi]) || year;
    }
  }

  const questions: AnswerKeyEntry[] = [];
  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(",").map((s) => s.trim());
    const id = Number(cols[0]);
    const answer = Number(cols[1]);
    if (!Number.isFinite(id) || !Number.isFinite(answer))
      throw new Error(`Row ${i + 1}: expected numeric id,answer`);
    questions.push({ id, answer });
  }

  return { year, course, questions };
}

export function applyAnswerKey(
  key: AnswerKey,
  questions: Question[],
  idMap?: (q: Question) => number
): { updated: number; missing: number } {
  const byNumber = new Map<number, Question>();
  for (const q of questions) {
    byNumber.set(idMap ? idMap(q) : q.number, q);
  }
  let updated = 0;
  let missing = 0;
  for (const entry of key.questions) {
    const q = byNumber.get(entry.id);
    if (!q) {
      missing++;
      continue;
    }
    q.correctAnswer = entry.answer - 1; // 1-based -> 0-based index
    updated++;
  }
  return { updated, missing };
}

// ============================================================
// Question importers
// ============================================================

export interface QuestionImport {
  year: number;
  course: string;
  questions: Array<{
    id?: number;
    number?: number;
    prompt: string;
    type?: Question["type"];
    options: string[];
    correctAnswer?: number | number[];
    difficulty?: Question["difficulty"];
    topic?: string;
    subtopic?: string;
    explanation?: string;
    hint?: string;
    tags?: string[];
    image?: string;
    code?: string;
    math?: string;
    estimatedTime?: number;
  }>;
}

export function parseQuestionsJSON(text: string): QuestionImport {
  const data = JSON.parse(text);
  if (typeof data.year !== "number") throw new Error("Missing numeric 'year'");
  if (typeof data.course !== "string") throw new Error("Missing 'course'");
  if (!Array.isArray(data.questions))
    throw new Error("Missing 'questions' array");

  const questions = data.questions.map((q: any, i: number) => {
    if (typeof q.prompt !== "string")
      throw new Error(`Question ${i}: missing 'prompt' string`);
    if (!Array.isArray(q.options) || q.options.length < 2)
      throw new Error(`Question ${i}: needs at least 2 options`);
    return {
      id: q.id,
      number: q.number,
      prompt: q.prompt,
      type: q.type ?? "single",
      options: q.options.map(String),
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

  return { year: data.year, course: data.course, questions };
}

/** Parse a simple CSV of questions with columns:
 *  number,prompt,optionA,optionB,optionC,optionD,answer(1-based),difficulty,topic
 */
export function parseQuestionsCSV(text: string): QuestionImport {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV needs a header + rows");

  const header = lines[0].toLowerCase().split(",").map((s) => s.trim());
  const idx = (name: string) => header.findIndex((h) => h === name);
  const iNum = idx("number") >= 0 ? idx("number") : 0;
  const iPrompt = header.findIndex((h) => h.includes("prompt") || h.includes("question"));
  const iAnswer = header.findIndex((h) => h.includes("answer"));
  const iDiff = header.findIndex((h) => h.includes("diff"));
  const iTopic = header.findIndex((h) => h.includes("topic"));
  const optCols = header
    .map((h, i) => ({ h, i }))
    .filter(
      ({ h }) =>
        h.startsWith("option") ||
        ["a", "b", "c", "d", "e"].includes(h)
    )
    .map(({ i }) => i);

  if (iPrompt < 0) throw new Error("Missing 'prompt'/'question' column");
  if (optCols.length < 2) throw new Error("Need at least 2 option columns");
  if (iAnswer < 0) throw new Error("Missing 'answer' column");

  const questions = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = splitCsvLine(lines[r]);
    const num = Number(cols[iNum]) || r;
    const prompt = cols[iPrompt];
    const options = optCols.map((i) => cols[i] ?? "");
    const answer = Number(cols[iAnswer]);
    const questions_row: QuestionImport["questions"][number] = {
      number: num,
      prompt,
      options,
      correctAnswer: Number.isFinite(answer) ? answer - 1 : undefined,
      difficulty: (cols[iDiff]?.toLowerCase() as any) || "medium",
      topic: iTopic >= 0 ? cols[iTopic] || "General" : "General",
    };
    questions.push(questions_row);
  }

  return {
    year: new Date().getFullYear(),
    course: "Imported",
    questions,
  };
}

function splitCsvLine(line: string): string[] {
  // simple splitter that supports "quoted,values"
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

// ============================================================
// Exporters
// ============================================================

export function toCSV(rows: (string | number)[][]): string {
  return rows
    .map((r) =>
      r
        .map((cell) => {
          const s = String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\n");
}
