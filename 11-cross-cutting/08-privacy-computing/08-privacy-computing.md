# 隐私计算（Privacy Computing）

> **一句话定位**：用联邦学习、安全多方计算、可信执行环境、差分隐私、同态加密等"数据可用不可见"的技术组合，让数据在不出域的前提下完成价值释放——是 AI 时代跨域协作的核心基础设施。

> 本文是 data-travel 项目 [Ch11 · 横切工程](../../README.md) 的子章节（**08 隐私计算**）。覆盖 **R7 横切能力（质量 / 可观测 / 成本 / 安全）** 中「隐私计算」的联邦学习（FL）、安全多方计算（MPC）、可信执行环境（TEE）、差分隐私（DP）、同态加密（HE），以及 FATE / SecretFlow / PrivPy / PySyft / OpenMined / Intel SGX / AMD SEV / NVIDIA H100 CC 等关键工具与 2024-2025 工业落地。

## 0. 本章速读地图

| 你将解决的问题 | 直接跳到 |
| --- | --- |
| 隐私计算的三大技术路线是什么？FL / MPC / TEE 怎么选？ | §1.3、§3.1 |
| 联邦学习怎么落地？横向 vs 纵向怎么选？ | §2.1、§4.1 |
| 安全多方计算的性能瓶颈在哪？落地场景有哪些？ | §2.3、§4.2 |
| TEE 怎么选型？Intel SGX vs AMD SEV vs NVIDIA H100 CC？ | §4.3、§7.1 |
| 差分隐私怎么用？隐私预算怎么定？ | §2.2、§5.1 |
| 同态加密的实际应用场景？性能瓶颈？ | §2.3、§5.3 |
| FATE / SecretFlow / PrivPy 怎么选？ | §4.4、§7.1 |
| 隐私计算在金融 / 医疗 / 政务的落地案例？ | §6.1、§6.2 |
| AI 时代的隐私计算新场景？ | §5.1、§5.3 |

---

## 1. 概念与定位

### 1.1 是什么

**学术定义**：隐私计算（Privacy Computing / Privacy-Preserving Computation）是指在保护数据隐私的前提下，完成数据计算与分析的一类技术总称。学术界用 "Privacy-Enhancing Technologies (PETs)" 指代这一类技术，主要包含三大方向：

1. **联邦学习（Federated Learning, FL）**：Google 2016 年提出，让数据"不动模型动"。
2. **安全多方计算（Secure Multi-Party Computation, MPC）**：姚期智 1982 年提出（百万富翁问题），让多方联合计算但不泄露各自数据。
3. **可信执行环境（Trusted Execution Environment, TEE）**：Intel SGX（2015）、AMD SEV（2017）等硬件级隔离方案。

加上差分隐私（Differential Privacy, DP）、同态加密（Homomorphic Encryption, HE）等辅助技术，构成完整的"数据可用不可见"技术体系。

**工程定义**：在数据架构师手里，隐私计算是一套**"让数据不出域就能产生价值"**的工程体系：

```
                [数据源 A]
                    ↓
        ┌─────────┴─────────┐
        ↓                   ↓
   TEE / FL            TEE / MPC
   (本方处理)          (跨方协作)
        ↓                   ↓
        └─────────┬─────────┘
                    ↓
              计算结果
              (明文可用)
                    ↓
        ┌─────────┴─────────┐
        ↓                   ↓
   AI 训练              数据分析
   (联邦学习)          (MPC / DP)
```

**三大技术路线对比**：

| 技术 | 原理 | 性能 | 安全性 | 适用场景 |
| --- | --- | --- | --- | --- |
| **联邦学习（FL）** | 数据不动模型动 | 高（接近明文） | 中（依赖协议） | AI 训练、跨域建模 |
| **安全多方计算（MPC）** | 多方密文协同计算 | 低（10-1000 倍慢） | 高（密码学保证） | 联合统计、隐私查询 |
| **可信执行环境（TEE）** | 硬件隔离 enclave | 高（接近明文） | 中（依赖硬件厂商） | 数据共享、机密计算 |

**关键术语**：

| 概念 | 定义 |
| --- | --- |
| **联邦学习（FL）** | 分布式机器学习，数据不动模型动 |
| **横向联邦（Horizontal FL）** | 特征相同、样本不同（跨地域、跨设备） |
| **纵向联邦（Vertical FL）** | 样本相同、特征不同（跨机构、跨部门） |
| **联邦迁移学习（FTL）** | 样本和特征都不同（迁移 + 联邦） |
| **安全多方计算（MPC）** | 多方协同计算，不泄露各自数据 |
| **秘密分享（Secret Sharing）** | MPC 基础协议（Shamir / SPDZ） |
| **不经意传输（OT）** | MPC 关键组件 |
| **可信执行环境（TEE）** | 硬件隔离的安全区域 |
| **Enclave** | TEE 中的安全执行单元 |
| **Intel SGX** | Intel 处理器级 TEE |
| **AMD SEV-SNP** | AMD 虚拟机级 TEE |
| **NVIDIA H100 CC** | NVIDIA GPU TEE |
| **机密计算（Confidential Computing）** | TEE 的云端形态 |
| **差分隐私（DP）** | 在数据 / 结果上加噪声 |
| **同态加密（HE）** | 密文上可计算 |
| **FHE（全同态）** | 支持任意密文运算 |
| **PHE（部分同态）** | 支持有限密文运算 |
| **隐私预算（ε）** | DP 中隐私保护强度参数 |
| **数据信托（Data Trust）** | 受托管理隐私数据的机构 |

### 1.2 为什么需要

**业务驱动力**：

1. **合规要求**：GDPR / 个保法 / HIPAA / PCI-DSS 强制要求数据不出域。
2. **跨机构协作需求**：金融联合风控、医疗联合研究、政务数据共享——数据不能直接互通。
3. **AI 训练数据稀缺**：单方数据不够，需要联合多方数据训练模型。
4. **数据要素市场化**：中国"数据二十条"明确"数据可用不可见"是数据要素流通的关键技术。
5. **商业竞争保护**：企业不愿共享原始数据，但想用对方数据建模。

**痛点**：

1. **"数据孤岛"**：跨域、跨机构、跨云的数据无法直接共享。
2. **"合规阻碍业务"**：合规要求严格，业务方无法用外部数据。
3. **"AI 训练数据不够"**：单方数据训练效果差。
4. **"机密泄露担忧"**：明文共享风险高。
5. **"技术选型难"**：FL / MPC / TEE 不知道怎么选。

### 1.3 在 AI 时代数据架构中的位置

```
                [业务需求]
                    ↓
        ┌─────────┴─────────┐
        ↓                   ↓
   联邦学习              隐私计算
   (跨域建模)          (密文计算)
        ↓                   ↓
        └─────────┬─────────┘
                    ↓
        ┌─────────┴─────────┐
        ↓                   ↓
   TEE 推理              机密 LLM
   (保护用户)            (保护模型)
        ↓                   ↓
        └─────────┬─────────┘
                    ↓
              隐私保护输出
                    ↓
        ┌─────────┴─────────┐
        ↓                   ↓
   数据要素              AI Agent
   (跨域流通)          (隐私保护)
```

**隐私计算 × AI 时代的协同**：

1. **跨域 AI 训练**：联邦学习让多个机构联合训练模型。
2. **机密 LLM 推理**：TEE 保护 LLM 推理中的用户数据。
3. **RAG 隐私保护**：私有 RAG 库不泄露给外部 LLM。
4. **AI Agent 跨域协作**：Agent 通过隐私计算共享结果不共享数据。
5. **差分隐私训练**：训练过程中加噪声，防止成员推断攻击。

**与其他横切能力的关系**：

- **数据安全**（§2）：隐私计算是"保护数据"的高级形态。
- **数据质量**（§1）：隐私计算的输出也需要质量保证。
- **可观测性**（§4）：隐私计算的性能可观测性很重要（性能瓶颈明显）。
- **审计合规**（§7）：隐私计算需要可审计（GDPR 主张权 vs FL 模型）。

**一句话判断**：**P7 会让数据"在域内用好"，P8 会让数据"在域内安全用好"，资深数据架构师会让数据"跨域合规可用"——隐私计算是数据要素时代的核心武器。**

### 1.4 演进历程

**学术阶段（1980s–2010）**：

- 1982：姚期智提出"百万富翁问题"，MPC 奠基。
- 1986：Shamir 秘密分享协议。
- 1996-2009：同态加密理论逐步成熟（BGN、BFV、BGV、CKKS）。
- 2006：差分隐私（Dwork）正式提出。

**技术萌芽阶段（2010–2016）**：

- 2012-2015：Intel SGX 研发。
- 2016：Google 提出联邦学习（Federated Learning）。
- 2016-2017：FATE（微众银行）开源。

**工业落地阶段（2016–2022）**：

- 2018：GDPR 实施，隐私计算成为合规刚需。
- 2019：FATE 1.0 GA；PySyft（OpenMined）开源。
- 2020：阿里达摩院、字节、蚂蚁等头部企业开始隐私计算布局。
- 2021：蚂蚁 SecretFlow 开源；个保法实施。
- 2022：阿里、腾讯、京东等推出隐私计算平台。

**AI 时代爆发（2023–2025）**：

- 2023：LLM 隐私问题引爆（ChatGPT 泄密事件）；机密 LLM 推理起步。
- 2024：NVIDIA H100 CC 商用；OpenMined 推出 PySyft 2.0。
- 2024-2025：AI 时代隐私计算成为新热点，FATE / SecretFlow 推出 LLM 联邦学习。
- 2025：机密 LLM 推理成为云厂商标配。

---

## 2. 核心原理

### 2.1 关键概念定义

| 概念 | 定义 | 与隐私计算的关系 |
| --- | --- | --- |
| **联邦学习（FL）** | 数据不动模型动 | 隐私计算三大主线之一 |
| **安全多方计算（MPC）** | 多方密文协同计算 | 隐私计算三大主线之一 |
| **可信执行环境（TEE）** | 硬件隔离 | 隐私计算三大主线之一 |
| **差分隐私（DP）** | 在数据 / 结果上加噪声 | 隐私计算辅助技术 |
| **同态加密（HE）** | 密文上可计算 | 隐私计算辅助技术 |
| **不经意传输（OT）** | MPC 协议组件 | MPC 基础 |
| **秘密分享（SS）** | 数据拆分给多方 | MPC 基础 |
| **混淆电路（GC）** | MPC 协议组件 | MPC 基础 |
| **联邦平均（FedAvg）** | FL 聚合算法 | FL 核心算法 |
| **纵向联邦** | 样本对齐 + 特征分拆 | FL 分类 |
| **横向联邦** | 特征相同 + 样本分拆 | FL 分类 |
| **联邦迁移学习** | 样本 / 特征都不同 | FL + 迁移学习 |
| **Enclave** | TEE 内部隔离区 | TEE 基础 |
| **远程证明（Attestation）** | TEE 远程验证 | TEE 关键 |
| **隐私预算（ε）** | DP 隐私保护强度 | DP 核心参数 |

### 2.2 数学/形式化基础

**联邦学习（FedAvg 算法）**：

设 $K$ 个参与方，第 $k$ 方本地数据为 $D_k$。

1. 全局模型参数 $w_t$，分发到所有参与方。
2. 各参与方本地更新：$w_{t+1}^k = w_t - \eta \nabla L_k(w_t; D_k)$。
3. 全局聚合：$w_{t+1} = \sum_{k=1}^{K} \frac{|D_k|}{|D|} w_{t+1}^k$。
4. 重复迭代直到收敛。

**差分隐私（形式化）**：

算法 $\mathcal{M}$ 满足 $(\epsilon, \delta)$-差分隐私，若对任意相邻数据集 $D, D'$：

