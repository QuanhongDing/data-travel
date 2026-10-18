export const meta = {
  name: 'ref-audit',
  description: '逐条核对文件里的「见 §X / [§X](path) §X.M 的 Y」引用是否真的落在所指的内容上',
  phases: [
    { title: 'Audit', detail: '每个 agent 审若干文件，逐条 grep 核对' },
    { title: 'Confirm', detail: '独立复核者证伪：报告的问题是否真成立' },
  ],
}

// args: { files: [...], perAgent: n, label }
const cfg = args
const REPO = '/Users/dqh/CCProject/me/data-travel'
const files = cfg.files || []
const PER = cfg.perAgent || 3

const batches = []
for (let i = 0; i < files.length; i += PER) batches.push(files.slice(i, i + PER))

const FINDINGS = {
  type: 'object',
  properties: {
    broken: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          line: { type: 'number' },
          quote: { type: 'string', description: '被引用的原文片段（含 §号）' },
          claim: { type: 'string', description: '这句话声称目标处有什么' },
          evidence: { type: 'string', description: '你 grep 了什么、命令与结果行数' },
          verdict: { type: 'string', description: '不存在 / 指向别的小节 / 标签不符' },
        },
        required: ['path', 'line', 'quote', 'claim', 'evidence', 'verdict'],
      },
    },
    checkedCount: { type: 'number', description: '本轮实际逐条核过的引用数' },
  },
  required: ['broken', 'checkedCount'],
}

const CONFIRM = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    stands: { type: 'boolean', description: '这条问题是否真的成立' },
    why: { type: 'string' },
  },
  required: ['path', 'stands', 'why'],
}

const AUDIT = [
  '你是《AI 时代数据架构师》书稿的**引用核对员**。仓库：' + REPO,
  '',
  '**本环境没有网络**，禁止 WebSearch / WebFetch。核对的依据只能是仓库内部的文件。',
  '这条约束**一个字都不许写进书稿**。你本轮通常不改稿，若确需改，正文里不得出现',
  '「本环境」「本项目环境」这类关于作者环境的元叙述。',
  '',
  '## 你要做什么',
  '',
  '对分配给你的每个文件，**逐条**找出所有形如下列的引用：',
  '- 「§3.2.3 的候选边结构」',
  '- 「见 §3.5」「参见 §7.3.1」「（§4.3）」',
  '- 「[09 数据血缘 §3](../09-data-lineage/09-data-lineage-section-3-sec3.md) §3.2.3 的 X」',
  '- 「主文件 §1.4 记」「本章 §2.2 给出」',
  '',
  '然后**一条一条用 grep 实际核对**：被引的那一节里，到底有没有这句话声称的内容？',
  '',
  '核对方法（必须照做，不要凭印象）：',
  '1. 先确定目标文件：同章的 `<章名>-section-<N>-*.md` / `<章名>.md`，',
  '   或方括号里给出的路径（跨章引用）。',
  '2. 用 `sed -n "/^### 3\\.2\\.3/,/^###/p" <目标文件>` 或 `awk` 把那一节的正文取出来。',
  '3. 在**那一节的范围**内 grep 被引物的关键词，**记下命令与命中行数**。',
  '   注意：要在该节范围内找，不要在整文件里找 —— 整文件找得到但该节里没有，',
  '   **同样是缺陷**（这正是最常见的一类）。',
  '4. 命中 0 次 → 记为 broken。命中位置属于另一个小节 → 记为 broken（指向别的小节）。',
  '5. 引用的**标签**（如「既有能力（L1）」）与目标处实际写的标签不一致 → 记为 broken（标签不符）。',
  '',
  '## 不要报的东西',
  '',
  '- 指向**别章**、而目标文件/小节不存在的引用 —— 先确认路径是否真错；路径对、内容对，就不算问题。',
  '- 「见本节」「见上文」「如前所述」这类**自指**。',
  '- 纯粹的格式差异（`§ 3.1` 带空格 vs `§3.1`）。',
  '- 你觉得「这句话讲得不够好」。**本轮只查引用是否落空，不评内容质量。**',
  '',
  '## 精度要求（这条最重要）',
  '',
  '**宁可漏报，不可错报。** 每报一条，都要能在 evidence 里写出你跑的 grep 命令与结果。',
  '写不出命令的，不要报。若你实际核了 40 条、一条问题都没有，就返回空数组 —— ',
  '「没找到问题」是有效结论，不要为了凑数而报。',
  '',
  '你的最终文本就是返回值。',
].join('\n')

const CONFIRM_P = function (b) {
  return [
    '你是独立的**证伪者**。有人在书稿里报了一条「引用落空」的问题，你的任务是**推翻它**。',
    '仓库：' + REPO + '（本环境无网络，禁止 WebSearch/WebFetch）',
    '',
    '被报的问题：',
    '  文件：' + b.path,
    '  行号：' + b.line,
    '  原文：' + b.quote,
    '  声称：' + b.claim,
    '  报告者的证据：' + b.evidence,
    '  判定：' + b.verdict,
    '',
    '请**实际打开文件**核对：',
    '1. 该行现在是不是这个样子？（行号可能已变，用 grep 找原文片段）',
    '2. 被引的那一节，范围划对了吗？（报告者可能把节边界划错）',
    '3. 被引物真的一次都没出现吗？（试试同义词、缩写、不同写法）',
    '4. 有没有可能这是**跨章引用**、目标在别的目录？',
    '',
    '若你能证明这条问题不成立，stands=false 并说明理由。',
    '**默认怀疑报告者**：报告者也会出错（实测过：把 `### 4.x` 当成别节标题，',
    '而它其实挂在 `## 4 本章小结` 下，编号是对的）。',
    '只有当你**无法推翻**时才 stands=true。',
  ].join('\n')
}

phase('Audit')
const found = await parallel(batches.map(function (b) {
  return function () {
    return agent(AUDIT + '\n\n## 本轮分配给你的文件\n\n' +
      b.map(function (p) { return '- ' + REPO + '/' + p }).join('\n'),
      { label: 'audit:' + b.length + 'f', phase: 'Audit', schema: FINDINGS })
  }
}))

const all = found.filter(Boolean).flatMap(function (r) { return r.broken || [] })
const checked = found.filter(Boolean).reduce(function (a, r) { return a + (r.checkedCount || 0) }, 0)
log('核过 ' + checked + ' 条引用，报出 ' + all.length + ' 条待证伪')

phase('Confirm')
const verdicts = await parallel(all.map(function (b) {
  return function () {
    return agent(CONFIRM_P(b), { label: 'confirm', phase: 'Confirm', schema: CONFIRM })
      .then(function (v) { return Object.assign({}, b, { stands: v && v.stands, why: v && v.why }) })
  }
}))

const confirmed = verdicts.filter(Boolean).filter(function (v) { return v.stands })
return { checked: checked, reported: all.length, confirmed: confirmed.length, broken: confirmed }
