# Video Script - AI 视频生成工具

> 命令行工具，根据用户提供的标题、链接和文档，自动生成技术讲解视频。

## 技术栈

| 层级       | 技术                    | 版本    |
| ---------- | ----------------------- | ------- |
| 运行时     | Node.js + TypeScript    | TS 5.4+ |
| CLI        | Commander.js + Inquirer | -       |
| Agent 框架 | Mastra                  | ^0.1.0  |
| LLM        | OpenAI / Anthropic      | -       |
| 截图       | Playwright              | ^1.42.0 |
| 代码高亮   | Shiki                   | ^1.0.0  |
| 视频合成   | Remotion                | ^4.0.0  |
| 测试       | Vitest                  | ^1.4.0  |

---

## 架构约束

### 核心原则

1. **MVP 优先**: 只实现核心流程，不添加非必要功能
2. **本地优先**: 本地运行，后续容器化
3. **可配置**: LLM 后端、TTS 提供商可配置

### 数据流

```
Input (title + links + document)
  → Research (collected info)
  → Script (narration + timeline)
  → Screenshots (images)
  → Composition (Remotion project)
  → Render (final video)
```

### 开发流程

- 严格按照beads标准进行
- 领取bd ready 任务
- 按照 Spec Design 进行开发
- 开发产出需要满足 Spec Goal

### 模块边界

```
src/
├── cli/          # CLI 入口，只负责参数解析和交互
├── mastra/       # Agent + Workflow + Tools，核心业务逻辑
│   ├── agents/   # 4 个 Agent: Research, Script, Screenshot, Compose
│   ├── workflows/# Video Generation Workflow
│   └── tools/    # WebFetch, Playwright, CodeHighlight, RemotionRender
├── tts/          # TTS 模块，独立于主流程
├── remotion/     # Remotion 组件模板
└── utils/        # 配置、日志等工具函数
```

**规则**:

- CLI 层不包含业务逻辑
- Agent 只通过 Mastra Tools 与外部系统交互
- Remotion 组件必须是纯 React 组件
- TTS 是可选模块，主流程不依赖它

---

## 代码规范

### TypeScript 配置

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### 类型定义

所有接口必须定义在 `src/types/` 目录下，使用 `zod` 进行运行时验证：

```typescript
// src/types/research.ts
import { z } from "zod";

export const ResearchInputSchema = z.object({
  title: z.string().min(1),
  links: z.array(z.string().url()).optional(),
  document: z.string().optional(),
  documentFile: z.string().optional(),
});

export type ResearchInput = z.infer<typeof ResearchInputSchema>;
```

### Schema 定义（视频脚本）

```typescript
// SceneNarrativeType - 场景类型枚举
export const SceneNarrativeType = z.enum(["intro", "feature", "code", "outro"]);
export type SceneNarrativeType = z.infer<typeof SceneNarrativeType>;

// VisualLayerSchema - 视觉层配置
export const PositionSchema = z.object({
  x: z.union([z.number().min(0), z.enum(["left", "center", "right"])]),
  y: z.union([z.number().min(0), z.enum(["top", "center", "bottom"])]),
  width: z.union([z.number().min(0), z.literal("auto"), z.literal("full")]),
  height: z.union([z.number().min(0), z.literal("auto"), z.literal("full")]),
  zIndex: z.number().default(0),
});

export const AnimationConfigSchema = z.object({
  enter: z.enum([
    "fadeIn",
    "slideLeft",
    "slideRight",
    "slideUp",
    "slideDown",
    "zoomIn",
    "typewriter",
    "none",
  ]),
  enterDelay: z.number().default(0),
  exit: z.enum(["fadeOut", "slideOut", "zoomOut", "none"]),
  exitAt: z.number().optional(),
});

export const VisualLayerSchema = z.object({
  id: z.string(),
  type: z.enum(["screenshot", "code", "text", "diagram", "image"]),
  position: PositionSchema,
  content: z.string(),
  animation: AnimationConfigSchema,
});

// SceneSchema - 单个场景配置
export const SceneSchema = z.object({
  id: z.string(),
  type: SceneNarrativeType,
  title: z.string(),
  narration: z.string(),
  duration: z.number().positive(),
  visualLayers: z.array(VisualLayerSchema).optional(),
});

// ScriptOutputSchema - 完整脚本输出
export const ScriptOutputSchema = z.object({
  title: z.string(),
  totalDuration: z.number().positive(),
  scenes: z.array(SceneSchema).min(1),
  transitions: z.array(TransitionSchema).optional(),
});

// SceneTransitionSchema - 场景转场配置
export const SceneTransitionSchema = z.object({
  type: z.enum(["fade", "slide", "wipe", "none"]),
  duration: z.number().min(0),
});
```

