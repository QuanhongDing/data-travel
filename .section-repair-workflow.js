export const meta = {
  name: 'section-repair',
  description: '按独立复核给出的逐文件问题清单修复，并独立复核是否真的闭合（含「复核者本身可能出错」的处理）',
  phases: [
    { title: 'Repair', detail: '每 agent 按问题清单修 1 个文件' },
    { title: 'Verify', detail: '每文件一个独立复核 agent，逐条核对是否闭合' },
    { title: 'Fix2', detail: '未闭合的再修一轮并复验' },
  ],
}

// args: { findings, spec, files:[...], minLines, maxLines, expectedH3 }
const cfg = args
const REPO = '/Users/dqh/CCProject/me/data-travel'
const FINDINGS = REPO + '/' + cfg.findings
const SPEC = REPO + '/' + cfg.spec
const files = cfg.files
const short = function (p) { return p.split('/').slice(-2)[0] }
const RANGE = cfg.minLines + '–' + cfg.maxLines
const H3 = cfg.expectedH3

const REPAIR = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    lines: { type: 'number' },
    fixed: { type: 'array', items: { type: 'string' } },
    notFixed: { type: 'array', items: { type: 'string' }, description: '判定不该按复核意见改的条目及理由' },
  },
  required: ['path', 'fixed'],
}

const VERDICT = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    compliant: { type: 'boolean', description: '只有确实还有未闭合项时才可为 false；为 false 时 stillOpen 必须非空' },
    closed: { type: 'array', items: { type: 'string' } },
    stillOpen: { type: 'array', items: { type: 'string' }, description: 'compliant=false 时必填：仍未闭合的项，含行号与片段' },
    newProblems: { type: 'array', items: { type: 'string' } },
  },
  required: ['path', 'compliant', 'stillOpen'],
  allOf: [
    {
      // 实测多批出现 compliant=false 却 problems/stillOpen 为空的情况，
      // 使「未通过」与「未复核」无法区分，也让下游既不能据此改、又不能据此放行。
      // 这里强制：判 false 就必须说出问题是什么。
      if: { properties: { compliant: { const: false } }, required: ['compliant'] },
      then: { properties: { stillOpen: { minItems: 1 } } },
    },
  ],
}

const COMMON = [
  '仓库：' + REPO + ' —— 纯 Markdown 书籍《AI 时代数据架构师》。',
  '',
  '**本环境没有网络**：WebSearch 返回空结果、WebFetch 被阻断（已实测）。禁止使用。',
  '核不到的来源就降档或写成「可自行核验」的表述；**不要因为核不到就删掉正确的内容**，也不要断言无法核实的来源。',
  '',
  '**⚠ 但这条环境信息只给「你」看，不许写进书稿。** 实测失败模式：agent 把它转写进正文，',
  '于是书里出现「本环境无网络」这类**关于作者工具/环境的元叙述**，读者会误以为那是本书对读者的限定条件。',
  '正文里一个字都不许出现「本环境」「本项目环境」「本次改写」这类字眼；',
  '只能写成面向读者的核验指引（「请以官方文档当前版本为准」/「可按 <关键词> 自行检索核验」）。',
  '',
  '**禁止执行任何 git 写命令**（`git show HEAD:<path>` / `git diff` 只读可用）。',
]

function repairPrompt(p) {
  return [
    '你是《AI 时代数据架构师》书稿的修复执行者。',
    '',
    '第 1 步：读 ' + FINDINGS + ' —— 独立复核者给出的**逐文件问题清单**，找到「### `' + p + '`」那一节。',
    '  开头的「系统性问题」一节也要读，那是这批文件共同的毛病。',
    '第 2 步：读 ' + SPEC + '（尤其「已被实测抓出的失败模式」一节）。',
    '第 3 步：修复 ' + REPO + '/' + p,
    '',
    '修复纪律：',
    '1) **只修清单列出的问题**，不做与清单无关的改写，不调整已合规的部分。**过度修改与漏修同为缺陷。**',
    '2) **任何「原稿/原表怎么写」的陈述，动笔前逐字对照 `git show HEAD:' + p + '`**。',
    '   核不到就**删掉该句**，不要改写成「大致对」的说法。禁止用虚构的原文缺陷论证自己的更正。',
    '3) **写完通读一遍数字与小标题**：同一量在不同位置是否给了不同值？「三项」是否真的是三项？',
    '   小标题写「三种」下面是否真是三条？「下表」是否真的在下方？这类内部自相矛盾是本批高发问题。',
    '4) **【推算】必须由公开前提推导**。前提本身是经验假设的，改标【经验】并给区间。',
    '5) **决策树与「阈值依据」双向闭合**：树上每个判断节点（含各层分支）都有依据条目，依据里每条都在树上有落点。',
    '6) **因果句必须经得起对照**：核心节里「因为 A 机制所以 B 性质」的 A，要与所引来源和本文件其它表格一致。',
    '   特别当 A 涉及某算法/系统的具体性质时，先核对该性质是否真属该系统（本批已出现把 DeepSeek-R1 的改动安到 GRPO 头上的错误）。',
    '7) 修完仍须满足：' + RANGE + ' 行、恰好 ' + H3 + ' 个 `### ` 小节。',
    '8) 清单里若有你判断**不该按复核意见改**的条目（复核者也会出错），放进 notFixed 并写明理由。',
    '',
    COMMON.join('\n'),
    '',
    '返回结构化结果。',
  ].join('\n')
}

