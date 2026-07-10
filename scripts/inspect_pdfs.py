# -*- coding: utf-8 -*-
import fitz
import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent / "output"
OUT.mkdir(exist_ok=True)

paths = {
    "questions": Path(r"c:\Users\Erf\Downloads\کنکور\91\CE_91.pdf"),
    "key": Path(r"c:\Users\Erf\Downloads\کنکور\91\CE_91_Key.pdf"),
}

for name, path in paths.items():
    doc = fitz.open(path)
    report = {"pages": doc.page_count, "samples": []}
    for i in range(doc.page_count):
        page = doc[i]
        text = page.get_text()
        blocks = page.get_text("dict")["blocks"]
        images = page.get_images()
        report["samples"].append({
            "page": i + 1,
            "text_len": len(text),
            "blocks": len(blocks),
            "images": len(images),
            "text_preview": text[:500],
        })
    (OUT / f"{name}_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    # full text dump
    full = "\n\n".join(
        f"--- page {i+1} ---\n{doc[i].get_text()}" for i in range(doc.page_count)
    )
    (OUT / f"{name}_raw.txt").write_text(full, encoding="utf-8")
    doc.close()
    print(f"{name}: {report['pages']} pages -> {OUT / f'{name}_raw.txt'}")

print("done")
