> 本文件是 **04-observability.md** § 8 面试真题集 的子主题。完整章节请回到 [index](04-observability.md) 或 [§ 8 索引](04-observability-section-8-sec8.md)。

### 8.2 §21.4 监控指标采集与异常检测基础

> 本主题考察监控指标采集与异常检测的工程基础：3-sigma 法则、资源类指标采集、孤立森林算法、Prometheus / Telegraf 选型、万节点实时异常检测架构。面试官真正想听的是「算法原理 + 工程落地」。

#### §21.4.1 请解释在监控指标异常检测中，3-sigma（三西格玛）法则的基本原理，并说明它的适用场景与局限。

**1. 考察点**

- 是否理解 3-sigma 的统计学基础（正态分布 + 68-95-99.7 法则）。
- 能否说出适用场景（稳定 + 近似正态的指标）。
- 是否知道它的局限（季节性、非正态、稀疏数据）。
- 加分项：能给出 3-sigma 的工程化实现细节。

**2. 参考答案框架**

**第一层：3-sigma 法则的统计学原理。** 假设指标时序 `X = {x_1, ..., x_t}` 服从正态分布 `N(μ, σ^2)`：
- **P(|X - μ| ≤ 1σ) ≈ 68.27%**（正常）
- **P(|X - μ| ≤ 2σ) ≈ 95.45%**（轻微异常）
- **P(|X - μ| ≤ 3σ) ≈ 99.73%**（强异常）
- **P(|X - μ| > 3σ) ≈ 0.27%**（罕见）

3-sigma 异常 = `|x_t - μ| > 3σ`。在标准正态分布下，3σ 外的点概率 < 0.3%，可视为异常。

**第二层：工程化实现。**
- **窗口选择**：滚动窗口（最近 7 天）或扩展窗口（按周期对齐）。
- **均值 / 方差计算**：`μ = mean(history)`，`σ = std(history)`。
- **滑动窗口**：窗口大小 = 业务周期（如 1 天 / 1 周）。
- **强异常**：连续 N 个点都偏离 3σ 才告警（避免抖动）。
- **告警抑制**：窗口切换时短暂不评估。

**第三层：适用场景。**
- **稳定 + 近似正态**：CPU 利用率（长期 30-60%）、内存利用率（运行态稳定）；
- **业务低频波动**：订单成功率（基本稳定在 95%+）；
- **简单 + 实时性高**：每条 record 评估成本低（μs 级）。

**第四层：局限与边界。**

| 局限 | 表现 | 解法 |
| --- | --- | --- |
| **季节性失效** | 促销 / 周末 / 月初等周期异常会被误判 | 用 STL 分解先去除季节性 |
| **非正态** | 长尾分布（IOPS、流量）3-sigma 失效 | 用 IQR 或百分位 |
| **稀疏数据** | 冷启动时 < 30 个数据点，方差估计不准 | 用 EWMA 加权 + 历史知识 |
| **概念漂移** | 业务变化后 μ/σ 失真 | 在线学习 + 周期重训 |
| **多指标异常** | 单指标正常但多指标联合异常 | 用孤立森林 |

**第五层：3-sigma vs 其他简单方法。**
- **vs 静态阈值**：3-sigma 自动适应均值漂移；静态阈值固定。
- **vs IQR**：3-sigma 假设正态；IQR 对非正态更鲁棒。
- **vs EWMA**：3-sigma 用固定窗口；EWMA 用指数加权，对近期更敏感。
- **vs Z-score**：Z-score 与 3-sigma 等价，只是表达形式不同。

**第六层：工业实践。** Uber / Netflix / LinkedIn 公开过 3-sigma 是基础异常检测算法的核心（占工业用法的 50%+）；通常作为第一层基础算法，再叠加 ML 模型。

**3. 常见陷阱**

