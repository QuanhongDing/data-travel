> 本文件是 **08-privacy-computing.md** 的子文件（§7. 与其他方法对比）。完整章节请回到 [index](08-privacy-computing.md)。

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