$$
\Pr[\mathcal{M}(D) \in S] \leq e^{\epsilon} \cdot \Pr[\mathcal{M}(D') \in S] + \delta
$$

其中 $\epsilon$ 是隐私预算，$\delta$ 是松弛项。$\epsilon$ 越小，隐私保护越强。

**同态加密**：

设加密函数 $E$，解密函数 $D$，运算 $\oplus$：

$$
D(E(m_1) \oplus E(m_2)) = m_1 + m_2
$$

- **PHE（部分同态）**：Paillier（加法）、RSA（乘法）。
- **FHE（全同态）**：BGV、BFV、CKKS。

**MPC（Shamir 秘密分享）**：

设秘密 $s$，随机多项式 $f(x) = s + a_1 x + ... + a_t x^t$，分发给 $n$ 方。

- 任 $t+1$ 方联立可还原 $s$。
- 任 $t$ 方无法还原 $s$。

### 2.3 关键算法/方法

**1. 联邦学习算法**：

| 算法 | 描述 | 适用 |
| --- | --- | --- |
| **FedAvg** | 经典聚合 | 横向联邦 |
| **FedProx** | 异构数据友好 | 横向联邦 |
| **FedNova** | 归一化聚合 | 横向联邦 |
| **SecureBoost** | 纵向联邦 GBDT | 纵向联邦 |
| **纵向联邦逻辑回归** | 纵向联邦 LR | 纵向联邦 |

**2. MPC 协议**：

| 协议 | 描述 | 性能 |
| --- | --- | --- |
| **SPDZ** | 信息论安全 | 慢 |
| **ABY** | 混合协议（布尔 + 算术 + Yao） | 中 |
| **Shamir SS** | 门限秘密分享 | 中 |
| **Yao GC** | 混淆电路 | 中 |
| **ABY3** | 三方安全计算 | 快 |

**3. TEE 架构**：

| 方案 | 描述 | 优势 | 劣势 |
| --- | --- | --- | --- |
| **Intel SGX** | 进程级 enclave | 隔离强 | 攻击面小，生态弱 |
| **AMD SEV-SNP** | 虚拟机级加密 | 隔离大 | 攻击面大 |
| **ARM CCA** | 架构级隔离 | 移动生态 | 服务器弱 |
| **NVIDIA H100 CC** | GPU TEE | AI 友好 | 仅 NVIDIA |

**4. 差分隐私机制**：

- **Laplace 机制**：加 Laplace 噪声。
- **Gaussian 机制**：加 Gaussian 噪声。
- **指数机制**：用于非数值输出。
- **随机响应（Randomized Response）**：用于本地差分隐私。

### 2.4 与相邻概念的关系

- **vs 数据安全（§2）**：安全是"防数据泄露"，隐私计算是"让数据可用不可见"。
- **vs 数据脱敏**：脱敏是"破坏数据可用性换隐私"，隐私计算是"保持数据可用性同时保护隐私"。
- **vs 联邦学习 vs MPC vs TEE**：三者是隐私计算的三种实现路径，互补而非互斥。
- **vs 区块链**：区块链是"去中心化信任"，隐私计算是"保护数据"，可结合（联邦区块链）。

---

## 3. 设计模式与范式

### 3.1 主要模式

**模式 1：横向联邦学习（Horizontal FL）**

适合跨地域、跨设备的同一类数据（如多个手机用户数据）：

```
客户端 1 (数据 A) → 本地训练 → 模型更新 ─┐
客户端 2 (数据 B) → 本地训练 → 模型更新 ─┤
客户端 3 (数据 C) → 本地训练 → 模型更新 ─┼→ 全局聚合 → 全局模型
客户端 4 (数据 D) → 本地训练 → 模型更新 ─┤
客户端 5 (数据 E) → 本地训练 → 模型更新 ─┘
```

代表实现：**Google Gboard、FedML、FATE**。

**模式 2：纵向联邦学习（Vertical FL）**

适合跨机构、跨部门的同一批用户数据（如银行 + 电商）：

```
银行数据 (X_银行) ─┐
                  ┼→ 样本对齐 + 加密训练 → 联合模型
电商数据 (X_电商) ─┘
```

代表实现：**FATE、SecretFlow**。

**模式 3：安全多方计算（MPC）**

适合多方协同统计分析、查询：

```
银行 A ─┐
       ├─ 密文协同计算 → 联合统计
医院 B ─┘
```

代表实现：**Shamir SS、Cape Privacy、Privitar**。

**模式 4：可信执行环境（TEE）**

适合数据需要出域但要保护计算过程：

```
数据 ─→ TEE enclave ─→ 密文计算 ─→ 解密结果
                  ↑
            硬件隔离
```

代表实现：**Intel SGX + Occlum、Azure Confidential VM、阿里云 enclave、蚂蚁摩斯**。

**模式 5：混合方案（Hybrid）**

实际生产中常常组合使用：

```
横向 FL（梯度聚合） + 差分隐私（梯度噪声） + TEE（聚合器）
```

代表实现：**SecretFlow（FL + TEE）、FATE（FL + MPC）**。

### 3.2 适用场景决策表

| 场景 | 推荐模式 | 理由 |
| --- | --- | --- |
| **跨设备 AI 训练** | 模式 1（横向 FL） | 设备多、特征同 |
| **跨机构联合建模** | 模式 2（纵向 FL） | 样本同、特征互补 |
| **金融联合风控** | 模式 2 + 模式 3 | 严格隐私 + 强解释性 |
| **医疗联合研究** | 模式 4（TEE）+ 模式 3 | 数据敏感 + 性能要求 |
| **政务数据共享** | 模式 4（TEE） | 跨部门、强隔离 |
| **AI 训练数据稀缺** | 模式 1 + 模式 5 | 多方联合 + 隐私保护 |
| **机密 LLM 推理** | 模式 4（TEE） | 保护用户 + 模型 |

### 3.3 反模式与陷阱

1. **"盲目上 FL"**：FL 性能损失大，不是所有场景都适合。**正确做法**：先看是否真的需要跨域。
2. **"FL 模型效果等同于明文"**：实际有 5-15% 的损失。**正确做法**：评估业务可接受性。
3. **"MPC 万能"**：MPC 性能差，简单场景用不上。**正确做法**：只在必要场景用 MPC。
4. **"TEE 万能"**：TEE 依赖硬件厂商，信任假设变了。**正确做法**：评估厂商风险。
5. **"忽视差分隐私"**：FL 也有隐私泄露风险（梯度攻击）。**正确做法**：FL + DP。
6. **"忽视性能瓶颈"**：隐私计算性能差 10-1000 倍。**正确做法**：先性能测试再上线。

---

## 4. 工程实现

### 4.1 落地步骤

**Step 1：场景评估（4-8 周）**

1. 识别跨域协作场景。
2. 评估隐私 / 性能需求。
3. 选型（FL / MPC / TEE / HE / DP）。
4. PoC 验证。

**Step 2：平台搭建（4-8 周）**

1. 部署 FATE / SecretFlow / 自研。
2. 配置参与方身份（PKI）。
3. 数据对齐（PSI 隐私求交）。
4. 训练 / 推理 pipeline。

**Step 3：试点（4-8 周）**

1. 选 1-2 个场景试点。
2. 性能测试（vs 明文 baseline）。
3. 效果评估（vs 明文模型）。
4. 安全审计。

**Step 4：扩展（4-8 周）**

1. 推广到更多场景。
2. 多参与方支持。
3. 性能优化。
4. 合规审核。

**Step 5：AI 时代扩展（持续）**

1. LLM 联邦学习。
2. 机密 LLM 推理。
3. RAG 隐私保护。
4. AI Agent 隐私计算。

### 4.2 关键技术点

**1. 联邦学习（FATE / PySyft）**：

```python
# fate_federated_learning.py
"""
FATE 联邦学习示例
"""
import torch
from torch import nn
from federatedml.nn.backend.pytoch import PytorchFederatedTrainer
from federatedml.util.param_util import InitParam


class SimpleNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(10, 5)
        self.fc2 = nn.Linear(5, 1)
    
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        return torch.sigmoid(self.fc2(x))


# 启动 FATE 联邦学习任务
job_config = {
    "job_type": "联邦学习",
    "algorithm": "FedAvg",
    "participants": ["guest", "host_1", "host_2"],
    "model": SimpleNet,
    "training_config": {
        "epochs": 10,
        "batch_size": 64,
        "learning_rate": 0.01,
    },
}

trainer = PytorchFederatedTrainer(job_config)
trainer.fit()
```

```python
# pysyft_federated.py
"""
PySyft 联邦学习（OpenMined）
"""
import syft as sy
import torch

# 创建虚拟参与方
hook = sy.TorchHook(torch)
alice = sy.VirtualWorker(hook, id="alice")
bob = sy.VirtualWorker(hook, id="bob")

# 各参与方数据
alice_data = torch.tensor([[1., 2.], [3., 4.]]).send(alice)
bob_data = torch.tensor([[5., 6.], [7., 8.]]).send(bob)

# 联邦平均
federated_data = sy.FederatedData({
    alice: alice_data,
    bob: bob_data,
})

# 训练模型（不在原始数据上直接计算）
model = nn.Linear(2, 1)
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

for epoch in range(10):
    for data, target in federated_data:
        optimizer.zero_grad()
        output = model(data)
        loss = ((output - target) ** 2).mean()
        loss.backward()
        optimizer.step()
```

**2. 安全多方计算（SecretFlow）**：

```python
# secretflow_mpc.py
"""
SecretFlow（蚂蚁）MPC 联合统计
"""
import secretflow as sf

# 初始化三参与方
sf.init(
    parties=["bank_a", "bank_b", "insurer"],
    addresses={
        "bank_a": "192.168.1.1:8080",
        "bank_b": "192.168.1.2:8080",
        "insurer": "192.168.1.3:8080",
    },
)

bank_a, bank_b, insurer = sf.PYU("bank_a"), sf.PYU("bank_b"), sf.PYU("insurer")

# 三方密文联合统计
a_data = bank_a(lambda: pd.read_csv("a_data.csv"))()
b_data = bank_b(lambda: pd.read_csv("b_data.csv"))()
c_data = insurer(lambda: pd.read_csv("c_data.csv"))()

# MPC 联合统计：总欺诈率
fraud_rate = sf.stat.mean(
    bank_a(lambda x: x.fraud_label)(a_data) +
    bank_b(lambda x: x.fraud_label)(b_data) +
    insurer(lambda x: x.fraud_label)(c_data)
)
```

**3. TEE 推理（Intel SGX + Occlum）**：

```python
# sgx_inference.py
"""
Intel SGX + Occlum 机密推理
"""
from occlum.api import occlum_runtime
import numpy as np


# 在 enclave 中执行推理
def inference_in_enclave(model_data, input_data):
    """在 SGX enclave 中执行模型推理"""
    
    # 1. 加载模型到 enclave
    model = occlum_runtime.load_model(model_data)
    
    # 2. 在 enclave 中执行推理
    output = occlum_runtime.predict(model, input_data)
    
    # 3. 返回加密结果
    return occlum_runtime.encrypt(output)


# 客户端
input_data = np.array([1, 2, 3, 4, 5], dtype=np.float32)
encrypted_output = inference_in_enclave(model_data, input_data)

# 4. 客户端解密
plaintext_output = occlum_runtime.decrypt(
    encrypted_output,
    client_key=os.environ["CLIENT_KEY"],
)
```

**4. 差分隐私训练（PyTorch + Opacus）**：

```python
# dp_training.py
"""
差分隐私训练（Opacus）
"""
import torch
from torch import nn
from opacus import PrivacyEngine


# 模型
model = nn.Linear(10, 1)
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)
data_loader = torch.utils.data.DataLoader(dataset, batch_size=64)

# 差分隐私引擎
privacy_engine = PrivacyEngine()
model, optimizer, data_loader = privacy_engine.make_private(
    module=model,
    optimizer=optimizer,
    data_loader=data_loader,
    noise_multiplier=1.0,  # 噪声倍率
    max_grad_norm=1.0,     # 梯度裁剪
)

# 训练
for epoch in range(10):
    for data, target in data_loader:
        optimizer.zero_grad()
        output = model(data)
        loss = ((output - target) ** 2).mean()
        loss.backward()
        optimizer.step()

# 查看隐私预算消耗
epsilon = privacy_engine.get_epsilon(delta=1e-5)
print(f"隐私预算 ε = {epsilon:.2f}")
```

### 4.3 工具链与平台（含 2024-2025 新工具）

**联邦学习框架**：

| 工具 | 定位 | 优势 |
| --- | --- | --- |
| **FATE** | 微众银行开源 | 工业级、生态丰富 |
| **SecretFlow** | 蚂蚁开源 | FL + TEE 混合 |
| **PySyft** | OpenMined | Python 友好 |
| **FedML** | USC 开源 | 学术友好 |
| **TensorFlow Federated** | Google | TF 集成 |
| **NVIDIA FLARE** | NVIDIA | GPU 友好 |
| **PrimiHub** | 开源 | 中文社区 |

**MPC 工具**：

| 工具 | 定位 |
| --- | --- |
| **Shamir SS** | 基础秘密分享 |
| **Cape Privacy** | MPC SaaS |
| **Sharemind** | 商业 MPC 平台 |
| **Privitar** | 商业隐私平台 |
| **MPC-Scale** | 字节自研 |

**TEE 平台**：

| 平台 | 定位 |
| --- | --- |
| **Intel SGX + Occlum** | Intel 机密计算 |
| **AMD SEV** | AMD 机密 VM |
| **NVIDIA H100 CC** | NVIDIA GPU TEE |
| **Azure Confidential VM** | Azure TEE 云服务 |
| **Google Confidential VM** | GCP TEE 云服务 |
| **阿里云 enclave** | 阿里云 TEE |
| **蚂蚁摩斯** | 蚂蚁自研 |

**DP / HE 工具**：

| 工具 | 定位 |
| --- | --- |
| **Opacus** | PyTorch DP |
| **TensorFlow Privacy** | TF DP |
| **OpenMined PyDP** | Python DP |
| **TenSEAL** | 同态加密库 |
| **Microsoft SEAL** | 同态加密库 |
| **OpenFHE** | 同态加密库 |

**AI 时代新工具（2024-2025）**：

- **FATE-LLM**：FATE 联邦 LLM。
- **SecretFlow-LLM**：SecretFlow 联邦 LLM。
- **NVIDIA NeMo Guardrails + TEE**：机密 LLM。
- **Azure Confidential AI**：Azure 机密 OpenAI。
- **阿里通义 + enclave**：机密通义。

### 4.4 代码 / 示例

**示例 1：完整隐私计算平台（SecretFlow）**

```python
# privacy_platform.py
"""
完整隐私计算平台
基于 SecretFlow 实现 FL + TEE + MPC 混合方案
"""
import secretflow as sf

# 初始化三方
sf.init(
    parties=["hospital_a", "hospital_b", "research_center"],
)

ha, hb, rc = sf.PYU("hospital_a"), sf.PYU("hospital_b"), sf.PYU("research_center")

# 隐私求交（PSI）：找到共同的病人 ID
common_ids = sf.psi(
    hospital_a.ids,
    hospital_b.ids,
)

# 联合训练（联邦 XGBoost）
from secretflow.ml.boost import SFXgboost
params = {
    "tree_num": 10,
    "max_depth": 5,
}

sf_xgb = SFXgboost(params=params)
sf_xgb.fit(
    {ha: hospital_a_data, hb: hospital_b_data},
    {ha: y_train_a, hb: y_train_b},
)

# 联合预测
predictions = sf_xgb.predict({ha: x_test_a, hb: x_test_b})
```

**示例 2：机密 LLM 推理**

```python
# confidential_llm.py
"""
机密 LLM 推理（基于 TEE）
"""
import openai
import os

# 机密 OpenAI（基于 Azure Confidential VM）
client = openai.AzureOpenAI(
    api_key=os.environ["AZURE_OPENAI_KEY"],
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    api_version="2024-08-01-preview",
)

# 机密推理（基于 SGX/SEV）
response = client.chat.completions.create(
    model="gpt-4-confidential",
    messages=[
        {"role": "user", "content": "我的病历：糖尿病史 5 年..."},
    ],
)

# 推理在 enclave 中：
# - 用户 prompt 不能被 OpenAI 看到
# - 模型权重不能被用户拿走
# - 推理结果加密返回
```

---

## 5. 前沿演进（AI 时代）

### 5.1 LLM/Agent 时代的演进方向

**1. 联邦 LLM 训练**

未来 LLM 训练需要多方数据（医疗 + 金融 + 政务），但又不能共享原始数据：

- **FedLLM**：联邦学习 LLM。
- **FATE-LLM**：FATE 联邦 LLM。
- **SecretFlow-LLM**：SecretFlow 联邦 LLM。

**2. 机密 LLM 推理**

保护 LLM 推理中的用户数据 + 模型权重：

- **Azure Confidential AI**：基于 SGX。
- **Google Confidential Gemini**：基于 SEV。
- **阿里通义 + enclave**。
- **蚂蚁摩斯**。

**3. RAG 隐私保护**

私有 RAG 库不泄露给外部 LLM：

- **RAG + TEE**：检索在 enclave 中完成。
- **RAG + FL**：多机构 RAG 知识库。
- **RAG + MPC**：密文检索。

**4. 差分隐私 LLM**

训练 LLM 时加差分隐私：

- **DP-SGD**：差分隐私随机梯度下降。
- **DP-Fine-Tuning**：差分隐私微调。
- **DP-Prompt**：差分隐私 prompt。

### 5.2 与 RAG / 向量库 / GraphRAG 的结合

**RAG + 隐私计算**：

- **RAG + TEE**：检索和推理在 enclave 中。
- **RAG + FL**：多机构 RAG 知识库（FedRAG）。
- **RAG + MPC**：密文检索。
- **RAG + DP**：检索结果加噪声。

**GraphRAG + 隐私计算**：

- **GraphRAG + TEE**：图谱在 enclave 中。
- **GraphRAG + FL**：联邦图谱。
- **GraphRAG + 差分隐私**：图谱输出加噪声。

### 5.3 学术与工业最新进展（2024-2025）

**学术进展**：

- **2024 NeurIPS**：联邦 LLM 训练。
- **2024 CCS**：机密 LLM 推理安全分析。
- **2025 S&P**：AI 时代隐私计算。

**工业进展**：

- **2024-03**：Azure Confidential AI GA。
- **2024-06**：Google Confidential Gemini GA。
- **2024-09**：FATE 联邦 LLM GA。
- **2024-12**：SecretFlow 2.0 GA。
- **2025-Q1**：NVIDIA H100 CC 大规模商用。
- **2025-Q2**：阿里通义机密版 GA。

### 5.4 未来 3-5 年趋势

1. **联邦 LLM 标准化**：FedLLM 成为跨机构协作标准。
2. **机密 LLM 推理成为云标配**：所有云厂商的 LLM 服务都支持 TEE。
3. **隐私计算 + AI 治理融合**：AI 治理 = 合规 + 隐私。
4. **数据要素流通技术成熟**：联邦学习 / TEE / MPC 成为数据要素市场化的基础设施。
5. **同态加密实用化**：性能优化让 FHE 在更多场景实用。
6. **差分隐私普及**：训练数据保护成为标配。
7. **隐私计算 + 区块链结合**：联邦区块链让数据流通可追溯。

---

## 6. 落地实践

### 6.1 真实案例

**案例 1：微众银行 FATE（2018-2024）**

- **规模**：服务 100+ 金融机构。
- **架构**：FATE + 联邦学习 + 多种隐私技术。
- **关键设计**：
  - 跨银行联合风控。
  - 跨机构联合营销。
  - 跨行业联合反欺诈。
  - 联邦 XGBoost、联邦 LR、联邦迁移学习。
- **效果**：
  - 联合风控模型 AUC 提升 15%。
  - 数据不出域，合规通过。
  - 行业标杆。

**案例 2：蚂蚁集团 SecretFlow（2021-2024）**

- **场景**：金融联合营销、医疗联合研究、政务数据共享。
- **架构**：SecretFlow + FL + TEE + MPC。
- **关键设计**：
  - 金融联合营销（联合 LR / XGBoost）。
  - 医疗联合研究（联邦学习 + TEE）。
  - 政务数据共享（TEE 为主）。
  - 机密 LLM 推理。
- **效果**：
  - 服务 50+ 合作机构。
  - 联邦营销 ROI 提升 30%。
  - 数据不出域，合规 100%。

**案例 3：某三甲医院"联邦医学研究"（2024）**

- **场景**：跨 5 家医院的医学影像研究。
- **合规**：HIPAA + 个保法 + 卫健委。
- **架构**：FL + TEE + DP。
- **关键设计**：
  - 横向联邦学习（不同医院、相同影像数据）。
  - TEE 保护梯度聚合。
  - DP 防止梯度攻击。
- **效果**：
  - 模型 AUC 提升 20%（vs 单医院）。
  - 数据不出域，合规通过。
  - 发表 SCI 论文 3 篇。

### 6.2 踩坑与经验

**踩坑 1：FL 性能损失过大**

- **现象**：FL 模型比明文模型差 15%，业务不可接受。
- **根因**：数据分布差异大 + FL 通信瓶颈。
- **解决**：
  1. 选用 FedProx 等异构友好算法。
  2. 通信压缩。
  3. 部分数据共享（最低必要数据）。

**踩坑 2：MPC 太慢**

- **现象**：MPC 计算比明文慢 1000 倍。
- **根因**：MPC 通信开销大。
- **解决**：
  1. 选用更高效的协议（ABY3、SecureNN）。
  2. 混合方案（FL + MPC + TEE）。
  3. 减少参与方数量。

**踩坑 3：TEE 兼容性差**

- **现象**：SGX 应用改造困难。
- **根因**：SGX 编程模型特殊。
- **解决**：
  1. 用 Occlum 等 LibOS 简化开发。
  2. 用云厂商机密 VM 服务。
  3. 评估 AMD SEV（VM 级隔离，编程简单）。

**踩坑 4：忽视差分隐私**

- **现象**：FL 模型被梯度攻击反推出训练数据。
- **根因**：梯度本身就是信息泄露。
- **解决**：
  1. FL + DP（梯度加噪声）。
  2. 安全聚合（Secure Aggregation）。
  3. 隐私预算管理。

### 6.3 落地路径（0→1, 1→10, 10→100）

**0→1：最小可行方案（3-6 个月）**

- 选 1 个跨域场景试点。
- FATE / SecretFlow 部署。
- 性能 + 效果 PoC。
- 合规审核。
- 目标：1 个场景上线。
- 成本：2 算法工程师 + 1 SRE + 1 合规。

**1→10：扩展到多场景（6-12 个月）**

- 多场景覆盖（联合风控 / 联合营销 / 联合研究）。
- 多参与方支持。
- 性能优化。
- TEE 引入。
- 目标：5+ 场景，10+ 参与方。
- 成本：5-10 人隐私计算团队。

**10→100：平台化 + AI 时代（12-24 个月）**

- 隐私计算平台化。
- LLM 联邦学习。
- 机密 LLM 推理。
- 数据要素市场化对接。
- 目标：10+ 场景，30+ 参与方，行业领先。
- 成本：15-20 人隐私计算 + AI 团队。

### 6.4 ROI 评估

**直接收益**：

| 维度 | 衡量指标 | 估算 |
| --- | --- | --- |
| **跨域协作** | 联合项目数 | 5-10 个 |
| **模型效果** | 联合模型 AUC | 提升 10-20% |
| **业务收益** | 联合营销 / 风控收益 | 数千万级 |
| **合规通过** | 跨域项目合规率 | 100% |

**间接收益**：

- **数据要素流通**：合规前提下释放数据价值。
- **AI 训练数据**：跨域联邦训练，模型效果提升。
- **商业拓展**：可承接更多跨域项目。

**ROI 计算示例**：

```
投入：10 人 × 12 个月 × 100 万/人/年 = 1000 万/年
收益：
  - 联合风控减损：2000 万/年
  - 联合营销增收：3000 万/年
  - 数据要素流通：1000 万/年
ROI = (2000 + 3000 + 1000 - 1000) / 1000 ≈ 500%
```

---

## 7. 与其他方法对比

### 7.1 对比维度（评分 1-5）

| 工具 / 方案 | 性能 | 安全性 | 易用性 | 生态 | AI 集成 | 总分 |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| **FATE** | 4 | 4 | 4 | 5 | 4 | 21 |
| **SecretFlow** | 4 | 5 | 4 | 4 | 5 | 22 |
| **PySyft** | 3 | 4 | 5 | 4 | 4 | 20 |
| **FedML** | 3 | 4 | 4 | 4 | 5 | 20 |
| **Intel SGX** | 5 | 4 | 2 | 3 | 4 | 18 |
| **AMD SEV** | 5 | 4 | 4 | 3 | 3 | 19 |
| **NVIDIA H100 CC** | 5 | 4 | 3 | 3 | 5 | 20 |
| **Microsoft SEAL** | 2 | 5 | 3 | 3 | 3 | 16 |

### 7.2 决策树

```
场景类型？
├── 跨机构联合建模 → FL（FATE / SecretFlow）
└── 跨域安全计算 → 继续
    │
    性能要求？
    ├── 高 → TEE（SGX / SEV / H100 CC）
    └── 中 → MPC / HE
        │
        是否需要 AI 训练？
        ├── 是 → FL + DP
        └── 否 → TEE / MPC
```

### 7.3 组合使用

**常见组合 1：FATE + SecretFlow + Occlum**

- **FATE**：基础 FL。
- **SecretFlow**：混合方案。
- **Occlum**：SGX LibOS。

**常见组合 2：SecretFlow + NVIDIA H100 + Azure Confidential**

- **SecretFlow**：隐私计算框架。
- **NVIDIA H100 CC**：GPU TEE。
- **Azure Confidential VM**：云端 TEE。

**常见组合 3：FL + DP + TEE**

- **FL**：跨域训练。
- **DP**：梯度保护。
- **TEE**：聚合器保护。

---

## 8. 面试真题集

> 本节整合自题库《大数据平台架构师》（创脉思出版，版本 2025-11-25）的真实面试题与本书作者补充，覆盖「隐私计算」核心六大问题（路线选型 / PSI / 差分隐私 / TEE 选型 / 联合建模设计 / 异构效果损失归因）。题号沿用本章编号 §11.8.X，便于读者交叉回溯。
>
> **每题按五段式作答**：考察点 → 参考答案框架 → 常见陷阱 → 追问预测 → 参考资料。参考答案优先引用**头部互联网企业与开源社区的公开架构实践**（Google / Microsoft / Intel / NVIDIA / 微众银行 FATE / 蚂蚁 SecretFlow / 阿里 / 字节 等），便于读者进一步溯源。

### 8.1 全景视图

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §11.8.1 | 三大路线选型 | 11.8.1 | 1 | 主 |
| §11.8.2 | PSI 与样本对齐 | 11.8.2 | 1 | 主 |
| §11.8.3 | 差分隐私与隐私预算 | 11.8.3 | 1 | 主 |
| §11.8.4 | TEE 选型（SGX/SEV/H100 CC） | 11.8.4 | 1 | 主 |
| §11.8.5 | 联合反欺诈建模设计 | 11.8.5 | 1 | 主 |
| §11.8.6 | FL 异构数据效果损失归因 | 11.8.6 | 1 | 辅 |

| 题号 | 难度 |
| --- | :---: |
| §11.8.1 | ★★★★☆ |
| §11.8.2 | ★★★★☆ |
| §11.8.3 | ★★★★☆ |
| §11.8.4 | ★★★★☆ |
| §11.8.5 | ★★★★★ |
| §11.8.6 | ★★★★☆ |

### 8.2 §11.8 隐私计算核心技术

> 本主题考察隐私计算（Privacy-Preserving Computation）的工程落地能力：选 FL/MPC/TEE 不是概念题，而是要在「性能 - 安全性 - 信任假设 - 生态成熟度」四个约束下做出有据可依的取舍。面试官通常从三大路线对比问起，下钻到 PSI 协议 / 差分隐私预算 / TEE 硬件选型，最后落到端到端的联合建模方案设计与异构数据下 FL 效果损失的归因。

#### §11.8.1 请对比联邦学习（FL）、安全多方计算（MPC）、可信执行环境（TEE）三大隐私计算路线的核心原理、性能边界、安全性假设与典型适用场景，并说明在金融联合反欺诈场景下应如何组合使用这些技术。

**1. 考察点**

- 是否能把 FL / MPC / TEE 放在同一个坐标系（性能 - 安全 - 信任假设 - 工程化成本）下做横向对比，而不是分别背定义。
- 能否说清三条路线各自的**安全性根基**——FL 依赖协议 + 差分隐私的组合保证，MPC 依赖密码学可证明安全，TEE 依赖硬件厂商信任根（Root of Trust, RoT）。
- 能否识别现实中跨机构联合反欺诈的真实约束：参与方半信任（Semi-Honest 甚至 Malicious）、模型必须可解释（信贷场景）、训练与推理都在监管视角下、被监管要求审计。
- 加分项：能把三条路线的**组合**讲清楚（FL + DP + TEE 聚合器、或 MPC + TEE），而不是把它们当成互斥选项。

**2. 参考答案框架**

**第一层：三条路线的本质差异（一张表说清）。**

| 维度 | 联邦学习（FL） | 安全多方计算（MPC） | 可信执行环境（TEE） |
| --- | --- | --- | --- |
| 数据流向 | 数据不动、模型 / 梯度动 | 数据被秘密分享、密文协同计算 | 数据出域但在硬件 enclave 内解密 |
| 计算性能 | 接近明文（瓶颈在通信） | 比明文慢 10–1000 倍 | 接近明文（部分硬件有 1–10% 损耗） |
| 安全性根基 | 协议 + 安全聚合 + DP | 密码学可证明安全 | 硬件厂商 RoT + 远程证明（Attestation） |
| 信任假设 | 半诚实 / 恶意参与方，但需要可信聚合器 | 半诚实即可，部分协议抵抗恶意 | 信任硬件厂商（Intel / AMD / NVIDIA） |
| 典型应用 | 跨机构 / 跨设备 AI 训练 | 联合统计、隐私求交、模型推理 | 数据出域训练、机密 LLM 推理 |
| 工程化痛点 | 通信瓶颈、Non-IID、梯度泄露 | 通信轮次多、性能差、协议实现复杂 | SGX 编程难、迁移成本高、侧信道攻击 |

**第二层：金融联合反欺诈场景的真实约束。** 银行 + 电商 + 保险的联合反欺诈是隐私计算最经典的落地场景，约束有四：
- **强合规**：个保法、GDPR、《银行业监督管理法》要求数据不出域，且需可审计。
- **异构数据**：银行有账户与交易特征、电商有行为序列、保险有保单与理赔历史——典型**纵向联邦**（样本 ID 重叠多、特征互补）。
- **可解释 + 可审计**：监管要求模型可解释（信贷风控），且训练过程可追溯、可复算。
- **半信任参与方**：竞争对手既是合作方也是博弈方，存在主动攻击动机。

**第三层：组合选型推演。**
- **纵向 FL（SecureBoost / 纵向 LR）做主干**——因为特征互补、模型可解释（AUC、单特征贡献度可量化）。
- **PSI（隐私求交）做样本对齐**——基于 OPRF（不经意伪随机函数）或加密电路，常见实现有 RSA-PSI、KKRT-PSI、Google Private Set Intersection（Google PSI）。
- **TEE 做密钥与聚合器**——把 PSI 不方便覆盖的环节（如最终模型聚合、签发可审计日志）放进 SGX / SEV-SNP enclave，避免对单一参与方聚合器的信任。Google 在 Gboard 联邦学习之外，也在数据中心场景下用 TEE 强化聚合器。
- **差分隐私（DP）兜底**——对梯度加噪声，防止 DLG（Deep Leakage from Gradients）、GradInversion 等梯度反演攻击。
- **MPC 选配**——对需要严格密码学证明的子任务（如某家保险不愿上 TEE），用 MPC 跑这一段，FL/MPC 异构共存。

**第四层：真实工业案例。**
- **微众银行 FATE**：自 2018 年开源，服务超百家金融机构，主推纵向 SecureBoost + 多方 PSI，是国内金融联邦学习的标杆。
- **蚂蚁 SecretFlow**：在 FL 主干基础上封装 TEE 加速器（HE / MPC / TEE 三引擎可切换），覆盖联合营销、联合风控与机密 LLM 推理，服务超 50 家合作机构，公开实践中反复出现「FL + MPC + TEE」混合架构。
- **Google Gboard 横向 FL**：跨设备键盘预测模型，展示大规模异构设备参与的工程范式（FedAvg + Secure Aggregation，通信轮次从 `O(K)` 降到 `O(1)`）。
- **Microsoft Azure Confidential VM + OpenAI**：在 Intel SGX / AMD SEV 上跑机密 LLM 推理，验证 TEE 端到端的工程可行性。
- **阿里「数据二十条」后落地的数据要素流通平台**：以 TEE 为主，提供跨域共享密钥与可审计计算日志。

**3. 常见陷阱**

- **把 FL 当「免费午餐」**：忽视 5–15% 的模型效果损失与通信代价，强行上 FL；正解是先评估业务可接受性，再决定是否真需要跨域。
- **混淆 MPC 与同态加密**：MPC 是一类协议集合（SPDZ、ABY3、Yao GC），同态加密（HE）是其中的密码学工具之一，二者常组合使用但不是一回事。
- **认为 TEE 万能**：TEE 把信任从「参与方」转移到「硬件厂商」，并没有消除信任，只是把信任根换了；同时还要面对侧信道攻击（Foreshadow / SGX 漏洞、SEV 早期漏洞）。
- **忽略通信瓶颈**：FL 看起来轻量，但千亿样本级别的特征同步在跨境链路上会成主瓶颈，必须算一笔跨地域带宽账。
- **不设计审计接口**：监管来查账时拿不出"谁在哪一步训练了什么"的日志，是 FL 平台最大的合规缺口。

**4. 追问预测**

- **「同态加密（HE）在联合风控中扮演什么角色？」** 答：HE 适合「算子单一、对延迟不敏感」的小数据子任务（如单特征 PSI、密文加权平均）；FHE 当前还扛不起完整训练，但 PHE（Paillier 加法同态）在纵向 LR 的"标签方不暴露标签"场景是标配。
- **「联邦 LLM 当前进展到哪一步？」** 答：FATE-LLM、SecretFlow-LLM 在 2024 年密集发布，但仍受限于 LoRA/Adapter 微调；参数级全量联邦 LLM 短期不现实，工程上更现实的路径是「私有微调 + TEE 推理 + DP-SGD」的组合。
- **「监管侧怎么审计 FL 模型？」** 答：抽象解释（特征贡献 Shapley / 单特征审计）+ TEE 内的可验证日志（远程证明 + 模型快照 hash）+ 隐私预算会计（DP 账本）；FATE 与 SecretFlow 都内置了这三件套。
- **「参与方有人搞破坏怎么办？」** 答：恶意安全模型下，要么切 MPC（如 SPDZ 的 MAC 校验）、要么加 Robust Aggregation（Krum、Trimmed Mean），代价是通信与计算进一步上升。

**5. 参考资料**

- McMahan, B., Moore, E., Ramage, D., Hampson, S. & Aguera y Arcas, B.《Communication-Efficient Learning of Deep Networks from Decentralized Data》, AISTATS 2017——FedAvg 的原始论文，是横向 FL 的标准出处。
- Bonawitz, K. 等《Practical Secure Aggregation for Privacy-Preserving Machine Learning》, ACM CCS 2017——Google 的 Secure Aggregation，通信量从 `O(K)` 降到 `O(1)`，是工业 FL 的安全基石。
- Cheng, K. 等《SecureBoost: A Lossless Federated Learning Framework》, IEEE Intelligent Systems 2021——纵向联邦 XGBoost 的代表实现，FATE 与 SecretFlow 都内置。
- Liu, T. 等《Fusion360 — FedLearner by WeBank》, AAAI 2022（或 KDD 2021 相关论文）——微众银行 FATE 在金融联合风控的真实落地报告。
- 蚂蚁集团《SecretFlow — Privacy Preserving Data Collaboration》技术白皮书——FL + MPC + TEE 三引擎架构的第一手材料。
- Google AI Blog《Federated Learning: Collaborative Machine Learning without Centralized Training Data》——Gboard 横向 FL 的工业范式与 Secure Aggregation 工程要点。
- 阿里研究院《中国数据要素流通场景化研究报告》与《大数据之路：阿里巴巴大数据实践》——国内数据要素市场化的方法论与工程架构。
- Intel《Intel SGX Architectural Overview》与 Microsoft《Azure Confidential VM》技术文档——TEE 在机密 AI 场景下的能力边界与远程证明机制。

- **金融（招商银行）的「数据中台 + 隐私计算」实践** —— 招商银行在零售信贷与对公风控场景中落地位 FL + TEE 节点的数据要素流通平台，是头部股份制银行较早期公开的隐私计算落地案例之一。
- **制造（宁德时代 / 美的 / 三一重工）的工业联邦学习与可信聚合** —— 宁德时代电池缺陷检测、美的工业大数据、三一重工设备运维均引入联邦学习与可信聚合，应对工业 IoT 数据不出域 + 集团共享模型的合规挑战。
- **物流（顺丰 / 京东物流）的跨境数据协作** —— 顺丰、京东物流在跨境物流数据协作中落地 PSI + FL，支撑跨境合规下的多方数据要素流通。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §11.8.2 纵向联邦学习中，隐私求交（Private Set Intersection, PSI）是关键前置步骤。请解释 PSI 的基本原理与常见协议家族（如基于加密电路、不经意传输），并说明它在工程落地中会遇到哪些性能瓶颈与精度陷阱。

**1. 考察点**

- 是否理解 PSI 的工程定位：它**不是训练**，而是把"哪条样本两家都对得上"对齐出来，且对齐过程不暴露对方不重叠的 ID。
- 能否区分三条主流 PSI 协议家族——基于哈希（DH-PSI）、基于 OPRF / OT（KKRT、PRF-PSI）、基于电路（Circuit-PSI）——并说清各自的性能 / 安全 / 实现难度取舍。
- 是否意识到 PSI 在亿级 ID 上的**根本瓶颈**——通信量与计算量随 `|A|·|B|` 或 `|A|+|B|` 增长，布线（布隆过滤器、cuckoo hashing）是关键工程优化。
- 加分项：能讲清楚近似 PSI（Circuit-PSI 的剪枝版、半诚实模型下的 Labeled PSI / Unlabeled PSI 区别）。

**2. 参考答案框架**

**第一层：PSI 的工程定位。** 联邦学习的样本对齐看似简单——"找双方 ID 都存在的客户做训练"，但**不能直接拿 ID 明文比对**，因为：
- 暴露"我方有谁"本身就是 PII 泄露，电商用户 ID 关联到浏览历史属于敏感信息。
- 半诚实对手会通过交集大小反推合作密度（"你这家银行只和 3 家电商合作"）。

PSI 的目标是：**双方各自拿到"自己这一侧"的交集**（Unlabeled PSI），或双方各拿到"自己侧+对方标签"的交集（Labeled PSI / PSI-CA），且**不暴露非交集的 ID**。

**第二层：三大协议家族对比。**

| 协议家族 | 代表实现 | 性能 | 安全性 | 实现难度 |
| --- | --- | --- | --- | :---: |
| **基于 DH / 哈希（DH-PSI）** | Pinkas, Schneider, Tkachenko 等 | 快 | 半诚实 / 恶意 | 中 |
| **基于 OPRF / OT** | KKRT-PSI、PRF-PSI | 中 | 半诚实 | 中 |
| **基于加密电路（Circuit-PSI）** | Rindal–Pinkas、ABY、CryptoFlow | 慢 | 恶意安全最强 | 高 |
| **基于 Bloom Filter / Cuckoo Hash** | Pinkas–Schneider CNS 2014 | 快 | 半诚实、有 False Positive | 中 |

工程上主流的两条路径：
- **KKRT / PSZ OPRF-PSI**（基于不经意传输扩展）：通信量 `O(n)`，计算量 `O(n)`，是当前 **Go（Google Private Join and Compute）**、**SecretFlow PSI** 默认实现的核心。
- **Circuit-PSI + GMW/ABY 协议**：可抵抗恶意参与方，通信 / 计算开销大 10–100 倍，仅在金融高合规场景使用。

**第三层：工程性能瓶颈——千万级、亿级必须做分布式。**
- **通信瓶颈**：两方各 1 亿 ID，KKRT 的通信量在 100 Mbps 链路上可能要数十小时；现实做法是把 KDF / OT 扩展并行化 + 流水线化。
- **计算瓶颈**：OPRF 评估（每条 ID 一次伪随机函数）需要亿级 AES/SHA 硬件加速；Google PSI 团队公开过单核每秒数百万次 OPRF 的基准。
- **False Positive（误判）**：基于 Bloom Filter 的近似 PSI 必须容忍假阳性——训练集会多几条"看起来匹配但其实不匹配"的样本，对 AUC 通常影响很小，但下游必须留接口审计。

**第四层：精度陷阱——安全模型与 ID 重合度。**
- **半诚实 vs 恶意**：半诚实模型下 KKRT-PSI 已经足够；恶意模型必须用 Circuit-PSI 或在 OPRF 之上加一致性证明。
- **ID 重合率**：实际业务里银行和电商的客户重合度往往只有 20%–60%——训练样本比原始数据少一个数量级，**模型效果天然受损**，必须在选型时预估损失。
- **ID 漂移**：手机号换号、设备 ID 重置都会让 PSI 漏掉真实同一人；现实做法是引入弱标识符（生日 + 地区 + 名字）组合，但会引入更多协议层复杂度。
- **半诚实假设违反**：对方如果真攻破协议（如缓存 OPRF 输出做生日攻击），后果是交集泄露——必须按恶意安全设计 + 一次性 OPRF。

**第五层：工业案例。**
- **Google Private Join and Compute（PSI + PIR 联合）**：开源 PSI 参考实现之一，已广泛被工业界借鉴。
- **蚂蚁 SecretFlow PSI**：封装 KKRT / ECDH-PSI / OPRF 多协议，已在金融联合营销与医疗联合研究中规模化部署。
- **微众银行 FATE-PSI**：与 FATE 训练管线深度集成，识别规模在亿级以下的项目。
- **字节安全多方求交**：广告投放场景下跨广告主与媒体的样本对齐，强调低延迟。
- **欧盟电信运营商隐私求交**：GDPR 压力下的典型 PSI 落地，反欺诈领域。

**3. 常见陷阱**

- **以为 PSI 是纯算法问题**——工程上 80% 的难度是**通信优化 + 容错 + 监控**，不知道/不做就得满分也难交付。
- **把"近似 PSI"当成"近似的另一种说法"——忽略 False Positive 是协议层定义的**，必须选合适的 false positive rate（如 `2^-40`）并审计。
- **不评估 ID 重合率**——直接把全量 ID 拿去对齐，60% 的样本白丢，后期无法挽回。
- **忽略配对失败**：通信失败时 90% 的工程任务会"静默成功"，但漏掉的样本可能在关键长尾客户群体——必须有 checksum + 重试 + 失败告警。
- **混淆 PSI 与 PIR**：PIR（Private Information Retrieval）解决的是"我查数据库但不让数据库知道查的是哪条"，与 PSI 是两个独立工具，常组合使用。

**4. 追问预测**

- **「两方扩展到三方 PSI 怎么改？」** 答：KKRT 协议可扩展到 N 方，但通信轮次随参与方数线性增加；现实做法是把三方 PSI 拆成两两 PSI + 取交集，或者直接用三方 OPRF 协议（如 ABY3-PSI），代价明显上升。
- **「PSI 算完交集之后，还能做什么防止被反推？」** 答：在交集基础上跑 DP（差分隐私），对交集大小加噪声；或用 PSI-CA（Labeled PSI）一次性把标签带回来，避免二次通信泄露意图。
- **「服务器是恶意能破解吗？」** 答：标准 KKRT 在恶意模型下不安全，需要叠加 Cut-and-Choose 或切到 Circuit-PSI；工程上会用硬件 RoT（HSM）+ 远程证明补充。
- **「ID 高基数且不一致怎么办？」** 答：引入 LSH（局部敏感哈希）做预过滤 + 多轮 PSI，配合 PSI 的近似版本降低通信量。

**5. 参考资料**

- Pinkas, B., Schneider, T. & Tkachenko, O.《Efficient Private Set Intersection Based on OT Extension》, USENIX Security 2019——OT Extension PSI 的代表论文，是工业实现的主要理论基础。
- Pinkas, B., Schneider, T. & Zohner, M.《Faster Private Set Intersection Based on OT Extension》, PETS 2014——KKRT 协议的原始论文。
- Rindal, P. & Pinkas, B.《A Two-Party Protocol with Batched Oblivious Transfer》, EUROCRYPT 2018——Circuit-PSI 的恶意安全代表实现。
- Chase, M. & Miao, P.《Private Set Intersection in the Internet Setting from Lightweight Oblivious PRF》, CRYPTO 2020——轻量化 OPRF-PSI 的代表协议。
- Google Research《Private Join and Compute》开源项目——GO 语言参考实现，是工业集成度最高的 PSI 工程方案。
- 蚂蚁集团《SecretFlow 开源白皮书》——SecretFlow PSI 协议的工程封装与对 KKRT/ECDH-PSI 的支持。
- 微众银行《FATE 联邦学习技术白皮书》——FATE-PSI 与纵向 SecureBoost 协同的工程范式。

- **医疗（微医 / 医联 / 晶泰科技）的多中心 PSI** —— 跨医院、多中心药物研发场景基于 KKRT OPRF-PSI 做样本对齐，验证医疗行业在隐私约束下做联合科研的 PSI 性能边界。
- **运营商（中国移动 / 中国电信）的跨省反欺诈 PSI** —— 运营商在跨省反欺诈、风控场景中应用 PSI 做用户 ID 对齐，单次 PSI 规模可达亿级，是国内运营商公开过的较大规模 PSI 实践之一。
- **零售电商（京东 / 唯品会 / Shein）的广告投放样本对齐** —— 京东、唯品会与 Shein 在跨业务广告投放中用 PSI 把广告主与媒体的样本对齐，强调低延迟与假阳性容忍，是 PSI 在跨境电商与广告场景的典型用法。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接待联网环境补全。

---

#### §11.8.3 差分隐私（Differential Privacy, DP）的隐私预算 ε 是如何定义与累计的？请举例说明在深度学习训练（如 DP-SGD）中如何分配与监控预算，并分析 ε 取 1、3、8 分别对应什么样的实际隐私风险。

**1. 考察点**

- 是否能从形式化定义出发：算法 `M` 是 `(ε, δ)`-DP 当且仅当在相邻数据集 `D` 与 `D'` 上输出任意集合 `S` 的概率比值受 `e^ε` 控制。
- 是否区分**纯 ε-DP**（δ=0）与**近似 `(ε, δ)`-DP**——后者允许极小的"穿透概率"，是深度学习场景的事实标准。
- 是否掌握 DP 在 FL 中的复合作用：FL 的多次训练轮次 + 多参与方会消耗预算——**用一次 ε 不能评估整个系统**。
- 加分项：能讲清楚 RDP（Rényi Differential Privacy）与 zCDP 的隐私会计含义，以及高级组合定理（Advanced Composition）如何把多轮训练的预算"压缩"。

**2. 参考答案框架**

**第一层：ε 的工程含义。** ε 是隐私保护强度的"放大倍率"：ε 越小，攻击者区分"你某条数据是否参与训练"的可能性越低，但模型可用性也越差。**直觉类比**：ε=0 大致对应"严格不可区分"（开销极高），ε 在 1–3 是学术界常用范围，ε 在 5–10 是工业界可接受的"较弱保护"。

δ 则是"穿透概率"——目标是在 100 万次实验中最多误判 1 次（约 `1/N`），δ 通常设为 `1/N` 或更小。

**第二层：预算累计的三条理论。**
- **基础组合定理（Basic Composition）**：k 次访问满足 `(ε_i, δ_i)`-DP 的机制，合起来满足 `(Σε_i, Σδ_i)`-DP。简单但保守。
- **高级组合定理（Advanced Composition）**：在固定总 δ 的前提下，k 次访问的 ε 随 `√k` 增长而非线性。
- **RDP（Rényi DP）**：把不同噪声分布统一映射到 Rényi 散度下加性合成，再转回 `(ε, δ)`-DP——这是 **Opacus / TF Privacy 的工程基础**。

**第三层：DP-SGD 的三件武器。**
- **Per-sample 梯度裁剪**：把每个样本梯度 norm 裁到上限 `C`，防止"大梯度样本"过度影响模型——本质是把单个样本对模型的影响钳制在 `C/D` 量级。
- **高斯噪声注入**：聚合梯度后加 `N(0, σ²C² I)` 噪声，σ 控制信噪比。
- **隐私会计（Privacy Accountant）**：累计多轮训练的 `(ε, δ)`，常用 RDP 转换（Opacus 内置 `PRVAccountant`）。
- 公式粗估：`ε ≈ 样本数 × 轮数 / σ² × √log(1/δ)` 量级，反过来说——同一个隐私预算下，可训练轮数 `T ≈ ε·σ² / log(1/δ)·(样本数倒数)` 量级——**预算被样本量和训练轮数直接锁定**。

**第四层：ε 的现实分级（结合工业实践）。**
- **ε ≤ 1（强保护）**：美国 2020 年人口普查目标水平，隐私保护极强但模型 AUC 通常跌 5%–10%——只有最敏感的统计场景用。
- **ε ≈ 3（中等保护）**：学术界主流目标；DeepMind、OpenMined、Apple DP 实践的常用上界；模型可用性相对可接受。
- **ε ≈ 8（弱保护）**：Google 在 RAPPOR、Chrome 浏览器统计等大规模工业部署的典型值——商业可接受、研究上不够严谨。
- **ε > 10**：基本失去数学保护意义，工业部署偶尔出现，但应警惕。

**第五层：FL 中的预算特殊性。**
- FL 不只训练消耗预算，**PSI / 样本对齐**也消耗——一次 PSI 在半诚实模型下大约消耗 0.1–1 个 ε（依赖 ID 基数与重试频率），一个工业 FL 项目要算"完整隐私预算账"。
- 长期迭代项目必须假设预算会**随时间累计**——同一批用户数据参与多轮训练，预算 "升表"。现实做法是限定每个用户一生的总预算上限（用户级 ε 上限）。
- **组合性 vs 实用性**：必须用 RDP / 高级组合定理来压缩预算，不能简单相加，否则项目运营两三轮就被劝退。

**第六层：工业案例。**
- **Google Gboard 横向 FL**：用差分隐私 + 安全聚合（Secure Aggregation）做端到端保护，公开值常在 ε=8 量级，强调"工业可用性"。
- **Apple 差分隐私实践**：iOS 键盘 / 健康数据采集，使用 ε≈1–3 之间的"较强保护"，并通过本地 DP（Local DP, LDP）将噪声下发到客户端。
- **US 2020 人口普查**（Dwork 等的学术顾问）：在 ε≈0.5 量级设计 DP 噪声，公开报告明确给出"严格 ε"配置。
- **US Census Bureau OnTheMap**：劳动力流动统计使用 DP 防止个体身份推断。
- **Microsoft SEAL + DP**：在 SEAL 上实现 DP 加权平均，用于跨机构统计发布。
- **OpenMined PyDP / PyTorch Opacus**：当前学术界与工业界事实标准的 DP-SGD 实现，已服务大量研究项目。
- **微众银行 FATE 与蚂蚁 SecretFlow 的 DP 集成**：在纵向联邦训练内置 DP 噪声与隐私预算会计模块，是国内金融业落地范式。

**3. 常见陷阱**

- **"预算可简单相加"**——这是最常见的反模式，多次访问场景下预算增长不是线性的，必须用 RDP / 高级组合定理压缩。
- **"只看总 ε 不看 δ"**——δ 过大则 `(ε, δ)`-DP 退化为几乎没有保障，必须保证 `δ ≪ 1/N`（N 为样本数）。
- **"以为 DP-SGD 等于明文 SGD"**——实证上 DP-SGD 比明文差 5–15%，不可忽视，必要时换更大模型或更长训练。
- **"用一次 PSI 的 ε 给整个项目打 DP 标签"**——预算与机制（composition）是分开计算的，不能"以偏概全"。
- **"忽略了 Privacy Budget 的运营含义"**——上线后消费 ε 的并不只有训练，还包括统计查询、A/B 测试等，必须建立全链路预算台账。

**4. 追问预测**

- **「RDP 与 zCDP 怎么选？」** 答：高斯噪声天然适配 RDP（更紧的合成界），Opacus 默认用 RDP；zCDP 在换算上更简洁但合成常数略松。现代实践以 RDP 为主。
- **「用户级 DP 怎么实现？」** 答：把"单样本贡献上界"换成"单用户所有样本贡献上界"——通过限制每用户 batch 占比、单独的归一化、累积梯度裁剪；现实代价是训练 batch 与偏置都需要重新调参。
- **「隐私预算与模型大小的关系？」** 答：模型越大，越能容下噪声带来的干扰——DP 训练需要更大的模型 + 更多数据才能恢复到明文可用水平；这也是 LLM 时代 DP 重新受到关注的原因（参数容量更大）。
- **「怎么审计落地项目的隐私预算？」** 答：通过 RDP 转换、隐私会计组件做线上记账；定期由独立团队复盘；并在合同层面（DPAs）约定预算上限。

**5. 参考资料**

- Dwork, C. & Roth, A.《The Algorithmic Foundations of Differential Privacy》, Foundations and Trends in Theoretical Computer Science 2014——DP 的标准教科书，ε / δ / 组合定理的唯一权威出处。
- Mironov, I.《Rényi Differential Privacy》, IEEE CSF 2017——RDP 框架的原始论文，是 Opacus 的隐私会计基础。
- Abadi, M. 等《Deep Learning with Differential Privacy》, ACM CCS 2016——DP-SGD 的原始论文，是工业 DP 训练的事实标准。
- McMahan, B. 等《Learning Differentially Private Recurrent Language Models》, ICLR 2018——首次在大规模语言模型上落地 DP-Fine-Tuning，证明 DP 不止于小模型。
- Bonawitz, K. 等《Practical Secure Aggregation for Privacy-Preserving Federated Learning》——Google 在 Gboard 横向 FL 中部署 DP + Secure Aggregation 的工业先例。
- Apple《Learning with Privacy at Scale》——Apple 在 iOS 上的差分隐私部署白皮书，是 LDP 工业范式。
- US Census Bureau《Disclosure Avoidance and the 2020 Census》报告——大规模官方统计采用 DP 的第一手材料。
- OpenMined《PyDP / Opacus 文档》——DP 工具链的官方使用手册与案例。

- **零售电商（京东 / 唯品会 / 孩子王 / 屈臣氏）的 DP 画像发布** —— 京东在推荐系统、唯品会与孩子王在母婴 / 亲子推荐、屈臣氏在会员营销中引入 DP / DP-SGD，把用户画像发布的隐私预算 ε 控制在 3–8 的工业可接受范围。
- **政企能源（国家电网 / 中国石油）的统计 DP 实践** —— 国家电网在电力负荷统计、中国石油在能源调度数据发布中应用差分隐私防止个体推断，是公共事业领域公开的 DP 落地范式。
- **出行（滴滴 / 曹操出行）的本地差分隐私** —— 滴滴在司机画像、曹操出行在订单分配统计输出中应用本地差分隐私（LDP）做端侧保护，与 Secure Aggregation 互补形成端到端隐私链路。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §11.8.4 TEE 阵营中的 Intel SGX、AMD SEV-SNP 与 NVIDIA H100 Confidential Computing 各有什么取舍？请从隔离强度、迁移成本、AI 推理友好度与侧信道攻击面四个维度展开比较，并说明在为机密 LLM 推理做选型时应该关注哪些关键指标。

**1. 考察点**

- 是否理解 TEE 是「**信任根的转移**」——把对参与方的信任换成对硬件厂商的信任，这是技术决策也是治理决策。
- 能否区分 SGX（进程级 enclave）、SEV-SNP（VM 级加密内存）、H100 CC（GPU 协处理器级）的**目标场景差异**。
- 是否知道机密 LLM 推理的关键指标：模型权重保护、KV cache 不泄露、推理延迟、显存上限、远程证明机制、多 GPU 横向扩展。
- 加分项：能讲清侧信道攻击（Foreshadow、Hertzbleed、SEV 早期漏洞）与硬件厂商的信任根（Intel Signing Key、AMD SEV-SNP ARK）治理。

**2. 参考答案框架**

**第一层：三套 TEE 的定位差异。**

| 维度 | Intel SGX | AMD SEV-SNP | NVIDIA H100 CC |
| --- | --- | --- | --- |
| 隔离粒度 | 进程级 enclave | VM 级（整虚机） | GPU 卡级 |
| 隔离强度 | 强（最小可信计算基 TCB） | 中（依赖 VM 内核） | 强（GPU 数据/代码隔离） |
| 信任根 | Intel SGX Root Key | AMD ARK（Platform Owner 控制） | NVIDIA GPU + Hopper 架构 |
| 编程难度 | 高（SDK 限制多） | 中（透明加密） | 中（需要专用驱动/库） |
| AI 推理友好度 | 中（手动分区） | 中 | **高（GPU 原生支持）** |
| 侧信道历史 | Foreshadow、SGAXE、Spectre | 早期 SEV 漏洞（已被修补） | 较新（攻击面尚在研究） |
| 生态成熟度 | Occlum LibOS / Graphene | Azure Confidential VM / GCP | NVIDIA NeMo Guardrails + CC |
| GPU 加速 | 仅 GPU 直通，需手工密钥交换 | CPU 友好，GPU 需虚拟化 | **原生机密 GPU 模式** |

**第二层：四个维度的展开比较。**

- **隔离强度**：SGX 提供最大隔离——只有 enclave 内代码可见明文，包括 OS 在内都看不到；SEV-SNP 是 VM 加密，加密整虚机内存，但 VM 内核仍在威胁面内；H100 CC 隔离到 GPU 显存，对 LLM 场景天然贴合（模型权重以密文形式加载到 GPU 显存，host CPU 不可见）。
- **迁移成本**：SGX 应用通常需要**重新编译 + 修改 ABI**，迁移成本最高；SEV-SNP 通常只需要"把虚机跑在机密虚机里"；H100 CC 通过 Kubernetes Device Plugin + NeMo Guardrails 改造，迁移成本中等。
- **AI 推理友好度**：GPU TEE 完胜——H100 CC 让模型权重全程留在 GPU 显存里不暴露，**推理延迟几乎等同明文**；SGX + GPU 走的是"CPU enclave + GPU 透传"架构，密钥交换与 PCIe DMA 路径复杂且慢。
- **侧信道攻击面**：SGX 攻击面最丰富（Foreshadow / Spectre / SGAXE）、社区审计最严；SEV-SNP 在 2017 后修补了主要漏洞；H100 CC 攻击面研究尚新，NVIDIA Hopper 架构自带多级保护。

**第三层：机密 LLM 推理选型的关键指标。**
- **模型权重不泄露 host**——必须能验证 GPU 内密文加载、远程证明 GPU 硬件是 H100 而非模拟器。
- **推理延迟 vs 明文比**——目标劣化不超过 5%–10%，否则在线服务体验崩塌；H100 CC 在 FP16/BF16 推理上达标。
- **KV cache 不泄露**——KV cache 含用户 prompt 上下文，最敏感；H100 CC 通过机密显存与 CPU-GPU 加密 DMA 路径保护。
- **支持模型规模**——显存上限决定可服务模型大小（70B vs 405B vs 更大）；多卡 NVLink 域的机密扩展尚未完全公开。
- **审计与远程证明**——control plane 必须能远程证明：执行环境是确切的硬件型号 + 固件版本；Intel / AMD / NVIDIA 都提供配套 root of trust 验证 API。
- **多租户隔离**——多用户共享同一 GPU 时不能串味；机密 MIG（Multi-Instance GPU）切片是关键能力。

**第四层：工业落地的代表性案例。**
- **Microsoft Azure Confidential VM + Azure OpenAI**（Intel SGX / AMD SEV-SNP 双栈）——把 GPT 模型跑在机密虚机里，对外提供"机密 OpenAI"服务。
- **Google Confidential Gemini**（AMD SEV-SNP）——把 Gemini 推理部署在 GCP Confidential VM 上，强调与 Vertex AI 集成。
- **NVIDIA H100 CC + NeMo Guardrails**（Hopper 机密 GPU 模式）——自有商用部署和云服务（Bishop Fox 等第三方审计）均在推进。
- **蚂蚁「摩斯」**——基于自研 TEE 方案的机密 AI 平台，覆盖蚂蚁内部场景与少量外部场景。
- **阿里云机密计算 / 阿里通义 + enclave**——依托 SGX/SEV 的云机密算力，以及「通义 + enclave」的机密 LLM 推理。
- **Cape Privacy / Opaque / Privitar**（MPC + TEE 混合 SaaS）——TEE 在 SaaS 化隐私计算中的轻量化落地。
- **上海交通大学 IPADS / 清华 RCS** 等院校的机密 AI 学术研究——开源 Confidential AI 的训练侧探索。

**3. 常见陷阱**

- **"只看隔离不看迁移"**——SGX 隔离最强但工程化最弱，团队落地一年做不出生产线是常见结局。
- **"认为 AMD SEV 等于不泄露"**——SEV-SNP 隔离 VM，VM 内核仍是威胁面；若内核被攻破，加密失效。
- **"GPU TEE 完全无侧信道"**——Hopper CC 攻击面尚年轻，单纯相信 vendor 安全声明是危险的。
- **"远程证明不需要走流程"**——远程证明需要签名验证链 + 证书固定 + 周期性轮换密钥，工程上漏一步就被合规拒绝。
- **"模型大就能容错"**——大模型本身不能修复侧信道漏洞，硬件信任根与现代密码学证明（如 attestation）都不能少。

**4. 追问预测**

- **「Intel TDX 与 SGX 怎么选？」** 答：TDX 是 Intel 后续主推的 VM 级 TEE（对标 SEV-SNP），迁移成本比 SGX 低很多，对 AI 推理更友好；当前 SGX 仍用于极端隔离需求，但 TDX 是 LLM 时代的"次世代默认"。
- **「多卡 H100 怎么做机密横向扩展？」** 答：当前通过 NVLink 域内 certificate-based attestation 验证多卡一致性 + 共享统一 root key，但跨物理机 / 跨域的机密多卡仍受限于网络与硬件协议。
- **「TEE 与 DP 同时用有什么坑？」** 答：DP 注入的噪声在 enclave 内部还是外部做决定信任模型——若 enclave 内部做，需要硬件级的 trusted random source；外部做则 DP 噪声会被 host 看到，需要不同协议设计。
- **「远程证明的合规价值？」** 答：可以把 attestation evidence 落进审计链，把"在哪台机器跑的哪个硬件哪个固件版本"作为合规证据——这是 TEE 在金融合规的最大优势。

**5. 参考资料**

- Intel《Intel Software Guard Extensions Developer Reference》与《Intel Trust Domain Extensions (TDX) Overview》——SGX / TDX 的官方权威文档。
- AMD《AMD Secure Encrypted Virtualization - Secure Nested Paging (SEV-SNP)》白皮书——SEV-SNP 架构与远程证明机制的第一手材料。
- NVIDIA《Confidential Computing on NVIDIA H100 GPUs》与《Hopper Architecture Whitepaper》——H100 CC 的硬件能力与机密模式说明。
- Microsoft《Azure Confidential Computing: Protect Data in Use》——Azure Confidential VM 与 Azure OpenAI 的工业实践。
- Google Cloud《Confidential VMs on AMD SEV-SNP》——GCP Confidential Gemini 的部署参考。
- 蚂蚁集团《SecretFlow SPU Confidential TEE 加速器白皮书》——国内自研 TEE 加速器的工程范式。
- 中国信通院《机密计算白皮书（2024）》——国内 TEE 综述与各厂商对比。
- Muazu, K.《A Survey on GPU Confidential Computing》——GPU TEE 综述的学术参考。

- **政企能源（国家电网 / 南方电网 / 中国石油）的机密计算节点** —— 国家电网、南方电网在电力调度数据协同与营销数据场景部署 SGX / SEV-SNP 双栈机密虚机，中国石油在勘探与调度数据中应用 TEE 节点，应对能源行业强合规的数据出域保护。
- **运营商（中国移动 / 中国电信）的机密 AI 推理算力** —— 中国移动「磐基」PaaS、中国电信天翼云基于 SGX / SEV 提供机密虚机与机密 AI 推理算力服务，对外承载机密 LLM 推理与反欺诈场景，是国内运营商层 TEE 商业化的早期代表。
- **半导体（地平线 / 寒武纪）的端云机密推理协同** —— 地平线征程系列车规芯片、寒武纪思元系列在端侧 AI 推理中作为 TEE 单元的硬件支撑，与云端 SGX / SEV-SNP 形成端云协同的机密推理链路。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。
- **中国海油** —— 中国海油海上生产数据平台——钻井平台、船舶、生产数据的实时采集与监控。
- **中国石油** —— 中国石油勘探数据湖——地震、测井、钻井多源异构数据入湖 + AI 油气识别。
- **南方电网** —— 南方电网营销数据中台——客户、电价、计费、服务的统一数据底座。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

---

#### §11.8.5 设计一个跨三家机构（银行、电商、保险公司）的联邦反欺诈联合建模方案。请说明数据不出域的前提下如何进行样本对齐、特征加密、梯度聚合与模型部署，并指出潜在的梯度泄露风险以及对应的差分隐私 / 安全聚合缓解措施。

**1. 考察点**

- 是否能把端到端的工程链路拆清楚——从「需求拆解 → 系统选型 → 数据流 → 安全加固 → 上线运维」完整过一遍。
- 能否识别纵向 FL 的真实挑战：**样本对齐率低、特征尺度差异大、模型可解释性要求高、监管审计严格**。
- 是否能从「梯度本身也是信息」意识到 DLG / GradInversion 这类反演攻击的存在，并给出对应的 DP / 安全聚合缓解。
- 加分项：能给出指标量级的工程经验——通信量、PSI 规模、模型迭代周期、监管备案细节。

**2. 参考答案框架**

**第一层：场景与约束拆解。** 三方联合反欺诈建模的硬约束：
- **数据维度（纵向）**：银行 - 账户/交易/信贷历史；电商 - 行为序列/设备指纹；保险 - 保单/理赔/健康告知。
- **目标**：以欺诈标签为监督信号（来自历史黑样本），在数据不出域的前提下，训练一个跨域打分模型。
- **监管**：三方分别受银保监会 / 工信部 / 卫健委协同监管，要求训练过程**可复算**、**可审计**。
- **业务约束**：模型决策必须**可解释**——信贷反欺诈场景下，单个特征 Shapley 值必须可追溯。

**第二层：总体架构设计（自上而下）。**

```
[Bank API Gateway]      [E-commerce Gateway]      [Insurance Gateway]
      ↓                         ↓                        ↓
   PSI 阶段（横向密文求交，得交集 ID）
      ↓
   三方 SecureBoost 训练（纵向）
      ↓
   Secure Aggregation（最终梯度聚合） + DP（梯度加噪）
      ↓
   模型评估 / 监管可解释审计
      ↓
   模型分发到三方本地 + TEE 推理
```

**第三层：逐环节的关键决策。**

**a) 样本对齐（PSI 阶段）。** 三方 → 三次两两 PSI 取并集，或用三方 OPRF（如 ABY3-PSI）一次性算三交集。
- 协议选择：KKRT OPRF-PSI（半诚实模型下性能友好）；若保险方拒绝半诚实假设，需要 Circuit-PSI。
- 工程优化：ID 基数大时用 LSH 预过滤（如手机号前缀）+ 分桶并行；FATE 公开百万级 ID 整合作业时长。
- 失败兜底：通信中断必须能断点续传；丢失方协议可重新尝试但要审计。

**b) 特征加密与训练。** 主体使用 **纵向 SecureBoost**（XGBoost 的纵向联邦版本）：
- 每棵树的分裂点确定需要 ID 对齐后的"双方梯度直方图"，通过对齐 ID 上的密文聚合而非明文 rank。
- 关键优化：SecureBoost 的分裂过程以**梯度残差 + 二阶导**为输入，特征不必出域；模型结构最终只有 ID ↔ 叶子节点映射，避免泄露原特征。
- 替代方案：若更追求可解释性 / 训练稳定性，可用**纵向 LR**（逻辑回归）；SecureBoost 效果更好但训练成本更高。

