> 本文件是 **01-ai-compute.md** 的子文件（§8. 面试真题集）。完整章节请回到 [index](01-ai-compute.md)。

## 8. 面试真题集

> 本节整合自《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）题库与公开工业实践，按"AI 算力全景视图 → 六大主题分题 → 本章小结"组织。每题沿用五段式：**考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料**。参考案例优先引用 OpenAI / Anthropic / DeepMind / Meta / Google (TPU) / Microsoft / Amazon (Trainium) / NVIDIA (MIG) / 阿里 (PAI 灵骏) / 字节 (ByteFSDP) / 华为 (昇腾) / 寒武纪 / 智谱 / 月之暗面 / 阶跃等头部企业与芯片厂商的公开架构实践。

---

### 8.1 全景视图

| 主题 | 题号范围 | 收录题数 | 难度区间 | 在 AI 算力能力域中的角色 |
| --- | --- | :---: | :---: | --- |
| GPU / MIG 虚拟化与算力池化 | §9.1.1 | 1 | ★★★★☆ | 资源底座 |
| 大模型分布式训练（DDP / TP / PP / ZeRO） | §9.1.2 | 1 | ★★★★★ | 训练主线 |
| LLM 推理优化（PagedAttention / 量化 / 投机解码） | §9.1.3 | 1 | ★★★★★ | 推理主线 |
| AI 算力调度（Gang / 拓扑感知 / 混部） | §9.1.4 | 1 | ★★★★☆ | 工程枢纽 |
| 算力成本治理（FinOps for AI / Serverless） | §9.1.5 | 1 | ★★★★☆ | 商业可持续 |
| 国产化算力适配（昇腾 / 寒武纪 / 海光） | §9.1.6 | 1 | ★★★★☆ | 合规与供应链 |

---

### 8.2 §9.1 AI 算力核心主题

> 本节围绕「AI 算力」从资源底座、训练/推理主线、工程枢纽到成本与合规的六大主题。面试官通常从「GPU 虚拟化与池化」切入，下钻到「分布式训练 / 推理优化」两条主线，再深入到「调度与成本治理」的工程化能力，并最终落到「国产化适配」的合规与供应链议题。题号沿用原题库编号体系，便于读者回溯。

---

#### §9.1.1 在 GPU 集群中，如何通过 MIG（Multi-Instance GPU）与算力池化把单卡利用率从 30% 提升到 70%+？虚拟化、Time-Slicing、MIG 三种方案的边界是什么？

> 注：题干中「单卡利用率从 30% 提升到 70%+」为面试官的提问设定，用于框定讨论范围；本节正文只给方向性结论，不对该数字作可溯源背书。

**1. 考察点**

- 是否理解 GPU 利用率低的**根因**——不是「卡不够」，而是「显存与算力被独占式分配，小任务把大卡浪费掉」。
- 能否区分**硬件层切分**（MIG / MPS）、**驱动层切分**（CUDA MPS / vGPU）、**应用层切分**（Time-Slicing / rGPU）三种粒度，并说清各自的隔离性边界。
- 是否知道 MIG 的**硬约束**——A100 最多 7 个实例、H100 最多 7 个、Blackwell B200/GB200 域级 NVL72 互联打破单卡限制——以及不同实例规格（1g.5gb / 2g.10gb / 3g.20gb / 4g.20gb / 7g.40gb）的算力 / 显存配比。
- 加分项：能给出具体场景的算力配比案例（如 LLM 推理 7B/13B/70B 在 MIG 实例上的承载）。

**2. 参考答案框架**

**第一层：先定义问题——为什么 GPU 利用率长期偏低。** 核心矛盾是「**独占式分配 + 显存即上限 + 算力峰值与均值差距大**」三件套：

- 一张 H100 80GB，被某个 7B 推理进程独占，显存只用了 30%，但其他任务拿不到这张卡——结果「卡空闲、人排队」。
- 训练任务的算力峰值集中在前向 / 反向，IO / 通信阶段空载；推理任务的算力峰值集中在 Prefill，Decode 阶段空载——单卡「时间维度」的浪费也很严重。
- 加上 N 团队各自采购、调度策略各异的烟囱模式，集群利用率偏低是行业常态，头部公司（如 NVIDIA 内部、阿里 PAI、字节 ByteFSDP）的平台能把利用率推到明显更高的水平（【经验】档：本节无法给出可溯源的统一数字）。

**第二层：三种虚拟化方案的工程边界。**

| 方案 | 层级 | 隔离粒度 | 隔离性 | 适用场景 | 限制 |
| --- | --- | --- | --- | --- | --- |
| **MIG（Multi-Instance GPU）** | **硬件层** | 显存 + 算力 + 解码器 | **强**（每实例独立 SM、显存、L2 缓存分区） | 生产级多租户推理、小模型并发训练 | 必须是 Ampere 架构（A100/A30）+ 专属驱动；H100 同样支持；最多 7 个实例；不支持 MIG 实例间 NVLink 全速互联 |
| **CUDA MPS（Multi-Process Service）** | **驱动层** | 仅算力（SM 时间片） | **弱**（显存共享，靠应用自管理；故障会全网段崩溃） | 同任务内多进程（小模型多 stream / 多实验并行） | 不隔离显存；进程崩溃影响整个 GPU |
| **Time-Slicing（rGPU / vGPU）** | **应用层** | 时间片 | **最弱**（多个任务轮流占用整卡，零算力隔离） | PoC、调试、Notebook 共享 | 显存仍独占；本质上没解决显存浪费 |

**第三层：MIG 的工程细节。** 以 NVIDIA A100 40/80GB 为例：

- **实例规格**（Compute Instance）：1g.5gb（5GB 显存，1/7 算力）、2g.10gb、3g.20gb、4g.20gb、7g.40gb（独占整张卡）。每实例独立 SM、独立 L2 缓存分区、独立显存。
- **配置工具**：`nvidia-smi mig -i 0 -cgi 3g.20gb,3g.20gb` 创建 2 个 3g.20gb 实例；`nvidia-smi mig -dci` 删除实例；`nvidia-smi mig -lgi` 查看实例。
- **K8s 集成：通过 NVIDIA Device Plugin with MIG，`nvidia.com/mig-1g.5gb: 1` 这种 extended resource 调度**。
- **H100 升级**：H100 在 MIG 基础上支持 **MIG-GPU**（Multi-Instance GPU）与 **Multi-Process Service** 双模式；Blackwell B200/GB200 通过 NVL72 机柜级互联，单实例可横跨 72 卡，单卡 MIG 仍然有效但**域级（Domain）**成为新的切分单位。

**第四层：池化的工程闭环——从「卡」到「算力」。** 把 GPU 池化的关键不只是切分，而是「**池子 + 调度 + 计量**」三件套：

- **池子**：Volcano / KubeRay 把物理卡抽象为可切分资源池；MIG 实例、CPU、内存、RDMA 网络拓扑都进入资源画像。
- **调度**：Gang Scheduling（分布式训练必须 N 卡同时启动）+ 拓扑感知（同节点 > 同机柜 > 跨机柜）+ 抢占式调度（P0 任务可抢占 P2）。
- **计量**：按 MIG 实例 × 时长 × 显存容量计费，让「谁用了多少」可追溯、可优化。

**第五层：工业实证。** **NVIDIA 内部**用 MIG 把 H100 切成多个隔离实例、每个实例跑独立推理任务，整卡利用率显著高于独占式分配。**阿里云 PAI 灵骏**提供 GPU 池化能力，支持 MIG + 拓扑感知调度，把万卡集群利用率推到明显更高的水平。**字节 ByteFSDP** 配套自研调度器，把推理 GPU 利用率抬升一个台阶。**AWS EC2 / Neuron** 用 Trainium + Inferentia 配合软件层池化，把自研芯片的实例成本压到明显低于 NVIDIA 同规格。以上四条是方向性结论——**具体利用率与成本降幅随负载结构、抢占策略与计费口径而异，本节无法给出可溯源的统一数字（【经验】档）**。

**3. 常见陷阱**

