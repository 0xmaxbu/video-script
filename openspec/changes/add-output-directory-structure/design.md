## Context

当前视频生成工作流的 Agent 输出直接通过内存传递给下一个 Agent，没有持久化到文件系统。这导致：

1. 工作流中断后无法从断点恢复（必须重新开始）
2. 中间产物难以追溯和审计
3. 同一选题多次生成时无法复用已有研究成果

## Goals / Non-Goals

**Goals:**

- 实现结构化输出目录，按年/月日-月日/选题slug 组织
- 每个 Agent 的产出以固定文件名（JSON）保存到目录
- 下一个 Agent 能够从目录读取上一阶段的产出文件
- CLI --output 参数可完全覆盖默认输出路径

**Non-Goals:**

- 不实现断点续传功能（后续迭代）
- 不保留 Markdown 可读版本（仅 JSON）
- 不提供输出目录相关的 Agent 工具（目录由程序管理）
- 不引入数据库存储

## Decisions

### 1. 目录结构格式

**决策**: `{基准路径}/{年}/{月日-月日}_{选题slug}/`

**示例**: `output/2026/3-9_3-15_typescript-generics-tutorial/`

**理由**: 月日范围清晰直观；选题 slug 避免目录名问题

**备选**: `/data/年/周/选题/`（用户反馈周数意义不明，已排除）

### 2. 默认基准路径

**决策**: `process.cwd()/output/`

**理由**: 避免 `/data/` 需要 root 权限的问题；使用 cwd 确保在当前工作目录有写入权限

**CLI 覆盖**: `--output /custom/path` 完全覆盖默认路径，所有文件都写入指定路径

### 3. 月日范围计算

**决策**: 使用 `date-fns` 库的 `format(start, 'M-d')` + `format(end, 'M-d')`

**格式**: `M1-D1_M2-D2`（如 `3-9_3-15`）

**理由**: 简洁直观，计算逻辑简单

### 4. 文件命名规范

**决策**: 各阶段固定文件名

- Research 阶段: `research.json`
- Script 阶段: `script.json`
- Screenshot 阶段: `screenshots.json`（含截图路径列表）
- Compose 阶段: `composition.json`

**理由**: 固定名称便于下游 Agent 查找

### 5. 文件格式

**决策**: 仅 JSON 格式

**理由**: 用户明确表示不需要 Markdown 版本；JSON 便于程序解析

### 6. Agent 工具简化

**决策**: 只提供 writeJsonFile 和 readJsonFile 两个工具

**理由**:

- 输出目录由程序管理，不需要暴露给 Agent
- 不需要 listDir（系统不需要扫描文件列表）
- Agent 只需要读写产出的能力

## Risks / Trade-offs

- [风险] 磁盘空间管理 → [缓解] 提供目录清理 CLI 命令
- [风险] 并发写入冲突 → [缓解] 当前为单用户 CLI，无需并发控制
- [风险] 中文目录名编码 → [缓解] 使用 slugify 转换特殊字符

## 已解答问题

- **是否保留 Markdown**: 否，仅保留 JSON
- **目录基础路径是否可配置**: 不可配置，但 CLI --output 参数可完全覆盖
- **输出目录是否暴露给 Agent**: 否，由程序内部管理，Agent 只需知道固定文件名
