# Video Script 🎬

> 用 AI 自动生成技术教学视频的命令行工具。

## 概述

Video Script 自动化了技术教学视频的完整生成流程：

1. **Research（调研）** - 从链接和文档中收集并分析信息
2. **Script（脚本）** - 生成旁白脚本与场景分镜，并精确时间线
3. **Screenshots（截图）** - 捕获网页与代码高亮截图
4. **Composition（合成）** - 生成 Remotion 视频项目并组合镜头
5. **Rendering（渲染）** - 生成 MP4 视频并输出 SRT 字幕

## 要求

- **Node.js** >= 18.0.0
- **npm** 或 **pnpm**（用于依赖管理）
- **API Keys**（可配置：OpenAI 或 Anthropic）

## 安装

### 从源码安装

```bash
# 克隆仓库
git clone https://github.com/0xmaxbu/video-script.git
cd video-script

# 安装依赖
npm install

# 构建项目
npm run build

# （可选）全局安装
npm install -g .
```

### 从 NPM 安装（即将支持）

```bash
npm install -g video-script
```

## 快速开始

### 基本用法

```bash
# 交互式模式
video-script create

# 只提供标题
video-script create "Understanding TypeScript Generics"

# 提供链接
video-script create "Understanding TypeScript Generics" \
  --links "https://www.typescriptlang.org/docs/handbook/2/generics.html"

# 提供文档文件
video-script create "Understanding TypeScript Generics" \
  --doc ./typescript-notes.md

# 同时提供链接和文档
video-script create "Understanding TypeScript Generics" \
  --links "https://example.com/article" \
  --doc ./notes.md \
  --output ./videos
```

### 示例输出

执行命令后，你会得到一个输出目录，例如：

```
output/
├── video-generation-2025-03-15T10-30-00Z/
│   ├── research-data.json        # 收集到的信息
│   ├── script.json               # 生成的脚本与场景
│   ├── screenshots/              # 捕获的截图
│   │   ├── scene-1.png
│   │   ├── scene-2.png
│   │   └── ...
│   ├── highlights/               # 代码高亮图像
│   │   ├── example-1.png
│   │   └── ...
│   ├── remotion/                 # Remotion 项目
│   │   └── composition.tsx
│   ├── final-video.mp4           # 最终视频输出
│   └── final-video.srt           # 字幕输出
```

## 配置

### 环境变量

在项目根目录创建 `.env`：

```bash
# LLM 配置（必需）
OPENAI_API_KEY=sk-...              # 推荐使用 OpenAI
# OR
ANTHROPIC_API_KEY=sk-ant-...       # 使用 Anthropic Claude

# 可选：自定义模型
LLM_MODEL=gpt-4-turbo              # 默认：gpt-4-turbo
# OR
LLM_MODEL=claude-3-sonnet-20240229 # Anthropic 可用

# 可选：视频设置
VIDEO_FPS=30                        # 帧率（默认：30）
VIDEO_CODEC=h264                    # 视频编码（默认：h264）
```

### 配置文件（video-script.config.json）

在项目根目录创建配置文件：

```json
{
  "llm": {
    "provider": "openai",
    "model": "gpt-4-turbo",
    "apiKey": "${OPENAI_API_KEY}",
    "temperature": 0.7
  },
  "video": {
    "fps": 30,
    "codec": "h264",
    "width": 1920,
    "height": 1080,
    "aspectRatio": "16:9"
  },
  "screenshot": {
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "timeout": 30000
  },
  "output": {
    "baseDir": "./output",
    "includeIntermediates": true
  }
}
```

## 使用示例

### 示例 1：从文章生成视频

```bash
video-script create "How to Use React Hooks" \
  --links "https://react.dev/reference/react/hooks" \
  --output ./my-videos
```

### 示例 2：从文档生成视频

```bash
video-script create "Async/Await in JavaScript" \
  --doc ./async-await-guide.md \
  --output ./my-videos
```

### 示例 3：交互式模式（含所有选项）

```bash
video-script create

# 按提示输入：
# ? Title: Understanding Docker Containers
# ? Links (comma-separated): https://docker.io/...
# ? Documentation file: ./docker-notes.md
# ? Output directory: ./videos
```

## CLI 命令

### `video-script create [title]`

从头生成新视频。

**选项：**

```
--links <urls>        逗号分隔的 URL 列表
--doc <file>          Markdown 文档文件路径
--output <dir>        输出目录（默认：./output）
--skip-research       跳过调研阶段（使用缓存）
--dry-run             预览但不渲染视频
--help                显示帮助信息
```

### `video-script config`

查看或更新配置。

**选项：**

```
--set <key> <value>   设置配置值
--show               显示当前配置
--reset              重置为默认配置
```

## 开发

### 项目结构

