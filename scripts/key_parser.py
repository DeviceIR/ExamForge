# -*- coding: utf-8 -*-
"""
Konkur answer-key PDF parser — multiple Sanjesh layout strategies.

Returns dict[question_number, answer_1_to_4].
"""
from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

import fitz

AR = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
PE = str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")

SKIP_WORDS = {
    "سفید",
    "white",
    "حذف",
    "کلید",
    "پاسخنامه",
    "سوال",
    "شماره",
    "صحیح",
    "گزینه",
    "دفترچه",
    "کد",
    "نام",
    "سال",
    "آزمون",
    "کارشناسی",
    "ارشد",
    "ناپیوسته",
    "مشاهده",
    "alt",
    "سو",
    "الت",
    "اولیه",
}

# Sanjesh encoded answer letters (COM keys 96–99)
COM_ANS = {
    "C": 1,
    "H": 2,
    "I": 3,
    "J": 4,
    "B": 2,
    "K": 1,
    "G": 2,
    "A": 1,
    "D": 4,
    "E": 1,
    "F": 2,
    "L": 1,
    "M": 1,
    "N": 2,
    "O": 3,
    "P": 4,
    "Q": 1,
    "R": 2,
    "S": 3,
    "T": 4,
    "U": 1,
    "V": 2,
    "W": 3,
    "X": 4,
    "Y": 1,
    "Z": 2,
    "@": 1,
}


def norm(text: str) -> str:
    return text.translate(AR).translate(PE).strip()


def digits_only(text: str) -> str:
    return re.sub(r"[^\d]", "", norm(text))


def valid_pair(q: int, a: int) -> bool:
    return 1 <= q <= 400 and a in (1, 2, 3, 4)


def validate_key(answers: dict[int, int]) -> bool:
    if len(answers) < 10:
        return False
    if not all(valid_pair(q, a) for q, a in answers.items()):
        return False
    dist = Counter(answers.values())
    if len(answers) > 40 and len(dist) < 3:
        return False
    return True


def score_key(answers: dict[int, int]) -> float:
    if not answers:
        return 0.0
    n = len(answers)
    dist = Counter(answers.values())
    spread = len(dist) / 4.0
    mx = max(answers.keys())
    coverage = min(n / max(mx, 1), 1.0)
    return n * (0.5 + 0.3 * spread + 0.2 * coverage)


def page_rows(doc: fitz.Document, page_idx: int) -> list[list[str]]:
    """Words grouped into rows (top-to-bottom, left-to-right)."""
    words = doc[page_idx].get_text("words")
    if not words:
        return []
    y0 = min(w[1] for w in words)
    by_y: dict[float, list[tuple[float, str]]] = {}
    for w in words:
        t = w[4].strip()
        if not t:
            continue
        y = round(w[1] - y0, 0)
        by_y.setdefault(y, []).append((w[0], t))
    rows: list[list[str]] = []
    for y in sorted(by_y.keys()):
        cells = [t for _, t in sorted(by_y[y], key=lambda x: x[0])]
        rows.append(cells)
    return rows


def page_row_coords(doc: fitz.Document, page_idx: int) -> list[tuple[float, list[tuple[float, str]]]]:
    words = doc[page_idx].get_text("words")
    if not words:
        return []
    y0 = min(w[1] for w in words)
    by_y: dict[float, list[tuple[float, str]]] = {}
    for w in words:
        t = w[4].strip()
        if not t:
            continue
        y = round(w[1] - y0, 0)
        by_y.setdefault(y, []).append((w[0], t))
    return [(y, sorted(by_y[y], key=lambda x: x[0])) for y in sorted(by_y.keys())]


def is_noise_cell(cell: str) -> bool:
    c = norm(cell)
    if not c:
        return True
    if c in SKIP_WORDS:
        return True
    if c.startswith("http"):
        return True
    if re.match(r"^\d{1,2}/\d{1,2}$", c):
        return True
    if re.match(r"^\d{1,2}:\d{2}", c):
        return True
    if re.match(r"^\d{4}/\d{2}/\d{2}", c):
        return True
    if re.match(r"^[AP]M$", c, re.I):
        return True
    if re.match(r"^\d{1,2}/\d{2}/\d{2}", c):
        return True
    return False


