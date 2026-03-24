# Video Script - 用户手册

> **文档标识**: USER-MANUAL
> **状态**: 稳定版
> **最后更新**: 2026-03-24
> **目的**: 本文档定义了 video-script CLI 工具的稳定使用流程。此处记录的命令、选项和工作流程在后续更新中不应变更，除非明确进行版本升级。

---

## 1. 概述

Video Script 是一个由 AI 驱动的 CLI 工具，可根据标题、链接和文档生成技术教程视频。它自动化了整个视频生成流程：

```
研究 → 脚本 → 视觉 → 截图 → 合成 → 渲染 (MP4 + SRT)
```

---

## 2. 安装

### 2.1 系统要求

- **Node.js**: >= 18.0.0
- **包管理器**: npm 或 pnpm
- **API 密钥**: OpenAI 或 Anthropic（必需）

### 2.2 从源码安装

```bash
# 克隆仓库
git clone https://github.com/0xmaxbu/video-script.git
cd video-script

# 安装依赖
npm install

# 构建项目
npm run build

# 全局安装（可选）
npm install -g .
```

### 2.3 环境配置

在项目根目录创建 `.env` 文件：

```bash
# 必需：LLM API 密钥（二选一）
OPENAI_API_KEY=sk-...           # OpenAI（推荐）
# 或
ANTHROPIC_API_KEY=sk-ant-...    # Anthropic Claude

# 可选：自定义模型
LLM_MODEL=gpt-4-turbo           # 默认：gpt-4-turbo
```

---

## 3. CLI 命令参考

### 3.1 全局命令

```bash
video-script [command] [options]
```

**全局选项:**
| 选项 | 说明 |
|--------|-------------|
| `-h, --help` | 显示帮助信息 |
| `-v, --version` | 显示版本号 |

---

### 3.2 `create` 命令

生成完整视频项目的**主要命令**。

```bash
video-script create [title] [options]
```

**参数:**
| 参数 | 说明 |
|----------|-------------|
| `title` | 视频标题（交互模式下可选） |

**选项:**
| 选项 | 类型 | 说明 |
|--------|------|-------------|
| `--links <urls>` | 字符串 | 逗号分隔的 URL 列表 |
| `--doc <file>` | 字符串 | Markdown 文档文件路径 |
| `--output <dir>` | 字符串 | 输出目录（未指定则自动生成） |
| `--no-review` | 布尔值 | 跳过审核暂停，继续截图/合成 |
| `--aspect-ratio <ratio>` | 字符串 | 画面比例（默认：16:9） |

**示例:**

```bash
# 交互模式（提示输入所有内容）
video-script create

# 仅提供标题
video-script create "TypeScript 泛型详解"

# 提供链接
video-script create "TypeScript 泛型详解" \
  --links "https://www.typescriptlang.org/docs/handbook/2/generics.html"

# 提供文档文件
video-script create "TypeScript 泛型详解" \
  --doc ./typescript-notes.md

# 同时提供链接和文档
video-script create "TypeScript 泛型详解" \
  --links "https://example.com/article" \
  --doc ./notes.md

# 无审核暂停的完整流程
video-script create "我的视频" \
  --links "https://example.com" \
  --no-review

# 指定输出目录
video-script create "我的视频" \
  --links "https://example.com" \
  --output ./my-videos
```

**工作流程:**

1. 运行 `research` 阶段
2. 运行 `script` 阶段
3. 暂停等待审核（除非指定 `--no-review`）
4. 如果指定 `--no-review`：继续截图和合成
5. 生成最终视频和字幕

---

### 3.3 `research` 命令

根据标题、链接和文档生成 `research.json` 和 `research.md`。

```bash
video-script research <title> [options]
```

**参数:**
| 参数 | 说明 |
|----------|-------------|
| `title` | 视频标题 |

**选项:**
| 选项 | 类型 | 说明 |
|--------|------|-------------|
| `--links <urls>` | 字符串 | 逗号分隔的 URL |
| `--doc <file>` | 字符串 | Markdown 文件路径 |
| `--output <dir>` | 字符串 | 输出目录 |

**示例:**

```bash
video-script research "React Hooks 指南" \
  --links "https://react.dev/reference/react/hooks" \
  --doc ./react-notes.md \
  --output ./videos/react-hooks
```

**输出文件:**

- `research.json` - 结构化研究数据
- `research.md` - Markdown 格式的原始研究内容

**下一步:** `video-script script <dir>`

---

### 3.4 `script` 命令

根据 `research.md` 生成 `script.json`。

```bash
video-script script <dir>
```

**参数:**
| 参数 | 说明 |
|----------|-------------|
| `dir` | 包含 `research.md` 的输出目录 |

**前置条件:**

- 目录中必须存在 `research.md`

**示例:**

```bash
video-script script ./videos/react-hooks
```

**输出文件:**

- `script.json` - 包含旁白和时间轴的场景结构

