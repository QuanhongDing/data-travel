export const meta = {
  name: 'difficulty-rating',
  description: '为各章 README 的「难度」行按书内既定标度填值（三路独立评级 + 一次对齐）',
  phases: [
    { title: 'Rate', detail: '三路独立评级，每路覆盖全部章，便于横向校准' },
    { title: 'Reconcile', detail: '对齐三路分歧，产出最终值' },
  ],
}

// args: { chapters: [{dir, readme, main, title}], rubric }
const REPO = '/Users/dqh/CCProject/me/data-travel'
const cfg = args
const chapters = cfg.chapters

// chapters 支持两种形态："dir | 标题" 字符串，或 {dir,title} 对象
const LIST = chapters.map(function (c, i) {
  if (typeof c === 'string') return (i + 1) + '. ' + c
  return (i + 1) + '. ' + c.dir + '  「' + (c.title || '') + '」'
}).join('\n')

const RATE = {
  type: 'object',
  properties: {
    ratings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dir: { type: 'string' },
          stars: { type: 'number', description: '1–5 的整数' },
          why: { type: 'string', description: '凭什么给这个值：引用该章的具体内容特征，一句话' },
        },
        required: ['dir', 'stars', 'why'],
      },
    },
  },
  required: ['ratings'],
}

const spot = function (dir, n) { return REPO + '/' + dir + '/' + n }

const ratePrompt = function (lane) {
  return [
    '你是《AI 时代数据架构师》书稿的**难度定级员**（第 ' + lane + ' 路独立评级）。',
    '',
    '## 背景',
    '',
    '全书 114 个章的 README 里都有一行 `| 难度 | … |`，但 **108 个章填的是「未标注」**。',
    '而入门章 `00-introduction/03-difficulty-and-paths/03-difficulty-and-paths.md`',
    '已经定义了标度并告诉读者「看每章 README 的难度星，1 分钟决定要不要读」。',
    '**也就是说这本书对读者做了一个它没有兑现的承诺。** 你的任务是把它兑现。',
    '',
    '## 既定标度（来自入门章，**不要自创标度**）',
    '',
    '    ★☆☆☆☆ 1  基础：不需要前置，可随时查阅',
    '    ★★☆☆☆ 2  偏基础：需要本领域常识，但无重数学',
    '    ★★★☆☆ 3  中等：需要读懂机制与取舍，有少量形式化',
    '    ★★★★☆ 4  较难：需要跨章背景或较强形式化（数学 / 协议 / 一致性证明）',
    '    ★★★★★ 5  专家：需要该方向的一手实践经验才能判断取舍',
    '',
    '## 怎么定级（按这个顺序看，别只看标题）',
    '',
    '1. 读该章的 `README.md`（很短）与主文件 `' + '' + '` 的 §0 速读地图、§1、§2 的**小节标题**，',
    '   必要时扫一眼 §2 里有没有公式 / 协议描述 / 证明。**不要通读全章。**',
    '2. 抓这几个信号：① 前置知识有多少（要不要先读别的章）；',
    '   ② 形式化密度（有无数学、协议、一致性论证）；',
    '   ③ 是「讲机制」还是「讲取舍」——后者更难；',
    '   ④ 是通用技术章还是特定行业 / 特定组织场景章（后者对读者背景要求更窄但更深）。',
    '3. **案例章（`15-case-studies`）与组织类章（`14-leadership`、`13-decision`）不要默认给低分** ——',
    '   它们难在「没有标准答案、要靠经验判断取舍」，通常落在 3–4。',
    '',
    '## 你要评的章（**全部 114 个都要评**，这样才能横向校准）',
    '',
    LIST,
    '',
    '## why 字段怎么写',
    '',
    '一句话，必须**引用该章的具体内容特征**，不要写「内容较深」这种空话。',
    '例：「需要先懂 Spark 执行模型才能看懂优化器那节的代价模型」、',
    '「讲组织取舍，无标准答案，且要求读者有跨团队经验」。',
    '',
    '## 环境',
    '',
    '本环境无网络（WebSearch / WebFetch 不可用），禁止使用 —— 但本任务只需要读仓库内部文件。',
    '**不要修改任何文件。** 禁止 git 写操作。',
    '',
    '你的最终文本就是返回值。',
  ].join('\n')
}

const RECON = {
  type: 'object',
  properties: {
    final: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dir: { type: 'string' },
          stars: { type: 'number' },
          note: { type: 'string', description: '三路有分歧时的取值理由；无分歧写「一致」' },
        },
        required: ['dir', 'stars'],
      },
    },
    disagreements: { type: 'number' },
  },
  required: ['final'],
}

phase('Rate')
const lanes = await parallel([1, 2, 3].map(function (n) {
  return function () {
    return agent(ratePrompt(n), { label: 'rate:' + n, phase: 'Rate', schema: RATE })
  }
}))

const all = lanes.filter(Boolean)
log('三路各评 ' + all.map(function (l) { return (l.ratings || []).length }).join('/') + ' 个章')

phase('Reconcile')
const merged = JSON.stringify(all.map(function (l) { return l.ratings }), null, 0)
const recon = await agent([
  '你是**对齐员**。三路独立评级员各自给全书每个章打了 1–5 的难度星，现在要对齐。',
  '',
  '标度（既定，不要改）：1 基础 / 2 偏基础 / 3 中等 / 4 较难 / 5 专家。',
  '',
  '三路结果（JSON）：',
  merged,
  '',
  '## 你要做的',
  '',
  '1. **取三路的中位数**作为基准。',
  '2. **重点看分歧 ≥2 星的章** —— 去读那个章的 README 与主文件 §0/§1 的小节标题，自己判断，',
  '   而不是简单取中位数了事。',
  '3. **做一次全书横向检查**：有没有出现「明显同一难度的两类章给了不同星」？',
  '   典型要防的：把 `15-case-studies` 的案例章一律压低、把 `00-introduction` 一律抬高。',
  '   案例章难在「没有标准答案」，组织/决策类章同理 —— 它们通常不该低于 3。',
  '   反之，纯查阅型的基础章（术语表、能力模型）不该高于 2。',
  '4. 输出**恰好覆盖输入里的每一个 dir**，每个给一个整数 stars。',
  '   有分歧的在 note 里写一句你怎么定的；一致的写「一致」。',
  '',
  '仅可读仓库文件。不要修改任何文件。禁止 git 写操作。',
].join('\n'), { label: 'reconcile', phase: 'Reconcile', schema: RECON })

return { lanes: all.length, reconciled: (recon && recon.final || []).length,
         disagreements: recon && recon.disagreements, final: recon && recon.final }
