# -*- coding: utf-8 -*-
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from key_parser import extract_key, key_stats

base = Path(__file__).resolve().parent.parent / "کنکور"
keys = sorted(set(list(base.glob("*Key*")) + list(base.glob("*key*"))))
for p in keys:
    ans = extract_key(p, verbose=False)
    st = key_stats(ans)
    print(
        f"{p.name:30} {st['count']:3} Q{st['min']}-{st['max']} {st['distribution']}"
    )