**下一步:** `video-script visual <dir>`（可选）或 `video-script screenshot <dir>`

---

### 3.5 `visual` 命令

根据 `script.json` 和 `research.md` 生成包含视觉层定义的 `visual.json`。

```bash
video-script visual <dir>
```

**参数:**
| 参数 | 说明 |
|----------|-------------|
| `dir` | 包含 `script.json` 和 `research.md` 的输出目录 |

**前置条件:**

- 必须存在 `script.json`
- 必须存在 `research.md`

**示例:**

```bash
video-script visual ./videos/react-hooks
```

**输出文件:**

- `visual.json` - 每个场景的视觉层配置

**下一步:** `video-script screenshot <dir>`

---

### 3.6 `screenshot` 命令

为 `script.json` 中的每个场景截取屏幕截图。

```bash
video-script screenshot <dir>
```

**参数:**
| 参数 | 说明 |
|----------|-------------|
| `dir` | 包含 `script.json` 的输出目录 |

**前置条件:**

- 必须存在 `script.json`

**示例:**

```bash
video-script screenshot ./videos/react-hooks
```

**输出文件:**

- `screenshots/scene-001.png`
- `screenshots/scene-002.png`
- ...（每个场景一张）

**下一步:** `video-script compose <dir>`

---

### 3.7 `compose` 命令

根据脚本和截图渲染最终视频和字幕。

```bash
video-script compose <dir>
```

**参数:**
| 参数 | 说明 |
|----------|-------------|
| `dir` | 包含 `script.json` 和 `screenshots/` 的输出目录 |

**前置条件:**

- 必须存在 `script.json`
- 必须存在包含场景图片的 `screenshots/` 目录

**示例:**

```bash
video-script compose ./videos/react-hooks
```

**输出文件:**

- `output.mp4` - 最终视频
- `output.srt` - 字幕文件

---

### 3.8 `config` 命令

显示当前配置（敏感值已隐藏）。

```bash
video-script config
```

**输出示例:**

```json
{
  "llm": {
    "provider": "openai",
    "model": "gpt-4-turbo"
  },
  "video": {
    "fps": 30,
    "codec": "h264"
  }
}
```

---

### 3.9 `resume` 命令

从最后一个检查点恢复暂停的工作流程。

```bash
video-script resume [runId]
```

**参数:**
| 参数 | 说明 |
|----------|-------------|
| `runId` | 要恢复的特定工作流程运行 ID（可选） |

**示例:**

```bash
# 恢复最近暂停的工作流程
video-script resume

# 恢复指定的工作流程
video-script resume abc123-def456
```

**说明:**

- 工作流程在 `create` 命令后暂停（截图阶段之前）
- 自动确定要从哪个阶段恢复
- 检查现有文件以避免重复处理

---

## 4. 流程阶段

### 4.1 阶段概览

| 阶段    | 命令                                 | 输入                          | 输出                           |
| ------- | ------------------------------------ | ----------------------------- | ------------------------------ |
| 1. 研究 | `research` 或 `create`               | 标题、链接、文档              | `research.json`, `research.md` |
| 2. 脚本 | `script` 或 `create`                 | `research.md`                 | `script.json`                  |
| 3. 视觉 | `visual`（可选）                     | `script.json`, `research.md`  | `visual.json`                  |
| 4. 截图 | `screenshot` 或 `create --no-review` | `script.json`                 | `screenshots/*.png`            |
| 5. 合成 | `compose` 或 `create --no-review`    | `script.json`, `screenshots/` | `output.mp4`, `output.srt`     |

### 4.2 完整流程（分阶段执行）

```bash
# 阶段 1: 研究
video-script research "我的视频" \
  --links "https://example.com" \
  --doc ./notes.md \
  --output ./output/my-video

# 阶段 2: 脚本
video-script script ./output/my-video

# 阶段 3: 视觉（可选但推荐）
video-script visual ./output/my-video

# 阶段 4: 截图
video-script screenshot ./output/my-video

# 阶段 5: 合成
video-script compose ./output/my-video
```

### 4.3 快速流程（单命令）

```bash
video-script create "我的视频" \
  --links "https://example.com" \
  --doc ./notes.md \
  --no-review
```

---

## 5. 输出目录结构

运行完整流程后：

```
output/my-video/
├── research.json          # 结构化研究数据
├── research.md            # Markdown 格式原始研究
├── script.json            # 带旁白的场景分解
├── visual.json            # 视觉层配置（如果运行了 visual 阶段）
├── screenshots/           # 截取的屏幕截图
│   ├── scene-001.png
│   ├── scene-002.png
│   └── ...
├── output.mp4            # 最终视频
└── output.srt            # 字幕
```

---

## 6. 配置文件

要进行高级设置，请在项目根目录创建 `video-script.config.json`：

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

---

## 7. 工作流程状态

### 7.1 工作流程生命周期

```
initialized → running → suspended → running → completed
                    ↘ failed
```

### 7.2 状态持久化