### Agent 定义规范

使用 Mastra 框架定义 Agent：

```typescript
// src/mastra/agents/research-agent.ts
import { Agent } from "@mastra/core";
import { webFetchTool } from "../tools/web-fetch";

export const researchAgent = new Agent({
  name: "Research Agent",
  instructions: `你是一个技术内容研究员。
    根据用户提供的标题、链接和文档，搜集并整理相关信息。
    输出结构化的研究结果。`,
  model: "openai/gpt-4-turbo",
  tools: {
    webFetch: webFetchTool,
  },
});
```

### Tool 定义规范

```typescript
// src/mastra/tools/playwright-screenshot.ts
import { createTool } from "@mastra/core";
import { z } from "zod";

export const playwrightScreenshotTool = createTool({
  id: "playwright-screenshot",
  description: "使用 Playwright 截取网页截图",
  inputSchema: z.object({
    url: z.string().url(),
    selector: z.string().optional(),
    viewport: z.object({
      width: z.number(),
      height: z.number(),
    }),
  }),
  outputSchema: z.object({
    imagePath: z.string(),
  }),
  execute: async (input) => {
    // 实现逻辑
  },
});
```

### 错误处理

定义明确的错误类型：

```typescript
// src/utils/errors.ts
export enum VideoGenerationError {
  INVALID_INPUT = "INVALID_INPUT",
  WEB_FETCH_FAILED = "WEB_FETCH_FAILED",
  LLM_API_ERROR = "LLM_API_ERROR",
  REMOTION_RENDER_FAILED = "REMOTION_RENDER_FAILED",
}

export class VideoGenerationError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = "VideoGenerationError";
  }
}
```

---

## 测试规范

### 测试框架

- **Vitest**: 单元测试 + 集成测试
- **Playwright**: E2E 测试

### 测试覆盖率

- 最低覆盖率: **80%**
- Tool 函数必须有单元测试
- Agent 必须有集成测试
- 关键用户路径必须有 E2E 测试

### 测试文件位置

```
src/
├── mastra/
│   └── tools/
│       └── __tests__/
│           └── playwright-screenshot.test.ts
```

### 测试示例

```typescript
// src/mastra/tools/__tests__/playwright-screenshot.test.ts
import { describe, it, expect } from "vitest";
import { playwrightScreenshotTool } from "../playwright-screenshot";

describe("playwrightScreenshotTool", () => {
  it("should capture full page screenshot", async () => {
    const result = await playwrightScreenshotTool.execute({
      url: "https://example.com",
      viewport: { width: 1920, height: 1080 },
    });

    expect(result.imagePath).toMatch(/\.png$/);
  });
});
```

---

## Git 提交规范

### 提交消息格式

```
<type>/<module>: <description>
```

### 类型

- `feat/`: 新功能
- `fix/`: Bug 修复
- `refactor/`: 代码重构
- `test/`: 测试相关
- `docs/`: 文档
- `chore/`: 杂项（依赖更新、配置等）

### 示例

```
feat/cli: add create command with interactive input
fix/screenshot: handle playwright timeout gracefully
test/research: add unit tests for web-fetch tool
refactor/compose: extract remotion project generator
```

### 原子提交规则

1. **每个步骤一个提交**
2. **保持最小 diff**（1-3 个文件，<100 行）
3. **提交前运行测试**
4. **使用 `git add -p` 交互选择**

---

## MVP 范围约束

### ✅ MVP 必须包含

