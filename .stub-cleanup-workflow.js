export const meta = {
  name: 'stub-file-cleanup',
  description: '处置全书 19 个「未填充的占位子文件」：判断该填还是该删，填则补真内容、删则同步删链接',
  phases: [
    { title: 'Triage', detail: '每 agent 判断一组文件该填还是该删' },
    { title: 'Verify', detail: '独立复核：填的是真内容 / 删的没留死链' },
    { title: 'Fix2', detail: '未闭合的再修一轮' },
  ],
}

// args: { findings, files: [...], groupSize }
const cfg = args
const REPO = '/Users/dqh/CCProject/me/data-travel'
const FINDINGS = REPO + '/' + cfg.findings
const files = cfg.files
const GROUP = cfg.groupSize || 3
const short = function (p) { return p.split('/').slice(-2)[0] }

const groups = []
for (let i = 0; i < files.length; i += GROUP) groups.push(files.slice(i, i + GROUP))

const COMMON = [
  '仓库：' + REPO + ' —— 纯 Markdown 书籍《AI 时代数据架构师》，无构建步骤。',
  '',
  '**本环境没有网络**：WebSearch 返回空结果、WebFetch 被阻断（已实测）。禁止使用。',
  '核不到的来源按【经验】档用区间表述；**不要把「本环境」「待联网环境」这类写作过程说明写进正文**。',
  '',
  '**禁止执行任何 git 写命令**（`git show HEAD:<path>` / `git diff` 只读可用）。',
  '**不要 commit**——提交由主控统一做。',
]

const TRIAGE = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          action: { type: 'string', description: 'filled 或 deleted' },
          lines: { type: 'number', description: 'filled 后行数；deleted 时为 0' },
          linksRemoved: { type: 'array', items: { type: 'string' }, description: 'deleted 时同步删掉的链接所在文件' },
          reason: { type: 'string' },
        },
        required: ['path', 'action', 'reason'],
      },
    },
    // 交给主控统一提交：删了哪些文件
    deletedFiles: { type: 'array', items: { type: 'string' } },
  },
  required: ['results'],
}

const VERDICT = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    compliant: { type: 'boolean' },
    problems: { type: 'array', items: { type: 'string' } },
    leftoverPlaceholders: { type: 'array', items: { type: 'string' }, description: '仍存在的模板残留，如 {X / Y}、| | | |' },
    deadLinks: { type: 'array', items: { type: 'string' }, description: '指向已删文件的残留链接' },
  },
  required: ['path', 'compliant'],
}

function triagePrompt(batch) {
  return [
    '你是《AI 时代数据架构师》书稿的占位文件处置执行者。',
    '',
    '第 1 步：完整读 ' + FINDINGS + ' —— 它说明了这批文件是什么、两种情形如何区分、以及硬性要求。',
    '',
    '第 2 步：处置下面 ' + batch.length + ' 个文件：',
    batch.map(function (p) { return '  - ' + REPO + '/' + p }).join('\n'),
    '',
    '对每个文件：',
    '1) Read 它，确认它到底是不是「只有模板骨架、内容从未填」。',
    '2) **判断该填还是该删**：',
    '   - 若同目录已有 `-section-N-secN.md` 覆盖了同一主题（用 `git show HEAD:` 与 grep 关键短语确认）',
    '     → 它是遗留重复文件，**删除它**；',
    '   - 若它代表一个独立小节（内容没有被别处覆盖）→ **填成真内容**。',
    '3) **删除文件时必须同步删掉所有指向它的链接**：',
    '   先 `grep -rn "<文件名>" --include="*.md" .` 找出引用它的 README 与主文件，逐处删掉该行或该表行。',
    '   留着链接会变成死链——那比原来的空文件更糟。',
    '4) 填内容时：参照**同章同类已达标文件**的体例与篇幅（这类小节通常 60–150 行，',
    '   **不要硬凑 300 行**）。内容要与该章其余各节同一套证据纪律：',
    '   具体数字标【公开】/【推算】/【经验】；核不到的写「本节未核到可引用的公开出处，按【经验】档处理」。',
    '5) **不得残留模板语法**：`{充足 / 部分 / 不足}`、`| | | |`、`X 小时`、`待补充` 这类一律清掉。',
    '6) 特别注意：有的文件里的示例内容**来自别的章节**（例如领导力章节的 IDP 文件里写着',
    '   「学习 Pinecone / Milvus 调优」），填内容时必须换成与本章主题相符的。',
    '',
    COMMON.join('\n'),
    '',
    '返回结构化结果，并在 results[].reason 里写清你为什么选「填」或「删」。',
  ].join('\n')
}

