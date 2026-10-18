export const meta = {
  name: 'sec6-deepening-audit',
  description: '审核并补齐全书 § 6 深度案例（5 段 × 4 案例 × ~400 行），修复不合规文件并独立复核',
  phases: [
    { title: 'Discover', detail: '枚举全部 § 6 子文件与规模指标' },
    { title: 'Audit', detail: '逐批审核结构合规性' },
    { title: 'Fix', detail: '重写不合规文件' },
    { title: 'Verify', detail: '独立复核修复结果' },
    { title: 'Critic', detail: '完整性批判：还有什么没查' },
  ],
}

const REPO = '/Users/dqh/CCProject/me/data-travel'

const SPEC = [
  '规范全文见仓库根目录的 .rewrite-spec.md（先读它）。硬性要求：',
  '1) 恰好 4 个深度公司案例，标题形如 `### N.1 <公司>「**<标题>**」（<年-年）`；',
  '2) 每个案例严格按 5 段：**背景（Why）** → **触发点（What）** → **详细做法（How）** → **具体数字（How much）** → **失败教训**；',
  '3) 详细做法含 5 个编号组件，每个组件含 关键设计 / 关键能力 / 关键数字 三行；第一个组件另含一个「关键示意」代码块；',
  '4) 每个案例恰好 1 个代码块，缩进 5 空格，语言标注 text 或 sql；',
  '5) 每个案例有一个关键数字表（约 8 行）；',
  '6) 失败教训 4-5 条，每条必须带后果从句：「早期『X』——<具体后果>，倒逼『Y』」；',
  '7) 尾部依次为 `### N.5 真实落地路径`、`### N.6 踩坑与经验`、`### N.7 ROI 评估`、`> 本节小结`、`> 配合 [§ 2 核心原理](...) 阅读`；',
  '8) 文件恰好 7 个 `### ` 小节；总行数 380–470；',
  '9) 不得含占位行 `| X | 不可用 | 100% | **∞** |`；',
  '10) 不得含无信息量的单词式「关键能力：**统一**」这类行。',
  '禁止执行任何 git 命令（不要 git add / git commit / git checkout）。',
].join('\n')

const INVENTORY = {
  type: 'object',
  properties: {
    total: { type: 'number' },
    files: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          lines: { type: 'number' },
          headings: { type: 'number' },
          fillerRows: { type: 'number' },
        },
        required: ['path', 'lines', 'headings', 'fillerRows'],
      },
    },
  },
  required: ['total', 'files'],
}

const AUDIT = {
  type: 'object',
  properties: {
    reports: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          lines: { type: 'number' },
          caseCount: { type: 'number' },
          sectionsComplete: { type: 'boolean' },
          codeBlocksOk: { type: 'boolean' },
          tipsHaveConsequence: { type: 'boolean' },
          fillerRows: { type: 'number' },
          degenerateProse: { type: 'boolean' },
          casesRepeated: { type: 'boolean' },
          verdict: { type: 'string', enum: ['ok', 'needs-fix'] },
          issues: { type: 'array', items: { type: 'string' } },
        },
        required: ['path', 'lines', 'caseCount', 'sectionsComplete', 'verdict', 'issues'],
      },
    },
  },
  required: ['reports'],
}

const FIXRESULT = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    lines: { type: 'number' },
    headings: { type: 'number' },
    caseNames: { type: 'array', items: { type: 'string' } },
    changed: { type: 'boolean' },
  },
  required: ['path', 'lines', 'headings', 'caseNames'],
}

const VERDICT = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    lines: { type: 'number' },
    headings: { type: 'number' },
    fillerRows: { type: 'number' },
    compliant: { type: 'boolean' },
    problems: { type: 'array', items: { type: 'string' } },
  },
  required: ['path', 'compliant', 'problems'],
}

const CRITIC = {
  type: 'object',
  properties: {
    missing: { type: 'array', items: { type: 'string' } },
    coverage: { type: 'string' },
    residualRisks: { type: 'array', items: { type: 'string' } },
  },
  required: ['missing', 'coverage'],
}

