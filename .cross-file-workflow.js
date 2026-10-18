export const meta = {
  name: 'cross-file-consistency',
  description: '修复跨文件事实矛盾（同一本书内同一事实被写成不同值）——单文件审查看不出的缺陷类',
  phases: [
    { title: 'Fix', detail: '每 agent 负责一组互不重叠的文件，处理该组内全部冲突' },
    { title: 'Verify', detail: '独立复核：是否真的消除矛盾，且没有新造成矛盾' },
    { title: 'Fix2', detail: '未闭合的再修一轮' },
    { title: 'Critic', detail: '还漏了哪些冲突' },
  ],
}

// args: { groups: [{name, files:[...]}], spec, conflicts }
const cfg = args
const REPO = '/Users/dqh/CCProject/me/data-travel'
const SPEC = REPO + '/' + cfg.spec
const CONFLICTS = REPO + '/' + cfg.conflicts
const groups = cfg.groups

const RESULT = {
  type: 'object',
  properties: {
    group: { type: 'string' },
    handled: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          conflict: { type: 'string' },
          decision: { type: 'string', description: '统一到某值 / 消歧 / 降档不定论' },
          basis: { type: 'string', description: '判定依据（内部证据链）' },
          edits: { type: 'array', items: { type: 'string' } },
        },
        required: ['conflict', 'decision'],
      },
    },
    needsHuman: { type: 'array', items: { type: 'string' }, description: '无法判定、需人工决定的条目' },
    scannerFalsePositives: { type: 'array', items: { type: 'string' } },
  },
  required: ['group', 'handled'],
}

const VERDICT = {
  type: 'object',
  properties: {
    group: { type: 'string' },
    compliant: { type: 'boolean' },
    stillContradictory: { type: 'array', items: { type: 'string' } },
    newContradictions: { type: 'array', items: { type: 'string' } },
    deletedArguments: { type: 'array', items: { type: 'string' } },
    problems: { type: 'array', items: { type: 'string' } },
  },
  required: ['group', 'compliant'],
}

const COMMON = [
  '仓库：' + REPO + ' —— 纯 Markdown 书籍《AI 时代数据架构师》，985 个文件。',
  '',
  '**本环境没有网络**：WebSearch 返回空结果、WebFetch 被阻断（已实测）。禁止使用。',
  '**禁止把「搜不到」当作「这条是错的」** —— 这里根本搜不了。判定只能依据仓库内部证据链。',
  '',
  '**⚠ 但这条环境信息只给「你」看，不许写进书稿。** 正文里一个字都不许出现「本环境」「本项目环境」',
  '这类关于作者工具/环境的元叙述（读者会误以为那是本书对读者的限定条件）；',
  '只能写成面向读者的核验指引。',
  '',
  '**禁止执行任何 git 写命令**（`git show` / `git diff` 只读可用）。',
]

function fixPrompt(g) {
  return [
    '你是《AI 时代数据架构师》书稿的**跨文件一致性修复者**。你负责「' + g.name + '」这一组。',
    '',
    '第 1 步：完整读规范 ' + SPEC + '（重点是「第一步先消歧」「第二步判定」「第三步两种修法」）。',
    '第 2 步：读候选清单 ' + CONFLICTS + '，挑出属于你这一组的冲突条目。',
    '第 3 步：只在你这一组的文件里工作（**不要碰组外的文件**——其它 agent 在并行改别的文件）：',
    g.files.map(function (f) { return '  - ' + REPO + '/' + f }).join('\n'),
    '',
    '做法：',
    '1) 对每个冲突，先用 `grep -rn "<实体名>" --include="*.md" .` 与 Read **读全所有出现位置的上下文**。',
    '2) **先消歧**：确认这些出现指的是不是同一个东西。同名不同物（如 Maestro 同时指 Netflix 的',
    '   工作流编排平台与 AI21 的 BI 产品）要**补全限定词**，而不是统一年份——它们本来就不同。',
    '3) **再判定**：依据本仓库内部证据链（哪处带可核验来源 > 主文件口径 > 可推断的事实）。',
    '4) **最后修**：',
    '   - 可判定 → 统一到正确值，保留该处的论证与上下文；',
    '   - 不可判定 → **降档不定论**（给区间 + 说明年份口径不一 / 或删掉无法支撑的精确值而保留论点）。',
    '     **绝不要为了让书「看起来一致」而挑一个年份写死** —— 挑错了就是把一处错误复制成多处。',
    '5) 每处改动都要能说清依据（哪条内部证据让你认为该值正确）。',
    '6) 不删除论点、不新增来源（尤其「据业界报告」这类模糊来源）、不做与冲突无关的改写。',
    '',
    '注意：「' + g.name + '」这一组若包含扫描脚本的假阳性（如 Delta/Lake、Schema/Registry',
    '这类复合词被切开），**不要改**，把它记进 scannerFalsePositives。',
    '',
    COMMON.join('\n'),
    '',
    '返回结构化结果，把无法判定的放进 needsHuman —— 那是有价值的产出，不是失败。',
  ].join('\n')
}

