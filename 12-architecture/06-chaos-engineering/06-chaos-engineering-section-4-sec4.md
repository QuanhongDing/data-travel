> 本文件是 **06-chaos-engineering.md** 的子文件（§4. 工程实现）。完整章节请回到 [index](06-chaos-engineering.md)。

## 4. 工程实现

### 4.1 落地步骤

#### 阶段 1：基础准备（1-2 个月）

1. **建立可观测性**：监控告警、链路追踪、日志系统。
2. **定义稳态指标**：错误率、P99 延迟、吞吐量、可用性。
3. **选择混沌平台**：开源（ChaosBlade、Chaos Mesh）或商业（Gremlin）。

#### 阶段 2：预生产环境试点（1-2 个月）

1. **第一个实验**：kill 一个 Pod，观察系统表现。
2. **建立 Runbook**：每个实验的步骤、观察、Abort 机制。
3. **团队培训**：让团队熟悉混沌工程流程。

#### 阶段 3：生产环境推广（2-3 个月）

1. **从非核心业务开始**：从边缘业务开始，逐步推广到核心。
3. **建立审批流程**：生产环境混沌需审批。
4. **建立告警联动**：实验与告警联动，异常自动 Abort。

#### 阶段 4：常态化运营（持续）

1. **持续集成**：混沌实验集成到 CI/CD。
2. **GameDay 演练**：季度 / 月度演练。
3. **AI 辅助**：用 AI 推荐故障、识别异常。
4. **改进闭环**：每次实验的发现转化为改进项。

### 4.2 关键技术点

#### 1. ChaosBlade（阿里开源）

```bash
# CPU 满载
blade create cpu fullload --cpu-percent 80 --timeout 60

# 网络延迟
blade create network delay --time 3000 --interface eth0 --timeout 60

# 杀进程
blade create process kill --process mysql --timeout 60

# 磁盘 IO 故障
blade create disk fill --path /tmp --size 100 --timeout 60
```

#### 2. LitmusChaos（CNCF）

```yaml
# Pod 删除实验
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: pod-delete-engine
spec:
  appinfo:
    appns: default
    applabel: app=order-service
    appkind: deployment
  chaosServiceAccount: litmus-admin
  experiments:
  - name: pod-delete
    spec:
      components:
        env:
        - name: TOTAL_CHAOS_DURATION
          value: "30"
        - name: CHAOS_INTERVAL
          value: "10"
        - name: FORCE
          value: "false"
```

#### 3. Chaos Mesh（PingCAP，CNCF）

```yaml
# 网络分区实验
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: network-partition
spec:
  action: partition
  mode: all
  selector:
    namespaces:
    - default
    labelSelectors:
      app: order-service
  partition:
    from:
      - labelSelectors:
          app: order-service
    to:
      - labelSelectors:
          app: payment-service
  duration: "5m"
```

### 4.3 工具链与平台（含 2024-2025 新工具）

| 工具 | 出品方 | 特点 |
| --- | --- | --- |
| **Chaos Monkey** | Netflix（开源） | 老牌，kill 生产实例 |
| **Chaos Blade** | 阿里（开源） | 中文友好，覆盖面广 |
| **Chaos Mesh** | PingCAP（CNCF） | Kubernetes 原生，云原生首选 |
| **LitmusChaos** | MayaData（CNCF） | 实验丰富，社区活跃 |
| **Gremlin** | Gremlin（商业） | 商业平台，SaaS 一体化 |
| **AWS Fault Injection Service** | AWS | 云厂商集成 |
| **Azure Chaos Studio** | Microsoft | 云厂商集成 |
| **GCP Chaos Engineering** | Google | 云厂商集成 |
| **Chaostoolkit** | Chaos Toolkit（开源） | 跨平台实验编排 |
| **Toxiproxy** | Shopify（开源） | 网络层故障代理 |

### 4.4 代码 / 示例

#### ChaosBlade + K8s 完整示例

```bash
# 1. 安装 ChaosBlade Operator
helm install chaosblade blade/chaosblade-operator --namespace chaosblade

# 2. 创建 Pod 杀进程实验
cat > pod-kill.yaml <<EOF
apiVersion: chaosblade.io/v1alpha1
kind: ChaosBlade
metadata:
  name: pod-kill-order
spec:
  experiments:
  - scope: pod
    target: order-service
    action: pod-kill
    desc: "kill order-service pod"
    matchers:
    - name: pod
      value:
        - order-service-*
    - name: namespace
      value:
        - default
    - name: container-ids
      value:
        - order-service
    - name: cpu-percent
      value: ["80"]
  duration: 5m
EOF

kubectl apply -f pod-kill.yaml

# 3. 观察实验结果
kubectl get chaosblade pod-kill-order -w
```

#### Python 编排实验

```python
# ChaosBlade Python SDK
from chaosblade import ChaosBladeClient

cb = ChaosBladeClient(host="chaosblade.k8s.cluster")

# 创建实验
experiment = cb.create_experiment(
    target="pod",
    action="kill",
    matchers={
        "name": "pod",
        "value": ["order-service-*"],
        "namespace": "default"
    },
    duration="5m"
)

# 观察实验
try:
    while experiment.is_running():
        status = cb.get_status(experiment.uid)
        print(f"Status: {status.phase}, "
              f"Success: {status.success_count}, "
              f"Errors: {status.error_count}")
        time.sleep(10)
finally:
    # 确保回滚
    experiment.destroy()
```

---
