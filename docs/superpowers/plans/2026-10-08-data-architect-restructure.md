# AI 时代数据架构师 — 仓库目录重组实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `data-travel` repository structure to align with the AI-era data architect (AI 智能体平台架构师) capability stack defined in `docs/superpowers/specs/2026-10-08-data-architect-restructure.md`.

**Architecture:**
- Move from 10-chapter "数据架构师能力分层" layout (存储/计算/中台/AI ...) to 15-chapter main-body layout where each chapter maps to a specific persona capability derived from the Agent 架构师 (高级) job posting
- Decompose absorbed chapters (02 存储 + 03 计算 → Ch3 数据全栈 + Ch4 数据资产化; 04 中台 + 05 AI 原生 → distributed across 6 AI-platform chapters)
- Renumber remaining chapters (06 → 11, 07 → 12, 08 → 13, 09 → 14, 10 → 15)
- Preserve all 102 existing sub-folder skeletons (READMEs + empty assets/), moving them to new chapters per the mapping table below

**Tech Stack:**
- Bash + `git mv` for file moves (preserves history)
- Markdown (no build step)
- Conventional Commits

## Global Constraints

- Spec file: `docs/superpowers/specs/2026-10-08-data-architect-restructure.md` (authoritative source)
- Sub-folder mapping table (use this exact mapping when moving files):

| 源路径 | 目标路径 |
| --- | --- |
| `01-modeling/*` | `01-modeling/*` (no move; kept as-is) |
| `02-storage/data-warehouse/` | `03-data-stack/data-warehouse/` |
| `02-storage/data-lake/` | `03-data-stack/data-lake/` |
| `02-storage/lakehouse/` | `03-data-stack/lakehouse/` |
| `02-storage/streaming-store/` | `03-data-stack/streaming-store/` |
| `02-storage/cold-hot-tiering/` | `03-data-stack/cold-hot-tiering/` |
| `02-storage/schema-and-time-travel/` | `03-data-stack/schema-and-time-travel/` |
| `02-storage/architecture-decisions/` | `03-data-stack/architecture-decisions/` |
| `02-storage/multimodal-db/` | `04-data-assetization/multimodal-db/` |
| `02-storage/vector-lake/` | `04-data-assetization/vector-lake/` |
| `02-storage/ai-native-db/` | `04-data-assetization/ai-native-db/` |
| `03-compute/offline-compute/` | `03-data-stack/offline-compute/` |
| `03-compute/realtime-compute/` | `03-data-stack/realtime-compute/` |
| `03-compute/stream-batch-unified/` | `03-data-stack/stream-batch-unified/` |
| `03-compute/olap-engine/` | `03-data-stack/olap-engine/` |
| `03-compute/scheduler/` | `03-data-stack/scheduler/` |
| `03-compute/query-engine/` | `03-data-stack/query-engine/` |
| `03-compute/optimizer/` | `03-data-stack/optimizer/` |
| `03-compute/ai-compute/` | `09-data-intelligence-product/ai-compute/` |
| `04-data-mesh-and-middleware/one-data/` | `03-data-stack/one-data/` |
| `04-data-mesh-and-middleware/one-id/` | `01-modeling/one-id/` (merge; merge if duplicate, otherwise move) |
| `04-data-mesh-and-middleware/one-service/` | `04-data-assetization/one-service/` |
| `04-data-mesh-and-middleware/data-api-gateway/` | `04-data-assetization/data-api-gateway/` |
| `04-data-mesh-and-middleware/data-catalog/` | `04-data-assetization/data-catalog/` |
| `04-data-mesh-and-middleware/unified-query-gateway/` | `04-data-assetization/unified-query-gateway/` |
| `04-data-mesh-and-middleware/metric-platform/` | `04-data-assetization/metric-platform/` |
| `04-data-mesh-and-middleware/data-mesh/` | `09-data-intelligence-product/data-mesh/` |
| `04-data-mesh-and-middleware/data-lineage/` | `11-cross-cutting/data-lineage/` |
| `04-data-mesh-and-middleware/hands-on/` | (drop; covered by chapter-level hands-on, no contents) |
| `05-ai-native-data-stack/feature-store/` | `02-data-science/feature-store/` |
| `05-ai-native-data-stack/embedding-and-retrieval/` | `06-multi-model/embedding-and-retrieval/` |
| `05-ai-native-data-stack/llm-in-sql/` | `06-multi-model/llm-in-sql/` |
| `05-ai-native-data-stack/hybrid-search/` | `04-data-assetization/hybrid-search/` |
| `05-ai-native-data-stack/rag-architecture/` | `04-data-assetization/rag-architecture/` |
| `05-ai-native-data-stack/data-agent/` | `05-agent-platform/data-agent/` |
| `05-ai-native-data-stack/ai-data-governance/` | `08-ai-governance/ai-data-governance/` |
| `05-ai-native-data-stack/decision-intelligence/` | `09-data-intelligence-product/decision-intelligence/` |
| `05-ai-native-data-stack/multimodal-ai/` | `10-industry-agent/multimodal-ai/` |
| `05-ai-native-data-stack/ai-native-db/` | (drop; moved from 02-storage already covers it) |
| `06-cross-cutting-engineering/*` | `11-cross-cutting/*` (rename parent; sub-folders stay) |
| `07-architecture-and-reliability/*` | `12-architecture/*` (rename parent; sub-folders stay) |
| `08-decision-and-tradeoff/*` | `13-decision/*` (rename parent; sub-folders stay) |
| `09-team-and-leadership/*` | `14-leadership/*` (rename parent; sub-folders stay) |
| `10-case-studies/*` | `15-case-studies/*` (rename parent; sub-folders stay) |

