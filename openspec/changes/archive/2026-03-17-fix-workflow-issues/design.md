## Context

当前 video-script 项目使用 Mastra framework 构建视频生成 workflow，包含 5 个步骤：

1. **researchStep** - 研究主题，收集信息
2. **scriptStep** - 生成视频脚本
3. **humanReviewStep** - 人工审核脚本（可 suspend）
4. **screenshotStep** - 生成截图素材
5. **composeStep** - 合成最终视频

**问题现状**：

- Agent 的 instruction 中定义的输出格式与 `src/types/index.ts` 中的 Zod schema 不一致
- CLI 没有处理 workflow 的 suspended 状态
- CLI 使用的 workflow id 与实际定义不匹配

**约束**：

- 必须保持向后兼容，不能破坏现有的测试
- 修改应该最小化，只修复必要的问题
- 需要遵循 Mastra framework 的最佳实践

## Goals / Non-Goals

**Goals:**

1. 修复 schema 不匹配问题，使 workflow 步骤间数据流畅通
2. 实现 CLI 对 human review suspend/resume 的完整支持
3. 修复 CLI workflow id 错误
4. 支持 `--no-review` 选项跳过人工审核

**Non-Goals:**

- 不重构整个 workflow 架构
- 不添加新的 agent 或 tool
- 不实现 TTS 配音功能（MVP 不包含）
- 不修改 Remotion 组件结构

## Decisions

### Decision 1: Schema 修复策略

**选择**: 扩展 Zod schema 以匹配 agent 实际输出，而不是修改 agent instruction

**理由**:

- Agent 的 instruction 中定义的输出格式更丰富、更合理
- 修改 schema 比修改 agent instruction 风险更小
- 保持 agent 输出的表达能力，有利于后续扩展

**备选方案**:

- ❌ 修改 agent instruction 以匹配现有 schema - 会丢失有价值的信息
- ❌ 添加数据转换层 - 增加复杂度，不符合 MVP 原则

### Decision 2: 数据流转换

**选择**: 在 scriptStep 中添加 `map()` 转换，将 agent 输出规范化为 SceneSchema 格式

**理由**:

- 集中处理转换逻辑，下游步骤无需关心格式差异
- 使用 Mastra 内置的 map 功能，无需额外代码
- 保持 schema 定义简洁

**备选方案**:

- ❌ 在每个下游步骤中处理格式差异 - 分散逻辑，难以维护
- ❌ 创建独立的转换 step - 增加步骤数量，降低效率

### Decision 3: Human Review 处理

**选择**: 使用 `_skipReview` 标志在 workflow 内部控制 suspend 行为

**理由**:

- 简单直接，不需要修改 Mastra workflow API
- CLI 只需要设置标志，无需理解 workflow 内部逻辑
- 易于测试和调试

**备选方案**:

- ❌ 创建两个不同的 workflow（带/不带 review）- 代码重复
- ❌ 使用 Mastra 的条件步骤 - 过于复杂，不符合当前需求

### Decision 4: CLI Suspend 处理

**选择**: CLI 检测 suspended 状态，显示脚本内容，并等待用户确认后调用 `run.resume()`

**理由**:

- 提供良好的用户体验
- 用户可以在审核后修改脚本
- 保持 CLI 的交互性

**备选方案**:

- ❌ CLI 阻塞等待 resume - 用户体验差
- ❌ 使用外部服务处理 resume - 过于复杂

## Risks / Trade-offs

### Risk 1: Schema 变更可能破坏现有测试

**缓解**: 运行完整测试套件，确保所有测试通过；如有必要，更新测试用例

### Risk 2: Suspend/Resume 逻辑可能存在边界情况

**缓解**: 添加详细的错误处理和日志；编写单元测试覆盖边界情况

### Risk 3: `_skipReview` 标志是临时约定

**缓解**: 在代码中添加清晰注释；考虑在未来版本中标准化此约定

### Trade-off: 扩展 schema vs 保持简洁

**选择**: 扩展 schema 以支持更丰富的数据结构
**代价**: schema 变得更复杂
**收益**: 保持 agent 输出的表达能力，有利于后续扩展
