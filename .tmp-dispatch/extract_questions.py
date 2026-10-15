#!/usr/bin/env python3
"""Extract interview-question records from every chapter file's section 8.

Walks the corpus, finds the `## 8. 面试真题集` block in each chapter file,
and pulls out per-question records (id, difficulty, stem, theme, sub-theme,
plus the structural defects found in the block). Emits a JSON manifest.
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

SECTION8_RE = re.compile(r"^## 8\. 面试真题集\s*$")
THEME_H3_RE = re.compile(r"^### 2\.(\d+)\s+(.*)$")
SUBSEC_H4_RE = re.compile(r"^#### 2\.(\d+)\.(\d+)\s+(.*)$")
DIFF_ROW_RE = re.compile(r"^\|\s*(§[\d.]+?)\s*\|\s*(★+☆*)\s*\|")
QUESTION_RE = re.compile(r"^- \*\*(§[\d.]+?)\*\*：(.*)$")
SOURCE_RE = re.compile(r"^> 来源：原 PDF §([\d.]+)，收录 (\d+) 道题。")


def normalize_qid(raw: str) -> str:
    """Tolerate trailing/doubled dots in the source numbering (`§4.2.` -> `§4.2`)."""
    return "§" + ".".join(p for p in raw.lstrip("§").strip(".").split(".") if p)


@dataclass(frozen=True)
class Question:
    qid: str
    stem: str
    truncated: bool
    difficulty: str
    file: str
    chapter: str
    subsection: str


@dataclass(frozen=True)
class Defects:
    nested_h1: bool
    stem_in_heading: bool
    dup_preamble: bool
    has_answers: bool


def chapter_files() -> list[Path]:
    """Chapter article files: NN-name/NN-sub/NN-sub.md, excluding READMEs and docs/."""
    out = []
    for path in sorted(REPO.glob("*/*/*.md")):
        if path.name == "README.md":
            continue
        if path.parent.name.split("-")[0] != path.name.split("-")[0]:
            continue
        out.append(path)
    return out


def split_section8(lines: list[str]) -> int | None:
    for i, line in enumerate(lines):
        if SECTION8_RE.match(line):
            return i
    return None


def looks_truncated(stem: str) -> bool:
    """A stem is truncated when it does not end on sentence-final punctuation."""
    return not stem.rstrip().endswith(("。", "？", "！", "：", "）", "」", "”", "…", "."))


def parse_block(lines: list[str], rel: str, chapter: str) -> tuple[list[Question], Defects]:
    questions: dict[str, Question] = {}
    difficulty: dict[str, str] = {}
    current_sub = ""
    nested_h1 = False
    stem_in_heading = False
    dup_preamble = 0

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("# ") and "面试真题集" in stripped:
            nested_h1 = True
        if stripped.startswith("> 本文整合自题库"):
            dup_preamble += 1

        if m := SUBSEC_H4_RE.match(stripped):
            current_sub = m.group(3).strip()
            if looks_truncated(current_sub):
                stem_in_heading = True
        elif m := THEME_H3_RE.match(stripped):
            if looks_truncated(m.group(2).strip()):
                stem_in_heading = True

        if m := DIFF_ROW_RE.match(stripped):
            difficulty[normalize_qid(m.group(1))] = m.group(2)
            continue

        if m := QUESTION_RE.match(stripped):
            qid, stem = normalize_qid(m.group(1)), m.group(2).strip()
            if qid in questions:
                continue
            questions[qid] = Question(
                qid=qid,
                stem=stem,
                truncated=looks_truncated(stem),
                difficulty=difficulty.get(qid, ""),
                file=rel,
                chapter=chapter,
                subsection=current_sub,
            )

    defects = Defects(
        nested_h1=nested_h1,
        stem_in_heading=stem_in_heading,
        dup_preamble=dup_preamble > 1,
        has_answers=False,
    )
    return list(questions.values()), defects


def main() -> int:
    allq: list[Question] = []
    per_file: dict[str, dict] = {}

    for path in chapter_files():
        rel = str(path.relative_to(REPO))
        chapter = rel.split("/")[0]
        lines = path.read_text(encoding="utf-8").splitlines()
        start = split_section8(lines)
        if start is None:
            per_file[rel] = {"questions": 0, "section8": False}
            continue
        qs, defects = parse_block(lines[start:], rel, chapter)
        allq.extend(qs)
        per_file[rel] = {
            "questions": len(qs),
            "section8": True,
            "defects": asdict(defects),
        }

    by_id: dict[str, list[Question]] = {}
    for q in allq:
        by_id.setdefault(q.qid, []).append(q)

    manifest = {
        "summary": {
            "chapter_files": len(per_file),
            "files_with_section8": sum(1 for v in per_file.values() if v.get("section8")),
            "occurrences": len(allq),
            "unique_ids": len(by_id),
            "truncated": sum(1 for q in allq if q.truncated),
            "files_with_nested_h1": sum(
                1 for v in per_file.values() if v.get("defects", {}).get("nested_h1")
            ),
            "files_with_stem_in_heading": sum(
                1 for v in per_file.values() if v.get("defects", {}).get("stem_in_heading")
            ),
            "files_with_dup_preamble": sum(
                1 for v in per_file.values() if v.get("defects", {}).get("dup_preamble")
            ),
            "dup_ids": sum(1 for v in by_id.values() if len(v) > 1),
        },
        "per_file": per_file,
        "questions": [asdict(q) for q in allq],
    }

    out = Path(__file__).resolve().parent / "questions.json"
    out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(manifest["summary"], ensure_ascii=False, indent=2))
    print(f"\nwrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
