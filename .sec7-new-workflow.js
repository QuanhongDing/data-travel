export const meta = {
  name: 'sec7-new',
  description: '为缺 §7 的章按 §7 规范新写「对比与选型」子文件，并把主文件导航补上',
  phases: [
    { title: 'Write', detail: '每章一个新 §7 文件 + 主文件导航与悬空指针修正' },
    { title: 'Verify', detail: '独立对抗式复核' },
    { title: 'Repair', detail: '未过的按问题清单修复并复验' },
  ],
}

// args: { chapters: [ {dir, main} ], spec }
const REPO = '/Users/dqh/CCProject/me/data-travel'
const cfg = args
const SPEC = REPO + '/' + (cfg.spec || '.sec7-spec.md')

const VERDICT = {
  type: 'object',
  properties: {
    dir: { type: 'string' },
    lines: { type: 'number' },
    headings: { type: 'number' },
    compliant: { type: 'boolean' },
    problems: { type: 'array', items: { type: 'string' } },
    navFixed: { type: 'boolean', description: '主文件导航是否已补上 §7 且悬空 §7.x 指针已修正' },
  },
  required: ['dir', 'compliant'],
}

const COMMON = [
  '仓库：' + REPO + ' —— 纯 Markdown 书籍《AI 时代数据架构师》。',
  '',
  '**本环境没有网络**：WebSearch / WebFetch 不可用（已实测）。禁止使用。',
  '**禁止**把「搜不到」当作「是假的」——这里根本搜不了。证据只能来自仓库内部。',
  '',
  '**⚠ 这条环境说明只给你看，一个字都不许写进书稿。** 正文里不得出现「本环境」「本项目环境」',
  '「本节未核到可引用出处」这类关于作者工具/环境的元叙述。要表达同意思只能写成面向读者的',
  '核验指引（「请以官方文档当前版本为准」/「可按 <关键词> 自行检索核验」）。',
  '',
  '**禁止执行任何 git 命令**（`git show` / `git diff` 只读可用；`add` / `commit` / `checkout` / `stash` 禁止）。',
].join('\n')

const writePrompt = function (ch) {
  return [
    '你是《AI 时代数据架构师》的 §7 撰稿人。',
    '',
    '**任务**：本章 `' + ch.dir + '` **没有 §7 子文件**，而它的主文件导航表里已经写了',
    '「详见 §7.2」这类指针 —— 也就是说读者被指向一个不存在的节。你要补上这个节。',
    '',
    '第 1 步：完整读规范 ' + SPEC + '（硬性要求，尤其「证据纪律」与「硬性检查清单」）。',
    '第 2 步：读本章主文件 ' + REPO + '/' + ch.main + ' 的 §1、§2、§3–§6，',
    '  以及本目录下已有的 §3/§4/§5/§6 子文件 —— **本节要对比的候选方案清单，',
    '  必须与它们提到的一致**（哪些方法/工具/模式被本书当作同类对比对象）。',
    '第 3 步：按规范骨架写 **新文件** ' + REPO + '/' + ch.dir + '/' + ch.out + '，',
    '  行数 300–360，恰好 8 个 `### ` 小节（7.1–7.8）。',
    '第 4 步：改本章主文件 ' + REPO + '/' + ch.main + ' ——',
    '  ① 在导航列表里补上 `- [§7. 与其他方法对比](' + ch.out + ')`（位置在 §6 与 §8 之间）；',
    '  ② 把导航表里指向 §7 的悬空指针改成真实小节号（若表里写「§7.2」而你的 7.2 不是「决策树」，',
    '     就改成你实际把决策树放在的那个号）。**只改编号与链接，别的一律不动。**',
    '',
    '**本节的价值在于「机制 → 证据 → 决策」**：讲清候选之间**因为哪个机制而表现不同**，',
    '不是打分表。每条机制差异要能回答「因为 A，所以在 B 条件下必然优于 C，代价是 D」。',
    '',
    '证据纪律：每个数字标【公开】（来源+年份）/【推算】（写出推导链）/【经验】（区间+条件）。',
    '**禁止编造精确数字**（「延迟降低 47%」这类）。**禁止**为了凑骨架而写入拿不准的产品名。',
    '',
    COMMON,
    '',
    '你的最终文本就是返回值。返回结构化结果。',
  ].join('\n')
}

const verifyPrompt = function (ch) {
  return [
    '你是独立的**对抗式**复核者，任务是**证伪**。',
    '',
    '待复核：' + REPO + '/' + ch.dir + '/' + ch.out + '（新写的 §7）',
    '以及被改动的 ' + REPO + '/' + ch.main + '（只应改编号与链接）',
    '规范：' + SPEC + '（读它，按硬性检查清单逐条核）',
    '',
    '逐条实际检查（用 Read / Bash / `git diff`，不要凭印象）：',
    '1) 新文件行数是否 300–360？`### ` 是否恰好 8 个？',
    '2) **编造数字**：逐个挑出数字，无来源却精确到个位/百分位的一律记为问题。',
    '3) **伪因果**：核心节是否真有「因为 A，所以 B，代价是 C」？还是只有形容词并列？',
    '4) **候选清单是否与本章其它节一致**（不能只对比两个而漏掉本章 §3 列过的方法）。',
    '5) **主文件是否只改了编号与链接**：`grep -n "§7" <主文件>` 核对，',
    '   并确认**全文没有别的改动**（用 `git diff --stat` 与逐 hunk 看）。',
    '6) **悬空指针是否已消除**：主文件里还有没有指向不存在小节号的 §N.M？',
    '7) 链接正确性：新文件首行导航语与末行「配合阅读」的相对路径是否真实存在（用 ls）。',
    '8) 正文有无环境元叙述（「本环境」「本项目」）？',
    '',
    '只读，不要修改任何文件。**只把「问题」写进 problems**；确实无问题才 compliant=true。',
    '复核者也会出错 —— 不要为了凑数而报问题。',
  ].join('\n')
}

phase('Write')
const written = await parallel(cfg.chapters.map(function (ch) {
  return function () {
    return agent(writePrompt(ch), { label: 'write:' + ch.dir.split('/')[1], phase: 'Write' })
  }
}))

phase('Verify')
const verdicts = await parallel(cfg.chapters.map(function (ch) {
  return function () {
    return agent(verifyPrompt(ch), { label: 'verify:' + ch.dir.split('/')[1], phase: 'Verify', schema: VERDICT })
  }
}))

phase('Repair')
const failed = verdicts.filter(Boolean).filter(function (v) { return !v.compliant })
const repaired = await parallel(failed.map(function (v) {
  const ch = cfg.chapters.filter(function (c) { return c.dir === v.dir })[0] || {}
  return function () {
    return agent([
      '你是修复执行者。规范：' + SPEC + '。',
      '待修：' + REPO + '/' + (ch.dir || v.dir) + '/' + (ch.out || ''),
      '（若问题涉及主文件 ' + REPO + '/' + (ch.main || '') + '，也一并按问题清单修。）',
      '',
      '独立复核者发现了下列问题，逐条修掉：',
      (v.problems || []).map(function (x, i) { return '  ' + (i + 1) + '. ' + x }).join('\n'),
      '',
      COMMON,
    ].join('\n'), { label: 'repair:' + String(v.dir).split('/')[1], phase: 'Repair' })
  }
}))

return { written: written.filter(Boolean).length, verified: verdicts.filter(Boolean).length,
         passed: verdicts.filter(Boolean).filter(function (v) { return v.compliant }).length,
         repaired: repaired.filter(Boolean).length,
         open: failed.map(function (v) { return { dir: v.dir, problems: v.problems } }) }
