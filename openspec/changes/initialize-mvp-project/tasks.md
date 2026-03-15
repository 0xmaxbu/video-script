## 1. 项目初始化

- [ ] 1.1 初始化 TypeScript 项目（创建 package.json、tsconfig.json）
- [ ] 1.2 安装基础依赖（commander、inquirer、zod、chalk、ora）
- [ ] 1.3 配置 TypeScript 编译选项（ES2022 模块）
- [ ] 1.4 创建项目目录结构（src/cli、src/mastra、src/utils 等）
- [ ] 1.5 创建 .gitignore 文件
- [ ] 1.6 创建 video-script.config.json 配置文件

## 2. CLI 入口实现

- [ ] 2.1 实现 CLI 主入口（Commander.js 命令定义）
- [ ] 2.2 实现 create 命令（标题参数解析）
- [ ] 2.3 实现交互式输入流程（Inquirer 提示）
- [ ] 2.4 实现链接输入（单/多个）
- [ ] 2.5 实现文档输入（粘贴/文件）
- [ ] 2.6 实现 config 命令
- [ ] 2.7 实现 --aspect-ratio、--no-review、--output 参数支持
- [ ] 2.8 实现脚本审核节点（逐场景展示、编辑、重新生成）
- [ ] 2.9 实现视频审核节点（预览、接受、重新渲染）

## 3. Mastra 框架集成

- [ ] 3.1 安装 @mastra/core 依赖
- [ ] 3.2 创建 Mastra 实例配置（src/mastra/index.ts）
- [ ] 3.3 定义 LLM 后端抽象（支持 OpenAI/Anthropic）
- [ ] 3.4 创建类型定义（ResearchInput、ScriptOutput 等）
- [ ] 3.5 创建错误类型定义（VideoGenerationError）

## 4. Tool 实现

- [ ] 4.1 实现 WebFetch Tool（网页抓取）
- [ ] 4.2 实现 PlaywrightScreenshot Tool（网页截图）
- [ ] 4.3 实现 CodeHighlight Tool（代码高亮）
- [ ] 4.4 实现 RemotionRender Tool（视频渲染）
- [ ] 4.5 为每个 Tool 编写单元测试（Vitest）

## 5. Agent 实现

- [ ] 5.1 实现 Research Agent（网页抓取 + LLM 分析）
- [ ] 5.2 实现 Script Agent（场景划分 + 时间轴规划）
- [ ] 5.3 实现 Screenshot Agent（网页/代码截图）
- [ ] 5.4 实现 Compose Agent（Remotion 项目生成）
- [ ] 5.5 为每个 Agent 编写集成测试

## 6. Workflow 实现

- [ ] 6.1 创建 Video Generation Workflow
- [ ] 6.2 定义工作流步骤（Research → Script → Screenshot → Compose）
- [ ] 6.3 实现工作流状态管理
- [ ] 6.4 （MVP 后）实现断点续传状态保存

## 7. Remotion 组件开发

- [ ] 7.1 安装 @remotion/cli、@remotion/player、react 依赖
- [ ] 7.2 创建 Intro 组件（开场动画）
- [ ] 7.3 创建 FeatureSlide 组件（特性展示）
- [ ] 7.4 创建 CodeAnimation 组件（代码动画）
- [ ] 7.5 创建 Outro 组件（结尾）
- [ ] 7.6 实现基础动画效果（打字机、高亮、过渡）

## 8. 视频渲染流程

- [ ] 8.1 实现 Remotion 项目生成器
- [ ] 8.2 实现视频渲染流程
- [ ] 8.3 实现 SRT 字幕生成
- [ ] 8.4 实现临时文件清理

## 9. 错误处理与日志

- [ ] 9.1 实现错误类型和错误处理
- [ ] 9.2 实现重试机制（WebFetch、Playwright）
- [ ] 9.3 实现日志模块（ora 进度显示）
- [ ] 9.4 实现优雅退出

## 10. 测试与验证

- [ ] 10.1 编写 Tool 单元测试（覆盖率 > 80%）
- [ ] 10.2 编写 Agent 集成测试
- [ ] 10.3 运行完整流程测试
- [ ] 10.4 修复测试发现的问题

## 11. 文档与发布

- [ ] 11.1 完善 README.md
- [ ] 11.2 添加 CLI 使用示例
- [ ] 11.3 运行 typecheck 和 format
- [ ] 11.4 构建生产版本