- Naming convention: `NN-<english-slug>/` (NN = two-digit ordinal; lowercase + hyphens)
- Every chapter dir MUST have `README.md` with 6 required sections (per spec §6)
- Every new chapter dir MUST have `images/`, `code/`, `attachments/` sub-dirs with `.gitkeep`
- Use `git mv` for moves (NOT `mv` + `git add`, which loses history)
- Cross-references in all README.md must point to NEW chapter paths after restructuring
- Use Conventional Commits (`docs:` / `feat:` / `chore:` / `refactor!:`)

---

## Phase A: 物理目录重组 (Tasks 1-4)

### Task 1: 创建 8 个新章节目录骨架

**Files:**
- Create: `02-data-science/{README.md, images/.gitkeep, code/.gitkeep, attachments/.gitkeep}`
- Create: `03-data-stack/{README.md, images/.gitkeep, code/.gitkeep, attachments/.gitkeep}`
- Create: `04-data-assetization/{README.md, images/.gitkeep, code/.gitkeep, attachments/.gitkeep}`
- Create: `05-agent-platform/{README.md, images/.gitkeep, code/.gitkeep, attachments/.gitkeep}`
- Create: `06-multi-model/{README.md, images/.gitkeep, code/.gitkeep, attachments/.gitkeep}`
- Create: `07-agent-evolution/{README.md, images/.gitkeep, code/.gitkeep, attachments/.gitkeep}`
- Create: `08-ai-governance/{README.md, images/.gitkeep, code/.gitkeep, attachments/.gitkeep}`
- Create: `09-data-intelligence-product/{README.md, images/.gitkeep, code/.gitkeep, attachments/.gitkeep}`
- Create: `10-industry-agent/{README.md, images/.gitkeep, code/.gitkeep, attachments/.gitkeep}`

**Interfaces:**
- Consumes: nothing
- Produces: 8 chapter skeletons each with placeholder README + assets dirs

**Step 1.1: Create chapter dir trees**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
for n in 02-data-science 03-data-stack 04-data-assetization 05-agent-platform 06-multi-model 07-agent-evolution 08-ai-governance 09-data-intelligence-product 10-industry-agent; do
  mkdir -p "$n/images" "$n/code" "$n/attachments"
  touch "$n/images/.gitkeep" "$n/code/.gitkeep" "$n/attachments/.gitkeep"
done
ls -d */ | sort
```
Expected: 17 chapter dirs visible (00-introduction 01-modeling 02-data-science ... 15-case-studies 99-outro).

**Step 1.2: Write placeholder README for each new chapter**

For each of the 8 new chapters, write `README.md` with this exact skeleton (substitute chapter number/name/intro):

```markdown
# <NN> · <Chapter Title>（占位）

> **一句话定位**：<待章节标题定位>。

## 章节定位（占位）

> 本章节 **待 Phase B 重写**。届时将包含画像映射、核心问题、子主题列表、文件命名建议、画像能力小结。
> 临时内容由本占位 README 提供，确保目录结构与目标 spec 一致。

## 占位说明

本目录在仓库重组中新增，正文待 Phase B 写入。
```

**Chapter-specific titles for placeholders:**

| 目录 | 一句话定位 |
| --- | --- |
| `02-data-science` | 数据科学与算法（占位） |
| `03-data-stack` | 数据全栈基础设施（占位） |
| `04-data-assetization` | 企业级数据资产化与智能检索（占位） |
| `05-agent-platform` | AI 智能体平台架构（占位） |
| `06-multi-model` | 多模型编排与工具调用（占位） |
| `07-agent-evolution` | AI 资产沉淀与自进化（占位） |
| `08-ai-governance` | AI 治理与安全（占位） |
| `09-data-intelligence-product` | 数据智能产品（占位） |
| `10-industry-agent` | 行业智能体（占位） |

**Step 1.3: Commit skeleton creation**

```bash
cd /Users/dqh/CCProject/me/data-travel
git add 02-data-science 03-data-stack 04-data-assetization 05-agent-platform 06-multi-model 07-agent-evolution 08-ai-governance 09-data-intelligence-product 10-industry-agent
git commit -m "chore(structure): scaffold 8 new chapter directories per persona restructure

Refs: docs/superpowers/specs/2026-10-08-data-architect-restructure.md §4"
```

### Task 2: 迁移 sub-folders 按映射表（4 批）

**Files:**
- Move: ~36 sub-folders per the mapping table in Global Constraints
- Strategy: `git mv` each sub-folder, then commit after each source chapter is fully emptied

**Step 2.1: Move sub-folders from `02-storage/` (10 items per mapping)**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
git mv 02-storage/data-warehouse 03-data-stack/data-warehouse
git mv 02-storage/data-lake 03-data-stack/data-lake
git mv 02-storage/lakehouse 03-data-stack/lakehouse
git mv 02-storage/streaming-store 03-data-stack/streaming-store
git mv 02-storage/cold-hot-tiering 03-data-stack/cold-hot-tiering
git mv 02-storage/schema-and-time-travel 03-data-stack/schema-and-time-travel
git mv 02-storage/architecture-decisions 03-data-stack/architecture-decisions
git mv 02-storage/multimodal-db 04-data-assetization/multimodal-db
git mv 02-storage/vector-lake 04-data-assetization/vector-lake
git mv 02-storage/ai-native-db 04-data-assetization/ai-native-db
git status
```
Expected: 10 entries under "renamed:" section, each `02-storage/<x>` → target

