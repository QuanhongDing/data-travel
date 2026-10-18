export const meta = {
  name: 'parallel-fix-sec6-shells',
  description: '并行扫描并重写全库剩余的模板化空壳 §6 文件为深度公司案例（每批独立校验并修复）',
  phases: [
    { title: 'Scan', detail: '扫描全库 §6 文件，找出仍是模板化空壳的文件' },
    { title: 'Rewrite', detail: '每 3 个文件一批并行重写' },
    { title: 'Verify', detail: '每批改完立即独立校验并修复不达标项' },
  ],
}

const ROOT = '/Users/dqh/CCProject/me/data-travel'
const SPEC = ROOT + '/.rewrite-spec.md'
const GOLD = ROOT + '/11-cross-cutting/05-lineage-and-impact/05-lineage-and-impact-section-6-sec6.md'
const BT = String.fromCharCode(96)
const F = BT + BT + BT

const SCAN_SCHEMA = {
  type: 'object',
  properties: {
    files: { type: 'array', items: { type: 'string' } },
    total: { type: 'number' },
  },
  required: ['files', 'total'],
}

phase('Scan')
const scan = await agent(
  [
    '在仓库 ' + ROOT + ' 中扫描所有 `*-section-6-sec6.md` 文件，找出【仍是模板化空壳】的文件。',
    '',
    '判定签名：「关键数字」表里有整行填充 `| 某指标 | 不可用 | 100% | **∞** |`，且这类行数 >= 7。',
    '',
    '用 Bash 高效完成，不要逐个读全文：',
    "cd " + ROOT + " && for g in $(find . -name '*-section-6-sec6.md' | sort); do n=$(grep -c '不可用 | 100% | \\*\\*∞\\*\\*' \"$g\"); if [ \"$n\" -ge 7 ]; then echo \"${g#./}\"; fi; done",
    '',
    '只做只读扫描，不要修改任何文件。返回仓库相对路径数组与总数。',
  ].join('\n'),
  { label: 'scan-shells', phase: 'Scan', schema: SCAN_SCHEMA }
)

const FILES = (scan && scan.files ? scan.files : []).map(f => String(f).replace(/^\.\//, ''))
log('扫描完成：' + FILES.length + ' 个文件仍需重写')

if (!FILES.length) {
  return { scanned: 0, note: '未发现空壳文件（或扫描未取到结果）', scan }
}

const BATCH = 3
const batches = []
for (let i = 0; i < FILES.length; i += BATCH) batches.push(FILES.slice(i, i + BATCH))
log('切成 ' + batches.length + ' 批并行处理')

const REWRITE_SCHEMA = {
  type: 'object',
  properties: {
    files: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          lines: { type: 'number' },
          fences: { type: 'number' },
          fillerRows: { type: 'number' },
          ok: { type: 'boolean' },
          note: { type: 'string' },
        },
        required: ['path', 'lines', 'fences', 'fillerRows', 'ok'],
      },
    },
  },
  required: ['files'],
}

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          lines: { type: 'number' },
          fences: { type: 'number' },
          fillerRows: { type: 'number' },
          ok: { type: 'boolean' },
          note: { type: 'string' },
        },
        required: ['path', 'lines', 'fences', 'fillerRows', 'ok'],
      },
    },
  },
  required: ['results'],
}