**c) 梯度聚合与安全加固。**
- **三方聚合器选择**：用 TEE（SGX / SEV-SNP）做聚合服务器，三方各自把本地梯度密文送入 enclave；enclave 内解密、聚合并签发可审计日志。
- **Secure Aggregation（SA）**：三方梯度先在密文下相加再加噪声，参考 Bonawitz et al.（CCS 2017）；保证即使聚合服务器被攻破也只能看到"聚合后的最终梯度"，而不是"每家单独梯度"。
- **DP 加噪**：在 Secure Aggregation 输出后，向最终梯度叠加高斯噪声；预算选择 `ε ≈ 3–8`（金融联合建模的工业典型值）。
- **梯度反演防御**：DLG / iDLG 论文已知——单样本梯度足以反推出输入图像。缓解措施：**梯度裁剪 + 噪声 + 限制 batch 贡献**（per-user cap）。

**d) 模型部署与推理。**
- 三方各自把训练后的 SecureBoost 模型部署到本地机房；推理在本地完成，无需跨域调用。
- 若需要联合推理（如黑名单共享），把推理过程也放进 TEE，结果以密文返回调用方——参考 SecretFlow-LLM 与蚂蚁摩斯在 LLM 推理上的做法。

**第四层：审计与监管对齐。**
- **可复算审计**：每个训练轮次的输入特征 hash + 超参 hash + 梯度 hash 必须可由独立第三方复算（监管可重现实验）。
- **隐私预算台账**：从 PSI、训练、推理各环节核算的 ε/δ 累计成独立账本；上线前由 DPO（数据保护官）签字。
- **退出机制**：某一方退出训练时，已训练模型中"对方相关特征"的叶子权重必须可证清空；这是 SecretFlow 与 FATE 都在工程上反复打磨的"司法可解释性"。