function auditPrompt(batch) {
  return [
    '你是文档结构审核员。仓库：' + REPO,
    '',
    '审核下面 ' + batch.length + ' 个文件，逐个给出判定。这些是《AI 时代数据架构师》一书的 § 6 落地实践子文件。',
    '',
    SPEC,
    '',
    '审核方法（对每个文件）：',
    '- 用 Read 完整读一遍该文件，不要只读片段。',
    '- 用 Bash 跑这几条：wc -l <file>；grep -c "^### " <file>；grep -c \'```\' <file>；grep -c "不可用 | 100% | \\*\\*∞\\*\\*" <file>',
    '- 再人工判断以下几点（命令查不出来）：',
    '  a) 是否恰好 4 个案例，每个案例都完整具备 5 段；',
    '  b) 每个案例的「详细做法」是否有 5 个编号组件，且每个组件都有 关键设计 / 关键能力 / 关键数字；',
    '  c) 失败教训的每一条是否真的带后果从句，而不是半句话；',
    '  d) 是否存在无信息量的空洞表述，例如「关键能力：**统一**」「关键数字：**AI 集成**」；',
    '  e) 4 个案例之间是否在讲同一个机制（重复）。',
    '',
    '判定规则：以上任一条不满足 → verdict = "needs-fix"，并在 issues 里逐条写清「哪个案例 / 哪一段 / 具体什么问题」。',
    '全部满足 → verdict = "ok"，issues 为空数组。',
    '',
    '待审核文件：',
  ].concat(batch.map(function (f, i) {
    return (i + 1) + '. ' + f.path + '  （当前 ' + f.lines + ' 行 / ' + f.headings + ' 个 ### 小节 / ' + f.fillerRows + ' 处占位行）'
  })).join('\n')
}

function fixPrompt(path, issues) {
  return [
    '你是资深技术作者。仓库：' + REPO,
    '',
    '任务：把文件 ' + path + ' 的 § 6 整文件重写，使其完全符合规范。用 Write 工具整文件覆盖。',
    '',
    SPEC,
    '',
    '本次审核发现的问题（必须全部解决）：',
  ].concat(issues.map(function (s, i) { return (i + 1) + '. ' + s })).concat([
    '',
    '写作要求：',
    '- 先读该文件，确认原有的 4 个案例分别是哪些公司/方案，重写时必须保留这 4 个案例，不要换公司。',
    '- 再读这两个标杆文件作为格式与深度基准：',
    '  ' + REPO + '/03-data-stack/15-one-data/15-one-data-section-6-sec6.md',
    '  ' + REPO + '/15-case-studies/01-alibaba-data-middle-platform/01-alibaba-data-middle-platform-section-6-sec6.md',
    '- 每个「详细做法」组件要讲清机制与取舍：为什么这样做、不这样做会怎样。不要写「关键能力：**统一**」这类没有内容的行。',
    '- 关键示意代码块要画「两种做法的对比」（用 ─ │ ▼ ✗ ✓ 等字符），要有实质信息量，禁止空壳示意。',
    '- 失败教训每条都必须写成「早期『X』——<具体后果>，倒逼『Y』」的形式。',
    '- 目标总行数 400–450，恰好 7 个 `### ` 小节，恰好 8 个代码围栏（4 案例 × 2 行）。',
    '',
    '不要执行任何 git 命令。',
    '',
    '完成后返回：文件路径、最终行数、`### ` 小节数、4 个案例名。',
  ]).join('\n')
}

function verifyPrompt(path) {
  return [
    '你是独立复核员，任务是**证伪**下面这份重写结果，而不是确认它没问题。仓库：' + REPO,
    '',
    '待复核文件：' + path,
    '',
    SPEC,
    '',
    '复核方法（必须实际执行命令，不要凭印象）：',
    '- Read 完整读该文件。',
    '- Bash：wc -l ' + path,
    '- Bash：grep -c "^### " ' + path,
    '- Bash：grep -c \'```\' ' + path,
    '- Bash：grep -c "不可用 | 100% | \\*\\*∞\\*\\*" ' + path,
    '- Bash：grep -c "失败教训" ' + path + '   （应 >= 4）',
    '- Bash：grep -c "——.*倒逼" ' + path + '   （带后果从句的失败教训条数，应 >= 16）',
    '',
    '然后逐条对照规范检查。默认立场是「有问题」——只有实际验证过、确实找不到问题时，才把 compliant 设为 true。',
    '不确定时给 false，并在 problems 里写清不确定的点。',
    '',
    '返回：路径、行数、`### ` 小节数、占位行数、是否合规、所有发现的问题。',
  ].join('\n')
}