- **把 Time-Slicing 当成 MIG。** 二者粒度完全不同——Time-Slicing 是「轮流用整卡」，MIG 是「同时独立用部分卡」。前者没有真正的并行，后者是真正的并行。
- **忽略 MIG 不支持 NVLink 跨实例互联。** 训练任务如果用 MIG 切 7 个实例，跨实例通信会退化为 PCIe，**张量并行跑在 MIG 上是反模式**——这是把 MIG 用错的最大陷阱。
- **认为「切得越细越好」。** 切得越细，单实例算力越弱——1g.5gb 实例只能跑 7B 量化后的推理，跑不动训练。**切分粒度必须匹配工作负载**。
- **忽略驱动 / 内核版本约束。** MIG 必须在 NVIDIA 专有驱动下启用，且 K8s Device Plugin 必须明确开启 MIG 模式——很多团队「卡不支持 MIG」其实是「没启用 MIG profile」。
- **不区分 MIG 与 MPS。** MPS 只切算力不切显存，对显存敏感的多任务并发场景没有帮助。

**4. 追问预测**

- **「MIG 切分后，监控怎么做？」** 答：用 **DCGM Exporter** 按 MIG 实例采集利用率（`DCGM_FI_DEV_GPU_UTIL` 按 instance 维度），Prometheus 抓取后 Grafana 按团队 / 项目展示——这是把「按卡计费」落到「按 MIG 实例计费」的前提。
- **「7B 推理跑在 1g.5gb 实例上能撑多少 QPS？」** 答：vLLM + AWQ INT4 量化 + Continuous Batching，单实例 1g.5gb 大约 5-15 QPS（512 token 输出）；切 4g.20gb 实例可达 30-60 QPS（【经验】档：QPS 随模型、量化方式、上下文长度与并发请求分布大幅变化，本节无法给出可溯源的统一数字）——选规格的关键是「并发请求数 × 单请求 token 数 × 模型规模」。
- **「H100 MIG 和 A100 MIG 有什么差别？」** 答：H100 增加 **MIG-GPU**（每实例独占 PCIe 通道）、**Confidential Computing**（机密计算）、**Sparsity-Aware**（稀疏加速）；Blackwell B200 支持 **MIG + 软件定义可分片**（动态调整实例规格）。
- **「国产卡支持 MIG 吗？」** 答：华为昇腾 910C 通过 **CANN 软件栈**提供「**虚拟 NPU**」（类似 MIG）；寒武纪思元 590 提供 **MLU 虚拟化**；海光 DCU 兼容 CUDA 生态，可借助 `cGPU`（阿里自研）做软件层虚拟化。但成熟度与生态远不及 NVIDIA MIG。

**5. 参考资料**

- NVIDIA 官方文档《Multi-Instance GPU User Guide》——MIG 的权威定义与配置指南。
- NVIDIA DCGM Exporter 项目文档——GPU 与 MIG 实例级监控的开源实现。
- 阿里云 PAI 灵骏公开技术材料——国产 GPU 池化与拓扑感知调度的代表。
- 字节跳动 ByteFSDP 团队公开演讲——大模型分布式训练与 GPU 调度协同优化的工业实证。
- **Meta Llama 3.1 405B 训练集群** —— 405B 训练用的是万卡级 H100 集群（Meta Llama 3.1 技术报告给出的并行配置为 TP=8 × PP=16 × DP=128，约 1.6 万卡；Meta 另在 2024 年公布过「两个 24K GPU 集群」的基础设施公告，与本次训练的并行配置不是同一件事，引用时请对照报告核验），是开源 LLM 最大规模训练集群的典范。训练集群的网络与并行配置、推理服务的 MIG 池化是两套体系，本节无法给出可核验的推理侧利用率数字。
- **阿里 PAI 推理服务** —— 把 H100 切成隔离的 MIG 实例跑 Qwen 2.5 系列推理，是国产 LLM 推理池化的代表（单实例 QPS 与集群整体利用率随模型规格、量化方式与请求分布而异，本节无法给出可溯源的统一数字，【经验】档）。
- **AWS Trainium / Inferentia 推理池化** —— 自研芯片 + Neuron SDK + vGPU 软件层池化，单位算力成本低于 NVIDIA 同规格（【经验】档：具体降幅随实例类型、区域与是否 Spot 而异，本节无法给出可溯源的统一数字）。
- **Google TPU v5p Pod** —— 通过 **Multislice**（多切片互联）实现「跨机柜级」切分，4096 芯片级 Pod 是 TPU 路线对 MIG 的回应（其训练利用率本节无法给出可核验的数字）。
- **CoreWeave GPU 云** —— 2024 年估值 190 亿美元，专门做 AI 优化的 GPU 云，NVIDIA 投资；用 MIG + 自研调度支撑 OpenAI / Mistral / Cohere 等头部 AI 公司。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §9.1.2 千亿参数大模型训练时，如何选型数据并行（DDP）/ 张量并行（TP）/ 流水并行（PP）/ ZeRO / FSDP？请说明 Meta Llama 3.1 405B 是怎么组合的，以及为什么？

**1. 考察点**

- 是否理解分布式训练的**核心矛盾**——显存容量、通信带宽、同步开销三者不可同时最优。
- 能否说清 DDP / TP / PP / ZeRO / FSDP 五种并行策略的**适用边界**，以及 **3D 并行（TP + PP + DDP）**的组合逻辑。
- 是否知道 Meta Llama 3.1 405B 的真实工程参数——约 1.6 万张 H100（TP=8 × PP=16 × DP=128）、54 天训练、3D 并行 + FSDP 混合。
- 加分项：能解释 MoE（Mixtral / DeepSeek V3）对分布式训练提出的新挑战——专家并行 + 通信拓扑。

**2. 参考答案框架**

**第一层：先定义问题——千亿模型的显存压力。** 405B 参数的 Llama 3.1，训练阶段需要存储的参数 / 梯度 / 优化器状态总量：

- **参数（FP16）**：405B × 2 byte = 810 GB。
- **梯度（FP16）**：405B × 2 byte = 810 GB。
- **优化器状态（AdamW：FP32 主权重 + 一阶 + 二阶动量）**：405B × 12 byte = 4.86 TB。
- **激活值（Activation）**：依 batch size 与 sequence length，典型 1-5 TB。
- **总计**：**7-12 TB（全模型口径，不是单卡需求）**——单卡 H100 80GB 完全无法承载，这正是必须做切分的原因。

所以「分布式训练」不是为了「跑得更快」，本质上是为了「**单卡装不下**」。

**第二层：五种并行策略的工程边界。**

| 策略 | 切分对象 | 通信开销 | 显存节省 | 适用边界 | 限制 |
| --- | --- | --- | --- | --- | --- |
| **DDP（Data Parallel）** | 数据 batch | AllReduce 梯度 | 不省显存（每卡全模型） | 模型 < 单卡显存（典型 < 13B） | 模型大了放不下 |
| **TP（Tensor Parallel）** | 单层参数（矩阵切分） | AllGather / ReduceScatter 每层 | 显存减少 N 倍（卡数） | 单层大（>10B）或 NVLink 强互联 | 跨机通信瓶颈；常限制单机 8 卡 |
| **PP（Pipeline Parallel）** | 模型层（stage） | 点对点 Send/Recv | 显存减少 N 倍（stage 数） | 模型深（>50 层）或层间大 | 流水线气泡（bubble）；负载不均 |
| **ZeRO-1/2/3** | 优化器状态 / 梯度 / 参数 | AllGather 按需 | 节省 3-4 倍（ZeRO-3 等价 FSDP） | 模型 13B-200B + 显存不足 | 通信量增加；小模型反而慢 |
| **FSDP（Fully Sharded Data Parallel）** | 参数 + 梯度 + 优化器状态（全分片） | AllGather 通信 | 等价 ZeRO-3 | 模型 13B-500B | 与 TP / PP 组合复杂 |

**第三层：3D 并行的组合逻辑。** 千亿模型的标准组合是 **TP + PP + DP（DDP）**：

- **TP（张量并行）**：在单机 8 卡内做张量切分，利用 NVLink / NVSwitch 高速互联。每卡分 1/8 张量，通信走 NVLink（900 GB/s），开销可接受。
- **PP（流水并行）**：把模型按层切分到多机（如 8-16 stage），用 micro-batch 流水线填满气泡。前向 / 反向像流水线，前 stage 算完第一个 micro-batch 就传给下一 stage。
- **DP（数据并行）**：把 TP+PP 整体作为一组，复制多组（如 16A / 32A），跑不同 batch 数据。组间 AllReduce 梯度同步。