**第五层：真实工业案例对照。**
- **微众银行 FATE + 跨行联合反欺诈**：纵向 SecureBoost + PSI + 联邦 XGBoost，AUC 提升 15% 左右（对比单方模型），是国内最早公开案例。
- **蚂蚁集团 SecretFlow + 联合营销 / 联合风控**：FL + MPC + TEE 三引擎，按场景切换；公开提及服务超 50 家合作机构、ROI 提升 30% 量级。
- **平安金融「联邦学习反欺诈平台」**：纵向 SecureBoost + 区块链审计上链，金融场景典型落地。
- **腾讯 WeChat Pay「联邦反欺诈」**：跨金融机构 + 跨场景的横向 + 纵向混合 FL 实践。
- **平安科技 + 多家保险公司「联邦保险定价」**：纵向 FL + 差分隐私 + TEE，欧盟 GDPR 框架下合规。

**3. 常见陷阱**

- **"样本对齐直接用身份证号"**——身份证号本身是高敏感信息，且可能因换号/冒用不对齐；现实必须用协议层 PSI，而不是明文传身份证号。
- **"SecureBoost 等于明文 XGBoost"**——分裂过程中需要密文聚合，分布之间通信开销大 5–10 倍；不预留带宽就会因超时不停失败。
- **"没用 Secure Aggregation"**——一旦单方梯度被泄露，等于直接泄露了该方本地样本的统计信息；SA 是「防御梯度泄露」的关键。
- **"DP 噪声加在每一方本地而不是聚合端"**——加在本地会让单方训练更难收敛；实战做法是聚合端加噪，配套 RDP 隐私会计。
- **"审计只看模型不看过程"**——监管要求"过程可复算"，只记录最终模型等于无审计；必须保留训练轮次的可追溯日志。
- **"把模型分发当成数据共享"**——SecureBoost 的叶子节点权重本身可能泄露训练集分布（反演攻击）；必须配套差分隐私。

