## Why

当前 Agent 的输出直接传递给下一个 Agent，没有持久化保存。当工作流中断或需要回溯时，无法找到之前的产出物。同时，产出的文件散落在临时目录，难以管理和追溯。引入结构化的输出目录，每个 Agent 的产出以固定文件名（JSON）保存，方便查找、审计和复用。

## What Changes

1. **新增目录生成逻辑**：在工作流启动时，根据当前日期和视频选题生成结构化输出目录，格式为 `{cwd}/output/年/月日-月日_选题slug/`。
2. **CLI --output 参数**：支持用户指定自定义输出路径，完全覆盖默认路径。
3. **新增文件读写工具**：为 Agent 新增 writeJsonFile 和 readJsonFile 工具（仅 JSON 格式）。
4. **修改 Workflow 状态传递**：Agent 之间不再只传递内存对象，而是通过文件系统读写对应阶段的产出文件。

## Capabilities

### New Capabilities

- **输出目录管理**：根据日期和选题自动生成结构化输出目录，支持月日范围计算
- **文件读写工具**：writeJsonFile（写入 JSON）和 readJsonFile（读取 JSON），供 Agent 持久化产出

### Modified Capabilities

- （无）现有能力的需求未发生变化

## Impact

- **代码影响**：`src/mastra/tools/` 新增文件读写工具；`src/mastra/workflows/` 修改工作流步骤传递逻辑
- **依赖影响**：新增 `date-fns` 和 `slugify` 依赖
- **系统影响**：输出目录结构变更，需要同步更新文档
