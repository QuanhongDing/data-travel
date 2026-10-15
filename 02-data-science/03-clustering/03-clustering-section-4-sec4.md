> 本文件是 **03-clustering.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](03-clustering.md)。

## 4. 工程实现

### 4.1 落地步骤

**Step 1：业务问题抽象**

- 把业务问题转化为"无标签 + 按相似度归组"的聚类问题。
- 明确输入（特征 / Embedding）、输出（簇标签 + 簇描述）、评估方式（轮廓系数 + 业务人工）。
- 输出：**问题定义文档**。

**Step 2：数据准备与特征工程**

- 收集原始数据。
- 数值特征标准化（StandardScaler / MinMaxScaler）。
- 类别特征编码（One-Hot / Target Encoding / Embedding）。
- 文本特征 Embedding（Sentence-BERT / OpenAI Embedding）。
- 图像特征 Embedding（CLIP / ResNet）。
- 输出：**特征矩阵 / Embedding 矩阵**。

**Step 3：降维（可选但强烈推荐）**

- 高维数据先降维：PCA（线性） / t-SNE（可视化） / UMAP（保留局部结构）。
- 输出：**低维表示**（通常 2-50 维）。

**Step 4：选择聚类算法**

- 用 §3.2 决策表选 1-3 个候选算法。
- 输出：**算法选型报告**。

**Step 5：K 选择（K-Means / GMM）**

- 肘部法则：观察 SSE 随 K 变化的拐点。
- 轮廓系数：找轮廓系数最大的 K。
- CH Index：找 CH 最大的 K。
- Gap Statistic：与参考分布对比。
- 业务可解释性：业务专家 review 不同 K 的聚类结果。
- 输出：**最优 K + 评估报告**。

**Step 6：模型训练**

- K-Means / GMM / DBSCAN / HDBSCAN / 谱聚类等。
- 多次随机种子取最优。
- 输出：**聚类结果**（每个样本的簇标签）。

**Step 7：评估与可解释性**

- 内部评估：轮廓系数 / CH / DBI / SSE。
- 业务评估：业务专家 review 簇内 / 簇间差异。
- 可解释性：每个簇的中心样本 / LLM 命名 / 业务标签。
- 稳定性：多次聚类投票，看簇标签是否稳定。
- 输出：**评估报告 + 簇命名 + 业务标签**。

**Step 8：应用与监控**

- 聚类标签作为新特征喂给下游模型。
- 聚类标签作为用户/商品的"分群标签"用于精细化运营。
- 监控：分布漂移（如用户分布变了，聚类结果要重训）。
- 输出：**应用报告 + 监控 dashboard**。

### 4.2 关键技术点

**特征工程关键技术**：

1. **标准化**：StandardScaler（减均值除方差）、MinMaxScaler（缩放到 [0,1]）、RobustScaler（抗异常值）。
2. **降维**：
   - **PCA**（线性，速度快，可解释）——最大方差保留。
   - **t-SNE**（非线性，可视化好）——保留局部结构，但不可重复。
   - **UMAP**（非线性，可视化 + 通用）——保留局部 + 全局结构，速度比 t-SNE 快。
   - **自编码器**（深度学习）——非线性降维，可学习任务相关表示。
3. **类别特征处理**：Jaccard 距离、汉明距离、Target Encoding、自编码器 Embedding。
4. **文本特征**：TF-IDF（传统）、Sentence-BERT（语义）、OpenAI Embedding、LLM Embedding。
5. **图像特征**：ResNet（CNN 特征）、CLIP（多模态）、DINOv2（自监督）。

**聚类关键技术**：

6. **K 选择**：
   - 肘部法则（SSE 拐点）。
   - 轮廓系数（Silhouette Score）。
   - Calinski-Harabasz Index（CH）。
   - Davies-Bouldin Index（DBI）。
   - Gap Statistic。
   - X-means（自动选择 K 的 K-Means 变种）。