- **任何指标都用 3-sigma。** 长尾分布指标（QPS、网络 IO）3-sigma 失效。
- **不做季节性识别。** 促销期间订单量是正常季节性高峰，不是异常。
- **不做强异常过滤。** 单点抖动被误报；需连续 N 点。
- **不更新 μ/σ。** 业务增长后 μ/σ 失真；应在线更新。
- **冷启动直接用。** 历史数据不足时方差估计偏差大。

**4. 追问预测**

- **「3-sigma 阈值怎么调？」** 答：经验上 2-4；2 严格（误报多）、4 宽松（漏报多）；3 是平衡点。
- **「如何处理非正态指标？」** 答：先做 Box-Cox / 对数变换近似正态；或改用 IQR / 百分位。
- **「3-sigma 与 IQR 怎么选？」** 答：先看分布；正态用 3-sigma，非正态用 IQR；不确定就都试。

**5. 参考资料**

- 任何统计学教材关于正态分布与 68-95-99.7 法则的章节——3-sigma 的统计学基础。
- Brendan Gregg《Systems Performance》中关于异常检测的章节——监控领域的工业实践。
- Uber / Netflix / LinkedIn 关于异常检测算法的公开文章——头部企业的算法组合。
- Prometheus Alertmanager 官方文档中关于告警规则的章节——3-sigma 在告警系统中的实现。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接待联网环境补全。

---

#### §21.4.2 请列举在大数据集群监控中，针对 CPU、内存、磁盘 I/O 和网络流量这四类核心资源，各列举至少 3 个关键指标，并说明指标异常的可能故障原因。

**1. 考察点**

- 是否具备「资源监控」的指标选型能力。
- 能否用具体指标说明故障语义。
- 是否知道指标间的关联（CPU 高 → 内存涨 → 网络增）。
- 加分项：能给出指标的「基线 + 异常阈值」。

**2. 参考答案框架**

**第一层：CPU 类指标（OS + JVM）。**

| 指标 | 来源 | 含义 | 异常根因 |
| --- | --- | --- | --- |
| `node_cpu_seconds_total{mode="idle"}` | node-exporter | CPU 空闲率 | < 30% 表示繁忙 |
| `node_cpu_seconds_total{mode="iowait"}` | node-exporter | IO 等待占比 | > 20% 是 IO 瓶颈 |
| `node_cpu_seconds_total{mode="steal"}` | node-exporter | 虚拟化偷取 | > 10% 是超分 |
| `node_load1` / `node_load5` / `node_load15` | node-exporter | 1/5/15min 平均负载 | > 2 × CPU 核数是过载 |
| `jvm_cpu_recent_usage` | JVM | JVM 进程 CPU | > 70% 是 GC 频繁 |
| `process_cpu_seconds_total` | prom-client | 进程 CPU 时间 | 单进程 CPU 异常 |

**第二层：内存类指标（OS + JVM + Native）。**

| 指标 | 来源 | 含义 | 异常根因 |
| --- | --- | --- | --- |
| `node_memory_MemAvailable_bytes` | node-exporter | 可用内存（含 cache） | < 25% 是 OOM 风险 |
| `node_memory_MemFree_bytes` | node-exporter | 完全空闲 | 不准（cache 计入） |
| `node_memory_Buffers_bytes` | node-exporter | buffer cache | 异常不影响 |
| `node_memory_Cached_bytes` | node-exporter | page cache | 异常不代表问题 |
| `jvm_memory_bytes_used{area="heap"}` | JVM | 堆使用量 | > 80% 是 GC 频繁 |
| `process_resident_memory_bytes` | prom-client | 进程 RSS（包含 native） | > 容器 limit = OOMKilled |
| `node_vmstat_pswpin` | node-exporter | swap 读取次数 | > 0 是 swap 压力 |

**第三层：磁盘 IO 类指标。**

