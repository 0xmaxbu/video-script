## Context

当前项目使用 Remotion 进行视频渲染，但遇到以下问题：

1. Node.js v24 与 Remotion 的 `@remotion/bundler` 存在兼容性问题
2. `@remotion/studio/renderEntry` 模块无法正确解析
3. 主项目依赖 Mastra 需要 zod v4，而旧版本 Remotion 需要 zod v3，存在版本冲突

项目需要将渲染功能独立出来，避免版本冲突，同时保持模块化架构。

## Goals / Non-Goals

**Goals:**

- 创建独立的渲染 CLI 包 `@video-script/renderer`，包含完整视频渲染能力
- 主 CLI 通过子进程调用独立渲染 CLI，实现进程隔离
- 解决 zod 版本冲突问题
- 保持向后兼容，现有 CLI 使用方式不变

**Non-Goals:**

- 不修改现有的研究、脚本、截图 Agent 逻辑
- 不修改 TTS 配音模块（如果后续添加）
- 不修改 Remotion 组件的 React 代码

## Decisions

### 决策 1：独立 CLI vs 独立服务

**选择**：独立 CLI 命令（子进程调用）

**理由**：

- 相比于独立 HTTP 服务，启动更快，资源占用更少
- 无需额外端口和进程管理
- 实现简单，适合当前 MVP 阶段

### 决策 2：调用方式

**选择**：通过 `child_process.spawn` 执行独立 CLI

**理由**：

- 完全隔离 Node.js 进程，避免依赖冲突
- 支持流式输出，便于显示渲染进度
- 实现简单，跨平台兼容性好

### 决策 3：包结构

**选择**：monorepo 结构，主项目和渲染包共享部分类型定义

**理由**：

- 便于类型共享，避免重复定义
- 统一版本管理
- 简化 CI/CD 配置

## Risks / Trade-offs

- [风险] 进程调用增加延迟 → [缓解] 使用流式输出，减少等待感知
- [风险] 错误处理复杂化 → [缓解] 标准化 JSON 错误输出，统一解析
- [风险] 独立包维护成本 → [缓解] 初期保持最小功能集，逐步迭代

## Migration Plan

1. 创建 `packages/renderer` 目录
2. 迁移渲染相关代码到独立包
3. 添加独立的 `package.json`
4. 修改主 CLI 使用子进程调用
5. 测试完整流程
6. 更新文档
