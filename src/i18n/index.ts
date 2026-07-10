"use client";

import * as React from "react";
import en from "./messages/en.json";
import fa from "./messages/fa.json";
import type { AppLanguage } from "@/types";
import { useExamStore } from "@/store/exam-store";
import { toFaDigits } from "@/lib/utils";

type Messages = typeof en;

const MESSAGES: Record<AppLanguage, Messages> = { en, fa };

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] != null ? String(params[key]) : `{${key}}`
  );
}

export function formatLocalizedNumber(
  value: string | number,
  lang: AppLanguage
): string {
  return lang === "fa" ? toFaDigits(value) : String(value);
}

export function useTranslation() {
  const language = useExamStore((s) => s.settings.language);

  const t = React.useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const raw =
        getNested(MESSAGES[language] as Record<string, unknown>, key) ??
        getNested(MESSAGES.en as Record<string, unknown>, key) ??
        key;
      const text = interpolate(raw, params);
      if (language === "fa" && params) {
        // Localize numeric params in Persian strings
        return text.replace(/\d+/g, (m) => toFaDigits(m));
      }
      return text;
    },
    [language]
  );

  return { t, language, isRtl: language === "fa" };
}

/** Sync html lang/dir with store language. */
export function LocaleSync() {
  const language = useExamStore((s) => s.settings.language);

  React.useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === "fa" ? "rtl" : "ltr";
  }, [language]);

  return null;
}

export function localizeQuestion<T extends {
  prompt: string;
  options: { id: string; text: string; image?: string }[];
  topic: string;
  explanation?: string;
  i18n?: Partial<Record<AppLanguage, {
    prompt?: string;
    options?: string[];
    topic?: string;
    explanation?: string;
  }>>;
}>(question: T, lang: AppLanguage): T {
  const loc = question.i18n?.[lang];
  if (!loc) return question;
  return {
    ...question,
    prompt: loc.prompt ?? question.prompt,
    topic: loc.topic ?? question.topic,
    explanation: loc.explanation ?? question.explanation,
    options: question.options.map((opt, i) => ({
      ...opt,
      text: loc.options?.[i] ?? opt.text,
    })),
  };
}
