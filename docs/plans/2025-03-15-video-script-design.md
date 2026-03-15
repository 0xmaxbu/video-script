# Video Script - AI 视频生成工具设计文档

> 生成日期: 2025-03-15
> 状态: 已批准

## 1. 项目概述

### 1.1 目标

构建一个命令行工具，根据用户提供的标题、链接和文档，自动生成技术讲解视频。

### 1.2 核心特性

- ✅ 全自动执行 + 人工审核节点
- ✅ 支持多链接 + 自定义文档输入
- ✅ 网页截图 + 代码动画效果
- ✅ 可选 TTS 配音（中文优先）
- ✅ 软字幕 + 可选硬字幕
- ✅ 16:9 和 9:16 两种画幅

### 1.3 设计原则

- **MVP 优先**: 先跑通核心流程
- **本地优先**: 本地运行，后续容器化
- **可配置**: LLM 后端、TTS 提供商可配置

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI Entry Point                          │
│                    (Commander.js / Inquirer)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Mastra Framework Layer                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Video Generation Workflow                │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│  │  │ Research │→ │ Script   │→ │ Screenshot│→ │ Compose  │   │ │
│  │  │  Agent   │  │ Agent    │  │  Agent   │  │ Agent    │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                         Tools Layer                         │ │
│  │  WebFetch │ Playwright │ CodeHighlighter │ RemotionRender  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ LLM Backend   │    │ Playwright    │    │ Remotion      │
│ (OpenAI/      │    │ Browser Pool  │    │ Renderer      │
│  Anthropic)   │    │               │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
```

### 2.2 数据流

```
Input (title + links + document) 
  → Research (collected info) 
  → Script (narration + timeline) 
  → Screenshots (images) 
  → Composition (Remotion project) 
  → Render (final video)
```

---

## 3. 核心组件设计

### 3.1 Research Agent

**职责**: 搜集并整理技术信息

**输入**:
```typescript
interface ResearchInput {
  title: string;
  links?: string[];        // 外部链接
  document?: string;       // 用户提供的文档内容
  documentFile?: string;   // 本地文档文件路径
}
```

**输出**:
```typescript
interface ResearchOutput {
  summary: string;           // 技术概述
  keyFeatures: string[];     // 核心特性
  codeExamples: CodeBlock[]; // 代码示例
  screenshots: Screenshot[]; // 需要截图的页面
  references: string[];      // 参考资料
}
```

**工作流**:
1. 处理外部链接（WebFetch Tool）
2. 处理用户文档内容
3. LLM 综合分析所有来源
4. 输出结构化研究结果

---

### 3.2 Script Agent

**职责**: 生成视频脚本和时间轴

**输出**:
```typescript
interface ScriptOutput {
  scenes: Scene[];
  totalDuration: number;  // 秒
  aspectRatio: '16:9' | '9:16';
}

interface Scene {
  id: string;
  type: 'intro' | 'feature' | 'code' | 'demo' | 'outro';
  narration: string;       // 旁白文案
  duration: number;        // 秒
  visual: VisualSpec;      // 视觉指令
  screenshot?: string;     // 截图路径
  code?: CodeAnimation;    // 代码动画
}
```

**工作流**:
1. 根据研究结果生成场景划分
2. 为每个场景生成旁白
3. 规划视觉呈现方式
4. 计算时间轴

---

### 3.3 Screenshot Agent

**职责**: 自动截取网页和代码截图

**功能**:
- 网页全页截图
- 元素截图（CSS 选择器）
- 代码高亮截图（使用 Shiki）
- GitHub 页面截图

**输入**:
```typescript
interface ScreenshotTask {
  url: string;
  selector?: string;      // CSS 选择器
  viewport: { width: number; height: number };
  type: 'fullpage' | 'element' | 'viewport';
  code?: {
    language: string;
    content: string;
    highlightLines?: number[];
  };
}
```

---

### 3.4 Compose Agent

**职责**: 生成 Remotion 项目并渲染视频

**工作流**:
1. 根据脚本生成 Remotion 项目（临时）
2. 调用 Remotion CLI 渲染
3. 输出最终视频文件
4. 清理临时项目

**输出**:
```typescript
interface ComposeOutput {
  videoPath: string;        // ./output/video.mp4
  subtitlePath?: string;    // ./output/subtitles.srt
  thumbnailPath?: string;   // ./output/thumbnail.jpg
}
```

---

## 4. CLI 交互设计

### 4.1 命令设计

```bash
# 基础命令
video-script create <title>           # 创建新视频
video-script create <title> --links <url1,url2>  # 带链接

