# -*- coding: utf-8 -*-
"""
Parse Sanjesh Konkur answer-key PDF (CE_91_Key.pdf).

Layout patterns:
  - 3-char tokens: QQ A  (question 2 digits + answer 1 digit) e.g. 113 -> Q11, A3
  - 2+1 pairs with RTL digit reversal in question: ('62','3') -> Q26, A3
"""
from __future__ import annotations

import fitz
import json
import re
from pathlib import Path

KEY = Path(r"c:\Users\Erf\Downloads\کنکور\91\CE_91_Key.pdf")
OUT = Path(__file__).resolve().parent / "output"
AR = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")


def normalize(text: str) -> str:
    return text.translate(AR).strip()


def fix_qnum(s: str) -> int | None:
    s = normalize(s)
    s = re.sub(r"[^\d]", "", s)
    if not s:
        return None
    if len(s) == 1:
        return int(s)
    if len(s) == 2:
        # RTL extraction often reverses digit order
        return int(s[::-1])
    if len(s) == 3:
        return int(s[:2])
    return None


def parse_token(token: str) -> tuple[int, int] | None:
    t = normalize(token)
    t = re.sub(r"[^\d]", "", t)
    if len(t) == 3:
        q, a = int(t[:2]), int(t[2])
        if 1 <= q <= 400 and a in (1, 2, 3, 4):
            return q, a
    return None


def is_header_row(cells: list[str]) -> bool:
    joined = " ".join(cells)
    if any(ch in joined for ch in "()*+"):
        return True
    if any(len(c) > 4 for c in cells if c.isascii() is False):
        return True
    persian = sum(1 for c in cells if re.search(r"[\u0600-\u06FF]", c))
    return persian >= 2


def parse_row(cells: list[str]) -> list[tuple[int, int]]:
    out: list[tuple[int, int]] = []
    i = 0
    while i < len(cells):
        c = cells[i]
        # combined 3-digit token
        p = parse_token(c)
        if p:
            out.append(p)
            i += 1
            continue
        # pair: question + answer
        if i + 1 < len(cells):
            q = fix_qnum(c)
            a_raw = normalize(cells[i + 1])
            a_raw = re.sub(r"[^\d]", "", a_raw)
            if q and a_raw and len(a_raw) == 1:
                a = int(a_raw)
                if 1 <= q <= 400 and a in (1, 2, 3, 4):
                    out.append((q, a))
                    i += 2
                    continue
        i += 1
    return out


def extract_key(path: Path) -> dict:
    doc = fitz.open(path)
    answers: dict[int, int] = {}
    debug_rows: list[dict] = []

    for pi in range(doc.page_count):
        words = doc[pi].get_text("words")
        by_y: dict[float, list[tuple[float, str]]] = {}
        for w in words:
            t = w[4].strip()
            if not t:
                continue
            y = round(w[1], 0)
            by_y.setdefault(y, []).append((w[0], t))

        for y in sorted(by_y.keys()):
            cells = [t for _, t in sorted(by_y[y], key=lambda x: x[0])]
            if is_header_row(cells):
                continue
            parsed = parse_row(cells)
            if parsed:
                debug_rows.append({"page": pi + 1, "y": y, "cells": cells, "parsed": parsed})
                for q, a in parsed:
                    answers.setdefault(q, a)
    doc.close()
    return {"answers": answers, "debug_rows": debug_rows}


def main():
    OUT.mkdir(exist_ok=True)
    data = extract_key(KEY)
    answers = data["answers"]
    items = sorted(answers.items())
    result = {
        "year": 1391,
        "course": "ce",
        "courseName": "کنکور مهندسی کامپیوتر",
        "title": "کنکور سراسری مهندسی کامپیوتر ۱۳۹۱",
        "total": len(items),
        "questions": [{"id": q, "answer": a} for q, a in items],
    }
    (OUT / "ce_91_key.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Extracted {len(items)} answers")
    if items:
        print(f"Range: Q{items[0][0]} .. Q{items[-1][0]}")
        # sanity: answer distribution
        from collections import Counter
        dist = Counter(a for _, a in items)
        print("Answer distribution:", dict(sorted(dist.items())))


if __name__ == "__main__":
    main()
