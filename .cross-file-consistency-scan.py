#!/usr/bin/env python3
"""跨文件事实一致性扫描（data-travel 书籍）

用途：找出**同一本书内不同文件对同一事实给出互相矛盾的断言**。
这类缺陷单文件审查看不出来 —— 每个文件自身都自洽，矛盾只在跨文件比对时暴露。

已确认实例（2026-10-18）：
  Netflix Maestro 的上线/开源年份在同一本书里出现 2019 / 2021 / 2022 / 2024 四种说法。

用法：
    python3 .cross-file-consistency-scan.py                # 扫描全库
    python3 .cross-file-consistency-scan.py --entities     # 只打印候选实体清单
    python3 .cross-file-consistency-scan.py --grep Maestro  # 展开某个实体的全部出现位置

注意：本环境无网络（WebSearch 返回空、WebFetch 被阻断），
本脚本只能发现「书内自相矛盾」，无法判定哪个年份才是对的。
修复时的正确做法是统一到**有公开出处的那一个**，找不到出处就降为区间表述并标注档位。
"""
from __future__ import annotations

import argparse
import collections
import os
import re
import sys

YEAR = r'(?:19|20)\d{2}'
VERB = r'(开源|发布|推出|提出|公开|成立|诞生|上线|立项|首次)'
# 语序 A：年份 → 动词 → 实体（实体在动词之后）
CLAIM = re.compile(YEAR + r'\s*年?[^。\n]{0,12}?' + VERB + r'[^。\n]{0,30}')
# 语序 B：实体 → … → 年份 → 动词（实体在年份**之前**）
#   第四轮实测：只认语序 A 会漏掉「2018 年 Netflix 发起」这类句子——实体不在动词后 30 字符内。
CLAIM_REV = re.compile(r'\b([A-Z][A-Za-z0-9._+-]{2,19})\b[^。\n]{0,30}?' + YEAR + r'\s*年?[^。\n]{0,12}?' + VERB)
ENTITY = re.compile(r'\b([A-Z][A-Za-z][A-Za-z0-9]{2,19})\b')

# 这些词是常见英文单词或通用前缀，不是产品名 —— 它们会把 "Delta Lake" 拆成 "Delta"+"Lake"，
# 造成大量假阳性，直接排除。
STOPWORDS = frozenset({
    'Apache', 'The', 'Data', 'Open', 'Big', 'Cloud', 'Real', 'Time', 'Graph',
    'Vector', 'Feature', 'Store', 'Deep', 'Machine', 'Learning', 'Neural',
    'Based', 'Means', 'Interest', 'Instance', 'Foundation', 'Linux',
})

SKIP_DIRS = frozenset({'.git', '.idea', '.tmp-dispatch', '.superpowers', 'attachments', 'docs'})


def walk_markdown(root: str):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if not name.endswith('.md'):
                continue
            # ⚠ 排除本项目自己的报告/规范文件。第四轮实测：扫描器此前把
            # `.cross-file-conflicts*.md` 这类**工作文档**当成书稿参与配对，
            # 于是把自己刚刚记录的冲突又报了一遍，凭空制造噪声。
            if dirpath == root and name.startswith('.'):
                continue
            yield os.path.join(dirpath, name)[len(root) + 1:]


def collect(root: str) -> dict[tuple[str, str], dict[str, set[str]]]:
    """返回 {(实体, 事件动词): {年份: {文件}}}，只保留有 >=2 个不同年份的冲突项。"""
    claims: dict[tuple[str, str], dict[str, set[str]]] = collections.defaultdict(
        lambda: collections.defaultdict(set)
    )
    for path in walk_markdown(root):
        try:
            text = open(os.path.join(root, path), encoding='utf-8').read()
        except OSError:
            continue
        for line in text.splitlines():
            stripped = re.sub(r'`[^`]*`', ' ', line)  # 代码块里的年份不是断言
            for match in CLAIM.finditer(stripped):
                segment, verb = match.group(0), match.group(1)
                year = re.search(YEAR, segment).group(0)
                tail = segment[match.start(1):]  # 动词及其后文，实体通常在这
                for entity in ENTITY.findall(tail):
                    if entity in STOPWORDS:
                        continue
                    claims[(entity, verb)][year].add(path)
    return {k: dict(v) for k, v in claims.items() if len(v) >= 2}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', default='.')
    parser.add_argument('--entities', action='store_true', help='只打印冲突实体清单')
    parser.add_argument('--min-mentions', type=int, default=2)
    parser.add_argument('--grep', metavar='ENTITY', help='展开某实体的全部出现位置')
    options = parser.parse_args()

    if options.grep:
        pattern = re.compile(re.escape(options.grep))
        for path in walk_markdown(options.root):
            try:
                lines = open(os.path.join(options.root, path), encoding='utf-8').read().splitlines()
            except OSError:
                continue
            for number, line in enumerate(lines, 1):
                if pattern.search(line):
                    print(f'{path}:{number}: {line.strip()[:170]}')
        return 0

    conflicts = collect(options.root)
    rows = []
    for (entity, verb), years in conflicts.items():
        mentions = sum(len(files) for files in years.values())
        if mentions < options.min_mentions:
            continue
        rows.append((len(years), mentions, entity, verb, sorted(years)))
    rows.sort(key=lambda r: (-r[0], -r[1]))

    if options.entities:
        for _, _, entity, _, _ in rows:
            print(entity)
        return 0

    print(f'跨文件年份冲突的 (实体, 事件) 组合：{len(rows)}\n')
    for distinct, mentions, entity, verb, years in rows:
        print(f'  {entity:20s} {verb}  {years}   mentions={mentions}')
    print(
        '\n提醒：此清单含假阳性（词被切分，如 "Delta Lake" → Delta + Lake）。'
        '\n逐条人工确认后，再交给 agent 统一到有公开出处的年份。'
    )
    return 0


if __name__ == '__main__':
    sys.exit(main())