phase('Discover')
log('枚举全部 § 6 子文件…')
const inventory = await agent(
  [
    '在仓库 ' + REPO + ' 中枚举所有 *-section-6-sec6.md 文件。',
    '依次执行并把结果整理为结构化输出：',
    '  cd ' + REPO + ' && find . -name "*-section-6-sec6.md" | sort',
    '  cd ' + REPO + ' && find . -name "*-section-6-sec6.md" -exec wc -l {} + | sort -n',
    '  cd ' + REPO + ' && grep -rc "不可用 | 100% | \\*\\*∞\\*\\*" --include="*-section-6-sec6.md" .',
    '  cd ' + REPO + ' && grep -rc "^### " --include="*-section-6-sec6.md" .',
    '为每个文件给出：相对路径（形如 03-data-stack/15-one-data/15-one-data-section-6-sec6.md）、行数、### 小节数、占位行数。',
    '如果某条命令返回「暂时不可用 / timed out」，原样重试直到成功。',
    '不要执行任何 git 命令。只返回结构化数据。',
  ].join('\n'),
  { schema: INVENTORY, label: 'inventory', phase: 'Discover' }
)

if (!inventory || !inventory.files || !inventory.files.length) {
  log('未取得文件清单，工作流终止')
  return { error: 'inventory failed' }
}

const files = inventory.files
log('共 ' + files.length + ' 个 § 6 文件进入审核')

const BATCH = 9
const batches = []
for (let i = 0; i < files.length; i += BATCH) {
  batches.push(files.slice(i, i + BATCH))
}
log('分 ' + batches.length + ' 批并行审核')

phase('Audit')

const results = await pipeline(
  batches,
  function (batch, _orig, idx) {
    return agent(auditPrompt(batch), {
      schema: AUDIT,
      phase: 'Audit',
      label: 'audit#' + (idx + 1) + '(' + batch.length + ')',
    })
  },
  function (audit, batch, idx) {
    if (!audit || !audit.reports) {
      log('批次 #' + (idx + 1) + ' 审核未返回结果')
      return { batchIndex: idx, batch: batch, reports: [], fixed: [], ok: true, auditFailed: true }
    }
    const bad = audit.reports.filter(function (r) { return r && r.verdict === 'needs-fix' })
    if (!bad.length) {
      log('批次 #' + (idx + 1) + '：' + audit.reports.length + ' 个文件全部合规')
      return { batchIndex: idx, batch: batch, reports: audit.reports, fixed: [], ok: true, auditFailed: false }
    }
    log('批次 #' + (idx + 1) + '：' + bad.length + ' 个文件需要重写')
    return parallel(
      bad.map(function (r) {
        return function () {
          return agent(fixPrompt(r.path, r.issues || []), {
            schema: FIXRESULT,
            phase: 'Fix',
            label: 'fix:' + r.path.split('/').slice(-1)[0].replace('-section-6-sec6.md', ''),
          })
        }
      })
    ).then(function (fixed) {
      return {
        batchIndex: idx,
        batch: batch,
        reports: audit.reports,
        fixed: fixed.filter(Boolean),
        ok: false,
        auditFailed: false,
      }
    })
  },
  function (res, _batch, idx) {
    if (res.ok || !res.fixed.length) return res
    log('批次 #' + (idx + 1) + '：复核 ' + res.fixed.length + ' 个重写结果')
    return parallel(
      res.fixed.map(function (f) {
        return function () {
          return agent(verifyPrompt(f.path), {
            schema: VERDICT,
            phase: 'Verify',
            label: 'verify:' + f.path.split('/').slice(-1)[0].replace('-section-6-sec6.md', ''),
          })
        }
      })
    ).then(function (verdicts) {
      const v = verdicts.filter(Boolean)
      const bad = v.filter(function (x) { return !x.compliant })
      if (bad.length) {
        log('批次 #' + (idx + 1) + '：复核发现 ' + bad.length + ' 个仍未达标')
      } else {
        log('批次 #' + (idx + 1) + '：复核全部通过')
      }
      return Object.assign({}, res, { verdicts: v, stillBad: bad })
    })
  }
)