function verifyPrompt(g, handled) {
  return [
    '你是独立的**对抗式**复核者。你的任务是证伪。',
    '待复核范围：「' + g.name + '」这一组的文件：',
    g.files.map(function (f) { return '  - ' + REPO + '/' + f }).join('\n'),
    '规范：' + SPEC + '　候选清单：' + CONFLICTS,
    '',
    '修复者报告处理了这些条目：',
    (handled || []).map(function (h, i) { return '  ' + (i + 1) + '. ' + h.conflict + ' → ' + h.decision }).join('\n'),
    '',
    '用 grep / Read / `git diff` 实际检查：',
    '1) **矛盾真的消除了吗**：把该实体的每一处出现再 grep 一遍，逐处比对现在的说法是否一致。',
    '   两处仍给出互斥的值 → 记入 stillContradictory。',
    '2) **是否只是把矛盾挪了位置**：例如把 A 处改成与 B 处一致，却让 A 处与 C 处新冲突。',
    '3) **是否该消歧的地方被强行统一了**：同名不同物若被统一到同一值，是错的（应当补限定词）。',
    '4) **是否删掉了论点**：`git diff` 里成段的删除要么是降档、要么是删论点。降档可以，删论点记 deletedArguments。',
    '5) **是否新增了模糊假来源**（「据业界报告」「业内普遍认为」等）。',
    '6) 是否为了「看起来一致」而把一个无法判定的值写死（这比保留矛盾更糟）。',
    '',
    '复核者自己也会出错：若你判断某处「矛盾」其实是两个不同事件（如某产品的立项年 vs 开源年），',
    '写进 problems 说明理由，不要强行要求统一。',
    '',
    '本环境没有网络，禁止 WebSearch / WebFetch。只读，禁止任何 git 写操作。',
    '确实无遗留问题才返回 compliant=true。',
  ].join('\n')
}

phase('Fix')
log('跨文件一致性：' + groups.length + ' 组，文件集互不重叠')

const results = await pipeline(
  groups,
  function (g) {
    return agent(fixPrompt(g), { schema: RESULT, phase: 'Fix', label: 'fix:' + g.name })
  },
  function (res, g) {
    if (!res) return { group: g, result: null, verdict: null }
    return agent(verifyPrompt(g, res.handled), { schema: VERDICT, phase: 'Verify', label: 'verify:' + g.name })
      .then(function (v) { return { group: g, result: res, verdict: v } })
  },
  function (prev) {
    if (!prev || !prev.verdict || prev.verdict.compliant) return prev
    const probs = []
    probs.push.apply(probs, (prev.verdict.stillContradictory || []).map(function (x) { return '仍矛盾：' + x }))
    probs.push.apply(probs, (prev.verdict.newContradictions || []).map(function (x) { return '新矛盾：' + x }))
    probs.push.apply(probs, (prev.verdict.deletedArguments || []).map(function (x) { return '删了论点：' + x }))
    probs.push.apply(probs, prev.verdict.problems || [])
    if (!probs.length) probs.push('复核未通过，按规范逐条自查。')
    return agent(
      [
        '你是《AI 时代数据架构师》书稿的跨文件一致性修复者。组：「' + prev.group.name + '」',
        '规范：' + SPEC + '　候选清单：' + CONFLICTS,
        '只改这些文件：',
        prev.group.files.map(function (f) { return '  - ' + REPO + '/' + f }).join('\n'),
        '',
        '复核者认为仍未修好，逐条处理：',
        probs.map(function (x, i) { return '  ' + (i + 1) + '. ' + x }).join('\n'),
        '',
        '重申：先消歧再统一；不可判定就降档不定论；不要写死无法判定的值；不要删论点；不要新增来源。',
        '本环境无网络，禁止 WebSearch / WebFetch。禁止执行任何 git 写命令。',
      ].join('\n'),
      { schema: RESULT, phase: 'Fix2', label: 'fix2:' + prev.group.name }
    ).then(function (r2) {
      prev.result2 = r2
      return agent(verifyPrompt(prev.group, (r2 && r2.handled) || []), { schema: VERDICT, phase: 'Fix2', label: 'reverify:' + prev.group.name })
        .then(function (v2) { prev.verdict2 = v2; return prev })
    })
  }
)

const out = results.filter(Boolean)
const ok = [], unresolved = []
out.forEach(function (r) {
  const v2 = r.verdict2, v = r.verdict
  const passed = v2 ? v2.compliant === true : (v ? v.compliant === true : false)
  if (passed) ok.push(r.group.name)
  else unresolved.push({ group: r.group.name, problems: (v2 && v2.problems) || (v && v.problems) || ['未复核'] })
})

phase('Critic')
const critic = await agent(
  [
    '你是完整性批判者。仓库：' + REPO + ' 是一本 985 文件的 Markdown 书稿。',
    '本轮修复了跨文件事实矛盾，处理了 ' + groups.length + ' 组（' + ok.length + ' 组通过）。',
    '',
    '请用 Bash 实际检查，回答「还漏了哪些冲突」：',
    '1) 跑 `python3 .cross-file-consistency-scan.py` 看还剩哪些冲突组，按（年份数 × 提及数）排序列出前 15。',
    '2) 脚本有已知盲区：实体出现在动词后 30 字符之外就抓不到（Netflix Maestro 就漏过）。',
    '   请手工抽查 3-5 个本书高频引用的系统/产品（如 Iceberg、Hudi、Flink、Kafka、Spark、',
    '   Delta Lake、Metaflow、Doris、StarRocks），用 `grep -rn` 找它们的年份断言，看是否互相矛盾。',
    '3) 有没有跨文件的**非年份**矛盾（同一事实两个不同数值，如团队规模、性能量级、产品能力）？',
    '   给出 3-5 个候选。',
    '4) 本轮改动有没有引入新的跨文件不一致？',
    '',
    '只读。禁止任何 git 写操作。',
  ].join('\n'),
  { schema: { type: 'object', properties: { remaining: { type: 'array', items: { type: 'string' } }, nonYearConflicts: { type: 'array', items: { type: 'string' } }, risks: { type: 'array', items: { type: 'string' } } }, required: ['remaining'] }, phase: 'Critic', label: 'conflict-critic' }
)

return { groups: groups.length, passed: ok.length, passedGroups: ok, unresolved: unresolved, critic: critic }