7. **初始化**：
   - K-Means++（默认推荐，比随机初始化好）。
   - 多次随机种子取最优。
8. **距离度量**：
   - 欧氏距离：连续型、低维数据。
   - 余弦相似度：高维稀疏、文本、Embedding。
   - 曼哈顿距离：稀疏特征、决策树。
   - 马氏距离：考虑特征相关性的距离。
   - Jaccard 距离：集合 / 类别特征。
9. **稳定性评估**：
   - 多次聚类投票（bootstrap）。
   - ARI（Adjusted Rand Index）评估两次聚类的一致性。
   - 簇标签稳定性（同一簇的样本多次聚类是否一致）。
10. **加速技术**：
    - Mini-Batch K-Means（大数据）。
    - Faiss K-Means（GPU 加速）。
    - Spark MLlib K-Means（分布式）。
    - Canopy + K-Means 二阶段。
    - BIRCH（增量聚类，适合流式数据）。
11. **可视化**：
    - t-SNE / UMAP 散点图。
    - dendrogram（层次聚类）。
    - Clustergram（K-Means 多次结果可视化）。
    - PCA 散点图。

**LLM 聚类关键技术**：

12. **Embedding 选型**：
    - Sentence-BERT（开源、本地部署）。
    - OpenAI text-embedding-3（API、高质量）。
    - Cohere embed-english-v3（API、多语言）。
    - BGE / M3E（中文 SOTA）。
    - CLIP（多模态）。
13. **聚类后命名**：
    - 取簇中心最近样本的文本作为代表。
    - c-TF-IDF 提取主题词（BERTopic）。
    - LLM 命名（GPT-4 给每个簇起名 + 描述）。
14. **聚类质量 LLM 评估**：
    - LLM 判断"两个簇是否应该合并"。
    - LLM 评估"每个簇的语义一致性"。

### 4.3 工具链与平台

**传统聚类库**：

- **scikit-learn**（Python / 开源）——K-Means / DBSCAN / 谱聚类 / GMM / 层次聚类标配。
- **SciPy**（Python / 开源）——层次聚类（scipy.cluster.hierarchy）。
- **R cluster / factoextra**——R 语言聚类。

**工业级聚类库**：

- **Faiss**（Meta / 开源）——K-Means 的 GPU 加速实现，亿级数据可用。
- **Annoy**（Spotify / 开源）——近似最近邻 + K-Means。
- **Spark MLlib**（开源）——分布式 K-Means / GMM / Bisecting K-Means。
- **Mahout**（Apache / 开源）——Hadoop 上的聚类。

**专用聚类库**：

- **HDBSCAN**（Python / 开源）——密度聚类工业标准。
- **BERTopic**（Python / 开源）——文本主题聚类。
- **Top2Vec**（Python / 开源）——文本主题聚类。
- **CLIP + sklearn**——多模态聚类。

**深度聚类库**：

- **PyTorch** + 自研 DEC / DCN。
- **TensorFlow** + 自研深度聚类。
- **Keras** + 自研聚类层。

**降维库**：

- **scikit-learn**（PCA / t-SNE）。
- **UMAP**（开源）——非线性降维首选。
- **openTSNE**（开源）——t-SNE 的快速实现。

**可视化工具**：

- **matplotlib / seaborn**——静态可视化。
- **plotly / bokeh**——交互可视化。
- **clustergram**——聚类过程可视化。
- **tensorboard projector**——embedding + 聚类可视化。

**LLM 工具（2024-2025 新工具）**：

- **Sentence Transformers**（HuggingFace / 开源）——文本 Embedding 首选。
- **OpenAI Embeddings API**——商业 Embedding API。
- **Cohere Embed**——商业 Embedding。
- **BGE / M3E / Piccolo**（开源中文 Embedding）。
- **Instructor**（2023）——指令引导的 Embedding。
- **E5 / BGE-M3**（2024）——多语言 / 多功能 Embedding。
- **Voyage AI**（2024）——高质量 Embedding API。
- **Nomic Atlas**（2024）——Embedding 可视化 + 聚类平台。
- **DeepSeek-Embed**（2024）——国产高质量 Embedding。

