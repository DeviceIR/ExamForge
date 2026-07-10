<div align="center">

# 🎓 ExamForge

**Build your own question bank, take timed exams, and track your progress — all local-first.**

A bilingual (English 🇬🇧 / Persian 🇮🇷), fully RTL-aware exam platform built with Next.js 14, TypeScript, and Zustand.

[![CI](https://github.com/DeviceIR/exam-forge/actions/workflows/ci.yml/badge.svg)](https://github.com/DeviceIR/exam-forge/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

[Live Demo](#) · [Report Bug](https://github.com/DeviceIR/exam-forge/issues) · [Author](https://github.com/DeviceIR)

</div>

---

## ✨ Overview

ExamForge is a client-side, local-first exam preparation platform. Users create their own courses and exam sets by **importing files**, **extracting from plain text**, or **writing questions manually** — then take realistic timed exams, practice by topic, and analyze their performance over time. All data lives in the browser via `localStorage`, so there's no backend required.

> Built as a showcase of modern front-end engineering: App Router, strict TypeScript, state management, i18n/RTL, animation, testing, and CI.

## 🖼️ Screenshots

<!-- Replace with real screenshots / GIFs -->
| Dashboard | Exam runner | Library |
|-----------|-------------|---------|
| _add screenshot_ | _add screenshot_ | _add screenshot_ |

## 🚀 Features

- **Three ways to add questions**
  - 📁 **File import** — JSON / CSV for questions and answer keys (drag & drop)
  - 📝 **Text extract** — paste or upload a `.txt` file in a simple `1. …  A) …  Answer: B` format
  - ✍️ **Manual editor** — write and edit questions with a form
- **Full exam runner** — countdown timer, question palette, mark-for-review, bookmarks, per-question notes, keyboard shortcuts, fullscreen, auto-submit
- **Practice modes** — smart study (weak topics), random mix, wrong answers, bookmarked, by topic, by exam set
- **Rich analytics** — score trends, topic mastery, difficulty breakdown, per-exam-set comparison
- **Gamification** — achievements, daily goals, study streaks, activity heatmap
- **Library management** — view, edit, add, and delete questions per exam set; delete whole sets or courses
- **Bilingual & RTL** — instant English/Persian switch with automatic LTR/RTL layout and Persian digits
- **Polished UX** — dark/light/system themes, framer-motion animations, KaTeX math, responsive design

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) (strict) |
| State | [Zustand](https://github.com/pmndrs/zustand) + `localStorage` persistence |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + custom design tokens |
| UI primitives | [Radix UI](https://www.radix-ui.com/) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Charts | [Recharts](https://recharts.org/) |
| Math | [KaTeX](https://katex.org/) |
| Testing | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) |
| CI | GitHub Actions |

## 🏗️ Architecture & Decisions

- **Local-first** — the entire app runs in the browser with no server. A single persisted Zustand store (`src/store/exam-store.ts`) is the source of truth; selectors derive courses, exam sets, and stats on demand.
- **Data model** — content is organized as **Course → Exam Set (numeric id) → Questions**. This keeps the schema generic (not tied to any specific exam).
- **Pure, testable core** — parsing (`text-parser`, `importers`), scoring (`result.ts`), and helpers (`utils`) are pure functions with no React dependency, making them fast and easy to unit-test.
- **i18n without a heavy library** — a small typed `useTranslation()` hook reads mirrored `en.json` / `fa.json` message files and syncs `<html dir>` for RTL, with automatic Persian-digit formatting.
- **Resilient routing** — `useRouteParams` supports both Next 14 (sync) and Next 15+ (Promise) param shapes; App Router `error`/`loading`/`not-found` boundaries handle failures gracefully.

```
src/
├── app/                 # App Router pages, layouts, error/loading boundaries
│   ├── (app)/           # Shell-wrapped routes (dashboard, exams, practice, …)
│   └── exam/[attemptId] # Full-screen exam runner
├── components/          # UI, exam widgets, library editors, providers
├── store/               # Zustand store (single source of truth)
├── lib/                 # Pure logic: parsers, scoring, utils (unit-tested)
├── i18n/                # Translation hook + en/fa message files
└── types/               # Domain types
```

## 🧑‍💻 Getting Started

### Prerequisites
- Node.js 20+

### Installation

```bash
git clone https://github.com/DeviceIR/exam-forge.git
cd exam-forge
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |
| `npm test` | Run the Vitest suite |
| `npm run test:watch` | Watch mode |

## 🧪 Testing

Core logic is covered by unit tests (parsers, scoring, question utilities, helpers):

```bash
npm test
```

## 📥 Import Formats

<details>
<summary><strong>Questions (JSON)</strong></summary>

```json
{
  "year": 1,
  "course": "Math",
  "questions": [
    {
      "number": 1,
      "prompt": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": 1,
      "difficulty": "easy",
      "topic": "Arithmetic"
    }
  ]
}
```
</details>

<details>
<summary><strong>Plain text</strong></summary>

```
1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
Answer: B
```
</details>

<details>
<summary><strong>Answer key (JSON)</strong></summary>

```json
{ "year": 1, "course": "Math", "questions": [{ "id": 1, "answer": 2 }] }
```
</details>

## 🗺️ Roadmap

- [ ] Full library export/import (JSON backup & share)
- [ ] PWA / offline support
- [ ] Image support for question stems
- [ ] Named exam sets (string labels)

## 📄 License

[MIT](./LICENSE) © [Erfan Bastani (DeviceIR)](https://github.com/DeviceIR)
