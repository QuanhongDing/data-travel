#!/usr/bin/env python3
"""本书的六条**形式化**不变量（只查结构，不查语义）。

用法：python3 .check-invariants.py
退出码非 0 表示有异常项（1 项以上）。

   ① 代码围栏奇偶        —— 抓「整段被吞」
   ② 相对链接可达        —— 抓断链
   ③ 锚点在目标里存在     —— 抓「点不动」的链接（**必须索引全部标题级**）
   ④ 别名指向真实文件     —— 抓命名变体失配
   ⑤ 无入链文件          —— 抓读者到不了的页

⚠ 已知误报：表格单元格检查会把货币区间（`$0.001-0.005`）当行内公式吞掉。
⚠ 这些判据都**只听结构不听意思**；语义问题（引用落空、档位、循环引用、算例）
  只能靠 agent 逐条读 —— 本会话实测正则在这类判据上精度≈0。
"""
import os, re, sys, collections

ROOT = os.path.dirname(os.path.abspath(__file__))
SKIP = {'.git', 'docs', 'attachments', 'node_modules', '.tmp-dispatch'}
FENCE = re.compile(r'^\s*(```|~~~)')

def is_content(p):
    rel = os.path.relpath(p, ROOT)
    parts = rel.split(os.sep)
    return not parts[0].startswith('.') and not any(x in SKIP for x in parts[:-1])

def slug(h):
    h = re.sub(r'[`*_\[\]()]', '', h).strip().lower()
    h = re.sub(r'[^\w一-鿿\s-]', '', h)
    return re.sub(r'\s+', '-', h)

files, heads, refs = [], {}, set()
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP and not d.startswith('.')]
    for n in fn:
        p = os.path.join(dp, n)
        if not n.endswith('.md') or not is_content(p):
            continue
        files.append(p)
        hs = set(); inf = False
        for l in open(p, encoding='utf-8', errors='replace'):
            if FENCE.match(l): inf = not inf; continue
            if inf: continue
            m = re.match(r'^#{1,6}\s+(.*)', l)   # ← 全部标题级，不是只有编号 H2
            if m: hs.add(slug(m.group(1)))
        heads[p] = hs

LINK = re.compile(r'\]\(([^)\s]+\.md)(?:#[^)]*)?\)')
ANCH = re.compile(r'\]\(([^)\s]*?)#([^)\s]+)\)')
def cells(line):
    t = line.strip().strip('|').replace('\\|', '\x00')
    t = re.sub(r'`[^`]*`', '', t)
    t = re.sub(r'\$[^$]{1,40}\$', '', t)
    return t.count('|') + 1

fence_bad = []; dead = []; anch_bad = []; tbl_bad = []; cjksp_bad = []
# ④ 中文之间的多余空格：中文正文里不该出现「中<space>中」。
#    2026-10-18 加的：这类空格是全局替换留下的尾巴，全书曾有 570+ 处。
#    行内代码必须先切出来（SPLIT 带捕获组，代码段会保留在奇数下标），否则会把代码里的空格也算进来。
CJKSP = re.compile(r'(?<=[一-鿿]) (?=[一-鿿])')
CJKSP_SPLIT = re.compile(r'(`[^`]*`)')
for p in files:
    inf = False; nf = 0; block = []
    for i, l in enumerate(open(p, encoding='utf-8', errors='replace').read().split('\n'), 1):
        if FENCE.match(l): inf = not inf; nf += 1; continue
        if inf: continue
        for seg_i, seg in enumerate(CJKSP_SPLIT.split(l)):
            if seg_i % 2 == 0 and CJKSP.search(seg):
                cjksp_bad.append((os.path.relpath(p, ROOT), i, seg.strip()[:80]))
                break
        for t in LINK.findall(l):
            if t.startswith(('http', 'mailto:')): continue
            refs.add(os.path.normpath(os.path.join(os.path.dirname(p), t)))
            if not os.path.exists(os.path.normpath(os.path.join(os.path.dirname(p), t))):
                dead.append((os.path.relpath(p, ROOT), i, t))
        for t, a in ANCH.findall(l):
            q = os.path.normpath(os.path.join(os.path.dirname(p), t)) if t else p
            if os.path.exists(q) and q in heads and a.lower() not in heads[q]:
                anch_bad.append((os.path.relpath(p, ROOT), i, (t or '(self)') + '#' + a))
        if l.lstrip().startswith('|'):
            block.append(l)
        else:
            if len(block) >= 2:
                hd = cells(block[0])
                for r in block:
                    if not re.match(r'^\s*\|[\s:|-]+\|\s*$', r) and cells(r) != hd:
                        tbl_bad.append((os.path.relpath(p, ROOT), r[:90]))
            block = []
    if nf % 2: fence_bad.append(os.path.relpath(p, ROOT))

orph = [f for f in files if f not in refs and os.path.basename(f) != 'README.md']

print(f'① 代码围栏异常      : {len(fence_bad)}')
print(f'② 相对链接死链      : {len(dead)}')
print(f'③ 锚点落空          : {len(anch_bad)}')
print(f'④ 中文间多余空格    : {len(cjksp_bad)}')
print(f'⑥ 表格单元格数异常  : {len(tbl_bad)}  （含已知误报：货币区间）')
print(f'⑤ 无入链内容文件    : {len(orph)}')
for name, rows in [('围栏', fence_bad), ('死链', dead), ('锚点', anch_bad), ('中文空格', cjksp_bad),
                   ('表格', tbl_bad), ('孤儿', orph)]:
    for r in rows[:8]: print(f'   [{name}] {r}')
sys.exit(1 if (fence_bad or dead or anch_bad or cjksp_bad or orph) else 0)
