#!/usr/bin/env python3
"""Fix broken local .md cross-links created by the chapter flattening.

Two common broken-link patterns:
  1. Chapter-level README: `./<sub-name>.md` should be `./<sub-name>/<sub-name>.md` (or README)
  2. Section sub-file: `./<other-chapter>.md` should be `./<other-chapter>/<other-chapter>.md`

Strategy:
  - For a broken link like `./<name>.md`:
    - If `<name>/<name>.md` exists, replace with that.
    - If `<name>/README.md` exists, replace with README.
    - Otherwise, leave broken (or note).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REPO = Path("/Users/dqh/CCProject/me/data-travel").resolve()

LINK_RE = re.compile(r'\[([^\]]+)\]\(([^)]+\.md)(?:#[^)]*)?\)')


def fix_file(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    fixed_count = 0

    def replace(m: re.Match) -> str:
        nonlocal fixed_count
        label = m.group(1)
        target = m.group(2)
        if target.startswith(('http://', 'https://', 'mailto:')) or target.startswith('#'):
            return m.group(0)
        target_path = (path.parent / target).resolve()
        if target_path.exists():
            return m.group(0)
        # Try to find the actual file. Strip './' and #anchor.
        clean = target.lstrip('./')
        base = clean.split('#')[0]
        if not base.endswith('.md'):
            return m.group(0)
        stem = base[:-3]  # e.g. "10-metric-platform"

        # Build a list of candidate relative paths to try, in order of preference.
        # The link might be a sibling-chapter reference from within a sub-folder,
        # so we need to look upward to the chapter root (or even repo root).
        candidates = []
        # 1. Sub-folder sibling: <stem>/<stem>.md (only works for chapter root files)
        candidates.append(Path(stem) / f"{stem}.md")
        # 2. Sub-folder sibling README
        candidates.append(Path(stem) / "README.md")
        # Walk upward: for each ancestor directory, try <stem>/<stem>.md
        anc = path.parent
        while anc != anc.parent:
            anc = anc.parent
            candidates.append(Path("..") / anc.name / stem / f"{stem}.md")
            candidates.append(Path("..") / anc.name / stem / "README.md")

        for rel_cand in candidates:
            abs_cand = (path.parent / rel_cand).resolve()
            if abs_cand.exists() and abs_cand.is_file():
                fixed_count += 1
                return f'[{label}]({rel_cand.as_posix()})'
        return m.group(0)

    new_text = LINK_RE.sub(replace, text)
    if new_text != text:
        path.write_text(new_text, encoding="utf-8")
    return fixed_count


def main() -> int:
    total_fixed = 0
    files_changed = 0
    for f in sorted(REPO.rglob("*.md")):
        if any(p in str(f) for p in ('/.git/', '/.tmp-dispatch/', '/attachments/')):
            continue
        n = fix_file(f)
        if n:
            total_fixed += n
            files_changed += 1
    print(f"fixed {total_fixed} links across {files_changed} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
