> 本文件是 **02-classification.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](02-classification.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务问题抽象**

- 把业务问题转化为"输入 → 输出"的分类问题。
- 明确标签定义、类别空间、正负样本含义。
- 输出：**问题定义文档**（业务背景、标签定义、评估指标）。

**Step 2：数据准备与样本构建**

- 收集标注数据（有监督场景）或构造正负样本（无监督 / 半监督）。
- 切分训练集 / 验证集 / 测试集（注意时间切分避免穿越）。
- 处理不平衡（下采样 / 过采样 / 加权）。
- 输出：**样本库 / 训练集 / 测试集**。

**Step 3：特征工程**

- 数值特征：归一化 / 分箱 / 缺失值填充。
- 类别特征：One-Hot / Target Encoding / 嵌入。
- 文本特征：TF-IDF / Word2Vec / BERT Embedding。
- 图像特征：CNN 提取 / 预训练模型。
- 时序特征：滑动窗口 / 滞后值。
- 特征选择：方差 / IV / L1 正则 / 树模型重要性。
- 输出：**特征 pipeline + Feature Store**。

**Step 4：模型选型与基线**

- 用 §3.2 决策表选 1-3 个候选模型。
- 跑基线（如 LR / XGBoost / LightGBM），建立性能下限。
- 输出：**基线报告**（指标、训练时长、推理时长）。

**Step 5：模型调优**

- 超参调优（Grid Search / Random Search / Bayesian Optimization / Hyperband）。
- 类别不平衡处理（Focal Loss / 加权 / SMOTE）。
- 多标签处理（标签依赖 / Classifier Chain）。
- 输出：**调优报告**（最优超参、性能对比）。

**Step 6：模型评估**

- 离线评估：AUC / PR-AUC / F1 / Precision / Recall / 混淆矩阵。
- 业务对齐：AUC 提升 1% 对应业务 GMV 提升多少？
- 错误分析：把错误样本分类，研究是哪些场景容易错。
- 输出：**评估报告 + 错误分析**。

**Step 7：模型上线**

- 模型序列化（Pickle / PMML / ONNX）。
- 在线服务（TF Serving / Triton Inference Server / 自研 RPC 服务）。
- 性能压测（QPS / P99 延迟 / GPU 利用率）。
- A/B 测试（小流量 → 大流量 → 全量）。
- 输出：**上线报告 + A/B 实验报告**。

**Step 8：监控与闭环**

- 模型监控：输入分布、输出分布、AUC 实时计算。
- 漂移检测：Data Drift / Concept Drift / Label Drift。
- 反馈回流：线上预测 + 真实标签回流到样本库。
- 定期重训：日 / 周 / 月粒度。
- 输出：**监控 dashboard + 重训 pipeline**。

### 4.2 关键技术点

**特征工程关键技术**：

1. **分箱（Binning）**：将连续特征离散化（如等频分箱 / 等距分箱 / 卡方分箱）。优势：抗异常值、自动交叉、提升树模型效果。
2. **目标编码（Target Encoding）**：用目标变量的均值替换类别特征。注意必须用 K-Fold 防止泄漏。
3. **特征交叉（Feature Crossing）**：手动构造交叉特征（如 AND(user_country, item_category)）或用 FM / DeepFM 自动学习。
4. **WOE / IV**：Weight of Evidence / Information Value，金融风控的特征选择标准。
5. **特征选择**：方差过滤、卡方检验、互信息、L1 正则、树模型 feature importance、SHAP。
6. **类别不平衡处理**：
   - 下采样（Undersampling）：随机 / EasyEnsemble / BalanceCascade。
   - 过采样（Oversampling）：SMOTE / ADASYN / Borderline-SMOTE。
   - 加权（Class Weight）：对少数类提高 loss 权重。
   - 阈值调优：调整决策阈值而非模型本身。
   - Focal Loss：$\mathcal{L} = -\alpha (1-p)^\gamma \log p$，让模型聚焦难样本。
7. **多标签处理**：
   - Binary Relevance：每个标签独立训练二分类器。
   - Classifier Chain：把前面的标签预测结果作为后面的输入。
   - Label Powerset：每个标签组合作为一个新类别。
   - 深度学习：sigmoid 输出 + BCE Loss。

**训练关键技术**：

8. **分布式训练**：参数服务器（Parameter Server）架构（Angel / XDL）、AllReduce 架构（PyTorch DDP / Horovod）。
9. **混合精度训练**：FP16 + FP32 混合，训练速度提升 2-3 倍。
10. **学习率调度**：Warmup + Cosine Decay / Linear Decay。
11. **正则化**：L1 / L2 / Dropout / Early Stopping / Label Smoothing。
12. **梯度累积（Gradient Accumulation）**：小显存模拟大 batch。

**推理关键技术**：

13. **模型压缩**：量化（INT8 / INT4）、剪枝（Pruning）、蒸馏（Distillation，如 DistilBERT）。
14. **推理加速**：ONNX Runtime、TensorRT、OpenVINO、TVM。
15. **模型服务**：TF Serving、Triton Inference Server、KServe、BentoML、vLLM（LLM 推理）。
16. **特征实时化**：在线特征通过 Feature Store 实时查询（如 Redis / DynamoDB / HBase）。

**LLM 分类关键技术**：

17. **Prompt 工程**：清晰指令 + Few-shot 示例 + JSON Schema 输出约束。
18. **Function Calling**：让 LLM 直接输出结构化分类结果（避免解析错误）。
19. **Self-Consistency**：多次采样 + 投票，提升鲁棒性。
20. **LLM Embedding + 轻量分类头**：用 LLM 提 embedding，接 LR / MLP 分类头。比 fine-tuning LLM 便宜。
21. **路由分类器**：先用轻量分类器判断"走 LLM 还是走专用模型"，控制成本。

### 4.3 工具链与平台

**传统机器学习框架**：

- **scikit-learn**（Python / 开源）——经典 ML 库，LR / SVM / 决策树 / RF 标配。
- **XGBoost**（C++/Python / 开源）——GBDT 工业标准。
- **LightGBM**（C++/Python / 开源）——微软出品，速度最快。
- **CatBoost**（C++/Python / 开源）——Yandex 出品，类别特征友好。

**深度学习框架**：

- **PyTorch**（Python / 开源）——学术界主流。
- **TensorFlow / Keras**（Python / 开源）——工业界传统主流。
- **JAX**（Python / 开源）——Google 新一代框架。
- **PaddlePaddle**（国产 / 百度）——国产化深度学习框架。
- **MindSpore**（国产 / 华为）——华为全场景 AI 框架。

**专用框架**：

- **FastText**（Facebook / 开源）——文本分类轻量框架。
- **TextCNN / TextRNN**——经典文本分类模型实现。
- **HuggingFace Transformers**（开源）——预训练模型 SOTA 库，含 BERT / RoBERTa / GPT / LLaMA 等。
- **timm**（开源）——PyTorch Image Models，图像分类模型库。
- **TabNet / SAINT / FT-Transformer / TabPFN**——表格数据专用深度学习。

**大模型分类工具**：

- **LangChain**（开源）——LLM 应用框架，含分类链（Classification Chain）。
- **LlamaIndex**（开源）——LLM 数据框架，可做分类。
- **vLLM**（开源）——LLM 高吞吐推理。
- **SetFit**（HuggingFace / 开源）——少样本文本分类。
- **OpenAI Function Calling**——结构化输出分类。
- **Anthropic Tool Use**——结构化输出分类。
- **DSPy**（Stanford / 2024）——LLM 程序化优化，分类任务可自动 prompt 调优。

**训练平台**：

- **MLflow**（开源）——ML 实验管理 + 模型注册。
- **Kubeflow**（开源）——K8s 上的 ML 平台。
- **TFX**（Google / 开源）——TensorFlow 端到端 ML 平台。
- **Feast**（开源）——Feature Store。
- **Alibaba PAI**（阿里云）——阿里机器学习平台。
- **ByteDance AML**（字节）——字节机器学习平台。
- **AWS SageMaker**——AWS 托管 ML 平台。
- **Azure ML**——Azure 托管 ML 平台。
- **Google Vertex AI**——GCP 托管 ML 平台。

**2024-2025 新工具**：

- **PyTorch 2.x + compile**——训练速度提升 30-50%。
- **DeepSpeed + ZeRO-3**——千亿参数模型训练。
- **TRL / HuggingFace TRL**（2023+）——LLM 分类微调（SFT / DPO）。
- **Unsloth**（2024）——LLM 微速度提升 2-5x。
- **LlamaFactory**（2024）——LLM 一站式微调框架。
- **Pieces / Continue**（2024）——开发者助手，含分类能力。

### 4.4 代码 / 示例

**示例 1：LR 训练（CTR 预估）**

```python
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, classification_report
from sklearn.model_selection import train_test_split

# 假设 X 是用户/物品特征矩阵，y 是点击标签 (0/1)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 训练 LR
model = LogisticRegression(
    C=1.0,                    # 正则化强度倒数
    penalty='l2',            # L2 正则
    solver='lbfgs',          # 优化算法
    max_iter=1000,
    class_weight='balanced', # 类别不平衡加权
    n_jobs=-1
)
model.fit(X_train, y_train)

# 预测概率
y_prob = model.predict_proba(X_test)[:, 1]
y_pred = model.predict(X_test)

# 评估
print(f"AUC: {roc_auc_score(y_test, y_prob):.4f}")
print(classification_report(y_test, y_pred))
```

**示例 2：XGBoost 训练（结构化数据）**

```python
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 计算正负样本比例，用于 scale_pos_weight
neg, pos = (y_train == 0).sum(), (y_train == 1).sum()
scale_pos_weight = neg / pos

dtrain = xgb.DMatrix(X_train, label=y_train)
dtest = xgb.DMatrix(X_test, label=y_test)

params = {
    'objective': 'binary:logistic',
    'eval_metric': 'auc',
    'max_depth': 6,
    'eta': 0.1,                    # learning_rate
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'min_child_weight': 1,
    'gamma': 0,
    'scale_pos_weight': scale_pos_weight,  # 不平衡处理
    'tree_method': 'hist',         # 直方图加速
    'device': 'cuda',              # GPU 训练
}

bst = xgb.train(
    params, dtrain,
    num_boost_round=1000,
    evals=[(dtest, 'test')],
    early_stopping_rounds=50,
    verbose_eval=100
)

y_prob = bst.predict(dtest)
print(f"AUC: {roc_auc_score(y_test, y_prob):.4f}")

# 特征重要性
import matplotlib.pyplot as plt
xgb.plot_importance(bst, max_num_features=20)
plt.show()
```

**示例 3：BERT 文本分类（Fine-tune）**

```python
from transformers import (
    AutoTokenizer, AutoModelForSequenceClassification,
    Trainer, TrainingArguments
)
from datasets import load_dataset

# 加载数据
dataset = load_dataset("csv", data_files={"train": "train.csv", "test": "test.csv"})

# 分词
tokenizer = AutoTokenizer.from_pretrained("bert-base-chinese")

def tokenize(batch):
    return tokenizer(batch["text"], padding=True, truncation=True, max_length=128)

dataset = dataset.map(tokenize, batched=True)

# 加载模型
model = AutoModelForSequenceClassification.from_pretrained(
    "bert-base-chinese", num_labels=10
)

# 训练
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=32,
    per_device_eval_batch_size=64,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    learning_rate=2e-5,
    load_best_model_at_end=True,
    fp16=True,  # 混合精度
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
)

trainer.train()
```

**示例 4：LLM 零样本分类（OpenAI Function Calling）**

```python
import openai
import json

client = openai.OpenAI(api_key="sk-...")

# 定义分类标签（业务约束）
CLASSES = ["科技", "财经", "体育", "娱乐", "教育", "医疗", "其他"]

tools = [{
    "type": "function",
    "function": {
        "name": "classify_news",
        "description": "对新闻文本进行分类",
        "parameters": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": CLASSES,
                    "description": "新闻类别"
                },
                "confidence": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1,
                    "description": "分类置信度"
                },
                "reason": {
                    "type": "string",
                    "description": "分类理由"
                }
            },
            "required": ["category", "confidence", "reason"]
        }
    }
}]

def classify_news(text: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "你是一个新闻分类专家，精确判断新闻类别。"},
            {"role": "user", "content": f"新闻：{text}"}
        ],
        tools=tools,
        tool_choice={"type": "function", "function": {"name": "classify_news"}}
    )

    args = json.loads(response.choices[0].message.tool_calls[0].function.arguments)
    return args

# 使用
result = classify_news("OpenAI 发布 GPT-5，多模态能力大幅提升")
print(result)
# {'category': '科技', 'confidence': 0.95, 'reason': '涉及 AI 模型发布'}
```

**示例 5：类别不平衡处理（Focal Loss）**

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class FocalLoss(nn.Module):
    """Focal Loss 用于缓解类别不平衡"""
    def __init__(self, alpha=1, gamma=2, reduction='mean'):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction

    def forward(self, inputs, targets):
        BCE_loss = F.binary_cross_entropy_with_logits(inputs, targets, reduction='none')
        pt = torch.exp(-BCE_loss)
        focal_loss = self.alpha * (1 - pt) ** self.gamma * BCE_loss

        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        return focal_loss

# 使用
criterion = FocalLoss(alpha=0.25, gamma=2.0)
loss = criterion(logits, labels)
```

**示例 6：多标签分类（BCE）**

```python
import torch
import torch.nn as nn

class MultiLabelClassifier(nn.Module):
    """多标签分类：sigmoid + BCE"""
    def __init__(self, input_dim, num_labels):
        super().__init__()
        self.classifier = nn.Linear(input_dim, num_labels)

    def forward(self, x):
        return self.classifier(x)  # logits，不要 softmax

# 损失函数必须用 BCE（不是 CrossEntropyLoss）
criterion = nn.BCEWithLogitsLoss()  # 多标签
# criterion = nn.CrossEntropyLoss()  # 多分类（互斥标签）

logits = model(features)  # [batch, num_labels]
loss = criterion(logits, labels.float())  # labels 必须是 float
```

---
