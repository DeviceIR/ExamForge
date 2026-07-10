# -*- coding: utf-8 -*-
"""
Process Konkur exam PDFs from the workspace کنکور folder into public/konkur/{year}/.

Usage:
  py -3 scripts/process_konkur.py
  py -3 scripts/process_konkur.py --year 1400
  py -3 scripts/process_konkur.py --keys-only
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import fitz
import numpy as np
from PIL import Image

# Allow running as script from repo root
sys.path.insert(0, str(Path(__file__).resolve().parent))
from key_parser import extract_key, key_stats  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
KONKUR_DIR = ROOT / "کنکور"
OUT_DIR = ROOT / "public" / "konkur"

DARK = 110
TOP_CROP = 150
BOT_CROP = 90
MIN_CROP_H = 80
ZOOM = 1.5

ALL_YEARS = list(range(1391, 1405))

# Manual overrides when auto-discovery is ambiguous
MANUAL_MAP: dict[int, dict[str, str | None]] = {
    1391: {"questions": "CE_91.pdf", "key": "CE_91_Key.pdf"},
    1392: {"questions": "92.pdf", "key": "CE_92_B_key.pdf"},
    1394: {"questions": "94.pdf", "key": "94-key.pdf"},
    1395: {"questions": "95.pdf", "key": "CE_95_Key.pdf"},
    1396: {"questions": "96.pdf", "key": "COM_96_C_Key.pdf"},
    1397: {"questions": "97.pdf", "key": "COM_97_E_Key.pdf"},
    1398: {"questions": "98.pdf", "key": "COM_98_C_Key.pdf"},
    1399: {"questions": "99.pdf", "key": "COM_99_B_Key.pdf"},
    1400: {"questions": "1400.pdf", "key": "CE_1400_A_Final_Key.pdf"},
    1401: {"questions": "1401.pdf", "key": "CE_1401_B_Key.pdf"},
    1402: {"questions": "1402.pdf", "key": "CE_1402_C_Key.pdf"},
    1403: {"questions": "1403.pdf", "key": "CE_1403_C_Final_Key.pdf"},
}


def discover_exams() -> list[dict]:
    pdfs = list(KONKUR_DIR.glob("*.pdf")) if KONKUR_DIR.exists() else []
    by_name = {p.name: p for p in pdfs}
    by_lower = {p.name.lower(): p for p in pdfs}

    entries: list[dict] = []
    for year in ALL_YEARS:
        yy = year - 1300
        yy2 = f"{yy:02d}" if yy < 100 else str(yy)

        manual = MANUAL_MAP.get(year, {})
        q_name = manual.get("questions")
        k_name = manual.get("key")

        if not q_name:
            for cand in (
                f"CE_{yy2}.pdf",
                f"ce_{yy2}.pdf",
                f"{yy2}.pdf",
                f"{year}.pdf",
            ):
                if cand in by_name:
                    q_name = cand
                    break
                if cand.lower() in by_lower:
                    q_name = by_lower[cand.lower()].name
                    break

        if not k_name:
            key_cands: list[str] = []
            for p in pdfs:
                nl = p.name.lower()
                if "key" not in nl and "-key" not in nl:
                    continue
                if (
                    str(year) in nl
                    or f"_{yy2}" in nl
                    or nl.startswith(f"{yy2}-key")
                    or f"ce_{yy2}" in nl
                    or f"com_{yy2}" in nl
                ):
                    key_cands.append(p.name)
            if key_cands:
                key_cands.sort(
                    key=lambda n: (
                        "final" not in n.lower(),
                        "com_" in n.lower(),
                        len(n),
                    )
                )
                k_name = key_cands[0]

        q_exists = bool(q_name and (KONKUR_DIR / q_name).exists())
        k_exists = bool(k_name and (KONKUR_DIR / k_name).exists())

        entries.append(
            {
                "year": year,
                "questions": q_name if q_exists else None,
                "key": k_name if k_exists else None,
                "available": q_exists,
                "hasKeyFile": k_exists,
            }
        )
    return entries


def render_page(page, zoom: float = 1.0) -> Image.Image:
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
    return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)


def find_anchors(img: Image.Image, lo: float = 0.90, hi: float = 0.99) -> tuple[list[int], int]:
    g = np.asarray(img.convert("L"))
    h, w = g.shape
    ink = g < DARK
    x0, x1 = int(w * lo), int(w * hi)
    strip_row = ink[:, x0:x1].sum(axis=1)
    top, bot = TOP_CROP, h - BOT_CROP
    mark = np.zeros(h, dtype=bool)
    for y in range(top, bot):
        if strip_row[y] >= 2:
            mark[y] = True
    groups: list[int] = []
    y = top
    while y < bot:
        if mark[y]:
            s = y
            while y < bot and (
                mark[y]
                or (y + 1 < bot and mark[y + 1])
                or (y + 2 < bot and mark[y + 2])
            ):
                y += 1
            groups.append(s)
        else:
            y += 1
    return groups, h


def slice_questions(q_path: Path, out_dir: Path) -> list[tuple[int, str, int, int]]:
    doc = fitz.open(q_path)
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest: list[tuple[int, str, int, int]] = []
    qnum = 1

    for pi in range(doc.page_count):
        img1 = render_page(doc[pi], 1.0)
        starts, h = find_anchors(img1)
        if not starts:
            # Fallback: one full-page question when margin anchors aren't detected
            bounds = [(TOP_CROP, h - BOT_CROP)]
        else:
            ends = starts[1:] + [h - BOT_CROP]
            bounds = [
                (max(0, s - 34), min(h, e - 6))
                for s, e in zip(starts, ends)
                if (e - s) >= MIN_CROP_H
            ]
        if not bounds:
            continue

        pix = doc[pi].get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM))
        hi = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        for ci, (s, e) in enumerate(bounds):
            crop = hi.crop((0, int(s * ZOOM), hi.width, int(e * ZOOM)))
            fn = f"q{qnum:03d}.png"
            crop.save(out_dir / fn, optimize=True)
            manifest.append((qnum, fn, pi, ci))
            qnum += 1

    doc.close()
    return manifest


def build_exam_json(
    year: int,
    manifest: list[tuple[int, str, int, int]],
    answers: dict[int, int],
) -> dict:
    questions = []
    for qnum, fn, _pi, _ci in manifest:
        ans = answers.get(qnum)
        questions.append(
            {
                "number": qnum,
                "prompt": f"Question {qnum}",
                "promptFa": f"سؤال {qnum}",
                "type": "single",
                "options": ["1", "2", "3", "4"],
                "optionsFa": ["گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴"],
                "correctAnswer": (ans - 1) if ans else None,
                "image": f"/konkur/{year}/{fn}",
                "difficulty": "medium",
                "topic": "Konkur",
                "topicFa": "کنکور",
                "estimatedTime": 90,
            }
        )

    keyed = sum(1 for q in questions if q["correctAnswer"] is not None)
    return {
        "year": year,
        "course": "cs",
        "courseName": "Computer Engineering Konkur",
        "courseNameFa": "کنکور مهندسی کامپیوتر",
        "title": f"Konkur Computer Engineering {year}",
        "titleFa": f"کنکور مهندسی کامپیوتر {year}",
        "questionCount": len(questions),
        "keyedCount": keyed,
        "keyTotal": len(answers),
        "duration": 180 * 60,
        "questions": questions,
    }


def process_exam(entry: dict, keys_only: bool = False, skip_images: bool = False) -> dict | None:
    year = entry["year"]
    q_file = entry.get("questions")
    k_file = entry.get("key")

    if not q_file:
        print(f"  SKIP {year}: no question PDF")
        return {
            "year": year,
            "available": False,
            "hasKey": False,
            "questionCount": 0,
            "keyedCount": 0,
            "keyTotal": 0,
        }

    q_path = KONKUR_DIR / q_file
    k_path = KONKUR_DIR / k_file if k_file else None

    print(f"Processing {year}: {q_file} + {k_file or '(no key)'}")

    answers: dict[int, int] = {}
    if k_path and k_path.exists():
        answers = extract_key(k_path, verbose=True)
        st = key_stats(answers)
        print(f"  Key parsed: {st['count']} (Q{st['min']}-{st['max']}) {st['distribution']}")

    out_dir = OUT_DIR / str(year)
    out_dir.mkdir(parents=True, exist_ok=True)

    manifest: list[tuple[int, str, int, int]] = []
    if not keys_only and not skip_images:
        manifest = slice_questions(q_path, out_dir)
        print(f"  Images: {len(manifest)} question crops")
    elif (out_dir / "exam.json").exists():
        prev = json.loads((out_dir / "exam.json").read_text(encoding="utf-8"))
        manifest = [
            (q["number"], q["image"].split("/")[-1], 0, 0)
            for q in prev.get("questions", [])
        ]

    exam = build_exam_json(year, manifest, answers)
    (out_dir / "exam.json").write_text(
        json.dumps(exam, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    manifest_map = {str(qnum): fn for qnum, fn, _, _ in manifest}
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest_map, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    return {
        "year": year,
        "questionsFile": q_file,
        "keyFile": k_file,
        "available": True,
        "questionCount": exam["questionCount"],
        "keyedCount": exam["keyedCount"],
        "keyTotal": exam["keyTotal"],
        "hasKey": len(answers) > 0,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, help="Process a single year")
    parser.add_argument("--keys-only", action="store_true", help="Re-parse keys only")
    parser.add_argument("--skip-images", action="store_true", help="Skip question slicing")
    args = parser.parse_args()

    if not KONKUR_DIR.exists():
        print(f"Konkur folder not found: {KONKUR_DIR}", file=sys.stderr)
        sys.exit(1)

    entries = discover_exams()
    if args.year:
        entries = [e for e in entries if e["year"] == args.year]

    catalog: list[dict] = []
    for entry in entries:
        if not entry.get("available"):
            catalog.append(
                {
                    "year": entry["year"],
                    "available": False,
                    "hasKey": False,
                    "questionCount": 0,
                    "keyedCount": 0,
                    "keyTotal": 0,
                }
            )
            continue
        meta = process_exam(
            entry,
            keys_only=args.keys_only,
            skip_images=args.skip_images,
        )
        if meta:
            catalog.append(meta)

    # When processing one year, merge into full catalog
    if args.year:
        cat_path = OUT_DIR / "catalog.json"
        merged: dict[int, dict] = {}
        if cat_path.exists():
            try:
                for y in json.loads(cat_path.read_text(encoding="utf-8")).get("years", []):
                    merged[y["year"]] = y
            except Exception:
                pass
        for item in catalog:
            merged[item["year"]] = item
        catalog = [merged.get(y, {"year": y, "available": False, "hasKey": False, "questionCount": 0, "keyedCount": 0, "keyTotal": 0}) for y in ALL_YEARS]

    catalog.sort(key=lambda x: x["year"])
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "catalog.json").write_text(
        json.dumps(
            {
                "courseId": "cs",
                "courseName": "Computer Engineering Konkur",
                "courseNameFa": "کنکور مهندسی کامپیوتر",
                "years": catalog,
                "yearRange": [1391, 1404],
                "generatedAt": datetime.now(timezone.utc).isoformat(),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    avail = sum(1 for c in catalog if c.get("available"))
    keyed = sum(1 for c in catalog if c.get("hasKey"))
    print(f"\nDone. {avail} years with PDFs, {keyed} with parsed keys -> {OUT_DIR / 'catalog.json'}")


if __name__ == "__main__":
    main()