| 指标 | 来源 | 含义 | 异常根因 |
| --- | --- | --- |
| `node_disk_io_now` | node-exporter | 当前 IO 请求数 | > 80% queue = 饱和 |
| `node_disk_read_bytes_total` | node-exporter | 累计读字节 | 监控趋势 |
| `node_disk_written_bytes_total` | node-exporter | 累计写字节 | 监控趋势 |
| `node_disk_io_time_seconds_total` | node-exporter | IO 占用时间 | > 80% 是饱和 |
| `node_filesystem_avail_bytes` | node-exporter | 文件系统可用 | < 10% 是磁盘满 |
| `node_filesystem_inodes_free` | node-exporter | inode 可用 | < 10% 是 inode 满 |
| `node_disk_read_time_seconds_total` | node-exporter | 读总时间（计算 await） | await > 50ms = IO 慢 |

**第四层：网络流量类指标。**

| 指标 | 来源 | 含义 | 异常根因 |
| --- | --- | --- | --- |
| `node_network_receive_bytes_total` | node-exporter | 累计收字节 | 监控趋势 |
| `node_network_transmit_bytes_total` | node-exporter | 累计发字节 | 监控趋势 |
| `node_network_mtu_bytes` | node-exporter | MTU | 配置异常 |
| `node_netstat_Tcp_Retrans_Segments` | node-exporter | TCP 重传 | > 1% 是网络质量差 |
| `node_netstat_Tcp_CurrEstab` | node-exporter | 当前 ESTABLISHED 连接数 | 异常增长是连接泄漏 |
| `node_sockstat_TCP_alloc` | node-exporter | TCP socket 分配数 | > 80% socket 上限是 FD 耗尽 |

**第五层：指标的故障关联。** 单指标不够，要看**关联**：
- CPU io_wait 高 + 磁盘 await 高 → 磁盘 IO 瓶颈；
- CPU 高 + 内存 RSS 涨 + JVM 堆正常 → Native 内存泄漏（如 Netty）；
- 网络重传高 + 磁盘 IO 正常 → 网络瓶颈（交换机或网卡）；
- Swap > 0 + 内存 cache 持续低 → 内存真实压力；
- TCP 连接数增长 + CPU 平稳 → 连接泄漏 / FD 耗尽。

**第六层：采集成本与精度平衡。**
- **高频采样（5-15s）**：核心指标（CPU、内存、磁盘 IO）；
- **低频采样（60-300s）**：边缘指标（文件系统 inode、网络 MTU）；
- **一次性采集**：SMART（`smartctl -a`）。

**3. 常见陷阱**

- **只看平均值不看 P99。** 平均值掩盖长尾。
- **不区分宿主机与容器。** 容器时代 cgroup 限制是关键。
- **不设阈值。** 指标无基线无法判断异常。
- **不区分 buffer / cache / free。** Free 不可用，cache 可回收。

**4. 追问预测**

- **「CPU 100% 但 load 正常，什么情况？」** 答：单线程应用或 IO 密集型；用 `pidstat -w` 看 context switch。
- **「内存可用率 30% 但 JVM 堆正常？」** 答：RSS 增长（native），如 RocksDB / Netty；用 `pmap` 看进程内存分布。
- **「网络重传 1% 算高吗？」** 答：> 0.1% 异常；> 1% 严重；> 5% 网络基本不可用。

**5. 参考资料**

- Brendan Gregg《Systems Performance》——四大资源指标的权威论述。
- Linux `iostat` / `vmstat` / `pidstat` / `nicstat` 工具官方文档——指标采集的命令行参考。
- Prometheus node-exporter 官方文档——指标命名与语义。
- Netflix / LinkedIn 关于四大资源监控的公开文章——头部企业实践。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接待联网环境补全。

---

#### §21.4.3 请阐述孤立森林（Isolation Forest）算法相较于传统统计方法（如 3-sigma）在异常检测中的优势和适用场景。

**1. 考察点**