**Step 2.2: Move sub-folders from `03-compute/` (8 items per mapping)**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
git mv 03-compute/offline-compute 03-data-stack/offline-compute
git mv 03-compute/realtime-compute 03-data-stack/realtime-compute
git mv 03-compute/stream-batch-unified 03-data-stack/stream-batch-unified
git mv 03-compute/olap-engine 03-data-stack/olap-engine
git mv 03-compute/scheduler 03-data-stack/scheduler
git mv 03-compute/query-engine 03-data-stack/query-engine
git mv 03-compute/optimizer 03-data-stack/optimizer
git mv 03-compute/ai-compute 09-data-intelligence-product/ai-compute
git status
```
Expected: 8 entries renamed

**Step 2.3: Move sub-folders from `04-data-mesh-and-middleware/` (10 items per mapping; merge `one-id` since it lives in `01-modeling/` already)**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
# Check if 01-modeling/one-id exists
test -d 01-modeling/one-id && echo "EXISTS-merge" || echo "ABSENT-move"
```

If `EXISTS-merge`: both `01-modeling/one-id` and `04-data-mesh-and-middleware/one-id` exist. Compare and merge:
```bash
cd /Users/dqh/CCProject/me/data-travel
diff -rq 01-modeling/one-id 04-data-mesh-and-middleware/one-id
# If files differ, manually reconcile then drop the duplicate
# Otherwise keep 01-modeling/one-id and remove 04-data-mesh-and-middleware/one-id
git rm -r 04-data-mesh-and-middleware/one-id
```

If `ABSENT-move`: just `git mv 04-data-mesh-and-middleware/one-id 01-modeling/one-id`

After resolving `one-id`:

```bash
cd /Users/dqh/CCProject/me/data-travel
git mv 04-data-mesh-and-middleware/one-data 03-data-stack/one-data
git mv 04-data-mesh-and-middleware/one-service 04-data-assetization/one-service
git mv 04-data-mesh-and-middleware/data-api-gateway 04-data-assetization/data-api-gateway
git mv 04-data-mesh-and-middleware/data-catalog 04-data-assetization/data-catalog
git mv 04-data-mesh-and-middleware/unified-query-gateway 04-data-assetization/unified-query-gateway
git mv 04-data-mesh-and-middleware/metric-platform 04-data-assetization/metric-platform
git mv 04-data-mesh-and-middleware/data-mesh 09-data-intelligence-product/data-mesh
git mv 04-data-mesh-and-middleware/data-lineage 11-cross-cutting/data-lineage
git status
```
Expected: 8 renames + (possibly 1 deletion for one-id duplicate)

**Step 2.4: Move sub-folders from `05-ai-native-data-stack/` (10 items per mapping; drop `ai-native-db` per mapping)**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
git mv 05-ai-native-data-stack/feature-store 02-data-science/feature-store
git mv 05-ai-native-data-stack/embedding-and-retrieval 06-multi-model/embedding-and-retrieval
git mv 05-ai-native-data-stack/llm-in-sql 06-multi-model/llm-in-sql
git mv 05-ai-native-data-stack/hybrid-search 04-data-assetization/hybrid-search
git mv 05-ai-native-data-stack/rag-architecture 04-data-assetization/rag-architecture
git mv 05-ai-native-data-stack/data-agent 05-agent-platform/data-agent
git mv 05-ai-native-data-stack/ai-data-governance 08-ai-governance/ai-data-governance
git mv 05-ai-native-data-stack/decision-intelligence 09-data-intelligence-product/decision-intelligence
git mv 05-ai-native-data-stack/multimodal-ai 10-industry-agent/multimodal-ai
git rm -r 05-ai-native-data-stack/ai-native-db
git status
```
Expected: 9 renames + 1 deletion (`ai-native-db` already exists at 04-data-assetization/ai-native-db from Step 2.1)

**Step 2.5: Verify old chapters are now empty (only README.md left)**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
ls 02-storage/ 03-compute/ 04-data-mesh-and-middleware/ 05-ai-native-data-stack/
```
Expected: each shows only `README.md` (and possibly the kept `data-lineage` for 04 — verify; if any non-README remains, return to mapping table to fix)

**Step 2.6: Commit all sub-folder moves**

```bash
cd /Users/dqh/CCProject/me/data-travel
git add -A
git commit -m "refactor(structure): migrate 36 sub-folders to AI persona-aligned destinations
- 10 from 02-storage → 03-data-stack + 04-data-assetization
- 8 from 03-compute → 03-data-stack + 09-data-intelligence-product
- 9 from 04-data-mesh-and-middleware → 01-modeling/03-stack/04-assetization/11-cross-cutting/09-product
- 9 from 05-ai-native-data-stack → 02-science/04-assetization/05-platform/06-multi-model/08-governance/09-product/10-industry

Refs: docs/superpowers/specs/2026-10-08-data-architect-restructure.md"
```

### Task 3: 删除 4 个废弃章节根目录

