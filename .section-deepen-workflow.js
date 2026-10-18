export const meta = {
  name: 'section-deepen',
  description: '把某一节（§N）子文件按对应规范整文件重写，并独立对抗式复核',
  phases: [
    { title: 'Rewrite', detail: '每 agent 重写若干个文件' },
    { title: 'Verify', detail: '每文件一个独立复核 agent（对抗式：证伪）' },
    { title: 'Repair', detail: '复核未通过的按问题清单修复并复验' },
    { title: 'Critic', detail: '完整性批判：还有什么没被查' },
  ],
}

// args: { spec, section, linkSuffix, minLines, maxLines, expectedH3, filesPerAgent, files: [...] }
const cfg = args
const REPO = '/Users/dqh/CCProject/me/data-travel'
const SPEC = REPO + '/' + cfg.spec
const files = cfg.files
const BATCH = cfg.filesPerAgent || 2
const short = function (p) { return p.split('/').slice(-2)[0] }

const batches = []
for (let i = 0; i < files.length; i += BATCH) batches.push(files.slice(i, i + BATCH))

const REWRITE = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          lines: { type: 'number' },
          headings: { type: 'number' },
          kept: { type: 'array', items: { type: 'string' }, description: '保留的原有条目/候选' },
        },
        required: ['path', 'lines', 'headings'],
      },
    },
  },
  required: ['results'],
}

const VERDICT = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    lines: { type: 'number' },
    headings: { type: 'number' },
    compliant: { type: 'boolean' },
    fabrications: { type: 'array', items: { type: 'string' } },
    inventedCitations: { type: 'array', items: { type: 'string' } },
    problems: { type: 'array', items: { type: 'string' } },
  },
  required: ['path', 'compliant'],
}

