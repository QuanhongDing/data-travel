#!/usr/bin/env python3
"""Split an oversized chapter file into a slim index + section sub-files.

Strategy (aligned with the book's writing convention 200-400 行典型, 800 行最多):
  - Keep the original file as the chapter index, holding only § 0 + § 1 概念 + § 2 原理
    + a "其他小节" pointer table. Target: ~400-600 lines.
  - Split sections 3..N into sibling files:
       <slug>-section-3-<title>.md   e.g.  04-observability-section-3-patterns.md
       <slug>-section-4-<title>.md
       <slug>-section-5-<title>.md
       <slug>-section-6-<title>.md
       <slug>-section-7-<title>.md
       <slug>-section-8-interview-qa.md
  - The interview-qa section (§ 8) is always split out because it's the largest.
  - Each sibling file gets a 1-line import header pointing to the index.

The script preserves the original section titles and content byte-for-byte.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent

# Matches "## N. <title>" (e.g. "## 3. 设计模式与范式"). The first `## 1. 概念` or `## 0.` always
# starts the chapter; the script treats anything before the first section-3 marker as the index.
SECTION_RE = re.compile(r"^## (\d+)\. ([^\n]+?)\s*$", re.M)
# Interview Q&A section is special — always a separate file.
INTERVIEW_RE = re.compile(r"^## 8\. 面试真题集\s*$", re.M)


def split_file(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    matches = list(SECTION_RE.finditer(text))
    if len(matches) < 3:
        return {"file": str(path), "skipped": "fewer than 3 sections", "created": []}

    # Build a list of (section_number, section_title, start_offset, end_offset)
    # The text before the first `## 1.` (or `## 0.`) is the prelude (front-matter like
    # 写作约定, 画像映射). Keep that with the index.
    first = matches[0]
    if int(first.group(1)) not in (0, 1):
        return {"file": str(path), "skipped": "unexpected first section", "created": []}

    prelude_end = first.start()
    prelude = text[:prelude_end]

    # Walk sections
    sections: list[tuple[int, str, int, int]] = []
    for i, m in enumerate(matches):
        num = int(m.group(1))
        title = m.group(2).strip()
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        sections.append((num, title, start, end))

    # Decide which sections are "in the index" vs "split out"
    INDEX_MAX_SECTION = 2  # § 0 + § 1 + § 2 stay in the index
    index_section_nums = {n for n, _, _, _ in sections if n <= INDEX_MAX_SECTION}
    split_sections = [(n, t, s, e) for n, t, s, e in sections if n > INDEX_MAX_SECTION]

    slug = path.stem
    parent = path.parent
    created: list[str] = []
    # Recompose the index file content
    index_body_parts: list[str] = [prelude]
    for n, t, s, e in sections:
        if n <= INDEX_MAX_SECTION:
            # Keep the section's text
            index_body_parts.append(text[s:e].rstrip() + "\n\n")
        else:
            # Add a bullet pointing to the sibling file, preserving the § N. number
            sibling_name = sibling_filename(slug, n, t)
            index_body_parts.append(
                f"- [§{n}. {t}]({sibling_name})\n"
            )

    # If there are sections to split, append a navigation header
    if split_sections:
        # Find a good place to insert the navigation block — right after the last
        # kept section in the index. We append it at the end of the index body.
        nav = ["\n---\n\n", "## 章节内容导航\n\n",
               "本章按写作约定拆分到以下子文件（每文件 200-800 行，专注一个主题）：\n\n"]
        for n, t, _, _ in split_sections:
            sibling_name = sibling_filename(slug, n, t)
            nav.append(f"- [§{n}. {t}]({sibling_name})\n")
        nav.append("\n---\n\n")
        index_body_parts.extend(nav)

    new_index_text = "".join(index_body_parts).rstrip() + "\n"
    path.write_text(new_index_text, encoding="utf-8")
    created.append(str(path) + " (rewritten as slim index)")

    # Write each split-out section to its own sibling file
    for n, t, s, e in split_sections:
        section_text = text[s:e].rstrip() + "\n"
        # Prepend a one-line cross-reference so the sibling file links back to the index
        sibling_path = parent / sibling_filename(slug, n, t)
        header = (
            f"> 本文件是 **{slug}.md** 的子文件（§{n}. {t}）。"
            f"完整章节请回到 [index]({slug}.md)。\n\n"
        )
        sibling_path.write_text(header + section_text, encoding="utf-8")
        created.append(str(sibling_path.relative_to(REPO)))

    return {
        "file": str(path.relative_to(REPO)),
        "original_lines": text.count("\n") + 1,
        "index_lines": new_index_text.count("\n") + 1,
        "split_sections": [f"§{n} {t}" for n, t, _, _ in split_sections],
        "created": created,
    }


def sibling_filename(slug: str, num: int, title: str) -> str:
    # Pinyin-ish slug for the title — keep ASCII, lowercase, hyphen-separated
    title_slug = re.sub(r"[^A-Za-z0-9一-鿿]+", "-", title)
    # For Chinese-heavy titles, fall back to a short tag; for ASCII titles, lowercase.
    if re.search(r"[A-Za-z]", title_slug):
        title_slug = re.sub(r"[^a-zA-Z0-9-]+", "-", title_slug).strip("-").lower()
    else:
        # Keep a short marker for CJK titles
        title_slug = f"sec{num}"
    return f"{slug}-section-{num}-{title_slug}.md"


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--file", action="append", required=True,
                   help="Path to a chapter file (relative to repo root, or absolute). "
                        "Can be passed multiple times.")
    p.add_argument("--dry-run", action="store_true",
                   help="Report what would be done without writing.")
    args = p.parse_args()

    results = []
    for f in args.file:
        path = (REPO / f).resolve() if not Path(f).is_absolute() else Path(f)
        if not path.exists():
            print(json.dumps({"file": str(path), "error": "not found"}, ensure_ascii=False))
            continue
        if args.dry_run:
            # Just parse and report; don't write
            text = path.read_text(encoding="utf-8")
            matches = list(SECTION_RE.finditer(text))
            print(json.dumps({"file": str(path.relative_to(REPO)),
                              "would_split": [{"n": m.group(1), "title": m.group(2).strip()}
                                              for m in matches if int(m.group(1)) > 2]}, ensure_ascii=False))
            continue
        results.append(split_file(path))

    print(json.dumps({"results": results}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