**以 Llama 3.1 405B 为例的并行配置（Meta Llama 3.1 技术报告口径；本书无法给出该报告的可核验链接，引用时请对照技术报告自行查证）**：
- **硬件**：约 16,384 张 H100，RoCE 网络互联。
- **并行策略**：TP=8（单机 8 卡）+ PP=16（16 stage）+ DP=128（16384/8/16）。
- **优化**：FSDP 进一步分片优化器状态、混合精度（FP16/BF16）、Activation Checkpointing（用计算换显存）、Async Checkpoint 保存到并行文件系统。
- **训练时长**：54 天（实际可能更长，包含调试与重启）。
- **关键工程**：Checkpoint 周期性保存到并行文件系统（原题口径写作 GPFS，本节无法核验该文件系统型号）；断点续训时间可控；RoCE 网络调优让 NCCL 通信效率保持在高位（保存间隔、恢复时长与通信效率的具体数字本节无法核验，【经验】档）。

**第四层：ZeRO / FSDP 的进一步优化。** ZeRO 把优化器状态（ZeRO-1）、梯度（ZeRO-2）、参数（ZeRO-3）逐级分片到 DP 维度——ZeRO-3 等价 FSDP 的全分片，**显存节省近 N 倍**（N 为 DP 数）。代价是通信量增加（每个 step 多一次 AllGather）。对 70B-200B 模型，FSDP + TP + Activation Checkpointing 是主流组合。

**第五层：MoE 与新挑战。** DeepSeek V3（671B 总参 / 37B 激活）、Mixtral 8×7B 等 MoE 模型给分布式训练提出新问题：

- **专家并行（Expert Parallel, EP）**：把 256 个专家分散到不同卡，token 通过 All-to-All 路由到对应专家卡。
- **通信模式**：All-to-All（每 token 可能去任意专家），与 TP 的 AllGather / ReduceScatter 不同。
- **负载均衡**：专家热度不均，需要 **Expert Parallelism Load Balancing** 调度器动态调整。

**工业实证**：**Meta Llama 3.1 405B** —— 万卡级 H100（TP=8 × PP=16 × DP=128）+ 3D 并行 + FSDP + 54 天训练，是开源 LLM 的标杆。**DeepSeek V3** —— 自研 DualPipe + Expert Parallel + FP8 混合精度，训练 2.788M H800 小时，成本 550 万 USD（极低）。**阿里 PAI 通义千问 Qwen 2.5** —— 万卡 H100/A100 + 3D 并行 + 自研 FSDP 实现。**Anthropic Claude 3.5 / 3.7** —— 训练集群规模未公开；有公开讨论认为其算力含数十万 H100 + Trainium 组合，本节未定位到具体文档与年份，无法核验。**Google Gemini 1.5 / 2.0** —— 用 TPU v5p Pod + Multislice 训练，规模到数千芯片级（其利用率数字本节无法核验）。

**3. 常见陷阱**

- **混淆 DDP 与 TP。** DDP 是「**每卡一份完整模型 + 切数据**」，TP 是「**切模型 + 协同算**」。前者卡间通信是 AllReduce 梯度，后者每层都要 AllGather / ReduceScatter。
- **以为 PP 越多越好。** PP 的气泡开销与 stage 数相关——stage 越多，气泡越大。**经验值**：PP stage 数 ≤ 模型层数 / 10。
- **忽略 NVLink 拓扑。** 张量并行必须跑在 NVLink 域内（单机 8 卡），跨机做 TP 通信瓶颈严重，**TP 通常限制单机**。
- **盲目用 FSDP 加速小模型训练。** FSDP 对 7B 模型反而比 DDP 慢，因为额外通信开销。**FSDP 适合 13B+ 模型**。
- **混淆 ZeRO-3 与 FSDP。** 二者本质等价，但 FSDP 是 PyTorch 原生（与 torch.compile / Dynamo 集成更好），ZeRO-3 是 DeepSpeed 实现（生态成熟、调参灵活）。
- **MoE 模型用 TP 切专家。** MoE 专家并行是 **All-to-All**，不是 TP 的 AllGather——必须用专门的 MoE 训练框架（DeepSpeed-MoE / Megatron-Core + 专家并行）。

**4. 追问预测**

- **「70B 模型训练最少需要多少卡？」** 答：用 FSDP + TP=8 + Activation Checkpointing，单机 8 卡 H100 80GB 可以启动训练（batch size 1），但效率低；推荐 **2-4 机 16-32 卡**做 TP×DP，性能最优。
- **「3D 并行的最优配比怎么定？」** 答：先确定总卡数 N，再分三层：(1) TP 受 NVLink 限制为 8（单机）；(2) PP 受气泡约束为 4-16（看模型深度，70B 通常 8 stage）；(3) DP = N / (TP × PP)。Llama 405B：TP=8 / PP=16 / DP=128 = 16384 卡（按 Meta Llama 3.1 技术报告的并行配置口径，引用时请对照报告核验）。
- **「断点续训（Resume Training）怎么做？」** 答：保存 **DDP 状态**（model + optimizer + scheduler + step + dataloader state）+ **PP 切分位置** + **FSDP 分片 metadata** 到并行文件系统（GPFS / JuiceFS），每 N 步保存一次，加载时必须用相同并行配置。Meta Llama 405B 的公开工程细节提到高频率的周期 Checkpoint（本节无法核验其保存间隔与恢复时长的具体数字）。
- **「通信瓶颈怎么诊断？」** 答：用 **NSight Systems / NCCL Debug** 看 AllReduce / AllGather 时间占比；若超过 30%，意味着通信是瓶颈，方案：换 NVLink / InfiniBand、检查 NCCL 版本、减少 PP / TP 规模。
- **「MoE 训练和 Dense 训练的关键区别？」** 答：MoE 多一层 **All-to-All 专家路由** + **负载均衡**（专家热度不均），通信模式从 TP 的点对点变成跨卡全互联；DeepSeek V3 的 DualPipe 把 All-to-All 与 TP/PP 通信重叠，显著提高通信与计算的并行度（【经验】档：具体倍数随集群拓扑与规模而异，本节无法给出可溯源的统一数字）。

**5. 参考资料**

- Meta AI《Llama 3.1 405B 技术报告》（公开版）——万卡级 H100（TP=8 × PP=16 × DP=128）+ 3D 并行 + FSDP 的完整工程细节，是本题最权威的工业案例。
- Microsoft DeepSpeed 官方文档与 DeepSpeed-MoE 仓库——ZeRO-1/2/3 + MoE 训练的工业实现。
- NVIDIA Megatron-LM 仓库——张量并行 + 流水并行的标准实现，是 TP/PP 的权威参考。
- PyTorch FSDP 官方文档——FSDP 调参、Activation Checkpointing、CPU Offload 的最佳实践。
- DeepSeek V3 技术报告——MoE + FP8 + DualPipe 的极致工程优化，2.788M H800 小时训练成本仅 550 万 USD，是 MoE 训练的国产标杆。
- **阿里 PAI 通义千问 Qwen 2.5 训练** —— 万卡 H100 + 3D 并行 + 自研 FSDP，是国产 LLM 训练的代表（其单次训练成本的具体数字本节无法核验，【经验】档）。
- **Google Gemini 1.5 / 2.0** —— TPU v5p Pod + Multislice 训练 4096 芯片级，MoE 架构 + 多模态一体训练，是闭源 LLM TPU 路线的代表。
- **Anthropic Claude 3.5 / 3.7 训练** —— 训练集群规模未公开；有公开讨论认为其算力含数十万 H100 + Trainium 组合（本节未定位到具体文档与年份，无法核验），是闭源 LLM 算力规模的标杆。
- **月之暗面 Kimi K2 / 阶跃 Step-2 / 智谱 GLM-4** —— 国产闭源 / 半开源 LLM，用国产 + NVIDIA 混合集群训练，是国产 LLM 算力多元化的代表。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §9.1.3 LLM 推理服务中，PagedAttention / Continuous Batching / 投机解码（Speculative Decoding）/ INT4 量化各自的优化原理是什么？组合使用能把单卡吞吐提升多少倍？

**1. 考察点**

