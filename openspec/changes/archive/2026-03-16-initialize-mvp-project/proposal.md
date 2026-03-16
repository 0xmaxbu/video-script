## Why

构建一个 AI 视频生成工具，用于自动化技术讲解视频的制作。当前技术内容创作者面临重复性的工作：搜集资料、编写脚本、截取截图、合成视频。这个工具通过 AI 自动化整个流程，让创作者只需提供标题和参考资料，即可获得可直接使用的视频。

## What Changes

- 初始化 TypeScript + Mastra 项目结构
- 实现 CLI 命令行工具（create、config 命令）
- 实现 4 个核心 Agent：Research、Script、Screenshot、Compose
- 实现 4 个核心 Tool：WebFetch、PlaywrightScreenshot、CodeHighlight、RemotionRender
- 实现 Remotion 视频合成和渲染流程
- 实现脚本审核节点（人工审查）
- 输出 MP4 视频文件和 SRT 字幕文件

## Capabilities

### New Capabilities

- **cli-entry**: 命令行入口，支持 create/config 命令和交互式输入
- **research-agent**: 研究 Agent，负责搜集网页信息和分析内容
- **script-agent**: 脚本 Agent，负责生成视频脚本和时间轴
- **screenshot-agent**: 截图 Agent，负责网页和代码截图
- **compose-agent**: 合成 Agent，负责 Remotion 项目生成和视频渲染
- **web-fetch-tool**: 网页抓取工具
- **playwright-screenshot-tool**: Playwright 截图工具
- **code-highlight-tool**: 代码高亮工具
- **remotion-render-tool**: Remotion 渲染工具

### Modified Capabilities

（无 - 这是全新项目）

## Impact

- 新增项目目录：`src/cli/`、`src/mastra/`、`src/tts/`、`src/remotion/`、`src/utils/`
- 新增配置文件：`package.json`、`tsconfig.json`、`video-script.config.json`
- 新增依赖：commander、inquirer、@mastra/core、openai、playwright、shiki、@remotion/cli、react