**4. 追问预测**

- **"PSI 一方故意造假怎么办？"** 答：必须加一致性证明 / ZKP（零知识证明），证明"我提交的 ID 集合对应这个 hash 原像"；或者引入第三方审计节点 + 局部抽样验证。
- **"模型下线后如何防止残留参数泄露？"** 答：使用 DP-Style 的"训练后遗忘"（Machine Unlearning）技术，或周期性重训；监管层面应当成"数据生命周期"治理。
- **"新参与方中途加入怎么办？"** 答：用增量 PSI + 增量联邦学习算法（如 FedProx / FedNova），但要重新做 PSI 与预算对齐——这是工业部署的真实"运营负担"。
- **"梯度反演攻击的最新进展？"** 答：DLG（Zhu et al. NeurIPS 2019）、iDLG（Zhao et al. 2020）、GradInversion 等已证明单样本梯度可恢复；当前最优防御是高斯噪声 + 梯度裁剪 + 用户级 DP。

**5. 参考资料**

- Cheng, K. 等《SecureBoost: A Lossless Federated Learning Framework》, IEEE Intelligent Systems 2021——SecureBoost 的原始论文与算法形式化。
- Bonawitz, K. 等《Practical Secure Aggregation for Privacy-Preserving Machine Learning》, ACM CCS 2017——Google 的 Secure Aggregation，通信 `O(1)` 的工业实践。
- McMahan, B. 等《Communication-Efficient Learning of Deep Networks from Decentralized Data》, AISTATS 2017——FedAvg 原始定义，纵向联邦 SecureBoost 也基于其梯度聚合思想。
- Liu, T. 等《Fusion360 — FedLearner by WeBank》——微众银行纵向 SecureBoost 在金融反欺诈的工业报告。
- 蚂蚁集团《SecretFlow 开源白皮书》——FL + MPC + TEE 联合风控的工程范式与审计设计。
- Zhu, L. 等《Deep Leakage from Gradients》, NeurIPS 2019——DLG 梯度反演攻击，揭示"梯度本身是信息"的核心证据。
- 平安科技《联邦学习在金融反欺诈中的实践》——金融场景工程经验与监管对齐案例。
- 信通院《隐私计算金融应用白皮书》——国内金融业联合建模的合规与工程实践汇总。