- 是否理解孤立森林的核心思想（异常点更容易被孤立）。
- 能否说出与 3-sigma 的根本差异（多维 vs 单维）。
- 是否知道适用场景与局限。
- 加分项：能给出工程化实现与性能特征。

**2. 参考答案框架**

**第一层：孤立森林的核心思想。**
- **基本假设**：异常点在特征空间中**容易被孤立**——少量随机划分即可把它们分离出来。
- **算法**：
  1. 构建 N 棵 iTree（Isolation Tree），每棵树随机选特征 + 随机选阈值划分样本；
  2. 异常点路径长度 `E(h(x))` 短（容易孤立）；
  3. 计算异常分数 `s(x, n) = 2^(-E(h(x))/c(n))`，分数接近 1 = 异常。
- **关键参数**：`n_estimators`（树的数量，默认 100）、`max_samples`（每棵树的样本数）、`contamination`（异常占比估计）。

**第二层：与 3-sigma 的根本差异。**

| 维度 | 3-sigma | 孤立森林 |
| --- | --- | --- |
| **维度** | 单变量 | 多变量 |
| **假设** | 正态分布 | 无分布假设 |
| **训练** | 无 | 一次性训练 |
| **推理** | O(1)（简单算术） | O(log n)（树遍历） |
| **可解释** | 高（μ ± 3σ） | 低（黑盒分数） |
| **季节性** | 不识别 | 不识别（需先 STL） |
| **冷启动** | 直接可用 | 需训练数据 |

**第三层：优势 1 —— 多维异常检测。**
- **场景**：CPU 正常 + 内存正常 + 网络正常，但三者联合异常（罕见组合）。
- **3-sigma**：每个指标都正常，漏报。
- **孤立森林**：多维联合评估，能发现。
- **典型应用**：综合健康度评分；多指标联合异常。

**第四层：优势 2 —— 无分布假设。**
- **场景**：长尾分布指标（QPS、IOPS、网络流量）。
- **3-sigma**：假设正态，长尾分布失效。
- **孤立森林**：基于树结构，无分布假设。
- **典型应用**：网络流量、用户行为指标。

**第五层：优势 3 —— 自动适应。**
- **场景**：业务变化（流量增长 10x）。
- **3-sigma**：需要重新训练 μ/σ。
- **孤立森林**：训练一次，自动适应多尺度异常。

**第六层：局限。**

| 局限 | 表现 | 解法 |
| --- | --- | --- |
| **冷启动** | 无训练数据 | 用历史数据预训练或自监督 |
| **概念漂移** | 业务变化后模型失效 | 周期重训 |
| **可解释性差** | oncall 不理解 | SHAP / LIME 解释 |
| **时序特征弱** | 不识别时间序列模式 | 先用 STL 分解再孤立森林 |
| **高基数标签** | 标签爆炸 → 树分裂失败 | label allowlist |

**第七层：适用场景总结。**
- **适合孤立森林**：
  - 多维指标联合异常；
  - 长尾分布指标；
  - 无明显季节性的指标；
  - 一次性训练可接受的场景。
- **适合 3-sigma**：
  - 单变量稳定指标；
  - 季节性明显的指标；
  - 实时性要求极高（μs 级）；
  - 需要可解释告警。

**第八层：工业实践。**
- **Uber / LinkedIn**：用孤立森林做多维异常检测；
- **Netflix Atlas**：孤立森林作为综合健康度评分算法之一；
- **阿里**：孤立森林用于双 11 场景多指标异常。

**3. 常见陷阱**

- **不训练直接用。** 孤立森林需要历史数据训练。
- **用作时序异常检测。** 时序数据要先做时序特征工程（STL 分解）。
- **污染率（contamination）设错。** 真实异常率低于 contamination 会误报；高于会漏报。
- **黑盒告警无解释。** oncall 不接受黑盒分数。

**4. 追问预测**

