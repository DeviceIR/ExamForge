# -*- coding: utf-8 -*-
import fitz
import json
from pathlib import Path

KEY = Path(r"c:\Users\Erf\Downloads\کنکور\91\CE_91_Key.pdf")
OUT = Path(__file__).resolve().parent / "output"
AR = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

doc = fitz.open(KEY)
pages = []
for pi in range(doc.page_count):
    words = doc[pi].get_text("words")
    rows = {}
    for w in words:
        t = w[4].strip().translate(AR)
        if not t:
            continue
        y = round(w[1], 1)
        rows.setdefault(y, []).append({"x": round(w[0], 1), "t": t})
    sorted_rows = []
    for y in sorted(rows.keys()):
        sorted_rows.append({"y": y, "cells": sorted(rows[y], key=lambda c: c["x"])})
    pages.append({"page": pi + 1, "rows": sorted_rows[:40]})

doc.close()
(OUT / "key_layout.json").write_text(json.dumps(pages, ensure_ascii=False, indent=2), encoding="utf-8")
print("written", OUT / "key_layout.json")
