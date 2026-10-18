export const meta = {
  name: 'sec8-claim-audit',
  description: '审计 §8 面试题的断言强度：把「某公司公开数据+精确数字」这类不可核验断言降档，并独立复核是否删了论点或换了假来源',
  phases: [
    { title: 'Audit', detail: '每 agent 审计并修复 3 个 §8 文件' },
    { title: 'Verify', detail: '每文件一个独立复核 agent（对抗式：查降档是否变成了删论点或换假来源）' },
    { title: 'Fix2', detail: '复核未通过的再修一轮' },
  ],
}

const REPO = '/Users/dqh/CCProject/me/data-travel'
const SPEC = REPO + '/.sec8-claim-spec.md'
const paths = args
const short = function (p) { return p.split('/').slice(-2)[0] }

const BATCH = 3
const batches = []
for (let i = 0; i < paths.length; i += BATCH) batches.push(paths.slice(i, i + BATCH))

const AUDIT = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          classA: { type: 'number', description: '虚构出处' },
          classB: { type: 'number', description: '无档位精确数字' },
          classC: { type: 'number', description: '引用张冠李戴' },
          classD: { type: 'number', description: '技术性错误' },
          classE: { type: 'number', description: '有真实出处，未改动' },
          linesChanged: { type: 'number' },
          manualReview: { type: 'array', items: { type: 'string' }, description: '需人工复核但无法在无网络环境确认的条目' },
        },
        required: ['path', 'linesChanged'],
      },
    },
  },
  required: ['results'],
}

const VERDICT = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    compliant: { type: 'boolean' },
    deletedArguments: { type: 'array', items: { type: 'string' }, description: '被整条删除的论点（违规）' },
    fakeSources: { type: 'array', items: { type: 'string' }, description: '新引入的模糊假来源，如「业界报告表明」' },
    stillUnverifiable: { type: 'array', items: { type: 'string' }, description: '仍存在的「某公司公开数据+精确数字」组合' },
    problems: { type: 'array', items: { type: 'string' } },
  },
  required: ['path', 'compliant'],
}

function auditPrompt(batch) {
  return [
    '你是《AI 时代数据架构师》书稿（仓库 ' + REPO + '）的**内容正确性审计者**。',
    '',
    '第 1 步：完整读规范 ' + SPEC + '。它定义了 A–E 五类缺陷与修复方法，以及本环境的网络约束。',
    '',
    '**两条最重要的纪律**：',
    '1. **本环境没有网络。禁止使用 WebSearch / WebFetch。** 搜不到 ≠ 是假的——这里根本搜不了。证据只能来自仓库内部与推理。',
    '2. **降断言强度，不降信息量。** 绝不删除论点；绝不引入新的模糊来源（把「阿里公开数据」改成「业界报告表明」是违规，那是换了个更假的来源）。',
    '',
    '第 2 步：依次审计并修复下列 ' + batch.length + ' 个文件：',
    batch.map(function (p) { return '  - ' + REPO + '/' + p }).join('\n'),
    '',
    '每个文件：',
    '1) `grep -nE "(公开数据|公开披露|官方博客|内部数据|数据显示)" <文件>` 与 `grep -nE "(提升|下降|降低|减少|增长|节省)[了]? ?[0-9]+(\\.[0-9]+)?[%倍]" <文件>` 找出候选行；',
    '2) 逐条判定属于 A/B/C/D/E 哪一类，**必须读上下文**再决定；',
    '3) 用 Edit 精确修复 A/B/C/D 类，E 类不动；',
    '4) 顺手检查技术性错误（D 类）——机制解释有没有明显写反。',
    '',
    '硬性要求：不删除任何论点；不新增任何来源；五段式结构（考察点/参考答案框架/常见陷阱/追问预测/参考资料）不被破坏；行数变化不超过 ±20 行。',
    '禁止执行任何 git 命令。返回结构化结果，把无法在无网络环境确认的条目放进 manualReview。',
  ].join('\n')
}