工作流程状态自动保存到输出目录的 `.workflow-state.json` 文件中。这支持：

- 中断后恢复
- 跟踪已完成的阶段
- 从失败中恢复

### 7.3 查看状态

```bash
video-script resume
# 如果工作流程已完成或失败，会显示当前状态
```

---

## 8. 错误处理

### 8.1 重试逻辑

工具会自动重试失败的操作，最多 3 次：

- 研究阶段
- 脚本生成阶段

### 8.2 错误类型

| 错误代码                 | 说明         | 可重试 |
| ------------------------ | ------------ | ------ |
| `INVALID_INPUT`          | 验证错误     | 否     |
| `WEB_FETCH_FAILED`       | 网络问题     | 是     |
| `LLM_API_ERROR`          | API 失败     | 是     |
| `SCREENSHOT_FAILED`      | 截图超时     | 是     |
| `REMOTION_RENDER_FAILED` | 视频渲染错误 | 否     |

### 8.3 故障排除

**API 密钥问题:**

```bash
# 验证 API 密钥是否已设置
echo $OPENAI_API_KEY

# 如果未设置：
export OPENAI_API_KEY=sk-...
```

**Playwright 浏览器问题:**

```bash
# 安装浏览器依赖
npx playwright install
```

**构建失败:**

```bash
# 清除缓存并重新安装
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

**超时问题:**
在配置中增加超时时间：

```json
{
  "screenshot": {
    "timeout": 60000
  }
}
```

---

## 9. 常用用法

### 9.1 交互模式

```bash
video-script create
# 按提示输入标题、链接、文档
```

### 9.2 非交互式完整流程

```bash
video-script create "视频标题" \
  --links "https://url1.com,https://url2.com" \
  --doc ./notes.md \
  --output ./videos/my-video \
  --no-review
```

### 9.3 分步执行带审核

```bash
# 运行研究和脚本，暂停等待审核
video-script create "视频标题" \
  --links "https://example.com"

# 审核后继续
video-script resume
```

### 9.4 中断后恢复

```bash
# 如果工作流程被中断
video-script resume
```

### 9.5 使用现有研究

```bash
# 如果研究已存在
video-script script ./existing-output
video-script visual ./existing-output
video-script screenshot ./existing-output
video-script compose ./existing-output
```

---

## 10. 文件命名规范

### 10.1 输入文件

| 文件            | 必需                     | 格式     |
| --------------- | ------------------------ | -------- |
| `research.md`   | 是（对于脚本阶段）       | Markdown |
| `research.json` | 是（对于脚本阶段）       | JSON     |
| `script.json`   | 是（对于视觉/截图/合成） | JSON     |
| `visual.json`   | 否（可选）               | JSON     |

### 10.2 输出文件

| 文件                                | 格式            |
| ----------------------------------- | --------------- |
| `scene-001.png`, `scene-002.png` 等 | PNG (1920x1080) |
| `output.mp4`                        | H.264 MP4       |
| `output.srt`                        | SRT 字幕        |

---

## 11. 环境变量

| 变量                | 必需 | 说明                            |
| ------------------- | ---- | ------------------------------- |
| `OPENAI_API_KEY`    | 是\* | OpenAI API 密钥                 |
| `ANTHROPIC_API_KEY` | 是\* | Anthropic API 密钥              |
| `LLM_MODEL`         | 否   | 使用的模型（默认：gpt-4-turbo） |
| `VIDEO_FPS`         | 否   | 每秒帧数（默认：30）            |
| `VIDEO_CODEC`       | 否   | 视频编码（默认：h264）          |

\*需要设置 `OPENAI_API_KEY` 或 `ANTHROPIC_API_KEY` 之一。

---

## 12. 版本信息

查看版本：

```bash
video-script --version
```

当前版本：参见 `package.json`

---

## 13. 获取帮助

```bash
# 显示所有命令
video-script --help

# 显示特定命令的帮助
video-script create --help
video-script research --help
video-script script --help
video-script visual --help
video-script screenshot --help
video-script compose --help
video-script resume --help
```

---

## 附录 A：命令速查表

| 任务               | 命令                                                   |
| ------------------ | ------------------------------------------------------ |
| 生成视频（交互式） | `video-script create`                                  |
| 生成视频（自动）   | `video-script create "标题" --links "url" --no-review` |
| 仅生成研究         | `video-script research "标题" --links "url"`           |
| 仅生成脚本         | `video-script script <dir>`                            |
| 生成视觉计划       | `video-script visual <dir>`                            |
| 截取屏幕截图       | `video-script screenshot <dir>`                        |
| 渲染视频           | `video-script compose <dir>`                           |
| 恢复工作流程       | `video-script resume`                                  |
| 查看配置           | `video-script config`                                  |

---

## 附录 B：退出码

| 代码 | 含义                 |
| ---- | -------------------- |
| 0    | 成功                 |
| 1    | 错误（参见错误消息） |

---

**用户手册结束**