def is_header_row(cells: list[str]) -> bool:
    joined = " ".join(cells)
    if sum(1 for c in cells if c in SKIP_WORDS or re.search(r"[\u0600-\u06FF]", c)) >= 3:
        return True
    if re.search(r"question|answer|سوال|گزینه|شماره", joined, re.I):
        return True
    if cells.count("DEFG") + cells.count("CDEF") >= 2:
        return True
    # CE_91 column headers with ()*+
    if sum(1 for c in cells if any(ch in c for ch in "()*+")) >= 3:
        return True
    return False


def fix_qnum(s: str) -> int | None:
    s = digits_only(s)
    if not s:
        return None
    if len(s) == 1:
        return int(s)
    if len(s) == 2:
        return int(s[::-1])
    if len(s) == 3:
        return int(s[:2])
    if len(s) == 4:
        return int(s[:3])
    return None


def parse_token_qqa(token: str) -> tuple[int, int] | None:
    t = digits_only(token)
    if len(t) == 3:
        q, a = int(t[:2]), int(t[2])
        if valid_pair(q, a):
            return q, a
    if len(t) == 4:
        q, a = int(t[:3]), int(t[3])
        if valid_pair(q, a):
            return q, a
    return None


def strategy_table_pairs(path: Path) -> dict[int, int]:
    """Sanjesh web table: Q, A, Q, A, … (1401, 1402, 1405, CE_95)."""
    doc = fitz.open(path)
    answers: dict[int, int] = {}
    for pi in range(doc.page_count):
        for cells in page_rows(doc, pi):
            if is_header_row(cells):
                continue
            nums: list[int] = []
            for c in cells:
                if is_noise_cell(c):
                    continue
                cn = norm(c)
                if re.search(r"[\u0600-\u06FF]", cn):
                    continue
                if re.fullmatch(r"\d+", cn):
                    nums.append(int(cn))
            for i in range(0, len(nums) - 1, 2):
                q, a = nums[i], nums[i + 1]
                if valid_pair(q, a):
                    answers[q] = a
    doc.close()
    return answers


def strategy_ce91_combined(path: Path) -> dict[int, int]:
    """CE_91: merge row pairs + triplet tokens across all pages."""
    doc = fitz.open(path)
    answers: dict[int, int] = {}
    for pi in range(doc.page_count):
        for cells in page_rows(doc, pi):
            joined = " ".join(cells)
            # Skip only full header rows (parentheses columns), not data
            if cells.count("(") >= 4 and sum(1 for c in cells if ")" in c) >= 4:
                continue
            if re.search(r"question|سوال|شماره|گزینه", joined, re.I):
                continue
            for c in cells:
                p = parse_token_qqa(c)
                if p:
                    answers.setdefault(p[0], p[1])
            i = 0
            while i < len(cells):
                c = cells[i]
                p = parse_token_qqa(c)
                if p:
                    i += 1
                    continue
                if i + 1 < len(cells):
                    q = fix_qnum(c)
                    a_raw = digits_only(cells[i + 1])
                    if q and len(a_raw) == 1:
                        a = int(a_raw)
                        if valid_pair(q, a):
                            answers.setdefault(q, a)
                            i += 2
                            continue
                i += 1
    doc.close()
    return answers


def strategy_all_triplets(path: Path) -> dict[int, int]:
    """Every 3–4 digit token in document as QQA."""
    doc = fitz.open(path)
    answers: dict[int, int] = {}
    for pi in range(doc.page_count):
        for cells in page_rows(doc, pi):
            for c in cells:
                p = parse_token_qqa(c)
                if p:
                    answers.setdefault(p[0], p[1])
    doc.close()
    return answers