const allReports = results.filter(Boolean).flatMap(function (r) { return r.reports ? r.reports : [] })
const needsFix = allReports.filter(function (r) { return r && r.verdict === 'needs-fix' })
const fixedList = results.filter(Boolean).flatMap(function (r) { return r.fixed ? r.fixed : [] })
const verdictList = results.filter(Boolean).flatMap(function (r) { return r.verdicts ? r.verdicts : [] })
const stillBad = verdictList.filter(function (v) { return !v.compliant })
const auditFailed = results.filter(Boolean).filter(function (r) { return r.auditFailed }).length

log('审核完成：判定 ' + allReports.length + ' 个；需重写 ' + needsFix.length + ' 个；已重写 ' + fixedList.length + ' 个；复核未过 ' + stillBad.length + ' 个')

let secondRound = []
if (stillBad.length) {
  phase('Fix')
  log('第二轮修复 ' + stillBad.length + ' 个文件')
  const ok2 = (await parallel(
    stillBad.map(function (v) {
      return function () {
        return agent(fixPrompt(v.path, v.problems || ['复核未通过，请按规范逐条对照修复']), {
          schema: FIXRESULT,
          phase: 'Fix',
          label: 'refix:' + v.path.split('/').slice(-1)[0].replace('-section-6-sec6.md', ''),
        })
      }
    })
  )).filter(Boolean)
  if (ok2.length) {
    const v2 = await parallel(
      ok2.map(function (f) {
        return function () {
          return agent(verifyPrompt(f.path), {
            schema: VERDICT,
            phase: 'Verify',
            label: 'reverify:' + f.path.split('/').slice(-1)[0].replace('-section-6-sec6.md', ''),
          })
        }
      })
    )
    secondRound = ok2.map(function (f, i) { return { fix: f, verify: v2[i] } })
  }
}

phase('Critic')
const critic = await agent(
  [
    '你是完整性批判者。仓库：' + REPO + ' 是一本《AI 时代数据架构师》的书稿。',
    '本次工作对全书所有 *-section-6-sec6.md（§ 6 落地实践子文件）做了结构审核与重写。',
    '',
    '已知：',
    '- 枚举到 ' + files.length + ' 个 § 6 文件',
    '- 结构审核覆盖 ' + allReports.length + ' 个',
    '- 重写 ' + fixedList.length + ' 个，第二轮再修 ' + secondRound.length + ' 个',
    '- 有 ' + auditFailed + ' 个批次审核 agent 未返回结果',
    '',
    '你的任务：找出「还有什么没被检查到」。具体回答：',
    '1) 有没有 § 6 文件根本没进入审核（对比枚举清单与审核覆盖数）？',
    '2) 有没有该有 § 6 却整章缺失子文件的情况？（用 ls 检查各章目录）',
    '3) 主文件（如 03-data-stack/15-one-data/15-one-data.md）与子文件之间的交叉引用是否还指向正确路径？',
    '4) 还有哪些未验证的风险？',
    '',
    '用 Bash 实际检查，不要凭印象。不要执行任何 git 命令。',
  ].join('\n'),
  { schema: CRITIC, phase: 'Critic', label: 'completeness-critic' }
)

return {
  totalFiles: files.length,
  audited: allReports.length,
  needsFix: needsFix.length,
  fixed: fixedList.length,
  verifyFailed: stillBad.length,
  secondRound: secondRound.map(function (x) {
    return {
      path: x.fix.path,
      lines: x.fix.lines,
      headings: x.fix.headings,
      reverified: x.verify ? x.verify.compliant : null,
      problems: x.verify ? x.verify.problems : [],
    }
  }),
  auditFailedBatches: auditFailed,
  unresolved: verdictList.filter(function (v) { return !v.compliant }).map(function (v) {
    return { path: v.path, problems: v.problems }
  }),
  critic: critic,
  ok: allReports.length > 0 && stillBad.length === 0,
}