**Files:**
- Delete: `02-storage/` (now only contains README.md)
- Delete: `03-compute/` (now only contains README.md)
- Delete: `04-data-mesh-and-middleware/` (now only contains README.md)
- Delete: `05-ai-native-data-stack/` (now only contains README.md)

**Step 3.1: Remove the four deprecated chapter directories**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
git rm -r 02-storage 03-compute 04-data-mesh-and-middleware 05-ai-native-data-stack
git status
```
Expected: 4 entries under "deleted:"

**Step 3.2: Verify chapter structure**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
ls -d */ | sort
```
Expected output (17 dirs):
```
00-introduction/
01-modeling/
02-data-science/
03-data-stack/
04-data-assetization/
05-agent-platform/
06-multi-model/
07-agent-evolution/
08-ai-governance/
09-data-intelligence-product/
10-industry-agent/
11-cross-cutting/
12-architecture/
13-decision/
14-leadership/
15-case-studies/
99-outro/
```

**Step 3.3: Commit removal**

```bash
cd /Users/dqh/CCProject/me/data-travel
git commit -m "refactor(structure)!: remove 4 deprecated chapter directories

- 02-storage (replaced by 03-data-stack + 04-data-assetization)
- 03-compute (replaced by 03-data-stack + 09-data-intelligence-product)
- 04-data-mesh-and-middleware (decomposed across 6 chapters)
- 05-ai-native-data-stack (decomposed across 7 chapters)

Refs: docs/superpowers/specs/2026-10-08-data-architect-restructure.md"
```

### Task 4: 重命名 5 个保留章节

**Files:**
- Rename: `06-cross-cutting-engineering/` → `11-cross-cutting/`
- Rename: `07-architecture-and-reliability/` → `12-architecture/`
- Rename: `08-decision-and-tradeoff/` → `13-decision/`
- Rename: `09-team-and-leadership/` → `14-leadership/`
- Rename: `10-case-studies/` → `15-case-studies/`

**Step 4.0: Pre-step — relocate `data-lineage` from `11-cross-cutting/` to `06-cross-cutting-engineering/`**

Reason: Task 2 moved `04-data-mesh-and-middleware/data-lineage` to `11-cross-cutting/`, but Task 4 also needs to rename `06-cross-cutting-engineering` to `11-cross-cutting/`. The destination must be empty for `git mv` to work, so move `data-lineage` back to where it will end up after the rename.

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
git mv 11-cross-cutting/data-lineage 06-cross-cutting-engineering/data-lineage
git status
```
Expected: 1 rename

**Step 4.1: Rename all 5 chapters via git mv**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
git mv 06-cross-cutting-engineering 11-cross-cutting
git mv 07-architecture-and-reliability 12-architecture
git mv 08-decision-and-tradeoff 13-decision
git mv 09-team-and-leadership 14-leadership
git mv 10-case-studies 15-case-studies
git status
```
Expected: 5 renames

**Step 4.2: Verify final structure**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
ls -d */ | sort
```
Expected: same 17 dirs as Task 3.2 + directory naming `11-cross-cutting` etc.

**Step 4.3: Commit pre-step + renames**

```bash
cd /Users/dqh/CCProject/me/data-travel
git commit -m "refactor(structure): renumber 5 preserved chapters to 11-15