### 4.4 代码 / 示例

**示例 1：K-Means 聚类（用户分群）**

```python
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, calinski_harabasz_score
import matplotlib.pyplot as plt

# 假设 X 是用户行为特征 (n_samples, n_features)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 选择最优 K（轮廓系数）
silhouette_scores = []
K_range = range(2, 15)
for K in K_range:
    kmeans = KMeans(n_clusters=K, n_init=10, random_state=42)
    labels = kmeans.fit_predict(X_scaled)
    score = silhouette_score(X_scaled, labels)
    silhouette_scores.append(score)

optimal_K = K_range[np.argmax(silhouette_scores)]
print(f"最优 K = {optimal_K}, 轮廓系数 = {max(silhouette_scores):.3f}")

# 用最优 K 训练
kmeans = KMeans(n_clusters=optimal_K, n_init=10, random_state=42)
labels = kmeans.fit_predict(X_scaled)

# 评估
print(f"CH Index = {calinski_harabasz_score(X_scaled, labels):.1f}")

# 可视化（PCA 降到 2D）
from sklearn.decomposition import PCA
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)
plt.scatter(X_pca[:, 0], X_pca[:, 1], c=labels, cmap='viridis', s=5)
plt.title(f'K-Means Clustering (K={optimal_K})')
plt.show()
```

**示例 2：HDBSCAN（异常检测 + 任意形状）**

```python
import hdbscan
import numpy as np

# 假设 X 是已标准化的特征
clusterer = hdbscan.HDBSCAN(
    min_cluster_size=50,         # 最小簇大小
    min_samples=10,               # 核心点最少邻居
    metric='euclidean',
    cluster_selection_method='eabm',  # Excess of Mass / Leaf
    prediction_data=True
)
labels = clusterer.fit_predict(X)

# 异常分数（值越大越异常）
outlier_scores = clusterer.outlier_scores_

# 统计
n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
n_noise = (labels == -1).sum()
print(f"簇数 = {n_clusters}, 噪声点 = {n_noise} ({n_noise/len(X)*100:.1f}%)")

# 找出最异常的 1% 样本
threshold = np.percentile(outlier_scores, 99)
anomaly_idx = np.where(outlier_scores >= threshold)[0]
print(f"异常样本数 = {len(anomaly_idx)}")
```

**示例 3：Sentence-BERT + K-Means（文本聚类）**

```python
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import numpy as np

# 加载模型
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

# 计算 Embedding
texts = ["文档1...", "文档2...", ...]
embeddings = model.encode(texts, batch_size=64, show_progress_bar=True)

# K-Means 聚类
K = 20  # 可用轮廓系数调优
kmeans = KMeans(n_clusters=K, n_init=10, random_state=42)
labels = kmeans.fit_predict(embeddings)

# 评估
score = silhouette_score(embeddings, labels, metric='cosine')
print(f"轮廓系数 = {score:.3f}")

# 簇中心最近样本作为簇代表
for k in range(K):
    cluster_idx = np.where(labels == k)[0]
    center = kmeans.cluster_centers_[k]
    distances = np.linalg.norm(embeddings[cluster_idx] - center, axis=1)
    representative_idx = cluster_idx[np.argmin(distances)]
    print(f"簇 {k}（{len(cluster_idx)} 个文档）: {texts[representative_idx][:100]}")
```

**示例 4：BERTopic 主题聚类**

