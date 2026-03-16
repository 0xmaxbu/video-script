# 修复 Video Generation Workflow 的 Step 定义

## Why

当前 `video-generation-workflow` 在执行时会报错，workflow 显示包含 0 个 step。这是因为代码使用了 Mastra v0.x 风格的 `steps: [...]` 数组方式来定义 workflow 步骤，但 Mastra v1.x 要求使用 `.then()` 链式调用来注册步骤。

## What Changes

- 修改 `src/mastra/workflows/video-generation-workflow.ts` 中的 workflow 定义
- 将 `steps: [step1, step2, ...]` 数组方式改为 `.then(step1).then(step2)...` 链式调用
- 在链式调用末尾添加 `.commit()` 方法

## Capabilities

### New Capabilities

无需新增 capability。

### Modified Capabilities

- `video-generation-workflow`: 修复 step 注册方式，使其符合 Mastra v1.x API 规范

## Impact

- 受影响文件：`src/mastra/workflows/video-generation-workflow.ts`
- 依赖项：无新增依赖
- 相关系统：Mastra workflow 执行引擎