- **「孤立森林与 LOF 的区别？」** 答：LOF 基于密度（局部异常因子）；孤立森林基于路径长度；LOF 更准但更慢。
- **「孤立森林的训练成本？」** 答：O(n log n)；100 万样本 ~1min；推理 O(log n) 每条 ~μs。
- **「孤立森林与 LSTM-AE 怎么选？」** 答：单步异常用孤立森林；序列异常用 LSTM-AE；多指标联合用孤立森林。

**5. 参考资料**

- Liu 等人关于孤立森林的原始论文《Isolation Forest》——算法理论基础。
- scikit-learn 与 PyOD 官方文档——孤立森林的实现与 API。
- Uber / LinkedIn / Netflix 关于孤立森林在异常检测中的应用的公开文章——头部企业实战。
- 《Outlier Analysis》by Aggarwal——异常检测算法的系统化论述。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接待联网环境补全。

---

#### §21.4.4 请对比分析 Prometheus 和 Telegraf 在监控指标采集方面的各自特点和适用场景。

**1. 考察点**

- 是否理解两种采集方式的根本差异（Pull vs Push）。
- 能否说出 Prometheus 与 Telegraf 的典型用法。
- 是否知道边缘节点 vs 数据中心的采集策略。
- 加分项：能给出真实生产中的混合采集架构。

**2. 参考答案框架**

**第一层：Prometheus 与 Telegraf 的根本差异。**

| 维度 | Prometheus | Telegraf |
| --- | --- | --- |
| **采集模式** | Pull（主动拉取） | Push（主动上报） |
| **存储** | 内置 TSDB | 无（输出到外部） |
| **数据源** | Exporter | Input Plugin |
| **协议** | HTTP（Prometheus 文本格式） | HTTP / Kafka / InfluxDB |
| **生态** | Kubernetes 标配 | 多数据源 |
| **复杂度** | 中等 | 简单 |
| **适用** | 服务端、云原生 | 边缘节点、自定义 |

**第二层：Prometheus 的特点与适用场景。**
- **Pull 模式**：Prometheus 主动 scrape；服务发现集成；
- **内置 TSDB**：本地短期存储（默认 15 天）；
- **PromQL**：强大的查询语言；
- **生态完善**：Kubernetes 标配；Grafana 直接对接；
- **适用场景**：
  - **数据中心**：标准化服务的指标采集；
  - **Kubernetes**：Pod / Service 自动发现；
  - **Prometheus Operator**：声明式管理；
  - **微服务**：HTTP Exporter 易接入。

**第三层：Telegraf 的特点与适用场景。**
- **Push 模式**：Agent 主动上报到 TSDB；
- **200+ Input Plugin**：覆盖网络设备、数据库、消息队列、自定义；
- **多输出**：InfluxDB / Kafka / Prometheus Remote Write；
- **边缘友好**：低资源占用；可作为 sidecar；
- **适用场景**：
  - **边缘节点**：IDC 机房硬件（交换机、存储）；
  - **自定义指标**：业务埋点主动上报；
  - **数据库 / MQ**：JDBC / Kafka 插件；
  - **IoT 设备**：低带宽场景。

**第四层：典型组合架构。**

```
[数据中心]
  Prometheus → 短存储 + Grafana
  Prometheus Remote Write → 远端 TSDB（Thanos / Cortex）

[边缘节点]
  Telegraf → Kafka → Flink → TSDB
  Telegraf → Prometheus Remote Write

[业务侧]
  业务埋点 SDK → Pushgateway → Prometheus
```

**第五层：选型决策。**
- **选 Prometheus**：服务标准化、有服务发现、K8s 生态、短存储可接受；
- **选 Telegraf**：边缘节点、自定义数据源、需要插件生态、不在 K8s；
- **混用**：边缘 Telegraf push → 中心 Prometheus pull / Remote Write。

**第六层：性能对比。**
- **Prometheus 单实例**：~10M active series（2.x 后 ~20M）；
- **Telegraf**：单实例 ~10K-50K metrics/s（取决于 plugin）；
- **混合架构**：用 Telegraf 在边缘聚合 → 中心 Prometheus / 远端 TSDB。

