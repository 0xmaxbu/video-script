## Context

当前是一个全新的 greenfield 项目，目标是从零构建一个 AI 视频生成命令行工具。根据已批准的设计文档（docs/plans/2025-03-15-video-script-design.md），项目使用 TypeScript + Mastra 框架。

**当前状态**：
- 项目目录已创建，包含 AGENTS.md 和设计文档
- 已初始化 openspec 和 beads 环境
- 无任何源代码

**约束条件**：
- MVP 优先：先跑通核心流程
- 本地优先：本地运行，后续容器化
- 可配置：LLM 后端、TTS 提供商可配置

## Goals / Non-Goals

**Goals:**
- 初始化 TypeScript 项目结构
- 实现 CLI 入口（Commander.js + Inquirer）
- 实现 4 个核心 Mastra Agent（Research、Script、Screenshot、Compose）
- 实现 4 个核心 Mastra Tool（WebFetch、PlaywrightScreenshot、CodeHighlight、RemotionRender）
- 实现 Mastra Workflow 编排
- 实现基础 Remotion 组件模板
- 实现脚本审核节点
- 输出 MP4 视频和 SRT 字幕

**Non-Goals:**
- TTS 配音功能（MVP 后迭代）
- 9:16 画幅支持（MVP 后迭代）
- 批量生成功能（MVP 后迭代）
- 断点续传功能（MVP 后迭代）
- Docker 容器化（MVP 后迭代）
- 完整的错误处理和测试覆盖（MVP 后完善）
- MVP 包含基础错误处理（超时、重试机制）

## Decisions

### D1: 使用 Mastra 框架作为 Agent 编排层

**备选方案：**
- 直接使用 OpenAI API 构建 Agent
- 使用 LangChain/LangGraph

**选择理由：**
Mastra 是新一代 Agent 框架，专门优化了 Tool 定义和工作流编排。设计文档已指定使用 Mastra，其 TypeScript 原生支持与项目技术栈一致。

### D2: 使用 Playwright 进行网页截图

**备选方案：**
- Puppeteer
- Selenium

**选择理由：**
Playwright 是目前最成熟的浏览器自动化工具，支持多浏览器、等待策略、网络拦截等高级功能。设计文档已指定使用 Playwright。

### D3: 使用 Remotion 进行视频合成

**备选方案：**
- Motion Canvas
- 原生 FFmpeg

**选择理由：**
Remotion 基于 React 生态，图片组合能力强，社区活跃（50K+ stars）。相比 Motion Canvas，Remotion 更适合截图视频的制作场景。

### D4: CLI 层与业务逻辑分离

**备选方案：**
- CLI 直接调用 Agent

**选择理由：**
遵循 AGENTS.md 中的架构约束：CLI 层不包含业务逻辑。Agent 只通过 Mastra Tools 与外部系统交互。这种分离使得核心逻辑可测试、可复用。

## Risks / Trade-offs

**风险 1：Mastra 框架稳定性**
- 风险描述：Mastra 是相对新的框架，API 可能在开发过程中发生变化
- 缓解措施：在 AGENTS.md 中添加版本约束，使用 lock 文件锁定依赖版本

**风险 2：Remotion 渲染时间**
- 风险描述：视频渲染可能耗时较长，影响用户体验
- 缓解措施：实现进度显示，提供取消选项

**风险 3：LLM API 调用成本**
- 风险描述：多个 Agent 串联可能导致 API 调用次数过多
- 缓解措施：MVP 阶段先验证流程，后续优化调用次数

**风险 4：截图稳定性**
- 风险描述：网页截图可能因页面加载、动画等因素失败
- 缓解措施：实现重试机制和超时控制
