# Implementation Plan: fix-script-agent-incremental

## 核心诉求

1. **Script 可分多次输出**：不是一次生成整个 script，而是分多次调用 LLM，每次处理一个场景
2. **出错自动重试**：每个场景失败后自动重试，而不是整个流程失败

---

## 架构设计

### 当前问题

```
CLI → scriptAgent.generate(research) → 一次返回完整 script → 失败率高
```

### 解决方案：两阶段生成

```
Phase 1: 生成场景结构（不含 visualLayers）
  CLI → scriptAgent.generate(prompt: "生成场景结构")
    → 返回: { title, scenes: [{id, type, title, narration, duration}] }

Phase 2: 逐个生成 visualLayers
  for each scene:
    CLI → scriptAgent.generate(prompt: "为 scene-N 生成 visualLayers")
      → 返回: { sceneId, visualLayers: [...] }
      → 验证并保存到 script.json
      → 失败则自动重试（最多3次）
```

### 关键特性

| 特性     | 实现方式                      |
| -------- | ----------------------------- |
| 多次输出 | 循环调用 LLM，每次一个场景    |
| 自动重试 | 每个场景失败后重试 3 次       |
| 幂等保存 | 保存前检查场景 ID 是否已存在  |
| 优雅降级 | visualLayers 失败时设为空数组 |
| 增量保存 | 每完成一个场景即保存          |

---

## 数据流

```
research.json (输入)
    ↓
Phase 1: 生成场景结构
    ↓
partial-script.json (中间状态：含 scenes 但 visualLayers 为空)
    ↓
Phase 2: 逐个填充 visualLayers
    ↓
script.json (最终输出：完整的 scenes + visualLayers)
```

---

## 文件变更

| 文件                                | 变更                         |
| ----------------------------------- | ---------------------------- |
| `src/cli/index.ts`                  | 重构为两阶段流程 + 场景循环  |
| `src/utils/json-parser.ts`          | 新增：多 JSON 解析器         |
| `src/utils/scene-accumulator.ts`    | 新增：场景累加器（增量保存） |
| `src/mastra/agents/script-agent.ts` | 更新 prompt 以支持单场景输出 |

---

## 任务拆解

### Task 1: 创建 JSON 解析器工具 (chore)

- **依赖**: 无
- **输入**: LLM 输出文本
- **输出**: `src/utils/json-parser.ts`
- **Spec 源**: specs/json-parser/parser.md
- **验收**: 6 个测试用例全部通过

---

### Task 2: 创建场景累加器 (chore)

- **依赖**: Task 1
- **输入**: 单个场景更新
- **输出**: `src/utils/scene-accumulator.ts`
- **Spec 源**: design.md > 幂等保存策略
- **验收**:
  - [ ] 幂等检查：重复添加同一场景不会覆盖
  - [ ] 增量保存：每步更新后保存到 partial-script.json

---

### Task 3: 更新 CLI 为两阶段流程 (feature)

- **依赖**: Task 2
- **输入**: `src/cli/index.ts`
- **Spec 源**: design.md > 两阶段生成
- **Phase 1**: 调用 LLM 生成场景结构
- **Phase 2**: 循环调用 LLM 生成每个场景的 visualLayers
- **验收**:
  - [ ] Phase 1 成功生成场景列表
  - [ ] Phase 2 逐个填充 visualLayers
  - [ ] 每个场景独立重试 3 次
  - [ ] 失败时继续处理下一个场景

---

### Task 4: 更新 Script Agent Prompts (feature)

- **依赖**: Task 3
- **输入**: `src/mastra/agents/script-agent.ts`
- **Spec 源**: design.md > Script Agent 流式策略
- **变更**:
  - Prompt 1 (结构): 生成不含 visualLayers 的场景列表
  - Prompt 2 (单场景): 为指定场景生成 visualLayers
- **验收**:
  - [ ] 单场景 prompt 输出稳定的 JSON
  - [ ] 动画类型约束正确

---

### Task 5: E2E 集成测试 (task)

- **依赖**: Task 4
- **输入**: research.json
- **Spec 源**: proposal.md > 成功标准
- **验收**:
  - [ ] 完整流程跑通
  - [ ] script.json 生成成功
  - [ ] 通过 Schema 验证

---

## 验证追踪

| 目标                   | 验证任务 | 成功标准                 |
| ---------------------- | -------- | ------------------------ |
| 脚本生成成功率 >90%    | Task 5   | 连续 3 次 E2E 测试成功   |
| 每个场景单独验证       | Task 3   | 每个场景独立处理         |
| 失败的场景可以单独重试 | Task 3   | 单场景失败不影响其他场景 |
| 向后兼容               | Task 3   | research.json 格式不变   |