**第七层：工业案例。**
- **Kubernetes 生态**：Prometheus 是事实标准；
- **边缘监控**：Telegraf 主导（CDN / 机房硬件）；
- **阿里 / 字节**：数据中心 Prometheus + 边缘自研 / Telegraf；
- **Netflix**：自研时序采集系统（不基于开源）。

**3. 常见陷阱**

- **只用一种。** 不分场景统一采集模式会事倍功半。
- **Prometheus scrape 频率过高。** 15s 变 5s 让单实例崩溃。
- **Telegraf 输出到不匹配的 TSDB。** Telegraf 输出格式与 TSDB schema 不匹配。
- **不区分 Pull vs Push 代价。** Pull 是中心化调度；Push 是边缘主动；错配会丢数据。

**4. 追问预测**

- **「Prometheus 与 InfluxDB 选哪个？」** 答：Prometheus 适合云原生 + Pull；InfluxDB 适合 Push + 时序数据库 + 长期存储。
- **「Pushgateway 有什么用？」** 答：临时 / 短期作业的 push 入口（不被 Prometheus 主动 scrape）。
- **「混合架构怎么统一查询？」** 答：用 Grafana 多个数据源；或通过 Thanos / Cortex 联邦。

**5. 参考资料**

- Prometheus 官方文档中 `Concepts` 与 `Configuration` 章节——Pull 模型与服务发现。
- Telegraf 官方文档中 `Input Plugins` 与 `Output Plugins` 章节——多数据源采集。
- InfluxDB 官方文档——时序数据库的 TSDB 设计。
- Grafana Labs 关于 Prometheus + Loki + Tempo 的官方文档——云原生可观测性栈。
- 阿里 / 字节关于混合采集架构的公开分享——国内大规模生产经验。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接待联网环境补全。

---

#### §21.4.5 在一个万节点规模的 Hadoop 集群中，为了实现对监控指标的实时异常检测，请设计一套完整的端到端架构。

**1. 考察点**

- 是否具备「万节点实时异常检测」的系统设计能力。
- 能否分层架构（采集 / 传输 / 处理 / 检测 / 告警 / 存储）。
- 是否知道延迟与吞吐的取舍。
- 加分项：能给出具体的组件选型与配置参数。

**2. 参考答案框架**

**第一层：架构总览（六层架构）。**

```
[采集层]     [传输层]      [处理层]      [检测层]     [告警层]     [存储层]
node-        Kafka        Flink         ML/统计     Alert       TSDB
exporter     + Protobuf   + 状态后端    + 推理      Manager     + Event
+ Telegraf                                                  Store
+ Spark/Flink
Metrics
```

**第二层：采集层。**
- **组件**：node-exporter（DaemonSet）、Telegraf、Spark Metrics、Flink Metrics Reporter、kafka_exporter；
- **频率**：核心指标 15s；边缘指标 60-300s；
- **降维**：边缘聚合（按 host/instance 平均）。

**第三层：传输层。**
- **消息队列**：Kafka（3-5 broker 集群，partition 数 = consumer 数 × 3）；
- **格式**：Protobuf（替换 JSON，节省 50% 网络）；
- **压缩**：snappy（默认）或 zstd；
- **反压**：Kafka consumer 端的反压感知。

**第四层：处理层。**
- **流处理框架**：Flink（亚秒级延迟 + 大状态）；
- **状态后端**：RocksDB（GB+ 状态）+ 增量 checkpoint；
- **窗口**：滑动窗口（5min / 1h）+ Tumbling Window（1d）；
- **特征工程**：实时计算特征（均值、方差、P99、增长率）。