Pre-step: relocate data-lineage from 11-cross-cutting (pre-created
in Task 2 to receive 04-data-mesh's data-lineage) back to
06-cross-cutting-engineering so the rename below can proceed without
target conflict.

Mapping:
- 06-cross-cutting-engineering → 11-cross-cutting
- 07-architecture-and-reliability → 12-architecture
- 08-decision-and-tradeoff → 13-decision
- 09-team-and-leadership → 14-leadership
- 10-case-studies → 15-case-studies

Refs: docs/superpowers/specs/2026-10-08-data-architect-restructure.md §4"
```

---

## Phase B: README 重写（任务 5-10）

> Note: All README rewrites MUST include the **画像映射** section per spec §6 (required field 3).

### Task 5: 改写 01-modeling/README.md（扩展 KG / 本体建模）

**Files:**
- Modify: `01-modeling/README.md`

**Step 5.1: Replace the existing `01-modeling/README.md` content with new content**

Use Write tool to replace the entire file with content that:
- Updates title to `# Ch1 · 建模方法论`
- Adds 画像映射 section (mapping to R3 数据建模: 数仓 + 知识图谱 + 本体建模 + 图数据推理)
- Adds new sub-topics: `ontology-modeling/`, `knowledge-graph/`, `graph-reasoning/` (placeholders; create dirs in Task 5.2)
- Update **核心问题** to include `本体建模 / 图数据推理 / 知识图谱构建` questions
- Update **子主题列表** to list the 11+ new sub-topics
- Update 推荐章节: **数据科学 / 数据全栈 / 数据资产化** 都需要建模基础

**Step 5.2: Create 3 new placeholder sub-folders for ontology / KG / graph reasoning**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel/01-modeling
for d in ontology-modeling knowledge-graph graph-reasoning; do
  mkdir -p "$d/images" "$d/code" "$d/attachments"
  touch "$d/images/.gitkeep" "$d/code/.gitkeep" "$d/attachments/.gitkeep"
done
```
Each new sub-folder should also have its own `README.md` with the standard template (same as existing sub-folders in `01-modeling/`). Use Read on `01-modeling/dimensional-modeling/README.md` as the template; substitute `<chapter_title>` and `<chapter_number>` accordingly.

**Step 5.3: Commit**

```bash
cd /Users/dqh/CCProject/me/data-travel
git add 01-modeling
git commit -m "docs(Ch1): extend modeling chapter with KG/ontology/graph reasoning

Add 画像映射 (R3 data modeling), 3 new sub-topic placeholders
(ontology-modeling, knowledge-graph, graph-reasoning), and update
core questions per target persona.

Refs: docs/superpowers/specs/2026-10-08-data-architect-restructure.md §5 Ch1"
```

### Task 6: 改写 02-10 章节 README（含画像映射）

**Files:**
- Modify: `02-data-science/README.md`
- Modify: `03-data-stack/README.md`
- Modify: `04-data-assetization/README.md`
- Modify: `05-agent-platform/README.md`
- Modify: `06-multi-model/README.md`
- Modify: `07-agent-evolution/README.md`
- Modify: `08-ai-governance/README.md`
- Modify: `09-data-intelligence-product/README.md`
- Modify: `10-industry-agent/README.md`

**For each chapter, write a new content that:**
- Updates `# <NN> · <Chapter Title>` title
- Adds **画像映射** section (mapping to specific image-derived capability; see table below)
- Adds **核心问题** (3-7 问句 from spec §5)
- Lists **子主题** from migrated sub-folders + spec §5

| Chapter | 画像映射 | 子主题（来自迁移 + 新增） |
| --- | --- | --- |
| `02-data-science` | R2 数据科学算法 | feature-store (migrated from 05), + 推荐/分类/回归/聚类 算法 |
| `03-data-stack` | R4 数据全栈协同 | data-warehouse, data-lake, lakehouse, streaming-store, cold-hot-tiering, schema-and-time-travel, architecture-decisions, offline-compute, realtime-compute, stream-batch-unified, olap-engine, scheduler, query-engine, optimizer, one-data |
| `04-data-assetization` | 职责② 数据资产化与智能检索 | multimodal-db, vector-lake, ai-native-db, hybrid-search, rag-architecture, one-service, data-api-gateway, data-catalog, unified-query-gateway, metric-platform |
| `05-agent-platform` | 职责① 智能体平台整体架构 | data-agent (migrated from 05) |
| `06-multi-model` | 职责③ 多模型编排 + 加分项 OpenAI/Claude | embedding-and-retrieval, llm-in-sql |
| `07-agent-evolution` | 职责④ 自进化闭环 | （暂无迁移子目录；新增 placeholder） |
| `08-ai-governance` | 职责⑥ 防泄露 + 加分项等保 | ai-data-governance |
| `09-data-intelligence-product` | R5 数据智能产品 | ai-compute, decision-intelligence, data-mesh |
| `10-industry-agent` | 职责⑤ 行业智能体 + 加分项代码助手/办公自动化 | multimodal-ai |

**Step 6.1: For each chapter, replace README.md with new content (one commit per chapter)**

For `02-data-science/README.md`:
```markdown
# Ch2 · 数据科学与算法

> **一句话定位**：ML 算法（分类/聚类/回归/推荐）+ 特征工程 + 模型选型 + 效果评估。

## 画像映射

本章对应 **R2 数据科学算法**：
- 精通数据挖掘与机器学习（分类/聚类/回归/推荐）
- 扎实的特征工程、模型选型、效果评估能力
- 算法工程化落地经验

## 基本信息

- **难度**：★★★☆☆
- **推荐角色**：数据科学家 / AI 架构师
- **前置章节**：[Ch1 · 建模方法论](../01-modeling/)
- **后续章节**：[Ch3 · 数据全栈基础设施](../03-data-stack/)

## 本章要回答的核心问题

1. 四类机器学习算法（分类/聚类/回归/推荐）的核心原理与典型模型是什么？
2. 特征工程的完整链路（特征提取、特征选择、特征交叉、特征降维）？
4. 离线训练 vs 在线学习 vs 联邦学习——什么时候用哪个？
5. 如何用 MLflow / Feathr 搭建特征平台与模型管理？
6. A/B 实验设计、效果评估指标（CTR / AUC / NDCG）？

## 子主题

- [ ] **[Feature Store](./feature-store/README.md)**：特征平台搭建（Feast / Tecton）
- [ ] 分类算法（LR / GBDT / DeepFM）—— 占位
- [ ] 聚类算法（KMeans / DBSCAN）—— 占位
- [ ] 回归算法 —— 占位
- [ ] 推荐算法（协同过滤 / 双塔 / DeepFM）—— 占位
- [ ] 强化学习（DQN / PPO）—— 占位
- [ ] 模型选型与超参调优 —— 占位
- [ ] 效果评估与 A/B 实验 —— 占位

## 画像能力小结

> 资深架构师 要懂算法原理，但更要懂**算法工程化落地**与**业务问题抽象**。

## 下一步

- 回到 [根目录](../README.md) 选择其他角色路径
- 进入 [Ch3 · 数据全栈基础设施](../03-data-stack/) 继续阅读
```

Create remaining 3 placeholder sub-folders for `02-data-science` (each with `.gitkeep` skeleton dirs and template README; see Task 5.2 pattern):
- `02-data-science/classification/`, `02-data-science/regression/`, `02-data-science/clustering/`, `02-data-science/recommendation/`, `02-data-science/rl/`, `02-data-science/eval/`

Repeat the same pattern for chapters 03-10. Each chapter README uses the spec §5 "本章要回答的核心问题" list. Sub-topic checklist should reference migrated sub-folders via `[./<subfolder>/README.md]()` links, with the migrated sub-folder names as listed in the table.

**Step 6.2: Commit each chapter README + new sub-folder skeletons separately**

```bash
cd /Users/dqh/CCProject/me/data-travel
git add 02-data-science
git commit -m "docs(Ch2): rewrite data science chapter with persona mapping (R2)"

git add 03-data-stack
git commit -m "docs(Ch3): rewrite data-stack chapter with persona mapping (R4)"

git add 04-data-assetization
git commit -m "docs(Ch4): rewrite data-assetization chapter with persona mapping"

git add 05-agent-platform
git commit -m "docs(Ch5): rewrite agent-platform chapter with persona mapping (职责①)"

git add 06-multi-model
git commit -m "docs(Ch6): rewrite multi-model chapter with persona mapping (职责③)"

git add 07-agent-evolution
git commit -m "docs(Ch7): rewrite agent-evolution chapter with persona mapping (职责④)"

git add 08-ai-governance
git commit -m "docs(Ch8): rewrite ai-governance chapter with persona mapping (职责⑥)"

git add 09-data-intelligence-product
git commit -m "docs(Ch9): rewrite data-intelligence-product chapter with persona mapping (R5)"

git add 10-industry-agent
git commit -m "docs(Ch10): rewrite industry-agent chapter with persona mapping (职责⑤)"
```

### Task 7: 改写 11/12/13/14/15 章节 README（重命名后的）

**Files:**
- Modify: `11-cross-cutting/README.md`
- Modify: `12-architecture/README.md`
- Modify: `13-decision/README.md`
- Modify: `14-leadership/README.md`
- Modify: `15-case-studies/README.md`

**For each chapter:**
- Replace `# Ch<N> · title` to match new chapter number + name
- Update cross-reference paths (`../06-.../` → `../11-.../` etc.)
- Add **画像映射** section
- Update **核心问题** and **子主题列表** per spec §5

**Specific mappings:**

| Old chapter | New chapter | 画像映射 |
| --- | --- | --- |
| `06-cross-cutting-engineering` | `11-cross-cutting` | 横切能力（质量/可观测/成本/安全） — 三角色通用 |
| `07-architecture-and-reliability` | `12-architecture` | R6 高并发 + TB 级 + 分布式 + 微服务 |
| `08-decision-and-tradeoff` | `13-decision` | 决策能力（ADR / 选型 / 技术战略） |
| `09-team-and-leadership` | `14-leadership` | 加分项：5 人以上团队管理 |
| `10-case-studies` | `15-case-studies` | R8 行业经验：半导体/制造/金融/互联网 AI 智能体平台案例 |

**Step 7.1: For each renamed chapter, replace README.md**

Use Write tool for each chapter's `README.md` with new content. Keep existing structure but update:
- Title to new chapter number
- All `../07-...`/`../08-...` etc. paths to new path
- Add 画像映射 section
- Update 核心问题 from spec §5

**Step 7.2: Commit each chapter README separately**

```bash
cd /Users/dqh/CCProject/me/data-travel
git add 11-cross-cutting
git commit -m "docs(Ch11): rewrite cross-cutting chapter with persona mapping"

git add 12-architecture
git commit -m "docs(Ch12): rewrite architecture chapter with persona mapping (R6)"

git add 13-decision
git commit -m "docs(Ch13): rewrite decision chapter with persona mapping"

git add 14-leadership
git commit -m "docs(Ch14): rewrite leadership chapter with persona mapping"

git add 15-case-studies
git commit -m "docs(Ch15): rewrite case-studies chapter with persona mapping (R8)"
```

### Task 8: 改写 00-introduction/README.md

**Files:**
- Modify: `00-introduction/README.md`

**Step 8.1: Replace the file with new content that includes:**
- New **目标画像** section (6 大职责 + 8 大要求 + 加分项, condensed from spec §2)
- New **能力地图** Mermaid showing 4 能力域 + 4 横线
- Updated **难度梯度表** (含新推荐角色 + 前置章节)
- Updated **阅读路径** (4 类读者：AI 智能体架构师 / 数据科学家 / 数据架构师 / 团队负责人)
- Updated **术语表** (新增 AI 相关术语：智能体 / 向量数据库 / RAG / LLM / 多模型编排 / AI 资产沉淀 / 等保 2.0/3.0)

**Step 8.2: Commit**

```bash
cd /Users/dqh/CCProject/me/data-travel
git add 00-introduction
git commit -m "docs(intro): rewrite introduction with target persona + 4-domain map

Add 目标画像 (extracted from job posting), 能力地图 mermaid with 4
能力域 (数据基础 / AI 平台 / AI 应用 / 横切与软技能) + 4 横线,
4 reader profiles, and AI-era terms in glossary.

Refs: docs/superpowers/specs/2026-10-08-data-architect-restructure.md §5 Ch0"
```

### Task 9: 改写根 README.md

**Files:**
- Modify: `README.md`

**Step 9.1: Replace root `README.md` with new content**

Per spec §6 (根 README 内容结构), include:
1. **项目定位**：AI 时代数据架构师的开源书
2. **目标画像**：6 大职责 + 8 大要求 + 加分项
3. **目录速览** (表格，17 行: 00 + Ch1-Ch15 + 99)：核心问题 + 难度
4. **阅读路径**：4 类读者
5. **章节导图**：Mermaid 全景图
6. **横切主题索引**：4 条横线的主要承载章节
7. **辅助资源**：docs/career/, docs/interview/, docs/superpowers/specs/, docs/superpowers/plans/
8. **术语表**：超链接到 `00-introduction/README.md#术语表`
9. **写作约定**：引用规范、目录命名、文件命名、提交规范
10. **贡献指南**：如何新增章节 / 提交勘误
11. **许可**：Apache License 2.0
12. **作者与联系方式**

**Step 9.2: Commit**

```bash
cd /Users/dqh/CCProject/me/data-travel
git add README.md
git commit -m "docs(root): rewrite root README with AI-era persona positioning

Replace data-architect capability-layer framing with AI-era data
architect (AI 智能体平台架构师) persona-derived framing.
17-row directory table, 4 reader paths, new Mermaid, 4 横切索引.

Refs: docs/superpowers/specs/2026-10-08-data-architect-restructure.md §6"
```

---

## Phase C: 跨章引用修复（任务 10-11）

### Task 10: 扫描并修复失效的跨章引用

**Files:**
- Modify: any `README.md` under all chapter sub-folders whose `../README.md` link broke

**Step 10.1: Find all README.md with cross-chapter links to old paths**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
grep -rl "06-cross-cutting-engineering\|07-architecture-and-reliability\|08-decision-and-tradeoff\|09-team-and-leadership\|10-case-studies" --include="README.md" | head -50
grep -rl "02-storage\|03-compute\|04-data-mesh-and-middleware\|05-ai-native-data-stack" --include="README.md" | head -50
```
Expected: many hits in sub-folder READMEs that referenced old chapter paths in their 章节定位 / 前置章节 sections.

**Step 10.2: For each broken link, fix the path**

Common fixes:
- `[../../old-path]/` → `[../../new-path]/`
- `[../old-path/]/` → `[../new-path/]`

Use Edit tool with replace_all=true for each old-path → new-path mapping:
- `../06-cross-cutting-engineering/` → `../11-cross-cutting/`
- `../07-architecture-and-reliability/` → `../12-architecture/`
- `../08-decision-and-tradeoff/` → `../13-decision/`
- `../09-team-and-leadership/` → `../14-leadership/`
- `../10-case-studies/` → `../15-case-studies/`

Note: Most sub-folder READMEs use `../README.md` (relative to parent chapter dir) and that link is **already correct** because they refer to their own parent chapter. So in most cases only the **章定位** blockquote text needs updating (which contains a hardcoded path).

**Step 10.3: Replace hardcoded chapter references in sub-folder 章节定位 blockquotes**

For each sub-folder `README.md`, find the blockquote:
```
> 本节是 **[Ch<N> · <title>](../README.md)** 的子章节
```
Update the `Ch<N>` and `<title>` to match the new chapter:

For example, after Task 6 `03-data-stack` receives `data-warehouse` (originally from `02-storage`), its `README.md` may say:
```
> 本节是 **[Ch2 · 存储范式](../README.md)** 的子章节
```
This must become:
```
> 本节是 **[Ch3 · 数据全栈基础设施](../README.md)** 的子章节
```

Run a sed-based replacement script (be specific about each source→destination):

```bash
cd /Users/dqh/CCProject/me/data-travel

# 02-storage sub-folders → mostly moved to 03-data-stack or 04-data-assetization
# Use file path to infer the new chapter
for f in $(grep -rl 'Ch2 · 存储范式\|Ch3 · 计算范式\|Ch4 · 数据中台与服务化\|Ch5 · AI 原生数据栈\|Ch6 · 横切工程\|Ch7 · 架构与高可用\|Ch8 · 决策与权衡\|Ch9 · 团队管理与领导力\|Ch10 · 案例库' --include='README.md'); do
  # Determine new chapter from file location
  case "$f" in
    03-data-stack/*) sed -i '' 's/Ch2 · 存储范式/Ch3 · 数据全栈基础设施/g; s/Ch3 · 计算范式/Ch3 · 数据全栈基础设施/g' "$f" ;;
    04-data-assetization/*) sed -i '' 's/Ch2 · 存储范式/Ch4 · 数据资产化与智能检索/g; s/Ch4 · 数据中台与服务化/Ch4 · 数据资产化与智能检索/g; s/Ch5 · AI 原生数据栈/Ch4 · 数据资产化与智能检索/g' "$f" ;;
    02-data-science/*) sed -i '' 's/Ch5 · AI 原生数据栈/Ch2 · 数据科学与算法/g' "$f" ;;
    05-agent-platform/*) sed -i '' 's/Ch5 · AI 原生数据栈/Ch5 · AI 智能体平台架构/g' "$f" ;;
    06-multi-model/*) sed -i '' 's/Ch5 · AI 原生数据栈/Ch6 · 多模型编排与工具调用/g' "$f" ;;
    08-ai-governance/*) sed -i '' 's/Ch5 · AI 原生数据栈/Ch8 · AI 治理与安全/g; s/Ch4 · 数据中台与服务化/Ch8 · AI 治理与安全/g' "$f" ;;
    09-data-intelligence-product/*) sed -i '' 's/Ch4 · 数据中台与服务化/Ch9 · 数据智能产品/g; s/Ch5 · AI 原生数据栈/Ch9 · 数据智能产品/g; s/Ch3 · 计算范式/Ch9 · 数据智能产品/g' "$f" ;;
    10-industry-agent/*) sed -i '' 's/Ch5 · AI 原生数据栈/Ch10 · 行业智能体/g' "$f" ;;
    11-cross-cutting/*) sed -i '' 's/Ch6 · 横切工程/Ch11 · 横切工程/g' "$f" ;;
    12-architecture/*) sed -i '' 's/Ch7 · 架构与高可用/Ch12 · 架构与高可用/g' "$f" ;;
    13-decision/*) sed -i '' 's/Ch8 · 决策与权衡/Ch13 · 决策与权衡/g' "$f" ;;
    14-leadership/*) sed -i '' 's/Ch9 · 团队管理与领导力/Ch14 · 团队管理与领导力/g' "$f" ;;
    15-case-studies/*) sed -i '' 's/Ch10 · 案例库/Ch15 · 案例库/g' "$f" ;;
  esac
done
```

**Step 10.5: Verify no stale chapter names remain**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
grep -r "Ch2 · 存储范式\|Ch3 · 计算范式\|Ch4 · 数据中台\|Ch5 · AI 原生\|Ch6 · 横切\|Ch7 · 架构与高可用\|Ch8 · 决策与权衡\|Ch9 · 团队管理\|Ch10 · 案例库" --include='README.md'
```
Expected: no output (or only intentional historical references)

**Step 10.6: Commit fixes**

```bash
cd /Users/dqh/CCProject/me/data-travel
git add -A
git commit -m "fix(refs): update cross-chapter references in sub-folder chapter blocks

Update 章节定位 + 前置章节 references in sub-folder READMEs to
match new chapter numbering (00+Ch01+...+Ch15+99) per
docs/superpowers/specs/2026-10-08-data-architect-restructure.md"
```

### Task 11: 终检（结构验证 + 内容一致）

**Step 11.1: Verify directory structure matches spec §4**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
ls -d */ | sort
diff <(ls -d */ | sort) <(echo "00-introduction/
01-modeling/
02-data-science/
03-data-stack/
04-data-assetization/
05-agent-platform/
06-multi-model/
07-agent-evolution/
08-ai-governance/
09-data-intelligence-product/
10-industry-agent/
11-cross-cutting/
12-architecture/
13-decision/
14-leadership/
15-case-studies/
99-outro/")
```
Expected: no diff

**Step 11.2: Verify every chapter has README.md + assets dirs**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
for d in 00-introduction 01-modeling 02-data-science 03-data-stack 04-data-assetization 05-agent-platform 06-multi-model 07-agent-evolution 08-ai-governance 09-data-intelligence-product 10-industry-agent 11-cross-cutting 12-architecture 13-decision 14-leadership 15-case-studies 99-outro; do
  test -f "$d/README.md" && test -d "$d/images" && test -d "$d/code" && test -d "$d/attachments" && echo "OK $d" || echo "FAIL $d"
done
```
Expected: all 17 lines say `OK`

**Step 11.3: Verify no broken links in main README files**

Run:
```bash
cd /Users/dqh/CCProject/me/data-travel
# Check root README references
grep -oE '\]\([^)]+\)' README.md | sort -u
# Manually verify each exists (no broken links)
```

**Step 11.4: Commit if any final fixes were made**

```bash
cd /Users/dqh/CCProject/me/data-travel
git add -A
git status
# If anything changed:
git commit -m "docs(structure): final cleanup after restructure verification"
```

**Step 11.5: Mark plan complete**

Append to the plan file (this file):
```markdown

---

## Restructure-plan executed

This plan was executed on YYYY-MM-DD as part of the AI-era data
architect restructure. See git log for full commit history.
```

And commit:
```bash
git add docs/superpowers/plans/2026-10-08-data-architect-restructure.md
git commit -m "docs(plan): mark restructure plan as executed"
```

---

## Self-Review Notes

- **Spec coverage**: §2 画像 → Tasks 5-7 (画像映射 sections in every chapter); §4 目录骨架 → Tasks 1-4 (物理目录); §6 README 提纲 → Tasks 5-9 (README 重写); §7 命名约定 → enforced via per-task paths.
- **Scope check**: 不写子节正文（principles.md / architecture.md）；不改 docs/career/ docs/interview/（后续单独 PR）；不构建站点（保留纯 Markdown）。All in line with spec §9.
- **Test strategy**: 由于是 docs-only 仓库，测试 = 验证（目录结构 + 引用完整性 + 文件存在性）。Tasks 11.1-11.3 implement this.
- **Commit granularity**: One commit per logical unit (per chapter rewrite, per rename batch). Allows reviewer-friendly rollback.
- **Risks**:
  - Sub-folder README 内部 `../README.md` 链接仍然有效（因为它们指向父章的 README，move 不影响）
  - sed 替换需要小心测试；如失败用 Edit 工具逐个修复
  - 根 README 中的「上一版本 SUPERSEDED」指针需保留指向 `2026-09-30-data-services-book-design.md`

---

## Restructure-plan executed

This plan was executed on 2026-10-08 as part of the AI-era data
architect restructure. See git log for full commit history.