- 是否理解 LLM 推理的**两个阶段瓶颈**——Prefill（计算密集）vs Decode（IO/显存密集），对应不同的优化策略。
- 能否说清 PagedAttention 解决「**KV Cache 显存碎片化**」、Continuous Batching 解决「**请求内气泡**」、Speculative Decoding 解决「**串行解码**」、INT4 量化解决「**显存与算力折中**」的工程含义。
- 是否知道 vLLM / TensorRT-LLM / TGI / SGLang 等推理引擎的差异化定位。
- 加分项：能给出具体场景的优化组合案例（如 70B 模型在 H100 上 INT4 + Speculative + PagedAttention 的吞吐数据）。

**2. 参考答案框架**

**第一层：先理解 LLM 推理的两个阶段。** Transformer 自回归解码有完全不同的瓶颈：

- **Prefill 阶段**：一次处理整条 prompt（如 1024 token），算力密集——GEMM 占主导，GPU 利用率高，对延迟不敏感。
- **Decode 阶段**：逐 token 生成，每 token 都要读 KV Cache——IO / 显存带宽密集，GPU 算力利用率极低（典型在个位数到十几个百分点，【经验】档：随 batch size 与模型结构而异）。

一张 H100 80GB 跑 70B 模型（FP16）：

- 模型权重占 140 GB → 必须张量并行到 2 卡（80GB × 2 = 160GB）。
- KV Cache：每 token 占 `2 × num_layers × num_heads × head_dim × dtype_size` = 2 × 80 × 64 × 128 × 2 byte ≈ **2.5 MB / token**。
- 单请求 32k 上下文：32k × 2.5 MB ≈ 80 GB——单卡显存被 KV Cache 占满。

**第二层：四大优化技术原理。**

- **PagedAttention（vLLM，2023）**：把 KV Cache 类比 OS 虚拟内存「分页」管理——把 KV Cache 切成固定大小 page（如 16 token / page），显存按需分配，避免传统连续分配带来的内部碎片。**收益**：显存利用率从 30-40% 提升到 80%+（这两个数字本节未定位到原始出处，按【经验】档处理）；吞吐量提升 2-4 倍（vLLM 论文《PagedAttention》SOSP 2023 的口径；本节无法给出该论文的可核验链接，引用时请对照论文查证）。
- **Continuous Batching（vLLM / TGI / TensorRT-LLM）**：传统 static batching 必须等所有请求生成完才换下一批，**气泡时间占比可观（【经验】档：随请求长度分布与并发度而异）**。Continuous Batching 在每一步解码后动态插入新请求，把气泡时间基本填满，**吞吐相比 static batching 有数倍到十倍量级的提升（【经验】档量级：本节无法给出可溯源的统一数字）**。这是 LLM 推理吞吐提升最大的单项技术。
- **Speculative Decoding（投机解码）**：用小模型（如 7B）快速生成 K 个候选 token，大模型（70B）一次 verify K 个——如果接受率高，可以一次前进 K 步，**串行解码可加速数倍（【经验】档：倍数随接受率与 draft 模型质量而异，本节无法给出可溯源的统一数字）**。代表方法：EAGLE、Medusa、Lookahead Decoding、DeepMind SpecDec。
- **INT4 / FP8 量化**：把 FP16 模型量化到 INT4（AWQ / GPTQ）或 FP8（H100 原生），显存占用与算力开销明显下降（【经验】档：降幅随精度格式、模型与算子覆盖度而异，本节无法给出可溯源的统一数字）。**代价**：精度会有损失（PPL 略升，【经验】档：幅度随模型与校准数据集而异），需要校准数据集。

**第三层：组合使用的工程收益。** 以 70B 模型在单卡 H100 上推理为例（假设张量并行 2 卡 / INT4 量化 + vLLM）：

- **基线**：FP16 + static batching，约 **30 tokens/s**。
- **+ Continuous Batching**：约 **150 tokens/s**（5 倍）。
- **+ PagedAttention**：约 **300 tokens/s**（再加 2 倍）。
- **+ INT4 量化**：约 **500 tokens/s**（再加 1.7 倍，单卡可装下 70B 不用张量并行）。
- **+ Speculative Decoding**：约 **1500 tokens/s**（再加 3 倍）。

**组合优化后总收益**：从 30 tokens/s 提升到 1500 tokens/s，**单卡吞吐提升约 50 倍**（上述逐级推演均为示例口径，不是实测数字）。vLLM 一类推理引擎的公开材料也出现过同一量级的说法（本节未定位到具体文档与年份，无法核验；【经验】档：实际倍数随模型、量化方式、硬件与请求分布而异，本节无法给出可溯源的统一数字）。

**第四层：推理引擎的差异化定位。**

| 引擎 | 出品方 | 核心特性 | 适用场景 |
| --- | --- | --- | --- |
| **vLLM** | UC Berkeley | PagedAttention + Continuous Batching | 通用 LLM 推理、生产首选 |
| **TensorRT-LLM** | NVIDIA | FP8 + 算子融合 + NVIDIA GPU 深度优化 | NVIDIA GPU 极致性能 |
| **TGI（Text Generation Inference）** | Hugging Face | Rust 核心 + Continuous Batching | Hugging Face 生态集成 |
| **SGLang** | UC Berkeley | RadixAttention + 结构化生成 | 多轮对话 + Function Calling |
| **LMDeploy** | 上海人工智能实验室 | 国产 LLM 推理优化 + TurboMind | 国产 LLM + NVIDIA / 昇腾 |
| **DeepSpeed-MII** | Microsoft | DeepSpeed 推理优化 + 0 冗余优化器 | 微软 Azure 集成 |

**第五层：冷启动与延迟优化。** Continuous Batching 解决吞吐，但**首 token 延迟（TTFT）**和**流式延迟（ITL）**仍是用户体验关键：

- **TTFT 优化**：减少 Prefill 时间（计算密集）——用 FlashAttention、Long Context 处理（paged + sliding window）、Prompt Cache。
- **ITL 优化**：减少 Decode 时间——Speculative Decoding、Quantization、Batch Decoding。
- **冷启动优化**：Serverless Inference 场景下，首请求延迟受模型加载时间影响——用 **Persistent Container + Model Cache + Warm Pool** 把冷启动压到 < 1s。

**第六层：工业实证。** **OpenAI GPT-4o / o1** —— 闭源，疑似 Multi-model + Continuous Batching + Speculative Decoding + 自研芯片（可能含 Trainium 协处理）。**Anthropic Claude 3.5 / 3.7** —— 自研推理优化 + Trainium / H100 混合，延迟与吞吐处于第一梯队（本节无法给出可核验的对比数字，【经验】档）。**Meta Llama 3.1 405B 推理** —— 经 FP4 量化后可在少数几张卡上部署（不是单卡），vLLM 类引擎下延迟可控。**字节豆包 / 阿里通义 / 智谱 GLM-4** —— 用 vLLM / LMDeploy 国产推理引擎，单卡吞吐接近同规格闭源服务的水平（具体数字本节无法核验，【经验】档）。

**3. 常见陷阱**

- **混淆 PagedAttention 与 FlashAttention。** 前者是 **KV Cache 显存分页**（vLLM 提出），后者是 **Attention 计算 IO 优化**（Tri Dao 提出）——前者管显存，后者管算力。
- **以为 Continuous Batching 等价于 Dynamic Batching。** 传统 dynamic batching 是「batch 内所有请求同步前进」，仍有气泡；Continuous Batching 是「每个 step 独立调度，可增删请求」。
- **盲目追求量化精度损失最小。** INT4 量化损失 1-3% PPL，但业务侧 **A/B 实验**后实际业务指标差异通常远小于 PPL 的变化（【经验】档量级：随任务类型而异）——量化 ROI 通常远大于精度损失。
- **混淆 Speculative Decoding 与 Multi-Token Prediction。** 前者用独立 draft 模型，后者用主模型自身的 head——前者通用，后者只适用训练过的模型。
- **首 token 延迟只看模型加载。** 实际 TTFT = 排队 + Prefill + 启动，首请求排队可能 > 10s；必须配**请求队列 + 优先级调度**。

**4. 追问预测**