const CRITIC = {
  type: 'object',
  properties: {
    missing: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['missing'],
}

const COMMON = [
  '仓库：' + REPO + ' —— 纯 Markdown 书籍《AI 时代数据架构师》。本轮处理 **§' + cfg.section + '**。',
  '',
  '**本环境没有网络**：WebSearch 返回空结果、WebFetch 被网络策略阻断（已实测）。',
  '因此「搜不到」不等于「是假的」——这里根本搜不了。禁止使用 WebSearch / WebFetch。',
  '核不到的来源就降档或改成「可自行核验」的表述，**不要因为核不到就删掉正确的内容**，也不要断言无法核实的来源。',
  '',
  '**⚠ 但这条环境信息只给「你」看，不许写进书稿。** 实测失败模式：agent 读到上面这句后，',
  '把它转写进正文，于是书里出现了「本环境无网络」「本项目环境无法联网」「本节未核到可引用的公开出处」',
  '这类**关于作者工具/环境的元叙述**——读者会误以为这是本书对读者的限定条件。',
  '书稿正文里**一个字都不许出现**「本环境」「本项目环境」「本次改写」「本节环境」这类字眼。',
  '要表达同样的意思，只能写成**面向读者的核验指引**：「请以官方文档当前版本为准」/「可按 <关键词> 自行检索核验」。',
  '',
  '**禁止执行任何 git 命令**（`git show` / `git diff` 只读可用，`git add` / `commit` / `checkout` / `stash` 一律禁止）。',
]

function rewritePrompt(batch) {
  return [
    '你是《AI 时代数据架构师》书稿的 §' + cfg.section + ' 重写执行者。',
    '',
    '第 1 步：完整读规范 ' + SPEC + ' —— 硬性要求，逐条遵守，尤其是其中的「证据纪律」与「硬性检查清单」。',
    '',
    '第 2 步：读这两个已达标文件建立标杆感（信息密度要与之相当）：',
    '  ' + REPO + '/04-data-assetization/08-data-catalog/08-data-catalog-section-6-sec6.md',
    '  ' + REPO + '/11-cross-cutting/05-lineage-and-impact/05-lineage-and-impact-section-6-sec6.md',
    '',
    '第 3 步：依次重写下列 ' + batch.length + ' 个文件（每个都用 Write 整文件覆写，不要 Edit、不要追加）：',
    batch.map(function (p) { return '  - ' + REPO + '/' + p }).join('\n'),
    '',
    '每个文件都要：',
    '1) 先 Read 原文件，记下它列出的**全部原有条目/候选/方向** —— 可增补、可重新归类、可合并，**不可凭空删除读者已知的条目**；',
    '2) Read 同目录主文件（同前缀的 .md）的相关小节，取该主题的核心术语与机制，用词必须与主文件一致；',
    '3) 按规范骨架整文件重写，行数 ' + cfg.minLines + '–' + cfg.maxLines + '，恰好 ' + cfg.expectedH3 + ' 个 `### ` 小节；',
    '4) 严守证据纪律：禁止编造精确数字；每个数字标【公开】/【推算】/【经验】，【公开】必须带来源与年份，【推算】必须写出推导链；',
    '5) 核心节必须写出真正的「因为 A（机制），所以 B（性质），代价是 C」因果句，不能是形容词并列；',
    '6) **不要写关于「原稿怎么写」的陈述** —— 若要引用原稿，须先用 `git show HEAD:<path>` 核对；核不到就删掉这句话。伪造原文缺陷是本项目已实测的失败模式。',
    '',
    COMMON.join('\n'),
    '',
    '你的最终文本就是返回值。全部写完后返回结构化结果。',
  ].join('\n')
}

function verifyPrompt(p) {
  return [
    '你是独立的**对抗式**复核者。你的任务是**证伪**，不是确认。',
    '',
    '待复核文件：' + REPO + '/' + p,
    '规范：' + SPEC + '（读它，按它的硬性检查清单逐条核）',
    '',
    '逐条实际检查（用 Read / Bash / `git show HEAD:`，不要凭印象）：',
    '1) 行数是否在 ' + cfg.minLines + '–' + cfg.maxLines + '？`### ` 小节是否恰好 ' + cfg.expectedH3 + ' 个？',
    '2) **编造数字**（最重要）：把文件里每个数字挑出来，逐个判断是否有来源。无来源却精确到个位或百分位的（「延迟降低 47%」这类）一律记为 fabrication。带【公开】档且给了来源与年份的不算；【推算】写了推导链的不算；【经验】用区间表达的不算。',
    '3) **编造或空心的引用**：引了文档/论文/博客/Release Note，但**没有标题、没有年份、没有链接**，或仅写「某公司公开数据」而无出处 → 记为 inventedCitations。',
    '4) **伪因果**：核心节是否真有「因为 A，所以 B，代价是 C」？还是只有形容词并列？',
    '5) **伪造原文**：文中若有「原稿/原表怎么写」的陈述，用 `git show HEAD:' + p + '` 核对是否属实。核不到的一律记为问题。',
    '6) **条目缩水**：对照 git 中的原版本，原文件列出的条目/候选是否都还在？（可增补，不可删减）',
    '7) **链接正确性**：首行导航语与末行「配合阅读」的相对路径是否真实存在？（用 ls 验证）',
    '8) **残留旧内容**：是否还有属于其它节的内容串入（例如 §5 文件里残留面试题、§8 内容等）？',
    '9) 结构要素是否齐全（规范骨架要求的各个小节是否都在）？',
    '',
    '只读，不要修改任何文件。禁止 git 写操作。',
    '每条问题写清：类型 + 行号或原文片段 + 为什么算问题。确实无问题才返回 compliant=true。',
    '注意：复核者也会出错。若你判断某处其实没问题，不要为了凑数而报问题。',
  ].join('\n')
}

function repairPrompt(p, problems) {
  return [
    '你是《AI 时代数据架构师》书稿的 §' + cfg.section + ' 修复执行者。',
    '规范：' + SPEC + '（完整读）  待修文件：' + REPO + '/' + p,
    '',
    '独立复核者发现了下列问题，逐条修掉：',
    problems.map(function (x, i) { return '  ' + (i + 1) + '. ' + x }).join('\n'),
    '',
    '修复要求：只改被指出的问题，**不要推翻已合规的部分，不要降低信息密度，不要顺手"改进"没被点名的段落**。',
    '修完仍须满足规范硬性清单（' + cfg.minLines + '–' + cfg.maxLines + ' 行、' + cfg.expectedH3 + ' 个 `### `、证据纪律）。',
    '',
    COMMON.join('\n'),
    '',
    '返回结构化结果。',
  ].join('\n')
}

phase('Rewrite')
log('重写 ' + files.length + ' 个 §' + cfg.section + ' 文件，' + batches.length + ' 个 agent，每 agent ' + BATCH + ' 文件')

const results = await pipeline(
  batches,
  function (batch) {
    return agent(rewritePrompt(batch), { schema: REWRITE, phase: 'Rewrite', label: 'rewrite:' + batch.map(short).join('+') })
  },
  function (rw, batch) {
    if (!rw) return { batch: batch, rewrite: null, verdicts: [] }
    return parallel(
      batch.map(function (p) {
        return function () {
          return agent(verifyPrompt(p), { schema: VERDICT, phase: 'Verify', label: 'verify:' + short(p) })
        }
      })
    ).then(function (vs) { return { batch: batch, rewrite: rw, verdicts: vs } })
  },
  function (prev) {
    if (!prev || !prev.rewrite) return prev
    const bad = []
    prev.batch.forEach(function (p, i) {
      const v = prev.verdicts[i]
      if (!v || !v.compliant) {
        const probs = []
        if (v && v.fabrications && v.fabrications.length) probs.push('编造数字：' + v.fabrications.join('；'))
        if (v && v.inventedCitations && v.inventedCitations.length) probs.push('空心/编造引用：' + v.inventedCitations.join('；'))
        if (v && v.problems && v.problems.length) probs.push.apply(probs, v.problems)
        bad.push({ path: p, problems: probs.length ? probs : ['复核未通过，按规范硬性检查清单逐条自查修复'] })
      }
    })
    if (!bad.length) { prev.repairs = []; return prev }
    return parallel(
      bad.map(function (b) {
        return function () {
          return agent(repairPrompt(b.path, b.problems), { schema: REWRITE, phase: 'Repair', label: 'repair:' + short(b.path) })
            .then(function () {
              return agent(verifyPrompt(b.path), { schema: VERDICT, phase: 'Repair', label: 'reverify:' + short(b.path) })
                .then(function (v2) {
                  return { path: b.path, reverified: v2 ? v2.compliant : null, remaining: v2 ? v2.problems : ['复核未返回'], fabrications: v2 ? v2.fabrications : [] }
                })
            })
        }
      })
    ).then(function (rp) { prev.repairs = rp.filter(Boolean); return prev })
  }
)

const all = results.filter(Boolean)
const ok = [], unresolved = []
all.forEach(function (r) {
  r.batch.forEach(function (p, i) {
    const v = r.verdicts[i]
    const rp = (r.repairs || []).filter(function (x) { return x.path === p })[0]
    const passed = rp ? rp.reverified === true : (v && v.compliant === true)
    if (passed) ok.push(p)
    else unresolved.push({ path: p, problems: rp ? rp.remaining : (v ? v.problems : ['未复核']) })
  })
})

phase('Critic')
const critic = await agent(
  [
    '你是完整性批判者。仓库：' + REPO + ' 是一本《AI 时代数据架构师》的书稿。',
    '本轮对 §' + cfg.section + ' 的 ' + files.length + ' 个子文件做了重写（*-' + cfg.linkSuffix + '）：' + ok.length + ' 个通过复核、' + unresolved.length + ' 个未通过。',
    '',
    '请用 Bash 实际检查（不要凭印象），回答「还有什么没被查」：',
    '1) 全书到底有多少个 *-' + cfg.linkSuffix + ' 文件？本轮覆盖多少、还剩多少？按行数从少到多列出剩余的前 15 个。',
    '2) 有没有章节目录里该节子文件整体缺失的情况？（对照同目录的其它节文件是否存在）',
    '3) 本轮覆盖的文件里，有没有仍然串入了其它节的内容？',
    '4) 主文件（同前缀 .md）里指向该节子文件的链接是否都正确？',
    '5) 还有哪些未验证的风险？',
    '',
    '只读。禁止任何 git 写操作。',
  ].join('\n'),
  { schema: CRITIC, phase: 'Critic', label: 'completeness-critic' }
)

return { section: cfg.section, targeted: files.length, passed: ok.length, unresolved: unresolved, critic: critic }