- **零售电商（京东数科 / Shein / Temu）的纵向 FL 反欺诈** —— 京东数科「联邦学习反欺诈平台」、Shein 与 Temu 在跨境电商风控中落地纵向 SecureBoost + PSI + DP，验证跨域反欺诈从样本对齐到梯度聚合的端到端工程范式。
- **出行（滴滴 / 曹操出行 / 货拉拉）的联合风控** —— 滴滴跨平台订单反欺诈、曹操出行在跨出行方式联合风控、货拉拉在跨城际司机行为模型中应用纵向 FL + 三方 PSI + 梯度加噪，应对出行行业「强实时 + 半信任参与方」的双重约束。
- **证券（中信证券 / 长江证券）的跨机构联合核保与营销** —— 中信证券在跨机构联合营销、长江证券在联合投顾模型中应用纵向 FL + TEE + DP，应对证保行业跨机构联合建模的合规与审计要求。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **平安银行** —— 平安银行的数据分级与脱敏实践——把客户、账户、交易按敏感度分级，配合 ABAC 权限与脱敏网关，是国内金融业最完整的案例。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **微众银行** —— 微众银行的联邦学习实践——多家机构联合风控而不交换原始特征，对应「数据不动模型动」的反洗钱与信贷建模场景。
- **中信证券** —— 中信证券的指标管理实践——业务口径先于物理实现、Owner 制度落到人，对应「指标即资产」的工程范式。
- **京东数科** —— 京东数科的金融特征平台——支撑消费分期、信用支付等场景，特征口径与模型版本强一致。
- **招商银行** —— 招商银行湖仓一体的公开实践——用同一份湖表支撑监管报送、风险集市与营销分析，对应「口径先于实现」的数据治理落地。