```python
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer
from umap import UMAP
from hdbscan import HDBSCAN

# 自定义 Embedding 模型
embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

# UMAP 降维
umap_model = UMAP(n_neighbors=15, n_components=5, min_dist=0.0, metric='cosine')

# HDBSCAN 聚类
hdbscan_model = HDBSCAN(min_cluster_size=10, metric='euclidean')

# 创建 BERTopic
topic_model = BERTopic(
    embedding_model=embedding_model,
    umap_model=umap_model,
    hdbscan_model=hdbscan_model,
    top_n_words=10,
    nr_topics="auto",  # 自动合并相似主题
    verbose=True
)

# 训练
topics, probs = topic_model.fit_transform(texts)

# 查看主题
print(topic_model.get_topic_info().head(20))

# 可视化
topic_model.visualize_topics()
topic_model.visualize_hierarchy()
```

**示例 5：LLM 命名聚类（GPT-4 命名）**

```python
import openai
import json

def name_cluster_with_llm(samples: list[str], cluster_id: int) -> str:
    """用 LLM 给聚类命名"""
    client = openai.OpenAI(api_key="sk-...")
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{
            "role": "user",
            "content": f"""以下是聚类 {cluster_id} 的代表样本（来自同一类）：
{chr(10).join(samples[:10])}

请用 5-10 个字概括这群样本的共同主题，给出 3 个候选名称（JSON 数组）。
只输出 JSON，不要其他内容。"""
        }],
        temperature=0.3
    )
    return response.choices[0].message.content

# 对每个簇命名
for cluster_id in range(K):
    cluster_samples = [texts[i] for i in range(len(texts)) if labels[i] == cluster_id]
    name = name_cluster_with_llm(cluster_samples, cluster_id)
    print(f"簇 {cluster_id}: {name}")
```

**示例 6：Canopy + K-Means 二阶段聚类**

```python
from sklearn.cluster import KMeans
import numpy as np

def canopy_clustering(X, t1, t2):
    """Canopy 粗聚类"""
    n = X.shape[0]
    canopies = []
    removed = np.zeros(n, dtype=bool)

    for i in range(n):
        if removed[i]:
            continue
        canopy = [i]
        for j in range(n):
            if removed[j] or j == i:
                continue
            dist = np.linalg.norm(X[i] - X[j])
            if dist < t1:
                canopy.append(j)
                removed[j] = True  # 进入 canopy
            elif dist < t2:
                canopy.append(j)  # 进入但不从候选中移除
        removed[i] = True
        canopies.append(canopy)

    return canopies

# 阶段1：Canopy 粗聚类（选 K）
canopies = canopy_clustering(X, t1=1.0, t2=2.0)
K = len(canopies)
print(f"Canopy 数（建议 K）= {K}")

# 阶段2：K-Means 细聚类
kmeans = KMeans(n_clusters=K, n_init=10, random_state=42)
labels = kmeans.fit_predict(X)
```

**示例 7：联邦聚类（隐私保护）**

```python
# 伪代码：联邦 K-Means（每个数据源本地训练，共享质心）
class FederatedKMeans:
    def __init__(self, n_clusters=10, n_rounds=10):
        self.n_clusters = n_clusters
        self.n_rounds = n_rounds
        self.global_centroids = None

    def fit(self, data_sources):
        # 初始化：用第一个数据源初始化质心
        kmeans = KMeans(n_clusters=self.n_clusters, n_init=1)
        kmeans.fit(data_sources[0])
        self.global_centroids = kmeans.cluster_centers_

        # 迭代
        for round in range(self.n_rounds):
            local_centroids = []
            local_weights = []
            for X in data_sources:
                # 用全局质心初始化本地 K-Means
                kmeans = KMeans(
                    n_clusters=self.n_clusters,
                    init=self.global_centroids,
                    n_init=1
                )
                kmeans.fit(X)
                local_centroids.append(kmeans.cluster_centers_)
                local_weights.append(len(X))

            # 加权平均全局质心（FedAvg 思想）
            weights = np.array(local_weights) / sum(local_weights)
            self.global_centroids = np.average(
                local_centroids, axis=0, weights=weights
            )

        return self

    def predict(self, X):
        # 用全局质心分配标签
        distances = np.linalg.norm(X[:, None] - self.global_centroids, axis=2)
        return np.argmin(distances, axis=1)
```

---
