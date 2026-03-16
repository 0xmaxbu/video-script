## Context

当前自动 workflow 太过复杂，改为手动子命令模式， 由人工推进每个阶段，更加灵活可控。 **核心约束：动画编排必须服务于口播内容的节奏。**

## Goals / Non-Goals

**Goals:**
- 宯现手动子命令模式
- 每个阶段的产出以 JSON 文件形式持久化
- 结构化输出目录，- 动画服务于口播内容

**Non-Goals:**
- 不保留 Markdown 版本（仅 JSON）
- 不实现断点续传（后续迭代）
- 不引入数据库

## Decisions

### 1. 目录结构格式

**决策**: `{基准路径}/{年}/{周-月_日-月_日}_{选题slug}/`

**示例**: `output/2026/11-3_9-3_15/typescript-generics-tutorial/`

**理由**: 保留周数便于按周排序

### 2. 默认基准路径

**决策**: `process.cwd()/output/`

**理由**: 避免权限问题

**CLI 覆盖**: `--output /custom/path` 完全覆盖默认路径

### 3. 文件命名

- Research: `research.json`
- Script: `script.json`
- 视频: `output.mp4`
- 字幕: `output.srt`

### 4. 核心约束

**动画服务于口播内容** — Script Agent 必须按照 research.json 的 sentence 节奏编排截图和动画

## Risks / Trade-offs

- 磁盘空间 → 提供清理命令
- 中文目录名 → 使用 slugify
