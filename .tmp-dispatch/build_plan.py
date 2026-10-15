#!/usr/bin/env python3
"""Turn the raw question manifest into an execution plan.

Reads questions.json, recovers theme titles and 主/辅 marks from each file's
全景视图 table (the reliable source — the `###` headings are frequently
corrupted by a question stem bleeding into them), then assigns every question
to exactly one canonical file. Emits plan.json.
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent

THEME_ROW_RE = re.compile(
    r"^\|\s*§([\d.]+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*\d+\s*\|\s*(主|辅)\s*\|\s*$"
)
SECTION8_RE = re.compile(r"^## 8\. 面试真题集\s*$")


@dataclass(frozen=True)
class ThemeEntry:
    theme_id: str
    title: str
    role: str
    file: str


def theme_tables() -> dict[str, list[ThemeEntry]]:
    """Parse the 全景视图 table of every chapter file: theme -> entries."""
    by_theme: dict[str, list[ThemeEntry]] = defaultdict(list)
    for path in sorted(REPO.glob("*/*/*.md")):
        if path.name == "README.md":
            continue
        rel = str(path.relative_to(REPO))
        lines = path.read_text(encoding="utf-8").splitlines()
        start = next((i for i, l in enumerate(lines) if SECTION8_RE.match(l)), None)
        if start is None:
            continue
        for line in lines[start:]:
            if m := THEME_ROW_RE.match(line.strip()):
                by_theme[m.group(1)].append(
                    ThemeEntry(
                        theme_id=m.group(1),
                        title=m.group(2).strip(),
                        role=m.group(4),
                        file=rel,
                    )
                )
    return by_theme


def score_candidate(theme_id: str, file: str, count: int, roles: dict) -> tuple:
    """Rank a (file, theme) pair. Lower sorts better."""
    role = roles.get((theme_id, file), "辅")
    return (0 if role == "主" else 1, -count, file)


def main() -> int:
    data = json.loads((HERE / "questions.json").read_text(encoding="utf-8"))
    questions = data["questions"]

    themes = theme_tables()
    roles = {(e.theme_id, e.file): e.role for entries in themes.values() for e in entries}

    # theme id (e.g. "4.2") -> question id prefix (e.g. "§4.2.1")
    counts: dict[tuple[str, str], int] = defaultdict(int)
    for q in questions:
        theme_id = ".".join(q["qid"].lstrip("§").split(".")[:2])
        counts[(theme_id, q["file"])] += 1

    canonical: dict[str, str] = {}
    grouped = _group_by_id(questions)
    for qid, group in grouped.items():
        files = {q["file"] for q in group}
        # A question listed in only one file is already correctly placed; moving
        # it would empty the 57 files that only ever list 辅 themes.
        if len(files) == 1:
            canonical[qid] = next(iter(files))
            continue
        theme_id = ".".join(qid.lstrip("§").split(".")[:2])
        canonical[qid] = min(
            files,
            key=lambda f: score_candidate(theme_id, f, counts[(theme_id, f)], roles),
        )

    # Themes whose `###` heading was corrupted get their title from the table.
    theme_titles: dict[str, str] = {}
    for theme_id, entries in themes.items():
        primary = [e for e in entries if e.role == "主"] or entries
        theme_titles[theme_id] = max(primary, key=lambda e: len(e.title)).title

    per_file: dict[str, list[str]] = defaultdict(list)
    for qid, file in canonical.items():
        per_file[file].append(qid)

    def qid_key(qid: str) -> tuple:
        return tuple(int(p) if p.isdigit() else 0 for p in qid.lstrip("§").split("."))

    qbyid = {q["qid"]: q for q in questions}
    plan_files = []
    for file, qids in sorted(per_file.items()):
        qids.sort(key=qid_key)
        theme_ids = sorted({".".join(q.lstrip("§").split(".")[:2]) for q in qids}, key=qid_key)
        plan_files.append(
            {
                "file": file,
                "count": len(qids),
                "themes": [
                    {"theme_id": t, "title": theme_titles.get(t, ""), "count": sum(
                        1 for q in qids if ".".join(q.lstrip("§").split(".")[:2]) == t
                    )}
                    for t in theme_ids
                ],
                "questions": [
                    {
                        "qid": q,
                        "difficulty": qbyid[q]["difficulty"],
                        "stem": qbyid[q]["stem"],
                        "truncated": qbyid[q]["truncated"],
                        "subsection": qbyid[q]["subsection"],
                        "dupes_in": sorted({x["file"] for x in grouped[q]} - {file}),
                    }
                    for q in qids
                ],
            }
        )

    out = {
        "summary": {
            "files_to_edit": len(plan_files),
            "questions_total": len(canonical),
            "dupes_to_remove": sum(
                len(q["dupes_in"]) for f in plan_files for q in f["questions"]
            ),
            "themes": sum(len(f["themes"]) for f in plan_files),
        },
        "theme_titles": theme_titles,
        "files": plan_files,
    }
    (HERE / "plan.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(out["summary"], ensure_ascii=False, indent=2))
    print("\n=== top files by question count ===")
    for f in sorted(plan_files, key=lambda f: -f["count"])[:8]:
        print(f"{f['count']:4d}  {f['file']}  [{len(f['themes'])} themes]")
    return 0


def _group_by_id(questions: list[dict]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = defaultdict(list)
    for q in questions:
        grouped[q["qid"]].append(q)
    return grouped


if __name__ == "__main__":
    raise SystemExit(main())
