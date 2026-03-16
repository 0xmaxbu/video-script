# Video Script 测试手册

## 1. 环境准备

### 1.1 安装依赖

```bash
# 安装 Node.js 依赖
npm install

# 安装 Playwright 浏览器（用于截图）
npx playwright install chromium
```

### 1.2 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# 方式 1：直接写入
echo 'MINIMAX_CN_API_KEY="your-api-key"' > .env

# 方式 2：复制示例并编辑
cp .env.example .env
# 然后编辑 .env 文件，填入你的 API Key
```

**注意**：模型已配置为 `minimax-cn-coding-plan/MiniMax-M2.5`，需要设置对应的环境变量：

```
MINIMAX_CN_API_KEY=your-api-key-here
```

### 1.3 验证配置

```bash
# 查看当前配置（敏感信息会被遮罩）
npm run dev -- config
```

---

## 2. 测试命令

### 2.1 交互式测试（推荐）

```bash
npm run dev
```

然后按照提示输入：

- 视频标题
- 参考链接（逗号分隔）
- 文档文件路径（可选）

### 2.2 命令行参数测试

```bash
# 基本用法
npm run dev -- create "视频标题"

# 带链接
npm run dev -- create "视频标题" --links "https://example.com"

# 带文档
npm run dev -- create "视频标题" --doc ./notes.md

# 跳过审核节点（自动执行）
npm run dev -- create "视频标题" --links "https://example.com" --no-review

# 指定输出目录
npm run dev -- create "视频标题" --output ./my-videos
```

### 2.3 完整参数列表

| 参数             | 说明                 | 默认值     |
| ---------------- | -------------------- | ---------- |
| `title`          | 视频标题             | 交互式输入 |
| `--links`        | 参考链接（逗号分隔） | 无         |
| `--doc`          | 参考文档文件路径     | 无         |
| `--aspect-ratio` | 视频宽高比           | 16:9       |
| `--no-review`    | 跳过审核节点         | false      |
| `--output`       | 输出目录             | ./output   |

---

## 3. 测试场景

### 3.1 完整流程测试（包含审核）

```bash
npm run dev -- create "TypeScript 泛型教程" --links "https://www.typescriptlang.org/docs/handbook/2/generics.html"
```

**预期流程**：

1. 📥 输入收集
2. 🔍 Research Agent 执行研究
3. 📝 Script Agent 生成脚本 → **暂停在此**
4. 👀 用户审核脚本
5. 📷 Screenshot Agent 截图
6. 🎬 Compose Agent 合成视频
7. ✅ 完成

### 3.2 自动流程测试（跳过审核）

```bash
npm run dev -- create "TypeScript 泛型教程" --links "https://www.typescriptlang.org/docs/handbook/2/generics.html" --no-review
```

**预期流程**：直接执行完整流程，无暂停。

### 3.3 恢复暂停的工作流

工作流在审核节点暂停后，会输出 Run ID：

```
Run ID: abc-123-def
```

恢复执行：

```bash
# 不修改脚本，直接继续
npm run dev -- resume abc-123-def

# 指定修改后的脚本文件
npm run dev -- resume abc-123-def --file ./edited-script.json
```

---

## 4. 查看配置

```bash
npm run dev -- config
```

输出示例：

```json
{
  "llm": {
    "provider": "minimax-cn-coding-plan",
    "model": "MiniMax-M2.5",
    "apiKey": "sk-m****"
  },
  "tts": {
    "enabled": false
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

## 5. 单元测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- src/mastra/tools/__tests__/web-fetch.test.ts

# 监听模式（开发时）
npm run test:watch
```

---

## 6. 故障排查

### 6.1 API Key 未设置

```
Error: MINIMAX_CN_API_KEY is not set
```

**解决**：在 `.env` 文件中设置 `MINIMAX_CN_API_KEY`

### 6.2 Playwright 浏览器未安装

```
Error: Browser not found
```

**解决**：

```bash
npx playwright install chromium
```

### 6.3 TypeScript 错误

```bash
# 检查类型错误
npm run typecheck

# 检查 lint
npm run lint
```

### 6.4 查看日志

CLI 运行时会输出详细日志，包括每个工作流步骤的执行状态。

---

## 7. 开发相关

```bash
# 开发模式（watch）
npm run dev

# 构建
npm run build

# 类型检查
npm run typecheck

# 代码格式化
npm run format

# Lint
npm run lint
```

---

## 8. 测试数据示例

### 示例 1：简单标题

```bash
npm run dev -- create "JavaScript 异步编程"
```

### 示例 2：带链接

```bash
npm run dev -- create "React Hooks 教程" --links "https://react.dev/reference/react/hooks,https://react.dev/learn/state-a-components-memory"
```

### 示例 3：带文档

```bash
npm run dev -- create "Docker 入门" --doc ./docs/docker-guide.md
```

### 示例 4：完整参数

```bash
npm run dev -- create "Python 装饰器" \
  --links "https://docs.python.org/3/tutorial/classes.html#decorators" \
  --doc ./notes/decorators.md \
  --output ./my-videos \
  --no-review
```