```
src/
├── cli/                          # CLI 入口
│   └── index.ts                 # 命令定义
├── mastra/                       # Agent 框架
│   ├── agents/                  # 4 个 AI Agent
│   │   ├── research-agent.ts   # 网站调研与分析
│   │   ├── script-agent.ts     # 脚本生成
│   │   ├── screenshot-agent.ts # 截图生成
│   │   └── compose-agent.ts    # 视频合成
│   ├── tools/                   # 可复用工具
│   │   ├── web-fetch.ts        # HTTP 抓取
│   │   ├── playwright-screenshot.ts  # 屏幕截图
│   │   ├── code-highlight.ts   # 代码高亮
│   │   └── remotion-render.ts  # 视频渲染
│   └── workflows/               # 工作流编排
│       └── video-generation-workflow.ts
├── types/                        # TypeScript 类型定义
├── utils/                        # 工具函数
│   ├── cleanup.ts               # 清理辅助
│   ├── errors.ts                # 错误处理
│   ├── index.ts                 # 导出索引
│   ├── remotion-project-generator.ts
│   ├── srt-generator.ts         # 字幕生成
│   └── video-renderer.ts        # 视频渲染器
└── remotion/                     # 视频组件
    └── composition.tsx          # Remotion React 组件
```

### 开发命令

```bash
# 启动开发模式
npm run dev

# 运行全部测试
npm test

# 运行测试（观察模式）
npm test:watch

# 类型检查
npm run typecheck

# 代码格式化
npm run format

# 运行 lint
npm run lint

# 生产构建
npm run build
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行指定测试文件
npm test -- web-fetch.test.ts

# 观察模式
npm test:watch

# 生成覆盖率报告
npm test -- --coverage
```

## 架构

### 数据流

```
Input (标题 + 链接 + 文档)
  ↓
Research Agent (收集信息)
  ↓
Script Agent (生成旁白脚本)
  ↓
Screenshot Agent (截图)
  ↓
Compose Agent (生成合成项目)
  ↓
Remotion Render (生成 MP4)
  ↓
SRT Generator (生成字幕)
  ↓
Output (MP4 + SRT)
```

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 运行时 | Node.js + TypeScript | TS 5.4+ |
| CLI | Commander.js + Inquirer | 最新 |
| Agent 框架 | Mastra | ^1.13.2 |
| LLM | OpenAI/Anthropic | - |
| 截图 | Playwright | ^1.58.2 |
| 代码高亮 | Shiki | ^4.0.2 |
| 视频合成 | Remotion | ^4.0.435 |
| 测试 | Vitest | ^4.1.0 |

## 错误处理

工具包含全面的错误处理，覆盖常见问题：

```ts
// 常见处理错误：
- INVALID_INPUT: 校验错误
- WEB_FETCH_FAILED: 网络问题
- SCREENSHOT_FAILED: 截图超时
- CODE_HIGHLIGHT_FAILED: 代码高亮错误
- REMOTION_RENDER_FAILED: 视频渲染失败
- LLM_API_ERROR: LLM API 错误
- TIMEOUT: 请求超时
```

所有错误都会记录上下文，并提供用户友好的提示信息。

## 故障排查

### API Key 问题

```bash
# 验证 API key 是否设置
echo $OPENAI_API_KEY

# 如果未设置：
export OPENAI_API_KEY=sk-...
```

### Playwright 浏览器问题

```bash
# 安装浏览器依赖
npx playwright install

# 或安装指定浏览器
npx playwright install chrome
```

### 构建失败

```bash
# 清理缓存并重新安装
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

### 超时问题

在配置中增加超时时间：

```json
{
  "screenshot": {
    "timeout": 60000
  }
}
```

## 路线图

### MVP（当前）

- [x] CLI 交互式输入
- [x] Research Agent（网页抓取 + 分析）
- [x] Script Agent（旁白生成）
- [x] Screenshot Agent（网页 + 代码截图）
- [x] Compose Agent（Remotion 项目）
- [x] MP4 视频输出
- [x] SRT 字幕输出
- [x] 完整错误处理
- [x] 覆盖率达到 80%+

### 第二阶段（未来）

- [ ] TTS 语音配音
- [ ] 支持 9:16 画幅
- [ ] 批量生成
- [ ] 浏览器池优化
- [ ] 云端渲染支持
- [ ] 容器化（Docker）

## 贡献

欢迎贡献！请：

1. Fork 仓库
2. 新建分支 (`git checkout -b feat/<feature-name>`)
3. 为修改编写测试
4. 确保测试通过 (`npm test`)
5. 格式化代码 (`npm run format`)
6. 提交 PR

## 许可证

MIT License - 详见 LICENSE 文件

## 支持

- **Issues**: [GitHub Issues](https://github.com/0xmaxbu/video-script/issues)
- **Discussions**: [GitHub Discussions](https://github.com/0xmaxbu/video-script/discussions)
- **文档**: [完整文档](./docs)

## 更新日志

### v0.1.0（初始发布）

- 核心功能上线
- 4 个 AI Agent（Research、Script、Screenshot、Compose）
- 基于 Remotion 的视频合成
- SRT 字幕生成
- 覆盖率测试 80%+ 
- 错误处理与重试机制

---

**使用 ❤️ 构建，基于 Mastra、Remotion 和 TypeScript**