function rewritePrompt(batch) {
  const list = batch.map((f, i) => (i + 1) + '. ' + ROOT + '/' + f).join('\n')
  return [
    '你是书籍仓库 data-travel（《AI 时代数据架构师》）的内容重写执行者。',
    '',
    '【第一步】完整读这个规范文件，并严格按它执行：' + SPEC,
    '规范里指定了两个标杆文件，先读它们建立信息密度与写法的手感。',
    '',
    '【第二步】本次负责重写以下 ' + batch.length + ' 个文件：',
    list,
    '',
    '每个文件要求：读原文件并保留其 4 个案例的公司名与主题（若同一公司重复出现，为它们取不同侧面避免复读）；读同目录主 `.md` 的 §1、§2 对齐术语；',
    '然后【整文件 Write 覆写】为 400~440 行，严格按规范里的骨架（4 案例 × 5 段 + 落地路径 + 踩坑表 12~13 行 + ROI 表 10 行 + 小结）。',
    '',
    '硬性红线：填充行 `| X | 不可用 | 100% | **∞** |` 每文件最多 1 行；关键能力必须是一整句话（禁止单个词）；失败教训必须含后果；每案例恰好 1 个缩进 5 空格的代码/图示块。',
    '',
    '【第三步】对每个文件跑 Bash 自检，不达标就继续补写：',
    "  wc -l < <file>  → 400~440      grep -c '" + F + "' <file>  → >= 8",
    '  grep -cE "不可用 \\| 100% \\| \\*\\*∞\\*\\*" <file>  → <= 1      grep -c "^### " <file>  → 7',
    '',
    '不要写 git 命令，不要改动清单外的文件。',
    '返回 JSON：{files:[{path, lines, fences, fillerRows, ok, note}]}。',
  ].join('\n')
}

function verifyPrompt(batch) {
  const list = batch.map((f, i) => (i + 1) + '. ' + ROOT + '/' + f).join('\n')
  return [
    '你是独立校验者。刚刚有执行者重写了下面这些 §6 文件，请【独立校验并直接修复】，不要相信执行者的自评。',
    '',
    '文件：',
    list,
    '',
    '对每个文件跑 Bash 客观检查：',
    "  LINES=$(wc -l < <f>) ; FENCES=$(grep -c '" + F + "' <f>)",
    '  FILLER=$(grep -cE "不可用 \\| 100% \\| \\*\\*∞\\*\\*" <f>) ; H3=$(grep -c "^### " <f>)',
    '  VAGUE=$(grep -cE "关键能力：\\*\\*(统一|安全|跨域|全业务|多模态|毫秒级|AI|大规模|全球|实时|SaaS|业务自助)\\*\\*$" <f>)',
    '  NOCONSEQUENCE=$(grep -cE "^- 早期「.+」——倒逼" <f>)',
    '',
    '达标线：LINES 395~460；FENCES >= 8；FILLER <= 2；H3 == 7；VAGUE == 0；NOCONSEQUENCE == 0。',
    '',
    '不达标由你直接修复（Read 看内容 + Edit/Write 补齐）：行数不足就补组件描述/代码块/表格行；缺代码块就为对应案例补 8~16 行缩进 5 空格的 ASCII 图或 SQL；FILLER 过多就把整行填充换成真实可比的量（P99/覆盖率/时长/人数/表数）；VAGUE 就改写为完整句子；NOCONSEQUENCE 就补上具体后果。修完重跑检查直到全达标。',
    '',
    '参考标杆：' + GOLD,
    '不要写 git 命令，不要改动清单外的文件。',
    '返回 JSON：{results:[{path, lines, fences, fillerRows, ok, note}]}。',
  ].join('\n')
}

phase('Rewrite')
const results = await pipeline(
  batches,
  (b, i) => agent(rewritePrompt(b), { label: 'rewrite:' + (i + 1), phase: 'Rewrite', schema: REWRITE_SCHEMA }),
  (r, b, i) => agent(verifyPrompt(b), { label: 'verify:' + (i + 1), phase: 'Verify', schema: VERIFY_SCHEMA })
)

const flat = results.filter(Boolean).flatMap(r => (r && r.results) ? r.results : [])
const bad = flat.filter(f => !f.ok)
log('完成 ' + flat.length + ' / ' + FILES.length + '，未达标 ' + bad.length)

return { scanned: FILES.length, processed: flat.length, ok: flat.length - bad.length, notOk: bad, detail: flat }