def parse_merged_cell(cell: str) -> tuple[int, int | None] | None:
    """
    Parse cells like '31سفید4', '62سفید4', '86سفید3'.
    سفید = cancelled question (no reliable key) unless trailing answer is explicit.
    """
    c = norm(cell)
    m = re.match(r"^(\d+)سفید(\d)?$", c)
    if m:
        q = int(m.group(1))
        a = int(m.group(2)) if m.group(2) else None
        if a is not None and valid_pair(q, a):
            return q, a
        return q, None
    m = re.match(r"^(\d+)سفید$", c)
    if m:
        return int(m.group(1)), None
    if re.fullmatch(r"\d+", c):
        return int(c), None
    return None


def strategy_persian_rowscan(path: Path) -> dict[int, int]:
    """Row scan with merged Persian cells (1403-style)."""
    doc = fitz.open(path)
    answers: dict[int, int] = {}
    for pi in range(doc.page_count):
        for _y, cells in page_row_coords(doc, pi):
            texts = [t for _, t in cells]
            joined = " ".join(texts)
            if "شماره" in joined and "سوال" in joined:
                continue
            if texts and all(is_noise_cell(t) for t in texts):
                continue
            for c in texts:
                parsed = parse_merged_cell(c)
                if parsed and parsed[1] is not None and valid_pair(parsed[0], parsed[1]):
                    answers[parsed[0]] = parsed[1]
            flat: list[int] = []
            for c in texts:
                cn = norm(c)
                if "سفید" in cn and not re.search(r"\d+سفید\d", cn):
                    continue
                if is_noise_cell(c):
                    continue
                if re.fullmatch(r"\d+", cn):
                    flat.append(int(cn))
            i = 0
            while i < len(flat):
                if i + 2 < len(flat) and flat[i + 2] >= 10:
                    q, a = flat[i + 2], flat[i + 1]
                    if valid_pair(q, a):
                        answers[q] = a
                    i += 3
                elif i + 1 < len(flat) and flat[i + 1] >= 10:
                    q, a = flat[i + 1], flat[i]
                    if valid_pair(q, a):
                        answers[q] = a
                    i += 2
                else:
                    i += 1
    doc.close()
    return answers


def strategy_com_grid(path: Path) -> dict[int, int]:
    """COM_96–99 encoded letter grid (3-char tokens)."""
    doc = fitz.open(path)
    tokens: list[tuple[int, float, float, str]] = []
    skip_prefix = ("DEFG", "CDEF", "MNOP", "OPQR", "NOPQ", "?@A", "HIJK", "STL", "RSK")

    for pi in range(doc.page_count):
        words = doc[pi].get_text("words")
        if not words:
            continue
        y0 = min(w[1] for w in words)
        for w in words:
            t = w[4].strip()
            if len(t) != 3 or not t.isascii() or not t.isalpha():
                continue
            if t.startswith("AB") and t[2] in "CHIJBKGA":
                continue
            if any(t.startswith(p) for p in skip_prefix):
                continue
            if t.endswith("^") or "[" in t:
                continue
            tokens.append((pi, w[1] - y0, w[0], t))

    doc.close()
    tokens.sort(key=lambda x: (x[0], x[1], x[2]))

    answers: dict[int, int] = {}
    qnum = 1
    for _pi, _y, _x, t in tokens:
        a = COM_ANS.get(t[2])
        if a and valid_pair(qnum, a):
            answers[qnum] = a
        qnum += 1
    return answers


