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

> **一句话定位**：联邦学习、安全多方计算、可信执行环境。

> 本文整合自题库《大数据平台架构师》（创脉思 cms365.cn，版本 2025-11-25）的真实面试题。
> 题号沿用原题库编号（PDF §X.Y 第 K 题），便于读者回溯原题与答案详解。

## 1 全景视图

> 本节整合 1 个原 PDF 子章节、共 5 道真题。下表按原 PDF 主题汇总。

| 原 PDF §N.M | 主题 | 题号范围 | 收录题数 | 主/辅 |
| --- | --- | --- | :---: | :---: |
| §10.3 | 集群数据备份与恢复策略 | 10.3.1, 10.3.2, 10.3.3, 10.3.4, 10.3.5 | 5 | 辅 |

## 2 分主题展开

> 按原 PDF 主题（N）逐章展开。每个主题先给主题背景与核心概念，然后按子章节列出全部题目。

> 题干保持原题库表述（含部分 CJK 兼容性汉字），便于在原 PDF 中检索。

### 2.1 §10 应对节点、机架乃⾄数据中⼼级别故障 > 本主题涵盖 1 个子节、5 道题。

#### 2.1.3 集群数据备份与恢复策略

> 来源：原 PDF §10.3，收录 5 道题。（辅）

| 题号 | 难度 |
| --- | :---: |
| §10.3.1 | ★★★☆☆ |
| §10.3.2 | ★★★☆☆ |
| §10.3.3 | ★★★☆☆ |
| §10.3.4 | ★★★☆☆ |
| §10.3.5 | ★★★★☆ |

- **§10.3.1**：请解释在⼤数据集群中，全量备份和增量备份的主要区别是什么，并说明在什么
- **§10.3.2**：请描述HDFS快照的基本原理，并说明它在数据备份和恢复过程中起到什么作⽤？
- **§10.3.3**：在保证数据可⽤性和恢复时间⽬标（RTO）的前提下，如何平衡全量备份和增量
- **§10.3.4**：请设计⼀个万节点Hadoop集群的跨数据中⼼数据备份⽅案，需要阐述备份策略、
- **§10.3.5**：当⾯临数据中⼼级别的故障需要进⾏全量数据恢复时，请详细说明你的恢复流

## 3 横向小结

> 本节题目的横切主题分布——按跨章节反复考察的能力维度回顾：

- **集群容错与故障恢复**

## 4 本章小结

> 本面试真题集收录 5 道题，覆盖 1 个原 PDF 主题、1 个子章节。
> 题号沿用原题库编号，便于跨文章交叉检索。读者可按需查阅。

### 4.1 推荐学习路径

1. 先看「[§1 全景视图](#1-全景视图)」了解题目分布
2. 按「[§2 分主题展开](#2-分主题展开)」逐主题学习
3. 最后用「[§3 横向小结](#3-横向小结)」回顾横切主题

### 4.2 返回

- 返回 [11-cross-cutting 章节目录](../README.md)
- 返回 [项目根目录](../../README.md)