- **「Speculative Decoding 的接受率不高会怎样？」** 答：若接受率 < 50%，反而比正常解码慢——因为 draft 模型白算了。需要根据场景动态调整 draft token 数（3-10 个），或训练专用的 draft 模型（如 EAGLE 用主模型 hidden state）。
- **「INT4 量化后线上精度掉得厉害怎么办？」** 答：先用 **AWQ（激活感知权重量化）** 而非 GPTQ；保留 5-10% 「敏感层」为 FP16（**Mixed Quantization**）；在业务侧做 **A/B 实验**对比 INT4 vs FP16 实际指标；用 **QAT（Quantization-Aware Training）** 微调保持精度。
- **「MoE 模型的推理优化有什么特殊点？」** 答：MoE 推理时只有激活专家参与计算（37B 激活 / 671B 总参），KV Cache 与激活都按激活专家数算——**算力开销明显低于同规模 Dense 模型（【经验】档：幅度随激活比例与路由效率而异，本节无法给出可溯源的统一数字）**。但 All-to-All 专家路由仍是瓶颈，需要专门优化（如 SGLang 的 RadixAttention + 专家缓存）。
- **「长上下文（128k+）推理怎么做？」** 答：用 **Sliding Window Attention**（Mistral）+ **Ring Attention**（跨设备 KV Cache 分片）+ **PagedAttention**（显存分页）；避免把 128k KV Cache 全装在单卡——典型做法是按 head / layer 切到多卡。
- **「推理成本能优化到什么程度？」** 答：从基线 FP16 + static batching 到 INT4 + Speculative + PagedAttention + Continuous Batching，**单 token 成本可降低一个数量级以上**（【经验】档：降幅随模型、量化方式与请求分布而异，本节无法给出可溯源的统一数字）。国产头部 LLM 服务的自研推理优化也把单 token 成本压到明显低于同规格闭源 API 定价的水平（【经验】档：具体比值本节无法核验）。

**5. 参考资料**

- vLLM 官方论文《PagedAttention: Virtual Memory for LLM Serving》（SOSP 2023）——PagedAttention 与 Continuous Batching 的原始论文。
- Tri Dao《FlashAttention》系列论文——FlashAttention / FlashAttention-2 / FlashAttention-3 的原始论文与算子优化。
- Yaniv Leviathan 等《Speculative Decoding》论文——投机解码的原始论文。
- NVIDIA TensorRT-LLM 官方文档——FP8 + 算子融合的工业实现。
- DeepMind SpecDec 论文与 EAGLE 论文——投机解码的最新进展。
- **OpenAI GPT-4o / o1 推理** —— 闭源，工业界推理优化的天花板；用 Multi-model + Speculative + 自研芯片。
- **Anthropic Claude 3.5 / 3.7 推理** —— 自研推理优化 + Trainium / H100 混合，延迟与吞吐处于第一梯队（本节无法给出可核验的对比数字，【经验】档）。
- **Meta Llama 3.1 405B 推理** —— 用 vLLM + FP4 量化 + 2-4 卡张量并行即可部署（单卡装不下 405B，此处指多卡并行而非单卡）。
- **字节豆包推理** —— 自研 vLLM 改进版 + 量化，把单 token 成本压到明显低于同规格闭源 API 定价（【经验】档：具体比值本节无法核验）。
- **智谱 GLM-4 / 月之暗面 Kimi / 阶跃 Step-2** —— 国产闭源 / 半开源 LLM 推理平台，国产 + 国产推理引擎的代表。

> 注：以上参考资料均指向公开论文、官方文档或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §9.1.4 在万卡 GPU 集群中，如何设计 AI 算力调度器？为什么 Kubernetes 默认调度器不满足分布式训练，Gang Scheduling / 拓扑感知 / 抢占式调度各自解决什么痛点？

**1. 考察点**

- 是否理解 K8s 默认调度器对 GPU 的**根本短板**——不感知拓扑、不支持协同调度、抢占粒度粗。
- 能否说清 Volcano / KubeRay / YARN / Slurm 四大调度器的**差异化定位**与适用场景。
- 是否知道 Gang Scheduling（协同调度）、Topology-Aware Scheduling（拓扑感知）、Preemption（抢占）三大核心机制的工程含义。
- 加分项：能给出真实场景的调度参数（队列配比、抢占优先级、拓扑亲和性规则）。

**2. 参考答案框架**

**第一层：先定义问题——K8s 默认调度器为什么不够。** K8s 默认调度器对 AI 任务有三个根本缺陷：

- **不感知 GPU 拓扑**：8 卡 H100 节点的 NVLink 是内部 900 GB/s 互联，但 K8s 默认只看「几卡」，不看「这些卡是不是同一节点的同 NVLink 域」。结果 8 卡分布式训练被分配到 8 个不同节点，通信退化为跨机网络（10-100 GB/s），**训练显著变慢（【经验】档：倍数随带宽差距、并行配置与通信占比而异，本节无法给出可溯源的统一数字）**。
- **不感知协同调度**：分布式训练必须「**N 卡同时启动**」才能跑，K8s 默认调度会让「先分配到 N-1 卡、后卡永远排不到」的队头阻塞（**TCP-style deadlock-like waiting**）。
- **抢占粒度粗**：K8s 抢占是整 Pod 抢占，不能「**先抢 1 卡、保留其他 N-1 卡**」；对推理 + 训练混部场景，**整 Pod 抢占会中断线上推理**。

**第二层：四大调度器的差异化定位。**

| 调度器 | 出品 | 核心特性 | 适用场景 |
| --- | --- | --- | --- |
| **Volcano** | 华为云开源 | Gang Scheduling + Fair Share + Queue + Topology-Aware | 通用 AI / 大数据 / K8s 原生 |
| **KubeRay** | Anyscale + 社区 | Ray on K8s + Actor 调度 + 分布式训练感知 | Ray 生态 / 分布式训练 |
| **YARN** | Hadoop 原生 | Capacity Scheduler + Fair Scheduler + Label-based | 大数据 + AI 混部 / 传统大厂 |
| **Slurm** | HPC 社区 | Backfill + Topology-Aware + Multi-Cluster | 超算 / 国家级 AI 平台 / Slurm 老用户 |

**第三层：三大核心机制的工程含义。**

- **Gang Scheduling（协同调度）**：把分布式训练任务的「所有 Pod」当一个 Gang 整体调度——**要么全部分配、要么全部分配失败、不会部分分配**。Volcano 通过 `podgroup` 资源 + `minMember` 字段实现。**典型场景**：8 卡 DDP 训练，必须 8 卡同时启动，否则 NCCL 通信初始化失败。
- **Topology-Aware Scheduling（拓扑感知）**：调度时考虑 GPU 的物理拓扑（NVLink 域 / PCIe 通道 / InfiniBand 域）。Volcano / Slurm 都支持。**优先级规则**：同节点 > 同机柜 > 同可用区 > 跨可用区。**典型场景**：张量并行限制在单机 8 卡（NVLink），数据并行可跨机（InfiniBand）。
- **Preemption（抢占式调度）**：低优先级任务可被高优先级抢占。K8s 原生 `PriorityClass` + Volcano 扩展实现。**典型策略**：推理任务优先级 > 训练任务；P0 训练任务优先级 > P1 训练；被抢占任务回到队列队头，**不丢失进度**（断点续训配合）。

**第四层：典型架构——Volcano 调度 AI 任务的 4 层。**

```
[业务方提交训练任务] 
    ↓
[Volcano Queue（队列）] → 配额管理 / 公平调度
    ↓
[Volcano PodGroup（Gang）] → 协同调度 / 最小成员数
    ↓
[Scheduler Framework] → Gang / Topology / Binpack / DRF
    ↓
[Scheduler Plugin] → gpu / mig / topology / sla / capacity / overcommit
    ↓
[Node（GPU）] → NVLink 域 / InfiniBand 域 / MIG 实例
```

**第五层：混部（Co-location）的工程化。** 头部厂商的真实做法是**训练 + 推理 + 离线作业混部**：

- **训练任务**：占用整卡（或 MIG 实例），优先级 P1，可被 P0 抢占。
- **推理任务**：占用 MIG 实例（如 1g.5gb），优先级 P0，不可被抢占。
- **离线作业**：占用剩余 CPU / 内存 / 空闲 GPU 时间片，优先级 P2。
- **资源隔离**：用 **NVIDIA MPS** + **CPU Manager** + **Memory QoS** 做硬隔离，避免相互干扰。
- **调度器协同**：Volcano Queue + PriorityClass + 自研 capacity plugin 实现精细化配额。