# 可选参数
--aspect-ratio <16:9|9:16>  # 画幅比例（默认 16:9）
--duration <seconds>        # 目标时长（默认自动）
--tts                       # 启用 TTS 配音
--tts-voice <voice>         # TTS 声音（中文默认）
--no-review                 # 跳过审核节点（全自动）
--output <dir>              # 输出目录（默认 ./output）

# 高级命令
video-script config         # 配置 LLM API、TTS 等
video-script template       # 管理动画模板
video-script resume <id>    # 恢复中断的任务
```

### 4.2 输入方式

**方式 1: 命令行参数**
```bash
video-script create "React 19 新特性" \
  --links "https://react.dev/blog/...,https://github.com/..." \
  --doc ./my-notes.md
```

**方式 2: 交互式输入**
```
$ video-script create "React 19 新特性"

📌 视频标题: React 19 新特性

📎 参考资料输入方式:
  [1] 输入链接（多个链接，逗号分隔）
  [2] 粘贴文档内容（多行输入，输入 END 结束）
  [3] 指定本地文件路径
  [4] 混合输入（链接 + 文档）

选择: 4
```

### 4.3 审核节点

**脚本审核（Step 4）**:
- 逐场景查看旁白和视觉指令
- 可以编辑单个场景的旁白
- 可以重新生成某个场景
- 可以一键通过全部

**视频审核（Step 6）**:
- 预览生成的视频（调用系统播放器）
- 接受并保存
- 回到脚本编辑重新生成
- 调整设置重新渲染

---

## 5. 项目结构

```
video-script/
├── src/
│   ├── cli/                    # CLI 入口
│   │   └── index.ts
│   │
│   ├── mastra/                 # Mastra 核心
│   │   ├── index.ts            # Mastra 实例配置
│   │   │
│   │   ├── agents/             # Agent 定义
│   │   │   ├── research-agent.ts
│   │   │   ├── script-agent.ts
│   │   │   ├── screenshot-agent.ts
│   │   │   └── compose-agent.ts
│   │   │
│   │   ├── workflows/          # Workflow 定义
│   │   │   └── video-generation.ts
│   │   │
│   │   └── tools/              # Tools 定义
│   │       ├── web-fetch.ts
│   │       ├── playwright-screenshot.ts
│   │       ├── code-highlight.ts
│   │       └── remotion-render.ts
│   │
│   ├── tts/                    # TTS 模块
│   │   └── index.ts
│   │
│   ├── remotion/               # Remotion 组件模板
│   │   └── compositions/
│   │       ├── Intro.tsx
│   │       ├── FeatureSlide.tsx
│   │       ├── CodeAnimation.tsx
│   │       └── Outro.tsx
│   │
│   └── utils/
│       ├── config.ts
│       └── logger.ts
│
├── output/                     # 输出目录（gitignore）
├── temp/                       # 临时文件（gitignore）
├── docs/
│   └── plans/                  # 设计文档
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 6. 配置文件

```json
// video-script.config.json
{
  "llm": {
    "provider": "openai",
    "model": "gpt-4-turbo",
    "apiKey": "${OPENAI_API_KEY}"
  },
  "tts": {
    "enabled": false,
    "provider": "edge-tts",
    "voice": "zh-CN-XiaoxiaoNeural"
  },
  "video": {
    "defaultAspectRatio": "16:9",
    "fps": 30,
    "codec": "h264"
  },
  "screenshot": {
    "browserPoolSize": 3,
    "viewport": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

---

## 7. 错误处理

### 7.1 错误类型

```typescript
enum VideoGenerationError {
  // 输入验证
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_TITLE = 'MISSING_TITLE',
  
  // 网络相关
  WEB_FETCH_FAILED = 'WEB_FETCH_FAILED',
  PLAYWRIGHT_TIMEOUT = 'PLAYWRIGHT_TIMEOUT',
  
