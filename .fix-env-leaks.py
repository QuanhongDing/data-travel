#!/usr/bin/env python3
"""清除书稿正文里的「写作环境注解」（data-travel 书籍）

问题：作者取材时的运行环境说明泄入了书稿正文，例如
    （【经验】——仓库、许可证与发布记录可自行核验；本项目环境无法联网，落地前请以官方仓库为准）
「本项目环境无法联网」描述的是**作者的工具/环境**，不是读者所在的世界。
读者读到会以为这是本书对读者的限定条件。

正确写法是**面向读者的证据档位说明**：「本节未核到可引用的公开出处」。
（注意：后者是允许的——它说的是「这一节的取材结论」，不是「作者没有网」。）

本脚本把前者机械转换为后者。**幂等**：重复运行不会二次改动。
只处理书稿正文，**跳过**根目录下的点文件（.sec*-spec.md / .sec*-findings.md /
.cross-file-*.md）——那些是工作文档，「本环境」在其中是正确的用法。

用法：
    python3 .fix-env-leaks.py            # 应用
    python3 .fix-env-leaks.py --check    # 只报告，不修改
"""
from __future__ import annotations

import argparse
import os
import re
import sys

# 顺序重要：更具体的模式必须排在更泛的模式之前
SUBS = [
    (r'本环境无网络，未核到', '本节未核到'),
    (r'本环境无网络\s*未能核到', '本节未能核到'),
    (r'本环境无网络，未能定位到', '本节未能定位到'),
    (r'本环境无网络，(未|并不|故不|未逐)', r'本节\1'),
    (r'本环境无法联网核验', '本节无法核验'),
    (r'本环境无法联网核实', '本节无法核实'),
    (r'本环境无法核验', '本节无法核验'),
    (r'本环境未核原文', '本节未核原文'),
    (r'在本环境无法核验', '本节无法核验'),
    (r'本项目环境无法联网', '本节未核到可引用的公开出处'),
    (r'本环境无网络', '本节未核到可引用的公开出处'),
    (r'本环境', '本节'),

    # 参考资料尾注的模板句（第二批实测：879 处 / 139 个文件，是最大的一处环境注解泄漏）。
    # 它把「作者没有网」写进了书里。改成面向读者的核验指引。
    (r'精确链接待联网环境待联网环境补全。', '精确链接请按条目名称自行检索核验。'),
    (r'精确链接待联网环境待补全。', '精确链接请按条目名称自行检索核验。'),
    (r'精确链接待联网环境补全。', '精确链接请按条目名称自行检索核验。'),
    (r'精确链接与版本信息待联网环境补全；引用前请自行核验。',
     '精确链接与版本信息请按条目名称自行检索核验；引用前请自行核验。'),
    (r'待联网环境补全', '请按条目名称自行检索核验'),
]

SKIP_DIRS = {'.git', '.idea', '.tmp-dispatch', '.superpowers', 'attachments'}


def book_files(root: str):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if not name.endswith('.md'):
                continue
            # 跳过根目录下的工作文档（点文件）
            if dirpath == root and name.startswith('.'):
                continue
            yield os.path.join(dirpath, name)[len(root) + 1:]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root', default='.')
    ap.add_argument('--check', action='store_true', help='只报告，不修改')
    o = ap.parse_args()

    changed = []
    for p in book_files(o.root):
        full = os.path.join(o.root, p)
        try:
            src = open(full, encoding='utf-8').read()
        except OSError:
            continue
        out = src
        for pat, rep in SUBS:
            out = re.sub(pat, rep, out)
        if out == src:
            continue
        n = sum(1 for a, b in zip(src.splitlines(), out.splitlines()) if a != b)
        changed.append((n, p))
        if not o.check:
            open(full, 'w', encoding='utf-8').write(out)

    for n, p in sorted(changed, reverse=True):
        print(f'  {n:3d} 行  {p}')
    print(f'\n{"将改动" if o.check else "已改动"} {len(changed)} 个文件')

    leaked = [p for p in book_files(o.root)
              if '本环境' in open(os.path.join(o.root, p), encoding='utf-8').read()
              or '待联网环境' in open(os.path.join(o.root, p), encoding='utf-8').read()
              or '联网环境补全' in open(os.path.join(o.root, p), encoding='utf-8').read()]
    if leaked:
        print('\n仍含环境注解的书稿文件（应为 0）：')
        for p in leaked:
            print('  ' + p)
        return 1
    print('复查通过：书稿正文已无环境注解')
    return 0


if __name__ == '__main__':
    sys.exit(main())