**第六层：工业实证。** **阿里云 PAI 灵骏** —— Volcano 增强版 + 自研 topology 插件，支撑万卡集群训练，调度延迟控制在秒级。**字节 ByteFSDP / 机器学习平台** —— 自研调度器（类似 Volcano）+ Ray on K8s，训练任务排队时间在分钟级。**Google TPU v5p Pod + Multislice** —— 4096 芯片级 Pod 调度器，跨机柜协同调度，训练利用率处于高位（具体数字本节无法核验）。**Meta Llama 3.1 405B** —— 自研调度器 + 万卡级 H100 集群，调度效率处于领先水平（本节无法核验其调度效率的具体对比数字，【经验】档）。

**3. 常见陷阱**

- **把 Gang Scheduling 当成「先来先服务」。** Gang 是「**全或无**」语义，不是 FIFO。
- **忽略拓扑亲和性的代价。** 拓扑感知调度会让集群碎片化——必须配 **Binpack 策略**让碎片集中；同时配置 **Descheduler** 定期重平衡。
- **抢占不配合断点续训。** 没有断点续训的抢占 = 数据丢失；训练任务必须每 N 步保存 Checkpoint 到并行文件系统。
- **K8s 默认调度器直接用于大模型训练。** 8 卡 DDP 训练在默认 K8s 上很容易因部分 Pod 排不到而失败（【经验】档：失败概率随集群负载与队列深度而异），**必须用 Volcano / KubeRay 替换默认调度器**。
- **混部不隔离导致线上推理抖动。** 推理任务被训练干扰 → 用户感知卡顿；必须用 **MIG + 资源 QoS + cgroup 隔离**。

**4. 追问预测**

- **「Volcano 和 KubeRay 怎么选？」** 答：用 Ray 做分布式训练 / RL / 数据处理选 KubeRay；用 PyTorch DDP / DeepSpeed / 自研训练选 Volcano。两者也可组合（Volcano 调度 Gang，KubeRay 管理 Ray Cluster）。
- **「调度延迟怎么压？」** 答：四个优化——(1) Gang 调度优化（minMember 准实时检查）；(2) 拓扑预计算（缓存常用拓扑组合）；(3) 调度决策异步化（plugin 并行执行）；(4) 预测性调度（提前预留资源）。阿里 PAI 调度延迟 < 30s。
- **「Slurm 和 K8s 怎么选？」** 答：超算 / 国家级 AI 平台选 Slurm（拓扑感知最强）；互联网公司 + 云原生选 K8s + Volcano（生态成熟）；HPC + 云原生融合场景可考虑 **K8s + Volcano + Slurm bridge**。
- **「跨集群调度怎么做？」** 答：用 **Karmada / Volcano Multi-Cluster / Cluster API** 做跨集群调度；调度器抽象 Global Queue + Local Scheduler 两级调度。CoreWeave / Lambda Labs 等 GPU 云厂商用类似架构支持多地域 GPU 池化。

**5. 参考资料**

- Volcano 官方文档与 GitHub 仓库——K8s 增强调度器的工业实现，Gang Scheduling / Fair Share 的标准实现。
- KubeRay 官方文档——Ray on K8s 的标准实现，分布式训练 + RL 场景的首选。
- Slurm 官方文档——HPC 老牌调度器，超算 / 国家级 AI 平台的事实标准。
- NVIDIA GPU Operator 官方文档——K8s 上 GPU 设备插件、MIG、Time-Slicing 的标准集成。
- **阿里云 PAI 灵骏** —— Volcano 增强版 + 自研 topology 插件，支撑万卡集群训练，调度延迟控制在秒级。
- **字节 ByteFSDP / 机器学习平台** —— 自研调度器 + Ray on K8s，把推理 GPU 利用率抬升到明显更高的水平（【经验】档：具体数字本节无法核验）。
- **Google TPU v5p Pod + Multislice** —— 4096 芯片级 Pod 调度器，跨机柜协同调度。
- **AWS SageMaker / HyperPod** —— 端到端 ML 平台 + 集群调度，自研调度器支撑 EC2 GPU 池化。
- **Microsoft Azure ML** —— 端到端 ML 平台 + ND H100 v5 集群调度，与 OpenAI 算力基础设施同源。

> 注：以上参考资料均指向公开文档、官方仓库或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §9.1.5 LLM 推理成本居高不下（月产 200 万 USD），如何系统性地把单 Token 成本压到 1/10？请从量化 / 投机解码 / 缓存 / 模型路由 / Serverless 五个维度拆解。

> 注：题干中「月产 200 万 USD」与「压到 1/10」为面试官的提问设定，用于框定讨论范围；本节正文只给方向性结论，不对这两个数字作可溯源背书。

**1. 考察点**

- 是否理解 LLM 推理成本的**结构性原因**——70B 模型 FP16 单 token 算力成本约 OpenAI 公开定价的 7–33 倍（取本节 FP16 算力成本 0.0001 USD/token 与 OpenAI 公开定价 0.000003–0.000015 USD/token 重算：0.0001 ÷ 0.000015 ≈ 6.7，0.0001 ÷ 0.000003 ≈ 33）。
- 能否从「**单 token 算力成本 × QPS × 月调用量**」三层分解成本，并对应优化手段。
- 是否知道量化 / 投机解码 / 缓存（KV Cache 复用 / 语义缓存）/ 模型路由 / Serverless 五个维度的**独立收益与组合收益**。
- 加分项：能给具体的成本模型（如「日均 1 亿 token / 月成本 X USD / 优化后 Y USD」）。

**2. 参考答案框架**

**第一层：先量化成本结构。** LLM 推理成本 = **单 token 算力成本 × QPS × 调用时长**。以 70B 模型、H100 集群、月调用量 1 亿 token 为例：

- **裸推理（PyTorch + FP16 + static batching）**：单 token 算力成本约 `0.0001 USD/token`；月成本 `1e8 × 0.0001 = 10,000 USD`（万级）。
- **优化后（vLLM + INT4 + Speculative + Cache + Routing）**：单 token 算力成本约 `0.00001 USD/token`；月成本 `1,000 USD`（千级）。
- **加上 KV Cache 复用**：同一 Prompt 模板类的重复请求可命中缓存、不再重复计算，月成本进一步压缩（【经验】档：降幅随请求重复度与缓存命中率而异，本节无法给出可溯源的统一数字）。

**第二层：五个优化维度的独立收益。**

| 优化维度 | 原理 | 收益倍数（【经验】档量级，随场景而异） | 工程代价 |
| --- | --- | --- | --- |
| **INT4 / FP8 量化** | FP16 → INT4 / FP8，显存 + 算力减半 | 1.5-2x 吞吐 | 精度损失 1-3%（需 AWQ / QAT） |
| **Speculative Decoding** | 小模型 draft + 大模型 verify | 2-4x 加速 | 需训练 / 选择 draft 模型 |
| **KV Cache 复用** | 同 prefix 请求复用 KV Cache（如 system prompt） | 5-10x（命中场景） | 工程复杂度高（RadixAttention） |
| **语义缓存** | 同语义请求复用结果（如 FAQ） | 10-100x（命中场景） | 需 Embedding + 向量库 |
| **模型路由（小模型优先）** | 简单任务用 7B、复杂任务用 70B | 3-5x（混合负载） | 需任务分类器 |

**第三层：组合使用的工程收益。** 五段式场景化优化（按场景优先级组合；下面四种场景给出的倍数均为【经验】档量级，随场景、模型与口径而异，本节无法给出可溯源的统一数字）：

- **场景 A：高频同 prefix 请求（如 system prompt + few-shot）**：KV Cache 复用（RadixAttention）+ Continuous Batching——**单 token 成本降低 10-20 倍**。
- **场景 B：FAQ / 客服类请求**：语义缓存（命中直接返回）+ 小模型（7B）——**单 token 成本降低 100 倍**。
- **场景 C：复杂推理请求（数学 / 代码 / 长文）**：投机解码 + INT4 量化 + 模型路由（先 7B 试探，超时转 70B）——**单 token 成本降低 5-10 倍**。
- **场景 D：弹性突发流量（白天高峰 / 夜间低谷）**：Serverless Inference + Spot GPU + 弹性伸缩——**非高峰时段成本降低 5-10 倍**。

**第四层：Serverless Inference 的成本计算。** Serverless 把「**GPU 永远在线**」变成「**按调用付费**」：