function verifyPrompt(p) {
  return [
    '你是独立的**对抗式**复核者。你的任务是证伪。',
    '待复核文件：' + REPO + '/' + p,
    '上一轮问题清单：' + FINDINGS + '（找到「### `' + p + '`」）',
    '规范：' + SPEC,
    '',
    '用 Read / Bash / `git show HEAD:` / `git diff` 实际检查，不要凭印象：',
    '1) 清单里每一条，现在闭合了没有？（给出「已闭合 / 仍存在」+ 行号 + 片段）',
    '2) **是否只是把问题挪了位置**：例如把编造的原文陈述换个说法但依然与原稿不符；',
    '   把【推算】改标【经验】却仍写具体数值而非区间。',
    '3) **是否新引入问题**：删掉正确内容、改坏别的段落、行数越界、小节数不对、新造内部矛盾。',
    '4) **是否用「核不到」当借口删掉了正确内容**。',
    '5) 决策树与「阈值依据」是否**双向**闭合（含分支节点与多层树）。',
    '6) 行数 ' + RANGE + '、`### ` 恰好 ' + H3 + ' 个。',
    '',
    '注意：复核者自己也会出错。若你判断上轮某条意见本身不成立，写进 closed 并说明理由，',
    '**不要为了「看起来改过了」而强行要求改动**。',
    '**另外：只把「问题」写进 problems。** 你核对通过的项目请写进 closed，不要写进 problems ——',
    '实测有复核者把「结构/体量：全部达标」这类通过记录写进了 problems，使问题数被虚增。',
    '本环境没有网络，禁止使用 WebSearch / WebFetch。只读，不要修改文件；禁止任何 git 写操作。',
    '确实无遗留问题才返回 compliant=true。',
  ].join('\n')
}

phase('Repair')
log('按问题清单修复 ' + files.length + ' 个文件')

const results = await pipeline(
  files,
  function (p) {
    return agent(repairPrompt(p), { schema: REPAIR, phase: 'Repair', label: 'repair:' + short(p) })
      .then(function (r) { return { path: p, repair: r } })
  },
  function (prev) {
    if (!prev || !prev.repair) return prev
    return agent(verifyPrompt(prev.path), { schema: VERDICT, phase: 'Verify', label: 'verify:' + short(prev.path) })
      .then(function (v) { prev.verdict = v; return prev })
  },
  function (prev) {
    if (!prev || !prev.verdict || prev.verdict.compliant) return prev
    const lines = []
    lines.push.apply(lines, (prev.verdict.stillOpen || []).map(function (x, i) { return (i + 1) + '. 仍未闭合：' + x }))
    lines.push.apply(lines, (prev.verdict.newProblems || []).map(function (x) { return '新引入：' + x }))
    if (!lines.length) lines.push('复核未通过，按问题清单与规范逐条自查。')
    return agent(
      [
        '你是《AI 时代数据架构师》书稿的修复执行者。文件：' + REPO + '/' + prev.path,
        '问题清单：' + FINDINGS + '　规范：' + SPEC,
        '',
        '复核者认为仍未修好，逐条处理：',
        lines.join('\n'),
        '',
        '重申：禁止用编造的原文陈述论证更正（先 `git show HEAD:` 逐字对照）；写完通读数字与小标题；',
        '本环境无网络，禁止 WebSearch / WebFetch。',
        '禁止执行任何 git 写命令。',
      ].join('\n'),
      { schema: REPAIR, phase: 'Fix2', label: 'fix2:' + short(prev.path) }
    ).then(function (r2) {
      prev.repair2 = r2
      return agent(verifyPrompt(prev.path), { schema: VERDICT, phase: 'Fix2', label: 'reverify:' + short(prev.path) })
        .then(function (v2) { prev.verdict2 = v2; return prev })
    })
  }
)

const out = results.filter(Boolean)
const ok = [], unresolved = []
out.forEach(function (r) {
  const v2 = r.verdict2, v = r.verdict
  const passed = v2 ? v2.compliant === true : (v ? v.compliant === true : false)
  if (passed) ok.push(r.path)
  else unresolved.push({ path: r.path, stillOpen: (v2 && v2.stillOpen) || (v && v.stillOpen) || ['未复核'] })
})

return { targeted: files.length, repaired: out.length, passed: ok.length, passedPaths: ok, unresolved: unresolved }
