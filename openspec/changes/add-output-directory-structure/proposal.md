## Why

当前自动 workflow 太过复杂，难以调试和维护。改为手动子命令模式，由人工推进每个阶段，更加灵活可控。同时引入结构化输出目录，每个阶段的产出以 JSON 文件形式持久化。**核心约束：动画编排必须服务于口播内容的节奏。**

## What Changes

1. **移除自动 Workflow**：替换为 4 个独立子命令
2. **新增 CLI 子命令**：
   - `research` - 研究阶段，生成 research.json
   - `script` - 脚本阶段，生成 script.json（动画服务于口播）
   - `screenshot` - 截图阶段，批量生成截图
   - `compose` - 合成阶段，生成视频
3. **结构化输出目录**：`{cwd}/output/年/周-月_日-月_日/选题slug/`
4. **JSON 文件持久化**：每个阶段的产出以固定文件名保存

## Capabilities

### New Capabilities

- **research 子命令**：抓取网页内容，生成 research.json（含口播内容、重点知识、参考链接）
- **script 子命令**：读取 research.json，分析页面，按口播节奏编排场景和动画，生成 script.json
- **screenshot 子命令**：读取 script.json，按配置批量截图，系统自动生成文件名
- **compose 子命令**：读取 script.json 和截图，生成视频（output.mp4）和字幕（output.srt）

### Modified Capabilities

- **BREAKING** 移除原有的 `create` 自动 workflow 命令

## Impact

- **CLI 重构**：移除 `create` 命令，新增 `research`、`script`、`screenshot`、`compose`
- **Workflow 移除**：删除 `video-generation-workflow.ts`
- **Agent 重构**：每个 Agent 对应一个子命令
- **类型更新**：新增 research.json 和 script.json 的类型定义