function verifyPrompt(p) {
  return [
    '你是独立的**对抗式**复核者。你的任务是证伪。仓库：' + REPO,
    '待复核文件：' + REPO + '/' + p,
    '处置规范：' + FINDINGS,
    '',
    '用 Read / Bash 实际检查：',
    '1) **该文件现在是什么状态**？存在吗？',
    '2) 若**被删除**：',
    '   - `grep -rn "' + p.split('/').pop() + '" --include="*.md" .` 是否还有指向它的链接？',
    '     有 = 死链，记为 deadLinks（这是**最严重**的失败模式）。',
    '   - 删除前是否确认过内容已被别处覆盖？若没有覆盖，删除就是**丢内容**，记为问题。',
    '3) 若**被填入内容**：',
    '   - `grep -nE "\\{[^}]*[/|][^}]*\\}|\\| *\\| *\\| *\\| *\\|" ' + p + '` 是否还有模板残留？',
    '   - 行数是否与同章同类文件量级相当（60–150 行即可，不要求 300）？',
    '   - **内容是否与本章主题相符**？（重点查有没有从别章复制来的示例，如领导力章节出现向量库/ Pinecone）',
    '   - 数字是否标了档位？有没有为凑内容而编造的精确数字？',
    '   - 正文有没有出现「本环境」这类写作过程说明？',
    '4) 无论填还是删，**同目录的 README 与主文件的目录表是否仍与该目录的实际文件一致**？',
    '',
    '只读，不要修改文件。禁止 git 写操作。',
    '每条问题写清：类型 + 行号或原文片段 + 为什么算问题。确实无问题才返回 compliant=true。',
  ].join('\n')
}

phase('Triage')
log('处置 ' + files.length + ' 个占位文件，' + groups.length + ' 个 agent')

const results = await pipeline(
  groups,
  function (batch) {
    return agent(triagePrompt(batch), { schema: TRIAGE, phase: 'Triage', label: 'triage:' + batch.map(short).join('+') })
      .then(function (r) { return { batch: batch, triage: r } })
  },
  function (prev) {
    if (!prev || !prev.triage) return prev
    return parallel(
      prev.batch.map(function (p) {
        return function () {
          return agent(verifyPrompt(p), { schema: VERDICT, phase: 'Verify', label: 'verify:' + short(p) })
        }
      })
    ).then(function (vs) { prev.verdicts = vs; return prev })
  },
  function (prev) {
    if (!prev || !prev.verdicts) return prev
    const bad = []
    prev.batch.forEach(function (p, i) {
      const v = prev.verdicts[i]
      if (!v || !v.compliant) {
        bad.push({
          path: p,
          problems: (v && v.problems && v.problems.length) ? v.problems : ['复核未通过，按规范逐条自查'],
          dead: (v && v.deadLinks) || [],
          left: (v && v.leftoverPlaceholders) || [],
        })
      }
    })
    if (!bad.length) { prev.repairs = []; return prev }
    return parallel(
      bad.map(function (b) {
        return function () {
          const lines = []
          if (b.dead.length) {
            lines.push('**严重：你删了文件但留下了指向它的链接。必须把这些链接一并删掉：**')
            b.dead.forEach(function (x) { lines.push('  - ' + x) })
          }
          if (b.left.length) {
            lines.push('仍有模板残留，必须清掉：')
            b.left.forEach(function (x) { lines.push('  - ' + x) })
          }
          lines.push.apply(lines, b.problems.map(function (x, i) { return (i + 1) + '. ' + x }))
          return agent(
            [
              '你是《AI 时代数据架构师》书稿的占位文件处置执行者。',
              '规范：' + FINDINGS,
              '本组文件：' + prev.batch.map(function (p) { return REPO + '/' + p }).join('、'),
              '',
              '复核者发现了下列问题，逐条修掉：',
              lines.join('\n'),
              '',
              '重申：**删文件必须同步删链接**；不得残留模板语法；不得编造精确数字。',
              COMMON.join('\n'),
            ].join('\n'),
            { schema: TRIAGE, phase: 'Fix2', label: 'fix2:' + short(b.path) }
          ).then(function () {
            return agent(verifyPrompt(b.path), { schema: VERDICT, phase: 'Fix2', label: 'reverify:' + short(b.path) })
              .then(function (v2) {
                return { path: b.path, reverified: v2 ? v2.compliant : null, remaining: v2 ? v2.problems : ['复核未返回'], dead: v2 ? v2.deadLinks : [] }
              })
          })
        }
      })
    ).then(function (f2) { prev.fixes = f2.filter(Boolean); return prev })
  }
)

const out = results.filter(Boolean)
const ok = [], unresolved = [], deleted = []
out.forEach(function (r) {
  r.batch.forEach(function (p, i) {
    const v = r.verdicts[i]
    const f2 = (r.fixes || []).filter(function (x) { return x.path === p })[0]
    const passed = f2 ? f2.reverified === true : (v && v.compliant === true)
    if (passed) ok.push(p)
    else unresolved.push({ path: p, remaining: f2 ? f2.remaining : (v ? v.problems : ['未复核']) })
  })
  if (r.triage && r.triage.deletedFiles) r.triage.deletedFiles.forEach(function (d) { deleted.push(d) })
})

return { targeted: files.length, passed: ok.length, deletedFiles: deleted, unresolved: unresolved }
