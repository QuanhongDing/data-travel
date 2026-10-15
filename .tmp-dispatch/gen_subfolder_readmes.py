#!/usr/bin/env python3
"""Auto-generate sub-folder README.md for every chapter sub-folder that lacks one.

The README's content is derived from:
  - the sub-folder's main `.md` file (extracts: one-sentence positioning from the > blockquote,
    difficulty stars from the top metadata)
  - the chapter-level README (for the chapter description)
  - the section sub-files in the same folder (linked as a table of contents)

A README looks like:

  # 01 业务过程建模

  > 业务架构→数据架构的桥梁，把"业务怎么干活"翻译成"数据怎么落表"。

  | 项 | 值 |
  | --- | --- |
  | 难度 | ★★★☆☆ |
  | 章节 | [Ch1 建模方法论](../../README.md) |
  | 前置 | 无 |

  ## 子文件

  | 小节 | 文件 |
  | --- | --- |
  | § 3 设计模式 | [section-3-sec3.md](section-3-sec3.md) |
  | § 8 面试题集 | [section-8-sec8.md](section-8-sec8.md) |

  ## 返回

  - 返回 [Ch1 章节目录](../README.md)
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REPO = Path("/Users/dqh/CCProject/me/data-travel").resolve()

POSITIONING_RE = re.compile(r">\s*\*\*一句话定位[：:]\*\*\s*([^\n]+)", re.M)
DIFFICULTY_RE = re.compile(r"难度\s*[|｜]\s*(★+☆*)")
CHAPTER_TITLES = {}


def find_chapter_for_sub(sub: Path) -> str:
    """Walk up to find the chapter index file."""
    parent = sub.parent
    readme = parent / "README.md"
    if readme.exists():
        return readme.name  # the README inside the chapter dir
    return "README.md"


def get_main_md(sub: Path) -> Path | None:
    # The main chapter file has the same name as the folder.
    folder_name = sub.name
    for f in sub.glob(f"{folder_name}.md"):
        return f
    return None


def build_readme(sub: Path) -> str:
    main = get_main_md(sub)
    one_liner = ""
    difficulty = ""
    if main and main.exists():
        text = main.read_text(encoding="utf-8")
        m = POSITIONING_RE.search(text)
        if m:
            one_liner = m.group(1).strip()
        m = DIFFICULTY_RE.search(text)
        if m:
            difficulty = m.group(1).strip()

    # Find sibling sub-files
    siblings = sorted([p for p in sub.iterdir()
                       if p.is_file() and p.suffix == ".md" and p.name != "README.md"])
    section_links = []
    for s in siblings:
        if s == main:
            continue
        # Try to extract the section title from "## N. <title>" or "### 8.N <title>"
        text = s.read_text(encoding="utf-8", errors="ignore")
        title = ""
        for pat in (r"^## (\d+)\.\s+([^\n]+)", r"^### (\d+)\.([0-9]+)\s+([^\n]+)"):
            m = re.search(pat, text, re.M)
            if m:
                title = m.group(0).lstrip("# ").strip()
                break
        if not title:
            title = s.stem
        section_links.append((title, s.name))

    # Read chapter-level README for context (one short paragraph)
    parent = sub.parent
    chapter_readme = parent / "README.md"
    chapter_name = parent.name
    chapter_title = chapter_name
    if chapter_readme.exists():
        first_line = chapter_readme.read_text(encoding="utf-8", errors="ignore").splitlines()[0:3]
        if first_line:
            chapter_title = first_line[0].lstrip("# ").strip() or chapter_name

    # Compute path to chapter README
    rel_to_chapter = "../README.md"

    parts = [
        f"# {sub.name} {chapter_title}",
        "",
    ]
    if one_liner:
        parts += [f"> {one_liner}", ""]

    parts += [
        "| 项 | 值 |",
        "| --- | --- |",
        f"| 难度 | {difficulty or '未标注'} |",
        f"| 章节 | [{chapter_name}]({rel_to_chapter}) |",
    ]
    if main:
        parts += [f"| 主文件 | [{main.name}]({main.name}) |"]

    if section_links:
        parts += [
            "",
            "## 子文件",
            "",
            "| 小节 | 文件 |",
            "| --- | --- |",
        ]
        for title, fname in section_links:
            parts += [f"| {title} | [{fname}]({fname}) |"]

    parts += [
        "",
        "## 返回",
        "",
        f"- 返回 [{chapter_name} 章节目录]({rel_to_chapter})",
        "- 返回 [项目根目录](../../README.md)",
        "",
    ]
    return "\n".join(parts)


def main() -> int:
    written = []
    skipped = []
    # Walk 2-level chapter/sub-chapter directories.
    # e.g. 01-modeling/01-business-process-modeling/
    for chapter in sorted(REPO.iterdir()):
        if not chapter.is_dir() or chapter.name.startswith("."):
            continue
        if chapter.name in ("docs", "attachments"):
            continue
        for sub in sorted(chapter.iterdir()):
            if not sub.is_dir() or sub.name.startswith(".") or sub.name == "attachments":
                continue
            # Must contain a main .md file matching the folder name
            folder_name = sub.name
            main = sub / f"{folder_name}.md"
            if not main.exists():
                continue
            readme = sub / "README.md"
            if readme.exists():
                skipped.append(str(readme.relative_to(REPO)))
                continue
            text = build_readme(sub)
            readme.write_text(text, encoding="utf-8")
            written.append(str(readme.relative_to(REPO)))

    print(f"wrote: {len(written)}, skipped (already exist): {len(skipped)}")
    if written:
        for w in written[:5]:
            print(f"  + {w}")
        if len(written) > 5:
            print(f"  ... and {len(written) - 5} more")
    return 0


if __name__ == "__main__":
    sys.exit(main())
