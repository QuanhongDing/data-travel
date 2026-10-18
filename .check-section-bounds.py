#!/usr/bin/env python3
"""按「各节规范声明的小节标题」检查行数是否落在区间内。

为什么要这个脚本（2026-10-18）：
  前面每一轮派工都是**按「某轮报出的未闭合清单」**驱动的。结果是——
  **没进过任何清单的文件，既没被报缺陷（所以没派修复），也没被提交（所以不在版本历史里）**，
  于是 7 个 §4 文件超长到 397–567 行却无人过问，其中一个超上限 57%。
  「没人报错」不等于「合规」。规格里写了硬上限，就该有一条**按上限扫全书**的检查。

匹配规则（关键）：**只看文件自己的 `## N. <标题>`**，不看正文里出现的词。
  踩过的坑：按「正文里出现『关键决策』」匹配，会把面试题里提到「关键决策」的
  `-section-8-sec8.md` 全部误判成案例章 §5（一次误报 25 个文件）。
"""
import io, glob, os, re, sys, collections

# (H2 标题正则, 首个 H3 标题正则或 None, 下限, 上限, 应有的一级 H3 个数, 标签)
# 顺序即优先级，命中即停。
#
# 划界踩过的四个坑（都造成过整批误报，别再把规则放宽）：
#   1. 按**节号**划界 → 把案例章 §5 的 260–340 套到全部 §5 上，误报 25 个。
#   2. 按「正文里出现关键词」划界 → 面试题里提到「关键决策」的 `-section-8-sec8.md`
#      全被当成案例章 §5。
#   3. 把 `失败案例分析` 并进案例§5 规则 → `09-failure-cases §3`（8 个 H3）被误判。
#   4. 把 `改进措施` 并进操作脚本规则 → `11-team-topology §4`（正是 §4 的 7 节骨架，
#      259 行、合规）被按 220 行上限误判超 40 行。
#      **教训：标题会撞名，骨架不会。** 撞名的用「首个 H3 标题」判别：
#      `落地步骤` ⇒ §4 骨架（7 节）；`什么场合用` ⇒ 操作脚本骨架（6 节）。
RULES = [
    (re.compile(r'^(踩坑与教训|关键决策)$'),        None,        (260, 340), 7, '案例§5'),
    (re.compile(r'^工程实现$'),                     None,        (200, 360), 7, '§4'),
    (re.compile(r'^(改进措施|关键行动项)$'),         r'^落地步骤', (200, 360), 7, '§4'),
    (re.compile(r'^设计模式与范式$'),                None,        (300, 360), 8, '§3'),
    (re.compile(r'^前沿演进'),                      None,        (280, 340), 8, '§5'),
    (re.compile(r'^与其他方法对比$'),                None,        (300, 360), 8, '§7'),
    (re.compile(r'.'),                              r'^什么场合用', (140, 220), 6, '操作脚本'),
]
H2 = re.compile(r'^## \d+\.\s*(.+?)\s*$')
H3 = re.compile(r'^### (\d+)\.(\d+)\s*(.*)$')


def own_title(text):
    """取文件自己的一级节标题（第一个 `## N. 标题`）。非该形态则返回 None。"""
    for l in text.split('\n'):
        m = H2.match(l)
        if m:
            return m.group(1)
    return None


def top_h3_count(text):
    """本文件「自己那一节」的 `### N.x` 个数（以第一个 H3 的 N 为准）。"""
    hs = [m for m in (H3.match(l) for l in text.split('\n')) if m]
    if not hs:
        return 0
    top = int(hs[0].group(1))
    return len([m for m in hs if int(m.group(1)) == top])


def first_h3_title(text):
    """本文件第一个 `### N.x <标题>` 的标题（用于区分「同名不同骨架」）。"""
    for l in text.split('\n'):
        m = H3.match(l)
        if m:
            return m.group(3).strip()
    return ''


def scan(root='.'):
    rows = []
    for p in sorted(glob.glob(os.path.join(root, '**', '*.md'), recursive=True)):
        if '/.git/' in p or os.path.basename(p).startswith('.'):
            continue
        if os.path.basename(p) == 'README.md' or '-section-' not in os.path.basename(p):
            continue
        text = io.open(p, encoding='utf-8', errors='replace').read()
        n = len(text.split('\n'))
        t = own_title(text)
        if not t:
            continue
        h3first = first_h3_title(text)
        for rx, h3rx, (lo, hi), exp_h3, tag in RULES:
            if not rx.search(t):
                continue
            if h3rx and not re.search(h3rx, h3first):
                continue
            if n < lo or n > hi:
                rows.append((tag, n, lo, hi, p, t, '行数'))
            if exp_h3 is not None:
                got = top_h3_count(text)
                if got != exp_h3:
                    rows.append((tag, got, exp_h3, exp_h3, p, t, 'H3 数'))
            break
    return rows


if __name__ == '__main__':
    rows = scan(sys.argv[1] if len(sys.argv) > 1 else '.')
    c = collections.Counter(r[0] for r in rows)
    print('越界 %d 项：%s' % (len(rows), dict(c)))
    line_bad = [r for r in rows if r[6] == '行数']
    h3_bad = [r for r in rows if r[6] == 'H3 数']
    print('\n=== 行数超上限（%d） ===' % len([r for r in line_bad if r[1] > r[3]]))
    for tag, n, lo, hi, p, t, _ in sorted([r for r in line_bad if r[1] > r[3]],
                                          key=lambda r: -(r[1] - r[3])):
        print('  [%s] %4d（上限 %d，超 %3d）  %s' % (tag, n, hi, n - hi, p))
    print('\n=== 行数低于下限（%d） ===' % len([r for r in line_bad if r[1] < r[2]]))
    for tag, n, lo, hi, p, t, _ in sorted([r for r in line_bad if r[1] < r[2]], key=lambda r: r[1]):
        print('  [%s] %4d（下限 %d，差 %3d）  %s' % (tag, n, lo, lo - n, p))
    print('\n=== H3 个数不符（%d） ===' % len(h3_bad))
    for tag, got, exp, _, p, t, _ in sorted(h3_bad):
        print('  [%s] 应 %d 个，实 %d 个  %s' % (tag, exp, got, p))
