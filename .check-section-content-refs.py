#!/usr/bin/env python3
"""校验「§N.M 的 X」这类引用：X 是否真的出现在 §N.M 那一节里。

比 .check-section-pointers.py 严一档：那个只查小节**标题存在**，本脚本查小节**内容**。
实测动因：某文件写「§3.2.3 的候选边结构」，而候选边结构实际在 §3.2.5；
标题校验过不了这一关。

判据（保守）：把「的」后面到标点为止的短语当作被引用物，在目标小节正文里找
它的**尾部 2–4 字**；一个都找不到才报。宁漏勿错报。
"""
import os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SKIP = ('.git', 'docs', 'attachments', 'node_modules', '.tmp-dispatch')
FENCE = re.compile(r'^\s*(```|~~~)')
HEAD = re.compile(r'^(#{2,4})\s+(\d+)\.(\d+)')
# 只认「§N.M 的「被引物」」——书里给具名事物用的是「」，不加引号的多是句子
REF = re.compile(r'§\s*(\d+)\s*\.\s*(\d+)\s*的\s*[「“]([^」”]{2,18})[」”]')
LINKPATH = re.compile(r'\]\(([^)]+\.md)[^)]*\)')


def strip_fences(text):
    out, in_f = [], False
    for line in text.split('\n'):
        if FENCE.match(line):
            in_f = not in_f
            out.append('')
            continue
        out.append('' if in_f else line)
    return out


def sections(path):
    """{('3','2'): [正文行...]}"""
    lines = strip_fences(open(path, encoding='utf-8', errors='replace').read())
    res, cur, depth = {}, None, None
    for line in lines:
        m = HEAD.match(line)
        if m:
            cur, depth = (m.group(2), m.group(3)), len(m.group(1))
            res.setdefault(cur, [])
            continue
        if cur is not None:
            res[cur].append(line)
    return res


def main(targets):
    files = []
    for dp, dn, fn in os.walk(ROOT):
        dn[:] = [d for d in dn if d not in SKIP and not d.startswith('.')]
        files += [os.path.join(dp, n) for n in fn if n.endswith('.md')]
    if targets:
        files = [os.path.abspath(t) for t in targets]

    cache, hits = {}, []
    for p in sorted(files):
        txt = open(p, encoding='utf-8', errors='replace').read()
        for i, line in enumerate(strip_fences(txt), 1):
            for sec, sub, phrase in REF.findall(line):
                key = (os.path.dirname(p), sec)
                if key not in cache:
                    pool = {}
                    for n in os.listdir(os.path.dirname(p)):
                        if not n.endswith('.md'):
                            continue
                        if n == os.path.basename(p) or re.search(
                                r'-section-' + re.escape(sec) + r'(-|\.md$)', n):
                            for k, v in sections(os.path.join(os.path.dirname(p), n)).items():
                                pool.setdefault(k, []).extend(v)
                    cache[key] = pool
                body = '\n'.join(cache[key].get((sec, sub), []))
                if not body:
                    continue
                phrase = phrase.strip('「」“” ')
                probes = [phrase[-k:] for k in (4, 3, 2) if len(phrase) >= k] or [phrase]
                if not any(pr in body for pr in probes):
                    hits.append((os.path.relpath(p, ROOT), i, sec, sub, phrase, probes[-1]))
    print(f'扫描 {len(files)} 个文件；未解析的「§N.M 的 X」引用：{len(hits)} 处\n')
    for f, i, sec, sub, ph, probe in hits:
        print(f'{f}:{i}   §{sec}.{sub} 的「{ph}」（尾部探针「{probe}」在该小节 0 命中）')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
