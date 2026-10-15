#!/usr/bin/env python3
"""Splice generated section-8 content back into the chapter files.

For each file listed in plan.json, the generator writes a complete replacement
for the `## 8. 面试真题集` block to out/<slug>.md. This script swaps it in,
regenerating section 8 from scratch — which is also what removes the
mis-assigned duplicate questions, since only canonical ones are emitted.

Run:  python3 splice.py [--dry-run] [slug ...]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
OUT = HERE / "out"
SECTION8_RE = re.compile(r"^## 8\. 面试真题集\s*$")
SECTION8_HEADING = "## 8. 面试真题集"


def slug_for(rel: str) -> str:
    return rel.replace("/", "__").removesuffix(".md")


def splice(rel: str, dry_run: bool) -> str:
    """Return a status word: spliced / missing-out / no-anchor / unchanged."""
    target = REPO / rel
    generated = OUT / f"{slug_for(rel)}.md"
    if not generated.exists():
        return "missing-out"

    new_block = generated.read_text(encoding="utf-8").strip()
    if not new_block.startswith(SECTION8_HEADING):
        raise SystemExit(f"{generated}: must start with '{SECTION8_HEADING}'")

    lines = target.read_text(encoding="utf-8").splitlines()
    anchors = [i for i, line in enumerate(lines) if SECTION8_RE.match(line)]
    if len(anchors) == 0:
        # Chapter has no `## 8.` — append the new section at the end.
        body = target.read_text(encoding="utf-8").rstrip() + "\n\n" + new_block + "\n"
        if not dry_run:
            target.write_text(body, encoding="utf-8")
        return "appended"
    if len(anchors) > 1:
        return f"no-anchor({len(anchors)})"

    body = "\n".join(lines[: anchors[0]]).rstrip() + "\n\n" + new_block + "\n"
    if body == target.read_text(encoding="utf-8"):
        return "unchanged"
    if not dry_run:
        target.write_text(body, encoding="utf-8")
    return "spliced"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--orphans", action="store_true",
                        help="Splice out/ files whose chapter is not in plan.json.")
    parser.add_argument("slugs", nargs="*")
    args = parser.parse_args()

    plan = json.loads((HERE / "plan.json").read_text(encoding="utf-8"))
    plan_files = {f["file"] for f in plan["files"]}

    if args.orphans:
        todo_files = []
        for out_path in sorted(OUT.glob("*.md")):
            slug = out_path.stem
            rel = "/".join(slug.split("__")[:-1]) + "/" + slug.split("__")[-1] + ".md"
            if rel in plan_files:
                continue
            if not (REPO / rel).exists():
                continue
            todo_files.append({"file": rel})
        print(f"# orphan out/ files: {len(todo_files)}")
    else:
        wanted = {slug_for(f["file"]) for f in plan["files"]}
        todo = [f for f in plan["files"] if not args.slugs or slug_for(f["file"]) in args.slugs]
        unknown = set(args.slugs) - wanted
        if unknown:
            raise SystemExit(f"unknown slug(s): {sorted(unknown)}")
        todo_files = todo

    tally: dict[str, int] = {}
    for entry in todo_files:
        status = splice(entry["file"], args.dry_run)
        tally[status] = tally.get(status, 0) + 1
        if not status.startswith(("spliced", "unchanged")):
            print(f"  !! {status:16s} {entry['file']}")

    print(json.dumps(tally, ensure_ascii=False, indent=2))
    return 0 if not any(k.startswith("no-anchor") for k in tally) else 1


if __name__ == "__main__":
    sys.exit(main())
