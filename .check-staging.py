#!/usr/bin/env python3
"""提交前的暂存体检：拦住「把还在写的东西提交进去」。

为什么需要它（2026-10-18，同一个错犯了两次）：
  本会话我用 `git add` 的**通配形式**（`git add -A -- $(git diff --name-only …)`）提交了两次，
  两次都把**当时正被后台 workflow 写入的文件**一起提交了。
  第一次是运气好（那些文件恰好是完整的）；第二次还是。
  「下次记得用显式清单」这条规则我已经写下过，**但规则没拦住我，因为没有东西在执行它**。

做法：提交前跑一次，
    python3 -I .check-staging.py
它把**已暂存但最近 N 秒内还被改过**的文件列出来——那几乎一定是「另一个进程正在写它」。

退出码非 0 表示「暂存区里有疑似在写的文件，先别提交」。
确实想提交（比如你刚手动改完）时，加 `--force-ok` 跳过。
"""
import os, subprocess, sys, time

LIMIT = int(os.environ.get('STAGING_FRESH_SECS', '150'))


def main():
    force = '--force-ok' in sys.argv
    rel = subprocess.run(['git', 'diff', '--cached', '--name-only', '-z'],
                         capture_output=True, text=True).stdout
    staged = [p for p in rel.split('\0') if p.strip()]
    if not staged:
        print('暂存区为空。')
        return 0
    now = time.time()
    fresh = []
    for p in staged:
        if not os.path.exists(p):
            continue
        age = now - os.path.getmtime(p)
        if age < LIMIT:
            fresh.append((age, p))
    print(f'已暂存 {len(staged)} 个文件；其中最近 {LIMIT} 秒内还被改过的：{len(fresh)} 个')
    for age, p in sorted(fresh):
        print(f'   {age:5.0f} 秒前  {p}')
    if fresh and not force:
        print('\n⚠ 这些文件很可能是**后台 workflow 正在写**的。')
        print('  请确认它们已完成（复核报告已回），否则先取消暂存：')
        print('     git restore --staged <上面列出的路径>')
        print('  确认无误时加 --force-ok 重新运行。')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