- **AWS Lambda + SageMaker**：按调用次数 + 调用时长计费，冷启动 1-5s。
- **Modal / Replicate**：按 GPU 实例 × 调用时长计费，按秒粒度。
- **阿里 PAI EAS Serverless**：按 QPS × 时长计费，国产化首选。
- **冷启动优化**：Persistent Container + Model Warm Pool + Snapshot 加载（vLLM 支持）——冷启动压到 < 1s。

**第五层：成本监控与 FinOps。** 把成本治理落到工程化：

- **按团队 / 项目计费**：每个推理请求打 team_id / project_id tag，按 token 数 × 单价计入对应团队。
- **实时成本看板**：Grafana + 自研 cost exporter，按小时 / 天展示 `team_id → 成本`。
- **告警与配额**：单团队月预算告警、超过配额自动降级（路由到小模型）。
- **模型 ROI 评估**：每模型贡献的业务价值（GMV / CTR / 用户满意度）/ 算力成本，淘汰 ROI 低的模型。

**第六层：工业实证。** **OpenAI / Anthropic 闭源 API** —— 综合使用 INT4 + Speculative + Cache + Routing，单 token 公开定价约 `0.000003-0.000015 USD/token`（GPT-4o / Claude 3.5；该定价可公开查证）。**字节豆包 / 阿里通义** —— 自研推理优化后，单 token 成本明显低于 OpenAI 同规格（【经验】档：具体比值本节无法核验）。**Modal / Replicate** —— Serverless GPU 推理，把初创公司的 GPU 月成本从自建的高位显著压低（【经验】档：本节无法给出可溯源的统一数字）。**AWS Trainium / Inferentia** —— 自研芯片推理成本低于 NVIDIA 同规格，配合 Spot GPU 还能进一步下降（【经验】档：具体降幅随实例类型与区域而异）。

**3. 常见陷阱**

- **只看单 token 算力成本不看 QPS。** 单 token 成本降低 10x，但 QPS 涨 5x，实际成本只降一半——必须看**总成本**。
- **把量化当成「免费」。** INT4 量化需要校准数据集 + 业务 A/B 实验，工程投入 > 1 人月；精度损失可能在某些场景 > 5%（如长文本数学）。
- **忽略冷启动成本。** Serverless Inference 在低 QPS 场景反而更贵（冷启动 1-5s，每次启动都要付出 token 数计费）。
- **不做语义缓存的命中率监控。** 命中率 < 50% 的语义缓存 ROI 为负——必须监控命中率、动态调整阈值。
- **盲目追求小模型路由。** 简单任务用 7B，但分类错误会让用户体验崩；必须配**任务分类器 + 置信度阈值 + fallback 大模型**。

**4. 追问预测**

- **「语义缓存的命中率怎么提升？」** 答：(1) 调整 Embedding 模型（领域微调）；(2) 调相似度阈值（cosine 0.85-0.95）；(3) 多级缓存（精确匹配 → 模糊匹配 → Embedding）；(4) Cache 预热（高频请求提前写）。
- **「Spot GPU 风险怎么控？」** 答：Spot 会被 AWS / 云厂商随时回收——必须配**检查点 + 快速重启 + 多 AZ 备份**；训练任务不适用 Spot（损失 Checkpoint），推理任务适合 Spot（无状态）。
- **「模型路由的分类器怎么做？」** 答：可用小 LLM（如 7B）做意图分类，或用规则（关键词 + 长度 + 复杂度评分）；准确率 > 90% 才建议上线，否则宁可全用大模型。
- **「FinOps for AI 和传统 FinOps 的区别？」** 答：传统 FinOps 管 IaaS / PaaS 资源（CPU / 内存 / 存储），按月付；FinOps for AI 管 GPU + 模型 + 推理 QPS，按 token / 推理时长 / 模型版本计费——粒度更细、变化更快。
- **「推理成本占 AI 项目总成本的比例？」** 答：典型 AI 项目成本 = 训练成本（一次性）+ 推理成本（持续性，通常是最大头）+ 数据 / 标注，**推理成本是 AI 项目的最大持续支出**（【经验】档：三者比例随业务形态与模型迭代节奏而异，本节无法给出可溯源的统一数字），必须重点治理。

**5. 参考资料**

- vLLM 官方文档关于 PagedAttention + Continuous Batching + Speculative Decoding 的成本模型——单 token 成本优化的工程基线。
- Anthropic Claude API 定价文档与公开技术博客——闭源 LLM 推理成本优化的代表。
- Modal / Replicate 公开博客——Serverless GPU 推理的成本模型与冷启动优化。
- AWS Inferentia / Trainium 官方文档——自研芯片推理的定价与 ROI 数据。
- **OpenAI GPT-4o / o1 推理定价** —— 闭源 API 定价天花板，token 单价公开透明。
- **Anthropic Claude 3.5 / 3.7 推理** —— 闭源 API，自研推理优化 + 自研芯片。
- **字节豆包 / 阿里通义 / 智谱 GLM-4** —— 国产 LLM 推理，单 token 成本明显低于 OpenAI 同规格（【经验】档：具体比值本节无法核验）。
- **月之暗面 Kimi / 阶跃 Step-2** —— 国产闭源 LLM 推理，成本治理工业实践的代表。
- **CoreWeave / Lambda Labs / RunPod** —— GPU 云 + Serverless 推理服务，定价整体低于主流公有云（【经验】档：具体降幅随实例类型、区域与合约而异，本节无法给出可溯源的统一数字）。

> 注：以上参考资料均指向公开文档、官方定价或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

#### §9.1.6 在等保 / 信创合规要求下，如何做国产 AI 算力适配？华为昇腾 / 寒武纪 / 海光 DCU 的软件栈成熟度如何？CUDA → CANN / MLU / ROCm 迁移路径是什么？

**1. 考察点**

- 是否理解国产 AI 算力适配的**合规驱动**——等保 2.0/3.0、《算法推荐管理规定》、信创要求（金融 / 政企 / 央企）。
- 能否对比华为昇腾（CANN）/ 寒武纪（MLU）/ 海光 DCU（ROCm 兼容）三大国产芯片的**软件栈成熟度**。
- 是否知道 CUDA → 国产软件栈的**迁移路径**（算子替换 / 框架适配 / 双栈部署）。
- 加分项：能给出真实迁移案例（如从 NVIDIA H100 迁移到昇腾 910C 的工程量、精度损失、性能损耗）。

**2. 参考答案框架**

**第一层：先定义问题——为什么必须国产化适配。** 国产化是**合规刚需 + 供应链安全**双重驱动：

- **合规**：金融 / 政企 / 央企必须满足等保 2.0/3.0 + 信创要求——AI 算力必须在国产芯片 / 国产服务器 / 国产 OS / 国产数据库上跑。
- **供应链安全**：H100 / H200 在 2022-2025 受出口管制约束，国内万卡集群面临「卡荒」；昇腾 910C / 寒武纪思元 590 / 海光 DCU 是国产替代主力。
- **成本考量**：国产卡单价比 H100 明显更低，但软件栈成熟度差距大（【经验】档：具体价差随型号、供货状况与采购规模而异，本节无法给出可溯源的统一数字）。

**第二层：三大国产芯片 + 软件栈对比。**

| 厂商 | 芯片 | 算力（FP16） | 软件栈 | 生态成熟度 | 适用场景 |
| --- | --- | --- | --- | :---: | --- |
| **华为昇腾** | 910B / 910C | 910B: 780 TFLOPS / 910C: 940 TFLOPS | **CANN**（Compute Architecture for Neural Network） | **★★★★** | 训练 + 推理；国产 LLM 首选 |
| **寒武纪** | 思元 590 / 思元 690 | 590: 256 TFLOPS / 690: 512 TFLOPS | **MLU + Bang C** | **★★★** | 推理为主；训练需自研 |
| **海光 DCU** | Z100 / K100 | Z100: 24 TFLOPS / K100: 100 TFLOPS | **ROCm 兼容（DTK）** | **★★** | 兼容 CUDA 生态；推理 + 小模型训练 |

**第三层：CUDA → 国产软件栈的迁移路径。**