- [ ] CLI `create` 命令
- [ ] 交互式输入（标题 + 链接 + 文档）
- [ ] Research Agent（网页抓取 + LLM 分析）
- [ ] Script Agent（场景划分 + 时间轴）
- [ ] Screenshot Agent（网页截图 + 代码截图）
- [ ] Compose Agent（Remotion 项目生成 + 渲染）
- [ ] 脚本审核节点
- [ ] MP4 视频输出
- [ ] SRT 字幕输出

### ❌ MVP 不包含

- TTS 配音
- 9:16 画幅
- 批量生成
- 硬字幕烧录
- 断点续传
- 浏览器池优化
- Docker 容器化

---

## 配置文件

### video-script.config.json

```json
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

## 开发流程

### 1. 开始新任务前

```bash
# 1. 创建分支
git checkout -b feat/<feature-name>

# 2. 确保依赖最新
npm install

# 3. 运行测试
npm test
```

### 2. 开发中

```bash
# 1. 写测试
# 2. 运行测试（应该失败）
npm test

# 3. 写实现
# 4. 运行测试（应该通过）
npm test

# 5. 提交
git add -p
git commit -m "feat/<module>: <description>"
```

### 3. 完成任务后

```bash
# 1. 运行完整测试
npm test

# 2. 检查类型
npm run typecheck

# 3. 格式化代码
npm run format

# 4. 提交所有更改
git add .
git commit -m "feat/<module>: complete feature"
```

---

## 常用命令

```bash
# 开发
npm run dev           # 启动开发模式
npm run build         # 构建生产版本
npm run test          # 运行测试
npm run typecheck     # 类型检查
npm run format        # 格式化代码

# CLI 使用
video-script create "标题" --links "url1,url2"
video-script create "标题" --doc ./notes.md
video-script config   # 配置
```

---

## 默认输出路径规则

**默认输出目录**: `~/simple-videos/<Year>/<Week>-<StartMonth>_<StartDay>-<EndMonth>_<EndDay>/<slugified-title>`

### 路径结构说明

| 组成部分                  | 示例                        | 说明                                |
| ------------------------- | --------------------------- | ----------------------------------- |
| `~/simple-videos/`        | 基础目录                    | 用户主目录下的 simple-videos 文件夹 |
| `<Year>`                  | `2026`                      | 4位年份                             |
| `<Week>`                  | `12`                        | ISO周数 (1-53)                      |
| `<StartMonth>_<StartDay>` | `3_16`                      | 周起始日期 (月\_日)                 |
| `<EndMonth>_<EndDay>`     | `3_22`                      | 周结束日期 (月\_日)                 |
| `<slugified-title>`       | `typescript-54-xin-te-xing` | 标题的拼音slug格式                  |

### 示例

```
~/simple-videos/2026/12-3_16-3_22/typescript-54-xin-te-xing
```

### 规则

1. **自动创建目录**: 如果指定 `--output`，使用指定路径；否则按上述规则自动生成
2. **拼音转换**: 中文标题转换为拼音，英文和数字保留
3. **日期范围**: 使用ISO周计算，周一为起始日，周日为结束日
4. **可通过 `resume` 命令恢复**: 工作流暂停后可用 `video-script resume <dir>` 继续

### 相关代码

参考 `src/utils/output-directory.ts` 中的 `generateOutputDirectory()` 函数。

---

## 禁止事项

1. **禁止** 使用 `any` 类型
2. **禁止** 使用 `@ts-ignore` 或 `@ts-expect-error`
3. **禁止** 跳过测试提交代码
4. **禁止** 在 MVP 阶段添加非必要功能
5. **禁止** 硬编码 API Key 或敏感信息
6. **禁止** 在 CLI 层写业务逻辑
7. **禁止** Agent 直接调用外部 API（必须通过 Tool）

---

## 参考资料

- [Mastra 文档](https://mastra.ai)
- [Remotion 文档](https://remotion.dev)
- [Playwright 文档](https://playwright.dev)
- [设计文档](./docs/plans/2025-03-15-video-script-design.md)

<!-- BEGIN BEADS INTEGRATION -->

## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Dolt-powered version control with native sync
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update <id> --claim --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task atomically**: `bd update <id> --claim`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Auto-Sync

bd automatically syncs via Dolt:

- Each write auto-commits to Dolt history
- Use `bd dolt push`/`bd dolt pull` for remote sync
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- END BEADS INTEGRATION -->
