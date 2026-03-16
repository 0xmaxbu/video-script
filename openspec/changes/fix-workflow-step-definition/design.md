# Video Generation Workflow 修复设计

## Context

当前 `video-generation-workflow` 使用了错误的 API 风格：

```typescript
// 当前错误代码
export const videoGenerationWorkflow = createWorkflow({
  id: "video-generation-workflow",
  inputSchema: ResearchInputSchema,
  outputSchema: z.object({...}),
  steps: [              // ❌ 数组方式 - Mastra v1.x 不支持
    researchStep,
    scriptStep,
    ...
  ],
}).commit();
```

执行时验证显示 `Steps: {}`（空对象），workflow 无法正常运行。

根据 Mastra v1.x 文档（@mastra/core@1.13.2），workflow 步骤必须使用 `.then()` 链式调用注册。

## Goals / Non-Goals

**Goals:**

- 修复 workflow step 注册方式，使其能被 Mastra 正确识别
- 保持 workflow 的功能逻辑不变
- 确保 typecheck 和测试通过

**Non-Goals:**

- 不修改 step 内部的业务逻辑
- 不添加或删除任何 step
- 不改变 input/output schema

## Decisions

### 1. 使用 `.then()` 链式调用注册步骤

**选项 A（采用）**: `.then()` 链式调用

```typescript
export const videoGenerationWorkflow = createWorkflow({...})
  .then(researchStep)
  .then(scriptStep)
  .then(mapStep)
  .then(humanReviewStep)
  .then(screenshotStep)
  .then(composeStep)
  .commit();
```

**选项 B**: 使用 step 函数注册

- 不适用，当前代码未使用此模式

### 2. 确保 `.commit()` 在链式调用末尾

Mastra v1.x 要求必须调用 `.commit()` 来完成 workflow 定义。

## Risks / Trade-offs

- **风险**: 低 - 纯粹是 API 调用方式的修改，不涉及业务逻辑
- **回滚**: 简单 - 只需将代码恢复为数组方式（虽然不工作）
