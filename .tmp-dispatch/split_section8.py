#!/usr/bin/env python3
"""Split a chapter's § 8 面试真题集 file by sub-theme.

The § 8 file looks like:
  ## 8. 面试真题集
  ### 8.1 全景视图            (kept in index)
  ### 8.2 §X.Y <theme 1>     (split into theme-1 file)
  ### 8.2 §X.Y <theme 2>     (split into theme-2 file)
  ...
  ### 8.3 本章小结            (kept in index)
  ### 8.4 返回                (kept in index)

This script extracts each `### 8.2 <theme>` into its own sibling file, then
rewrites the index file to keep only 8.1, 8.3, 8.4 plus a navigation list.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent

# Match "### 8.2 <rest>" — anything under § 8.2 sub-themes
SUBTHEME_RE = re.compile(r"^### 8\.2 (.+?)\s*$", re.M)


def split(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    matches = list(SUBTHEME_RE.finditer(text))
    if len(matches) < 2:
        return {"file": str(path), "skipped": "fewer than 2 sub-themes", "created": []}

    slug = path.stem.replace("-section-8-sec8", "")
    parent = path.parent

    # The original § 8 file's stem: <slug>-section-8-sec8.md
    # Each sub-theme becomes: <slug>-section-8-<safe-title>.md
    themes = []
    for i, m in enumerate(matches):
        title = m.group(1).strip()
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        themes.append((title, start, end))

    # Determine what to keep in the slim index:
    # Everything from "## 8." up to the first sub-theme (preserves 8.1 全景视图)
    # and everything after the last sub-theme (preserves 8.3 + 8.4).
    first_theme_start = matches[0].start()
    last_theme_end = matches[-1].end()
    head = text[:first_theme_start].rstrip() + "\n"
    tail = text[last_theme_end:].rstrip() + "\n"

    created = []
    # Write each sub-theme to its own file
    for idx, (title, s, e) in enumerate(themes, start=1):
        safe = re.sub(r"[^A-Za-z0-9一-鿿-]+", "-", title)
        safe = re.sub(r"-+", "-", safe).strip("-")
        if not safe:
            safe = f"theme-{idx}"
        else:
            # Lowercase ASCII portions
            safe = re.sub(r"[A-Z]+", lambda m: m.group(0).lower(), safe)
        sibling = parent / f"{slug}-section-8-{safe}.md"
        section_text = text[s:e].rstrip() + "\n"
        # Add a small back-link header
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
    for idx, (title, _, _) in enumerate(themes, start=1):
        safe = re.sub(r"[^A-Za-z0-9一-鿿-]+", "-", title)
        safe = re.sub(r"-+", "-", safe).strip("-")
        if not safe:
            safe = f"theme-{idx}"
        else:
            safe = re.sub(r"[A-Z]+", lambda m: m.group(0).lower(), safe)
        nav.append(f"- [§ 8.{idx} {title}]({slug}-section-8-{safe}.md)\n")
    nav.append("\n---\n\n")
    new_index = head + "".join(nav) + tail
    path.write_text(new_index, encoding="utf-8")
    created.insert(0, str(path.relative_to(REPO)) + " (rewritten as slim index)")

    return {
        "file": str(path.relative_to(REPO)),
        "original_lines": text.count("\n") + 1,
        "index_lines": new_index.count("\n") + 1,
        "sub_themes": [t for t, _, _ in themes],
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
            matches = list(SUBTHEME_RE.finditer(text))
            results.append({
                "file": str(path.relative_to(REPO)),
                "would_split": [m.group(1).strip() for m in matches],
            })
            continue
        results.append(split(path))

    print(json.dumps({"results": results}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