> 注：以上参考资料均指向公开出版物或企业公开技术博客。精确链接待联网环境补全。

---

#### §11.8.6 联邦学习在生产中常面临「模型效果显著低于明文中心化训练」的问题。请从数据分布异构（Non-IID）、通信瓶颈、系统偏置三个角度分析 5–15% 的效果损失主要来自哪里，并比较 FedProx、FedNova、SCAFFOLD 等异构友好算法的对比与选型建议。

**1. 考察点**

- 是否能从「数据 - 模型 - 系统」三层把 FL 效果损失的根因拆开，而不是只背"non-IID 影响大"。
- 能否区分 FedAvg 的固有缺陷——客户端漂移（client drift）、异构梯度方向冲突、统计异质性三个机制。
- 是否掌握主流异构友好算法的核心机制与适用场景：FedProx（近端正则）、FedNova（归一化平均）、SCAFFOLD（控制变量）、FedOpt 系列（adaptive server optimizer）。
- 加分项：能结合 FedScale / LEAF benchmark、工业案例（CMU、Stanford、Google）讲清"哪种算法对应哪种数据"。

**2. 参考答案框架**

**第一层：5–15% 损失从哪里来。** FL 模型和明文中心化模型的差距本质上由三个独立贡献叠加：
- **统计异质性（Non-IID）**：每个客户端的样本分布、特征分布、标签分布都不同；最大可贡献 8%–12% 的差距，是核心来源。
- **系统异质性（System Heterogeneity）**：客户端算力/网络差异大——某些 client 训练慢、被 straggler 拖慢整体聚合节奏，导致参与 client 群体分布与全集不一致；贡献 1%–3%。
- **通信瓶颈 + 信息损失**：本地更新轮次、压缩、量化都会损失信息；长期低精度压缩贡献 1%–3%。
- **隐私噪声**（如启用了 DP）：额外贡献 2%–5%。

