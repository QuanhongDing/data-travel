> 本文件是 **08-privacy-computing.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](08-privacy-computing.md)。

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
