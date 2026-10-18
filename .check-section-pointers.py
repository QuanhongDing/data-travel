#!/usr/bin/env python3
"""校验全书 `§N.M` 交叉引用是否指向真实存在的小节标题。

用法：
    python3 .check-section-pointers.py            # 全库
    python3 .check-section-pointers.py <文件...>   # 指定文件

判据（保守，宁漏勿错报）：
- 引用写作 `§3.4` / `§ 3.4` / `§3.4.1`，取前两段为 (节, 小节)。
- 候选目标：引用所在的文件本身 + 同章目录下所有 `*-section-<节>-*.md`。
- 命中条件：候选文件里存在行首形如 `### <节>.<小节>`（允许空格）的标题。
- 另外跳过：代码围栏内的行、点文件、docs/、attachments/。
"""
import os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SKIP_DIR = ('.git', 'docs', 'attachments', 'node_modules', '.tmp-dispatch')

REF = re.compile(r'§\s*(\d+)\s*\.\s*(\d+)')
FENCE = re.compile(r'^\s*(```|~~~)')

def is_content(path):
    if not path.endswith('.md'):
        return False
    rel = os.path.relpath(path, ROOT)
    parts = rel.split(os.sep)
    if parts[0].startswith('.'):
        return False
    return not any(p in SKIP_DIR for p in parts[:-1])

def strip_fences(text):
    out, infence = [], False
    for line in text.split('\n'):
        if FENCE.match(line):
            infence = not infence
            out.append('')          # 围栏标记本身不算正文
            continue
        out.append('' if infence else line)
    return out

def headings_of(path):
    try:
        text = open(path, encoding='utf-8', errors='replace').read()
    except OSError:
        return set()
    hs = set()
    for line in strip_fences(text):
        m = re.match(r'^#{2,4}\s+(\d+)\.(\d+)\b', line)
        if m:
            hs.add((m.group(1), m.group(2)))
    return hs

def sibling_section_files(path, sec):
    """§N.M 的候选目标。

    注意：`§N.M` 里的 N **不一定是节号**。本书并存三套编号：
      ① 节号（`-section-N-*.md` 的 `### N.M`）—— 规范骨架用这套；
      ② **案例号按章号编**（第 10 章 `-section-6-sec6.md` 里是 `### 10.1`）；
      ③ §8 子主题文件里沿用**原始 PDF 题号**（`### 4.7`）。
    所以候选要放宽到本章**所有** md 文件里去找 `### N.M`，
    否则 ②③ 两类会被整类误报（实测过：§6 引用修好后 `§10.1` 仍被报为未解析）。
    """
    d = os.path.dirname(path)
    try:
        names = os.listdir(d)
    except OSError:
        return []
    main = os.path.join(d, os.path.basename(d) + '.md')
    out = [main] if os.path.exists(main) else []
    pat = re.compile(r'-section-' + re.escape(sec) + r'(-|\.md$)')
    hit = [n for n in names if n.endswith('.md') and pat.search(n)]
    if hit:
        out += [os.path.join(d, n) for n in hit]
    else:
        # 没有 -section-<sec>- 文件时，把本章全部 md 纳入候选（覆盖案例号 / PDF 号）
        out += [os.path.join(d, n) for n in names if n.endswith('.md')]
    return out

def main(targets):
    files = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIR and not d.startswith('.')]
        for n in filenames:
            p = os.path.join(dirpath, n)
            if is_content(p):
                files.append(p)
    if targets:
        files = [os.path.abspath(t) for t in targets]

    cache, bad = {}, []
    for p in sorted(files):
        try:
            lines = strip_fences(open(p, encoding='utf-8', errors='replace').read())
        except OSError:
            continue
        for i, line in enumerate(lines, 1):
            for sec, sub in REF.findall(line):
                key = (p, sec)
                if key not in cache:
                    got = headings_of(p)
                    for s in sibling_section_files(p, sec):
                        got |= headings_of(s)
                    cache[key] = got
                if not cache[key]:
                    continue          # 本章没有这一节（多为跨章引用），跳过
                if (sec, sub) not in cache[key]:
                    bad.append((p, i, sec, sub, line.strip()[:120]))
    rel = lambda p: os.path.relpath(p, ROOT)
    print(f'扫描 {len(files)} 个文件，未解析的 §N.M 引用：{len(bad)} 处\n')
    for p, i, sec, sub, txt in bad:
        print(f'{rel(p)}:{i}  §{sec}.{sub}\n    {txt}')
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