**第五层：检测层。**
- **算法分层**：
  - **L1：3-sigma / IQR / EWMA**（80% 场景）；
  - **L2：孤立森林**（多维联合异常）；
  - **L3：Prophet**（季节性指标）；
  - **L4：LSTM-AE**（复杂时序，黑盒，谨慎使用）；
- **推理**：Flink 内置算子 / 自研推理服务（gRPC）；
- **模型预加载**：模型启动时加载到内存；
- **降级策略**：模型失败回退到 3-sigma。

**第六层：告警层。**
- **Alertmanager**：原生告警引擎；
- **告警路由**：按 service / severity / cluster 路由；
- **告警抑制**：上游故障抑制下游；
- **告警聚合**：按血缘 + 时间窗口聚合；
- **告警模板**：必含指标 + 阈值 + 影响范围 + Runbook + Owner。

**第七层：存储层。**
- **指标存储**：Prometheus（短）+ Thanos / Cortex（长）；
- **降采样**：原始 7 天；5min 30 天；1h 1 年；
- **异常事件**：Kafka 短期 + Iceberg / ClickHouse 长期；
- **血缘存储**：Neo4j / Neptune（图数据库）。

**第八层：性能与延迟预算。**
- **采集延迟**：5-15s；
- **传输延迟**：< 1s；
- **处理延迟**：1-10s；
- **检测延迟**：< 1s；
- **告警延迟**：< 30s；
- **总延迟**：30s-2min（行业 SLO < 5min）。

**第九层：高可用与扩展。**
- **Kafka**：3-5 broker；replication=3；min-ISR=2；
- **Flink**：JobManager 2 副本 + ZK 选主；TaskManager N 副本；
- **Prometheus**：联邦 + remote write + Thanos 集群；
- **Alertmanager**：集群模式（gossip 协议同步告警状态）。

**第十层：成本与容量。**
- **Kafka 容量**：10K 节点 × 200 指标 × 15s × 1KB = ~10MB/s 写入；
- **Flink 容量**：10 worker × 16 GB（状态）；checkpoints 100GB+；
- **TSDB 容量**：原始 7 天 × 10M series × 1KB = 7 TB；
- **存储成本**：月度 ~50K 美元（云上）；自建可大幅降低。

**3. 常见陷阱**

- **只做检测不做告警收敛。** 告警风暴淹没 oncall。
- **Flink state 太大。** 状态后端没 TTL 或 compaction 会爆。
- **不做降采样。** 长期存储成本爆炸。
- **告警无 oncall。** 告警出来没人处理。
- **不做混沌演练。** 故障预案不演练等于不存在。

**4. 追问预测**

- **「Kafka 容量怎么估？」** 答：节点数 × 每节点指标数 × scrape 间隔 × 平均 size；再 × 副本数 = 总容量。
- **「Flink 状态多大合适？」** 答：单作业 < 100GB；超大状态用 RocksDB + 异步 checkpoint。
- **「Prometheus 联邦与 Remote Write 选哪个？」** 答：联邦适合聚合查询；Remote Write 适合长期存储；可同时用。

**5. 参考资料**

- Apache Flink 官方文档中 `Streaming Architecture` 与 `State Backends` 章节——Flink 流处理架构。
- Apache Kafka 官方文档中 `Capacity Planning` 章节——Kafka 容量估算。
- Prometheus / Thanos 官方文档——Prometheus 联邦与远程写入。
- Uber / Netflix / 阿里巴巴关于万节点监控架构的公开文章——头部企业的实战经验。
- 阿里 / 字节关于监控平台建设的公开分享——国内大规模生产经验。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。
- **中国电信** —— 中国电信的 BSS 数据湖——计费、营账、客户数据统一入湖 + 实时营销推荐。
- **中国移动** —— 中国移动的实时话单 Flink 引擎——PB 级话单走 Flink 流 + Spark 小时级对账。
- **中国联通** —— 中国联通网络运维数据平台——告警、性能、配置的统一存储与 AI 故障预测。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接待联网环境补全。

---

---