  // LLM 相关
  LLM_API_ERROR = 'LLM_API_ERROR',
  LLM_RATE_LIMIT = 'LLM_RATE_LIMIT',
  
  // 渲染相关
  REMOTION_RENDER_FAILED = 'REMOTION_RENDER_FAILED',
  DISK_SPACE_INSUFFICIENT = 'DISK_SPACE_INSUFFICIENT',
}
```

### 7.2 断点续传

每次运行保存状态到 `.video-script/state/<video-id>.json`:

```json
{
  "workflowId": "wf_xxx",
  "currentStep": "screenshot",
  "completedSteps": ["research", "script"],
  "stepOutputs": {
    "research": { ... },
    "script": { ... }
  },
  "timestamp": "2024-03-15T10:30:00Z"
}
```

恢复命令:
```bash
video-script resume react-19-new-features-20240315
```

---

## 8. 测试策略

### 8.1 测试金字塔

```
        /\
       /  \    E2E Tests (少量)
      /────\   - 完整流程测试
     /      \  - 关键用户路径
    /────────\
   /          \ Integration Tests (中等)
  /────────────\ - Agent 间协作
 /              \ - Workflow 执行
/________________\
  Unit Tests (大量)
  - Tool 函数
  - 数据转换
  - 错误处理
```

### 8.2 测试框架

- **Vitest**: 单元测试和集成测试
- **Playwright**: E2E 测试

---

## 9. 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| **CLI** | Commander.js + Inquirer | 命令行交互 |
| **Agent 框架** | Mastra | Workflow 编排、Agent 管理 |
| **LLM** | OpenAI GPT-4 / Anthropic Claude | 内容分析、脚本生成 |
| **网页抓取** | Playwright | 自动截图、页面渲染 |
| **代码高亮** | Shiki | 语法高亮 |
| **视频合成** | Remotion | 动画、渲染 |
| **视频编码** | FFmpeg | 最终视频输出 |
| **TTS（可选）** | Edge TTS / ElevenLabs | 语音合成 |
| **测试** | Vitest + Playwright | 单元/集成/E2E 测试 |
| **运行时** | Node.js + TypeScript | - |

---

## 10. MVP 范围

### 10.1 必须包含

1. **CLI 基础功能**
   - `create` 命令
   - 交互式输入（标题 + 链接 + 文档）
   - 脚本审核节点

2. **Research Agent**
   - 网页抓取（单个链接）
   - 文档内容处理
   - LLM 分析并结构化

3. **Script Agent**
   - 生成结构化脚本
   - 场景划分
   - 时间轴规划

4. **Screenshot Agent**
   - 网页截图
   - 代码截图（基础高亮）
   - GitHub 页面截图

5. **Compose Agent**
   - Remotion 项目生成
   - 基础动画模板（3-4 个）
   - 视频渲染

6. **输出**
   - MP4 视频文件
   - SRT 字幕文件

### 10.2 MVP 后迭代

1. **高级功能**
   - TTS 配音
   - 9:16 画幅
   - 批量生成
   - 硬字幕烧录

2. **优化**
   - 断点续传
   - 浏览器池优化
   - 模板自定义

3. **部署**
   - Docker 容器化
   - CI/CD 集成

---

## 11. 开发路线图

```
Week 1: 基础架构
├── 项目初始化（TypeScript + Mastra）
├── CLI 基础命令
└── Mastra Workflow 骨架

Week 2: Agent 开发
├── Research Agent + WebFetch Tool
├── Script Agent
└── Screenshot Agent + Playwright Tool

Week 3: 视频合成
├── Remotion 组件模板（3-4 个）
├── Compose Agent
└── 视频渲染流程

Week 4: 整合与测试
├── 完整流程测试
├── 错误处理
├── 文档编写
└── MVP 发布
```

---

## 12. 依赖清单

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "inquirer": "^9.2.0",
    "@mastra/core": "^0.1.0",
    "openai": "^4.0.0",
    "@anthropic-ai/sdk": "^0.20.0",
    "playwright": "^1.42.0",
    "shiki": "^1.0.0",
    "@remotion/player": "^4.0.0",
    "@remotion/cli": "^4.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "zod": "^3.23.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.4.0",
    "@playwright/test": "^1.42.0"
  }
}
```