function verifyPrompt(p) {
  return [
    '你是独立的**对抗式**复核者。你的任务是证伪。仓库：' + REPO,
    '',
    '待复核文件：' + REPO + '/' + p,
    '规范：' + SPEC + '（读它，特别是「修复方法」与「禁止的修法」两节）',
    '',
    '该文件刚做了一轮断言强度审计与修复。请用 Read / Bash / `git diff` 实际检查下面这些**失败模式**：',
    '',
    '1) **是否删除了论点**（最严重）：把整条 bullet 或整句话删掉，而不是降档。对照 `git diff` 逐条判断——被删的内容里有没有「论点」而非只有「无据的数字」。论点被删一律记为 deletedArguments。',
    '2) **是否引入了新的假来源**：例如把「阿里公开数据显示」改成「业界报告表明」「行业实践显示」「多项研究指出」——这不是降档，是换了个更模糊的假来源，一律记为 fakeSources。',
    '3) **是否仍残留**「某公司公开数据/公开披露 + 精确数字」的组合，且无文档名/链接/年份？记为 stillUnverifiable。',
    '4) **是否保留了论点的教学价值**：降档后的句子读起来还有信息量吗？还是被稀释成了废话（例如「效果有提升」这种没有信息量的句子）？后者记为问题。',
    '5) **五段式结构**是否完好（考察点/参考答案框架/常见陷阱/追问预测/参考资料）？',
    '6) 行数变化是否超过 ±20 行？',
    '7) 被标为 E 类（有真实出处）而未改动的行，其出处是否真的写了论文名/作者/年份？有没有该标档却没标的？',
    '',
    '注意：本环境没有网络，你也不要去搜。禁止使用 WebSearch / WebFetch。判断只能基于 `git diff`、文件内容与规范。',
    '只读，不要修改文件。禁止任何 git 写操作（git diff / git show 只读可用）。',
    '每条问题写清：类型 + 行号或原文片段 + 为什么算问题。确实无问题才返回 compliant=true。',
  ].join('\n')
}

phase('Audit')
log('审计 ' + paths.length + ' 个 §8 文件的断言强度，' + batches.length + ' 个 agent')

const results = await pipeline(
  batches,
  function (batch) {
    return agent(auditPrompt(batch), { schema: AUDIT, phase: 'Audit', label: 'audit:' + batch.map(short).join('+') })
  },
  function (a, batch) {
    if (!a) return { batch: batch, audit: null, verdicts: [] }
    return parallel(
      batch.map(function (p) {
        return function () {
          return agent(verifyPrompt(p), { schema: VERDICT, phase: 'Verify', label: 'verify:' + short(p) })
        }
      })
    ).then(function (vs) { return { batch: batch, audit: a, verdicts: vs } })
  },
  function (prev) {
    if (!prev || !prev.audit) return prev
    const bad = []
    prev.batch.forEach(function (p, i) {
      const v = prev.verdicts[i]
      if (!v || !v.compliant) {
        bad.push({
          path: p,
          problems: (v && v.problems && v.problems.length) ? v.problems : ['复核未通过，按规范「修复方法」与「禁止的修法」逐条自查'],
          deleted: (v && v.deletedArguments) || [],
          fake: (v && v.fakeSources) || [],
        })
      }
    })
    if (!bad.length) { prev.fix2 = []; return prev }
    return parallel(
      bad.map(function (b) {
        return function () {
          const lines = []
          if (b.deleted.length) {
            lines.push('**严重：你把论点整条删掉了。必须恢复论点，只降断言强度：**')
            b.deleted.forEach(function (x) { lines.push('  - ' + x) })
          }
          if (b.fake.length) {
            lines.push('**严重：你引入了模糊假来源。必须去掉，改为诚实描述：**')
            b.fake.forEach(function (x) { lines.push('  - ' + x) })
          }
          lines.push.apply(lines, b.problems.map(function (x, i) { return (i + 1) + '. ' + x }))
          return agent(
            [
              '你是《AI 时代数据架构师》书稿（仓库 ' + REPO + '）的 §8 断言强度修复者。规范：' + SPEC,
              '待修文件：' + REPO + '/' + b.path,
              '',
              '独立复核者发现了下列问题，逐条修掉：',
              lines.join('\n'),
              '',
              '再次强调：只降断言强度，**恢复被删的论点**，**不得引入任何新来源**。本环境无网络，禁止 WebSearch / WebFetch。',
              '禁止执行任何 git 命令。',
            ].join('\n'),
            { schema: AUDIT, phase: 'Fix2', label: 'fix2:' + short(b.path) }
          ).then(function () {
            return agent(verifyPrompt(b.path), { schema: VERDICT, phase: 'Fix2', label: 'reverify:' + short(b.path) })
              .then(function (v2) {
                return { path: b.path, reverified: v2 ? v2.compliant : null, remaining: v2 ? v2.problems : ['复核未返回'], deleted: v2 ? v2.deletedArguments : [] }
              })
          })
        }
      })
    ).then(function (f2) { prev.fix2 = f2.filter(Boolean); return prev })
  }
)

const all = results.filter(Boolean)
const ok = []
const unresolved = []
all.forEach(function (r) {
  r.batch.forEach(function (p, i) {
    const v = r.verdicts[i]
    const f2 = (r.fix2 || []).filter(function (x) { return x.path === p })[0]
    const passed = f2 ? f2.reverified === true : (v && v.compliant === true)
    if (passed) ok.push(p)
    else unresolved.push({ path: p, remaining: f2 ? f2.remaining : (v ? v.problems : ['未复核']) })
  })
})

return {
  targeted: paths.length,
  passed: ok.length,
  unresolved: unresolved,
}