def strategy_image_grid_ocr(path: Path) -> dict[int, int]:
    """Scan image-only keys by cropping grid cells and OCR each cell."""
    try:
        from rapidocr_onnxruntime import RapidOCR
        from PIL import Image, ImageOps
        import io
        import numpy as np
    except ImportError:
        return {}

    doc = fitz.open(path)
    text_len = sum(len(doc[i].get_text()) for i in range(doc.page_count))
    if text_len > 30:
        doc.close()
        return {}

    ocr = RapidOCR()
    answers: dict[int, int] = {}

    for pi in range(min(doc.page_count, 2)):
        imgs: list[Image.Image] = []
        for info in doc[pi].get_images(full=True):
            raw = doc.extract_image(info[0])
            imgs.append(Image.open(io.BytesIO(raw["image"])))
        if not imgs:
            pix = doc[pi].get_pixmap(matrix=fitz.Matrix(2, 2))
            imgs.append(Image.open(io.BytesIO(pix.tobytes("png"))))

        for img in imgs[:1]:
            im = ImageOps.grayscale(img)
            im = ImageOps.autocontrast(im)
            w, h = im.size
            cols, rows = 5, min(25, max(10, h // 100))
            cw, rh = w // cols, h // rows
            arr = np.asarray(im)
            for ri in range(1, rows):
                for ci in range(cols):
                    y1, y2 = ri * rh + 2, (ri + 1) * rh - 2
                    x1, x2 = ci * cw + 2, (ci + 1) * cw - 2
                    patch = arr[y1:y2, x1:x2]
                    if patch.size == 0 or patch.mean() > 235:
                        continue
                    crop = im.crop((x1, y1, x2, y2))
                    buf = io.BytesIO()
                    crop.save(buf, format="PNG")
                    result, _ = ocr(buf.getvalue())
                    if not result:
                        continue
                    text = re.sub(r"\s+", "", norm("".join(str(r[1]) for r in result)))
                    m2 = re.fullmatch(r"(\d{1,3})([1-4])", text)
                    if m2:
                        q, a = int(m2.group(1)), int(m2.group(2))
                        if valid_pair(q, a):
                            answers[q] = a

    doc.close()
    return answers


STRATEGIES = [
    ("table_pairs", strategy_table_pairs),
    ("persian_rowscan", strategy_persian_rowscan),
    ("ce91_combined", strategy_ce91_combined),
    ("all_triplets", strategy_all_triplets),
    ("com_grid", strategy_com_grid),
    ("image_grid_ocr", strategy_image_grid_ocr),
]


def merge_keys(*maps: dict[int, int]) -> dict[int, int]:
    out: dict[int, int] = {}
    for m in maps:
        out.update(m)
    return out


def extract_key(path: Path, verbose: bool = False) -> dict[int, int]:
    if not path.exists():
        return {}

    results: list[tuple[float, str, dict[int, int]]] = []
    text_strategies = [s for s in STRATEGIES if s[0] != "image_grid_ocr"]
    ocr_strategy = next((s for s in STRATEGIES if s[0] == "image_grid_ocr"), None)

    for name, fn in text_strategies:
        try:
            result = fn(path)
        except Exception as exc:
            if verbose:
                print(f"    strategy {name} failed: {exc}")
            continue
        if not result:
            continue
        valid = validate_key(result)
        sc = score_key(result) if valid else score_key(result) * 0.3
        if verbose:
            tag = "ok" if valid else "weak"
            print(f"    strategy {name}: {len(result)} score={sc:.1f} [{tag}]")
        results.append((sc, name, result))

    results.sort(key=lambda x: x[0], reverse=True)
    best: dict[int, int] = dict(results[0][2]) if results else {}

    if results:
        for sc, name, result in results[1:4]:
            if len(result) >= len(best) * 0.5:
                merged = merge_keys(best, result)
                if validate_key(merged) and score_key(merged) >= score_key(best):
                    best = merged
                    if verbose:
                        print(f"    merged with {name} -> {len(best)}")

    # OCR fallback only when text extraction failed
    if len(best) < 20 and ocr_strategy:
        name, fn = ocr_strategy
        try:
            ocr_result = fn(path)
            if ocr_result and score_key(ocr_result) > score_key(best):
                best = ocr_result
                if verbose:
                    print(f"    ocr fallback {name}: {len(best)}")
        except Exception as exc:
            if verbose:
                print(f"    strategy {name} failed: {exc}")

    if verbose:
        print(f"    -> final {len(best)} answers")

    return best if validate_key(best) else (results[0][2] if results else {})


def key_stats(answers: dict[int, int]) -> dict:
    if not answers:
        return {"count": 0, "min": 0, "max": 0, "distribution": {}}
    items = sorted(answers.items())
    dist = Counter(a for _, a in items)
    return {
        "count": len(items),
        "min": items[0][0],
        "max": items[-1][0],
        "distribution": dict(sorted(dist.items())),
    }
