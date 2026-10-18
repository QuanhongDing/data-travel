#!/usr/bin/env python3
"""跨文件**数值/归属**冲突扫描（data-travel 书籍）

用途：补 `.cross-file-consistency-scan.py` 的盲区。

那个脚本按 **(实体, 事件动词) → 年份** 配对，因此**只能发现年份冲突**。
它看不见下面这一类：同一主体、同一量纲，被写成不同的**数值**或**归属**。
实测（2026-10-18，由人工批判环节发现、本脚本事后复现）：

    「美团数据团队 100+ 人」/「300+ 人」/「巅峰期约 2000+ 人」   ← 四个文件、同一句式、三个量级
    「日事件量 数千亿条/日」vs「日均万亿级事件流」                  ← 同一口径差 10 倍
    「Metaflow 是 Netflix 开源」vs「Metaflow 是 Airbnb 开源」      ← 归属错，且同一文件内自相矛盾

**它仍然是粗筛。** 判定「是不是同一个量」需要读上下文——同名不同物、不同年份的同一指标、
不同口径的同一数字都会被报出来。把它当候选清单，不要当结论。

用法：
    python3 .cross-file-value-scan.py                  # 报告 (主体, 量纲) 的互斥取值
    python3 .cross-file-value-scan.py --grep '美团'     # 展开某主体的全部出现位置
"""
from __future__ import annotations

import argparse
import collections
import os
import re
import sys

# 常见量纲：主体 + 量纲词 + 数值。可按需要扩充。
PATTERNS = [
    # 「<主体> 数据团队 300+ 人」；允许中间插入「巅峰期约」这类限定词与 markdown 粗体
    (re.compile(r'([一-龥A-Za-z]{2,10})\s*(?:的)?\s*数据团队[^。\n]{0,12}?([0-9零一二三四五六七八九十百千万亿两]{1,6}\+?)\s*人'),
     '数据团队规模'),
    # 「<产品> 是/由 <公司> 开源」——markdown 粗体与空格需先剥掉。
    #   这是本脚本最有价值的一类：实测 Metaflow 被写成 Netflix（8+ 处）与 Airbnb（4 处，
    #   且与同文件另一张表自相矛盾）、Amundsen 被写成 Lyft 与 Airbnb。
    (re.compile(r'([A-Za-z][A-Za-z0-9_-]{2,20})\s*(?:是|由|系)\s*([A-Z][A-Za-z]{2,20})\s*(?:开源|开发|出品|推出|自研)'),
     '归属'),
]

SKIP_DIRS = {'.git', '.idea', '.tmp-dispatch', '.superpowers', 'attachments', 'docs'}


def book_files(root: str):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if name.endswith('.md'):
                yield os.path.join(dirpath, name)[len(root) + 1:]


def scan(root: str):
    """返回 {(主体, 量纲): {取值: {文件}}}，只保留有 >=2 个不同取值的。"""
    found: dict[tuple[str, str], dict[str, set[str]]] = collections.defaultdict(
        lambda: collections.defaultdict(set))
    for path in book_files(root):
        try:
            text = open(os.path.join(root, path), encoding='utf-8').read()
        except OSError:
            continue
        for line in text.splitlines():
            # 先剥掉代码块、markdown 粗体与链接语法——实测「Metaflow 是 **Airbnb** 开源」
            # 这类写法会因中间的 ** 而漏配，归属冲突恰恰常用粗体强调公司名。
            clean = re.sub(r'`[^`]*`', ' ', line)
            clean = clean.replace('**', '')
            clean = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', clean)
            for pattern, kind in PATTERNS:
                for match in pattern.finditer(clean):
                    groups = match.groups()
                    if len(groups) < 2:
                        continue
                    subject, value = groups[0], groups[-1]
                    if not subject or not value:
                        continue
                    found[(subject, kind)][value.strip()].add(path)
    return {k: dict(v) for k, v in found.items() if len(v) >= 2}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root', default='.')
    ap.add_argument('--grep', metavar='SUBJECT', help='展开某主体的全部出现位置')
    o = ap.parse_args()

    if o.grep:
        pat = re.compile(re.escape(o.grep))
        for path in book_files(o.root):
            try:
                lines = open(os.path.join(o.root, path), encoding='utf-8').read().splitlines()
            except OSError:
                continue
            for n, line in enumerate(lines, 1):
                if pat.search(line):
                    print(f'{path}:{n}: {line.strip()[:170]}')
        return 0

    conflicts = scan(o.root)
    rows = sorted(((len(v), k, v) for k, v in conflicts.items()), reverse=True)
    print(f'同一主体在同一量纲上出现互斥取值的组合：{len(rows)}\n')
    for _, (subject, kind), values in rows[:30]:
        vals = ' | '.join(sorted(values))
        print(f'  {subject}  [{kind}]  {vals}')
        for v, files in sorted(values.items()):
            for f in sorted(files)[:3]:
                print(f'        {v:<22} {f}')
    print('\n提醒：含假阳性。「日 N 条」这类模式会跨主体误配；归属类需要读上下文确认。'
          '\n逐条人工确认后再交给 agent；不可判定的按规范降档不定论，不要挑一个写死。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
