#!/usr/bin/env python3
"""Split a chapter's § 8 面试真题集 file by sub-theme.

Two § 8 layouts exist in this repo:
  Layout A — all sub-themes under ### 8.2 (e.g. 04-observability):
    ## 8. 面试真题集
    ### 8.1 全景视图               (kept in index)
    ### 8.2 §X.Y <theme 1>          (split into theme-1 file)
    ### 8.2 §X.Y <theme 2>          (split into theme-2 file)
    ...
    ### 8.3 本章小结               (kept in index)
    ### 8.4 返回                   (kept in index)

  Layout B — one ### 8.N per sub-theme (e.g. 05-tech-strategy):
    ## 8. 面试真题集
    ### 8.1 全景视图               (kept in index)
    ### 8.2 §X.Y <theme 1>          (split into theme-1 file)
    ### 8.3 §X.Y <theme 2>          (split into theme-2 file)
    ...
    ### 8.{N} <theme N>             (split)
    ### 8.{N+1} 本章小结           (kept in index)
    ### 8.{N+2} 返回               (kept in index)

This script detects the layout automatically by inspecting all `### 8.X` headings:
  - Always keep `### 8.1 全景视图` (if present)
  - Find the LAST `### 8.X` whose title contains `本章小结` or `返回` — that and everything
    after it stays in the index
  - Everything between becomes a sub-theme file
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent

# Match "### 8.<digit> <title>"
SECTION8_RE = re.compile(r"^### 8\.(\d+)\s+(.+?)\s*$", re.M)


def split(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    matches = list(SECTION8_RE.finditer(text))
    if len(matches) < 2:
        return {"file": str(path), "skipped": "fewer than 2 § 8.X headings", "created": []}

    slug = path.stem.replace("-section-8-sec8", "")
    parent = path.parent

    # Classify each heading
    sections = []  # [(num, title, start, end, kind: 'overview' | 'subtheme' | 'closing')]
    for i, m in enumerate(matches):
        num = int(m.group(1))
        title = m.group(2).strip()
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        # Determine kind
        if "全景视图" in title or num == 1:
            kind = "overview"
        elif ("本章小结" in title) or ("返回" in title and num >= 2):
            kind = "closing"
        else:
            kind = "subtheme"
        sections.append((num, title, start, end, kind))

    # The last section must be 'closing' for this to work
    subthemes = [s for s in sections if s[4] == "subtheme"]
    closings = [s for s in sections if s[4] == "closing"]
    if len(subthemes) < 2 or not closings:
        return {"file": str(path), "skipped": "could not classify", "created": []}

    # Split boundaries: keep everything before the first sub-theme (this includes
    # 8.1 全景视图) and everything from the first closing onward
    first_subtheme_start = subthemes[0][2]
    first_closing_start = closings[0][2]
    head = text[:first_subtheme_start].rstrip() + "\n"
    tail = text[first_closing_start:].rstrip() + "\n"

    created = []
    # Write each sub-theme to its own file
    for idx, (num, title, s, e, _) in enumerate(subthemes, start=1):
        safe = re.sub(r"[^A-Za-z0-9一-鿿-]+", "-", title)
        safe = re.sub(r"-+", "-", safe).strip("-")
        if not safe:
            safe = f"theme-{idx}"
        else:
            safe = re.sub(r"[A-Z]+", lambda m: m.group(0).lower(), safe)
        sibling = parent / f"{slug}-section-8-{safe}.md"
        section_text = text[s:e].rstrip() + "\n"
        header = (
            f"> 本文件是 **{slug}.md** § 8 面试真题集 的子主题。"
            f"完整章节请回到 [index]({slug}.md) 或"
            f" [§ 8 索引]({path.name})。\n\n"
        )
        sibling.write_text(header + section_text, encoding="utf-8")
        created.append(str(sibling.relative_to(REPO)))

    # Build the slim § 8 index
    nav = ["\n---\n\n", "## § 8 子主题导航\n\n",
           "本章 § 8 面试真题集按子主题拆分为以下独立文件（每文件 200-800 行）：\n\n"]
    for idx, (num, title, _, _, _) in enumerate(subthemes, start=1):
        safe = re.sub(r"[^A-Za-z0-9一-鿿-]+", "-", title)
        safe = re.sub(r"-+", "-", safe).strip("-")
        if not safe:
            safe = f"theme-{idx}"
        else:
            safe = re.sub(r"[A-Z]+", lambda m: m.group(0).lower(), safe)
        nav.append(f"- [§ 8.{num} {title}]({slug}-section-8-{safe}.md)\n")
    nav.append("\n---\n\n")
    new_index = head + "".join(nav) + tail
    path.write_text(new_index, encoding="utf-8")
    created.insert(0, str(path.relative_to(REPO)) + " (rewritten as slim index)")

    return {
        "file": str(path.relative_to(REPO)),
        "original_lines": text.count("\n") + 1,
        "index_lines": new_index.count("\n") + 1,
        "sub_themes": [t for _, t, _, _, _ in subthemes],
        "created": created,
    }


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--file", action="append", required=True)
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    results = []
    for f in args.file:
        path = (REPO / f).resolve() if not Path(f).is_absolute() else Path(f)
        if not path.exists():
            results.append({"file": str(path), "error": "not found"})
            continue
        if args.dry_run:
            text = path.read_text(encoding="utf-8")
            matches = list(SECTION8_RE.finditer(text))
            results.append({
                "file": str(path.relative_to(REPO)),
                "would_split": [f"§8.{m.group(1)} {m.group(2).strip()}" for m in matches],
            })
            continue
        results.append(split(path))

    print(json.dumps({"results": results}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