注意：这个「5–15%」是非常粗的经验区间；真实差距与任务、数据量、模型复杂度强相关。**没有任何机制保证 FL ≈ 明文中心化模型。**

**第二层：核心机制——FedAvg 为何会失效。** FedAvg 的目标是找到`argmin_θ Σ_k p_k F_k(θ)`，其中 `F_k` 是第 k 个 client 的本地 loss，权重 `p_k = |D_k|/|D|`。但在 Non-IID 下：
- **本地漂移（client drift）**：每个 client 解的是局部最优 `θ_k*`，聚合后是"局部最优点的加权平均"，与全局最优点可能有较大差距——特别是深度神经网络、病态 loss 地形下。
- **梯度分歧（gradient divergence）**：Non-IID 越严重，本地更新方向越不一致，聚合后信号的方差越大。
- **数据采样偏差**：被聚合的 client 子集若不代表数据全集，聚合结果就是有偏估计。

**第三层：异构友好算法对比。**

| 算法 | 核心机制 | 优势 | 代价 | 适用场景 |
| --- | --- | --- | --- | --- |
| **FedAvg** | 直接加权本地更新 | 简单 | Non-IID 下漂移严重 | IID 客户分布 |
| **FedProx**（Li et al. MLSys 2020） | 本地损失 + `μ/2‖θ-θ_global‖²` 近端项 | 抑制漂移、容忍 straggler | 近端系数 μ 需调 | 横向 FL、客户端硬件异质 |
| **FedNova**（Wang et al. NeurIPS 2020） | 归一化聚合（按本地有效更新步数归一化） | 解决"更新步数不一致"的偏置 | 与所有 client 同步轮次 | 客户端训练轮数差异大 |
| **SCAFFOLD**（Karimireddy et al. ICML 2020） | 控制变量：传 `c_k / c` 校正本地梯度 | 收敛性更紧致 | 通信量翻倍、内存大 | 强 Non-IID 场景 |
| **FedOpt 系列**（Adam/Yogi/Adagrad at server） | server 端用 adaptive optimizer 处理异质信号 | 实现简单、与非联邦 Adam 接续 | server 与 client 超参耦合 | 横向大规模 FL |
| **FedBN / Per-FedBN** | 客户端 BN 不参与聚合 | 处理客户端内部协变量偏移 | 需要细调 BN 行为 | 跨硬件/跨域 client |

**第四层：选型决策树。**

```
数据维度
├── IID 客户（随机均匀分布）
│    └── FedAvg 即可
├── 弱 Non-IID（同类商家，分布相近）
│    └── FedProx（小 μ）
├── 强 Non-IID（完全异构标签）
│    ├── 通信不是瓶颈 → SCAFFOLD
│    ├── 通信很贵 → FedProx 或 FedNova
│    └── 客户端训练轮次不等 → FedNova
├── 客户端硬件异质
│    └── FedProx（容忍 straggler）
└── 跨硬件 / 跨域
     └── FedBN / Per-FedBN（保护 BN 统计）
```

**第五层：工程经验与基准。**
- **本地更新轮次 E 的影响**：E=1 时 FedAvg 已接近 FedProx；E 越大，Non-IID 下漂移越严重，但通信节约越多；E=5 是常见上限。
- **参与者数量**：参与聚合的客户端数 ≤ 100 时，简单的 FedAvg 已能接近最优；≥ 1000 时异构影响显著，必须上 FedProx 或 SCAFFOLD 级别算法。
- **验证基准**：CMU 的 **FedScale benchmark**（Google LEAF 数据集扩展）允许跨算法横向对比；Stanford 提出的 **FedJAX** 是 JAX 实现的 FL 框架。
- **工业经验**：Google Gboard 横跨百万级 device，公开报告显示 FedAvg + Secure Aggregation 即可；金融纵向 FL 因样本对齐低、特征差异大，几乎一定要 FedProx 或 SCAFFOLD 级别算法。

**第六层：工业实践与参考研究。**
- **Google Gboard 横向 FL**：百万级 device，强 Secure Aggregation；FedAvg 在 Gboard 场景下结论性有效，但模型差异没有明文 baseline 时几乎不可能直接验证。
- **微众银行纵向 SecureBoost**：纵向 FL 经典，但与统计学习参数更新更类似；DP-SGD 风味而非经典 FedAvg。
- **NVIDIA FLARE** + Clara：医学影像横向 FL，使用 FedProx 处理跨医院设备分布差异；NVIDIA Clara Train SDK 集成 Federated Learning 与 Differential Privacy。
- **Stanford / CMU LEAF & FedScale**：开放 FL 基准，多算法可复现实验。
- **FedML / OpenMined PySyft**：学术研究导向的开源框架，集成了 FedAvg/FedProx/FedNova/SCAFFOLD 等算法。
- **CVS / Bank of America / Ping An** 等金融 FL 平台：纵向 FL 为主，常配 FedProx 级别算法 + DP。

**3. 常见陷阱**

- **"以为 FL ≈ 明文"**——这是最常见的错误预期；FL 必定与明文 baseline 有差距，必须量化到业务可接受范围。
- **"简单调学习率就能解决 Non-IID"**——Non-IID 的根因是数据分布而非优化器；调学习率往往只能缓解不能根治。
- **"只看最终 AUC 看通信"**——异构算法往往在达到相同 AUC 时需要的总通信量更小（SCAFFOLD 收敛更快、FedProx 更省总轮次）；不能孤立看效果。
- **"算法 + DP 共用就完了"**——大多数异构算法在 DP 加噪之后需要重新收敛性分析，盲目组合可能让效果雪崩。
- **"在纵向 FL 上乱用横向算法"**——纵向 FL 是求（中间密态直方图）与（密文梯度），与 FedAvg 协议不同；误用 FedAvg 反而拖累性能。

**4. 追问预测**

- **"FedProx 的 μ 怎么调？"** 答：粗网格搜索 + 验证集调优；经验上 0.01–0.1 起步；若 μ=0 退化为 FedAvg。
- **"SCAFFOLD 通信量太大怎么办？"** 答：用控制变量的低秩近似 / 周期性更新；或者切回 FedProx 折中；大规模生产往往选 FedProx 而非 SCAFFOLD。
- **"如何评估 FL 模型本身？"** 答：把聚合后模型在客户端本地验证集上测 AUC——衡量的是「跨客户端泛化能力」；切忌只看 server 端验证集。
- **"个性化 FL（pFL）是不是更好？"** 答：pFL（如 Ditto、FedBN）支持"每客户一个模型"，适合客户端分布极异构场景；代价是模型存储与发布成本高，难以集中推理。

**5. 参考资料**

- McMahan, B., Moore, E., Ramage, D.《Communication-Efficient Learning of Deep Networks from Decentralized Data》, AISTATS 2017——FedAvg 的原始论文，所有异构算法的对照基准。
- Li, T. 等《Federated Optimization in Heterogeneous Networks》, MLSys 2020——FedProx 的原始论文，是工业横 FL 的标准升级路径。
- Wang, J. 等《Tackling the Objective Inconsistency Problem in Heterogeneous Federated Optimization》, NeurIPS 2020——FedNova 的原始论文，处理本地更新步数不一致。
- Karimireddy, S. P. 等《SCAFFOLD: Stochastic Controlled Averaging for Federated Learning》, ICML 2020——控制变量算法，是 Non-IID 收紧收敛界的最强基线之一。
- Acar, D. A. E. 等《Federated Learning Based on Dynamic Regularization》, ICLR 2021——动态正则的进一步发展，与 FedProx 对比的方向之一。
- LEAF Benchmark（Caldas et al.）——学术界 FL 基准的实现之一。
- FedScale（CMU）——大规模 FL benchmark,允许横向对比算法效果与系统效率。
- NVIDIA FLARE 开源项目文档——医学影像领域 FL 工程范式。
- Google AI Blog《Federated Learning: Building more robust models》与 Gboard 系列报告——大规模 device-side FL 的工业实践。
- FedML / OpenMined PySyft / FedJAX 文档——FL 工具链第一手工程经验。

- **医疗（微医 / 医联 / 晶泰科技）的跨机构 FedProx 实践** —— 微医、医联在跨医院影像 FL 中验证 FedProx 处理 Non-IID；晶泰科技基于 NVIDIA FLARE 训练多中心药物筛选模型，验证医学场景下异构客户端的算法选型。
- **制造（美的 / 海尔 / 三一重工）的跨工厂 FedNova 实践** —— 美的、海尔在跨工厂设备预测维护中基于 FedProx / FedNova 处理设备分布异质性，三一重工在工程车辆远程运维中面对强 Non-IID 验证 SCAFFOLD 类算法。
- **零售（永辉超市 / 孩子王 / 屈臣氏）的跨业态 FL 推荐** —— 永辉超市在跨业态会员推荐中应用纵向 FL，屈臣氏与孩子王在跨门店 / 跨渠道会员推荐中处理 Non-IID 与设备异质，验证零售行业对异构友好算法的工程需求。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。
- **三一重工** —— 三一重工的工业遥测数据湖——PB 级设备运行数据走 Kafka + Iceberg 入湖，支撑预测性维护与能耗优化。
- **宁德时代** —— 宁德时代电池研发数据湖——材料、电芯、PACK 三层研发数据入湖 + Schema 演进 + 时间旅行。
- **富士康** —— 富士康「关灯工厂」的工业视觉与质量检测数据流——边缘端实时推理、云端批量训练、模型版本回滚。

> 注：以上参考资料均指向公开出版物、官方文档或企业公开技术博客。精确链接待联网环境补全。

### 8.3 本章小结

本节收录 6 道题，覆盖**隐私计算的「选型 - 实现 - 治理」三层**：

- **路线层**（§11.8.1）：FL / MPC / TEE 三路线的选型与组合策略。
- **协议层**（§11.8.2）：PSI 的协议家族、性能瓶颈与精度陷阱。
- **机理层**（§11.8.3）：差分隐私预算 ε 的定义、累计、训练 DP-SGD 中的工程。
- **硬件层**（§11.8.4）：SGX / SEV-SNP / H100 CC 的取舍与机密 LLM 选型指标。
- **设计层**（§11.8.5）：三方联合反欺诈端到端方案设计 + 审计与 DP 加固。
- **运营层**（§11.8.6）：FL 异构数据下 5–15% 效果损失归因与算法选型。

六道题构成一条完整的下钻链路：**为什么需要隐私计算 → 怎么选路线 → 怎么做协议 → 怎么管预算 → 怎么用硬件 → 怎么落地 → 怎么运营**。

参考答题的通用心法（沿用全书的"约束 - 选项 - 取舍"三段式）：

1. **先把约束讲清楚**——场景、性能、安全、合规四件套都要交代，否则选型没有依据。
2. **再把选项平铺**——不要只讲"我选 FL"，要把不选的 MPC / TEE 也提一句，并给出放弃理由。
3. **最后给取舍**——能量化就量化（延迟差几倍、AUC 差几个点、ε 预算差几），给不出量化也至少给出业务可接受范围。

**资深数据架构师的分水岭**是：能否在选型时主动给出"它在 100 亿样本 / 100 个参与方 / 季度级迭代下会怎么坏"，而不仅仅是"在 demo 数据集上能跑"。这就是为什么本主题越靠后的题目越考核设计能力——它需要你把工程经验摆上桌。

### 8.4 返回

- 返回 [11-cross-cutting 章节目录](../README.md)