- **Step 1：抽象层适配**。在 PyTorch / TensorFlow 上加抽象层（如 **cGPU**、**torch_npu**、**flagscale**），让上层框架代码不改，下层根据硬件路由到不同运行时。
- **Step 2：算子替换**。把 CUDA kernel 替换为 CANN 的 Ascend C / MLU 的 Bang C / DCU 的 HIP。**核心算子**（GEMM、Attention、Softmax）优先替换；**辅助算子**（IO、padding）后置替换。
- **Step 3：分布式训练适配**。把 NCCL 替换为 **HCCL**（华为集合通信库）/ **CNCL**（寒武纪集合通信库）。3D 并行 + FSDP 在 CANN / MLU 上需要重新调优。
- **Step 4：推理引擎适配**。vLLM / TensorRT-LLM 需要加 CANN / MLU backend——目前 vLLM 已支持昇腾 NPU，社区版支持 MLU。
- **Step 5：性能调优**。包括算子融合、内存优化、通信优化——昇腾有 **Ascend C 图引擎**、寒武纪有 **MagicMind 推理引擎**。

**第四层：双栈部署的工程模式。** 国产化迁移的**现实路径**是**双栈 + 渐进迁移**：

- **双栈适配**：NVIDIA GPU（主力）+ 国产 NPU（信创 / 备份）共存，推理服务通过硬件路由（DCGM + 自研 router）分发。
- **渐进迁移**：先用国产卡跑推理（精度损失可控），再用国产卡跑小模型训练（70B 以下），最后用国产 GPU 跑大模型训练（200B+，昇腾 910C 是首选）。
- **混合集群**：NVIDIA + 昇腾 + 海光混合部署，训练任务按硬件能力路由。

**第五层：精度与性能损失的量级。** 这是国产化最敏感的工程问题（以下为方向性口径，属【经验】档，具体数字本节无法核验）：

- **训练精度**：昇腾 910C、寒武纪思元 590、海光 DCU 在 BF16 / FP16 下的训练精度与 H100 处于同一量级，但仍存在可测量的 PPL 差异，且差异随模型规模与算子实现变化（有公开材料讨论过国产卡的训练精度差异，本书未定位到具体文档与年份，无法核验）。
- **推理性能**：同精度下国产单卡的推理性能普遍低于 H100，差距随量化方式与算子覆盖度变化。
- **分布式训练**：昇腾 HCCL + 910C 万卡集群训练 LLaMA-72B 的集群效率与 H100 + NCCL 集群仍有差距，但该差距在 2024-2025 年持续收窄。

**第六层：工业实证。** **华为昇腾 + 盘古大模型** —— 华为云用昇腾 910C + CANN 训练盘古 LLM，是国产化程度最高的 LLM 训练实践之一。**蚂蚁集团金融 AI 平台** —— 华为昇腾 + 自研图数据库 TuGraph + 自研推理引擎，是金融行业国产化适配的代表。**寒武纪 + 智谱 AI GLM-4** —— 思元 590 + 推理引擎，国产推理平台代表。**阿里 PAI + 灵骏 + 通义千问** —— 双栈适配（NVIDIA + 昇腾）。**海光 DCU + 月之暗面 Kimi / 阶跃 Step-2** —— 国产化推理的探索路径。（各家国产化比例本节无法核验，【经验】档）

**3. 常见陷阱**

- **把「国产化」当成「替换 NVIDIA」。** 国产化是合规 + 供应链安全，不是性能替代——**昇腾 910C 的算力与单卡推理性能仍低于 H100**（【经验】档：具体比例随精度、算子覆盖度与模型而异，本节无法给出可溯源的统一数字），必须客观看待。
- **忽略软件栈成熟度。** 很多国产芯片硬件参数亮眼，但软件栈（CANN / MLU / DTK）文档不全、社区小、bug 多——**实际可用性 < 官方宣传**。迁移工程量远大于预期。
- **迁移前不做精度评估。** 浮点精度（FP16 vs BF16 vs INT8）差异、算子实现差异（reduce / softmax / attention）都可能导致模型精度损失 > 5%。**必须先跑精度评估，再做性能迁移**。
- **忽略集合通信库差异。** NCCL → HCCL / CNCL 不仅是 API 改名，**AllReduce / AllGather 的实现算法不同**，大规模分布式训练会因此出现可观的性能损失（【经验】档：幅度随拓扑与规模而异，本节无法给出可溯源的统一数字）。
- **不做双栈部署导致业务停服。** 国产化迁移必须**双栈并行**，避免「迁移期间业务停服」或「迁移后发现问题无回退」。

**4. 追问预测**

- **「昇腾 910C 和 H100 在训练 LLaMA-72B 上性能差距多大？」** 答：单卡性能低于 H100，万卡集群训练周期相应更长；**差距在持续缩小**（【经验】档：本节无法给出可溯源的具体比例与倍数）。
- **「CUDA 代码迁移到 CANN 的工程量多大？」** 答：(1) 纯 PyTorch / Transformers 代码（无自定义 kernel）迁移成本约 1-2 人周，主要是环境配置 + 性能调优；(2) 含自定义 CUDA kernel 的代码迁移成本约 1-3 人月，需要算子重写 + 调试。
- **「国产推理能跑 LLaMA-405B 吗？」** 答：单卡昇腾 910C 跑不动（80GB 显存不够 405B FP16），需要 **多卡张量并行（4-8 卡 910C）+ 量化（INT4）**——精度可接受，性能低于同规模的 H100 集群（【经验】档：具体比例本节无法核验）。
- **「信创合规下能不能完全不用 NVIDIA？」** 答：合规上必须 100% 国产化（金融 / 央企），但实际生产中 **NVIDIA + 国产双栈**更常见——NVIDIA 跑前沿研发、国产跑生产部署。建议：核心研发保 NVIDIA + 信创生产用国产，双栈并行。
- **「国产软件栈未来 3-5 年的演进趋势？」** 答：CANN / MLU / DTK 软件栈成熟度会持续提升，**对标 CUDA 的可用性时间表是 2026-2028**；国产 LLM 训练 + 推理将逐步从「可用」走向「好用」。

**5. 参考资料**

- 华为昇腾官方文档与 CANN 仓库——CANN 软件栈的工业实现，对标 CUDA 的国产替代。
- 寒武纪官方文档与 MLU + Bang C 仓库——寒武纪 MLU 软件栈，工业落地较成熟。
- 海光 DCU 官方文档与 DTK 仓库——ROCm 兼容路线，国产软件栈第三条路径。
- 华为云盘古大模型公开技术材料——国产化 LLM 训练 + 推理的工业标杆。
- **华为昇腾 + 盘古大模型** —— 国产化程度最高的 LLM 训练实践之一（具体国产化比例本节无法核验）。
- **蚂蚁集团金融 AI 平台** —— 金融行业国产化适配的代表（具体比例本节无法核验）。
- **寒武纪 + 智谱 AI GLM-4** —— 思元 590 + 国产推理引擎，国产推理平台代表。
- **阿里 PAI + 灵骏 + 通义千问 Qwen** —— 双栈适配（NVIDIA + 昇腾），信创侧以国产算力承载生产推理（具体国产化比例本节无法核验）。
- **月之暗面 Kimi / 阶跃 Step-2** —— 探索国产 + 国产推理的多元化路径。
- **字节 ByteFSDP + 火山引擎** —— 部分国产化适配（推理用国产 + 训练主力 NVIDIA）。

> 注：以上参考资料均指向公开文档、官方仓库或企业公开技术博客。精确链接请按条目名称自行检索核验。

---

### 8.3 本章小结

本节收录 6 道题，覆盖「AI 算力」能力域的六大主题，横切主题为**算力工程化与商业可持续**。六道题构成一条完整的下钻链路：**资源底座（MIG / 池化）→ 训练主线（DDP / TP / PP / ZeRO）→ 推理主线（PagedAttention / 量化 / Speculative）→ 工程枢纽（调度）→ 商业可持续（成本）→ 合规与供应链（国产化）**。

参考答题的通用心法：**先说清约束（算力 / 显存 / 通信 / 合规），再说清选项（多种并行 / 优化 / 调度 / 国产方案），最后说清取舍（性能 vs 成本 vs 合规）**。这一主题下的所有问题，面试官真正想听的都不是「你会几种技术」，而是「**为什么这么选，以及你能不能把 7B 跑到 H100 上、把 70B 跑到昇腾上、把 405B 跑到万卡集群上**」。

---

### 8.4 返回

- 返回 [09-data-intelligence-product 章节目录](../README.md)
