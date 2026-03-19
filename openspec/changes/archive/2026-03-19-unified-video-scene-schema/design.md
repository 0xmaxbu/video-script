# Design: 统一视频场景 Schema

## Context

### 当前状态

项目存在两套不兼容的 Scene Schema：

**Schema A（主项目当前使用）**:

```typescript
// src/types/script.ts
{
  order: number;
  segmentOrder: number;
  type: "url" | "text";  // 基于数据来源，而非视频叙事
  content: string;          // 混合了 URL 和文本
  screenshot?: {...};
  effects?: Effect[];
}
```

**Schema B（Renderer 期望）**:

```typescript
// packages/renderer/src/types.ts
{
  id: string;
  type: "intro" | "feature" | "code" | "outro";  // 基于视频叙事角色
  title: string;
  narration: string;
  duration: number;  // 显式时长
  code?: { language, code, highlightLines };
}
```

**问题根源**: 两套 Schema 是独立开发的，Schema A 关注"数据来源"（url/text），Schema B 关注"视频叙事"（intro/feature/code/outro）。

### 约束条件

1. **Renderer 不能修改**: Renderer 的 React 组件已经基于 Schema B 实现
2. **Agent 需要更新**: script-agent 的输出必须符合新 Schema
3. **MVP 阶段**: 不需要迁移工具（无现有用户数据）
4. **最小改动原则**: 保持 renderer 不变，只修改主项目

### 利益相关者

- **开发者**: 需要清晰的 API 和类型定义
- **视频创作者**: 需要灵活的场景控制（多视觉层、动画）
- **Agent 系统**: 需要明确的输出格式指令

## Goals / Non-Goals

**Goals:**

1. 统一 Schema 定义，消除主项目与 renderer 的不一致
2. 支持 `visualLayers` 数组，允许一个场景包含多个视觉层
3. 支持场景类型：`intro`、`feature`、`code`、`outro`
4. 每个场景有独立的 `duration` 字段
5. 更新 Agent 指令以生成新格式

**Non-Goals:**

1. TTS 配音集成（后续 Phase）
2. 9:16 画幅支持（后续 Phase）
3. 批量视频生成
4. 浏览器池优化
5. Docker 容器化
6. 多语言字幕

## Decisions

### Decision 1: Schema 统一策略

**选择**: 采用 Renderer 的 Schema 作为统一标准，更新主项目

**理由**:

- Renderer 的 Schema 更适合视频制作（有 title、narration、duration）
- Renderer 组件已经实现，改动成本高
- Schema A 的 `url/text` 分类对视频制作意义不大

**备选方案**:

1. ❌ 保留 Schema A，修改 Renderer → 改动量大，破坏现有实现
2. ❌ 创建适配层 → 增加复杂度，信息丢失
3. ✅ 采用 Schema B，更新主项目 → **最小改动，最大收益**

### Decision 2: visualLayers 数据结构

**选择**: 使用数组结构，每个 layer 有独立的 type、position、animation

```typescript
interface VisualLayer {
  id: string;
  type: "screenshot" | "code" | "text" | "diagram" | "image";
  position: {
    x: number | "left" | "center" | "right";
    y: number | "top" | "center" | "bottom";
    width: number | "auto" | "full";
    height: number | "auto" | "full";
    zIndex: number; // 默认值为 0
  };
  content: string; // URL、代码、文本等
  animation: AnimationConfig;
  screenshot?: ScreenshotConfig;
  code?: CodeConfig;
}
```

**备选方案**:

1. ❌ 单一 visualContent 字段 → 无法支持多视觉
2. ❌ 固定布局模板 → 不够灵活

### Decision 3: AnimationConfig 定义

**选择**: 定义完整的动画配置接口（字段必填，默认值在类型定义中体现）

```typescript
interface AnimationConfig {
  enter:
    | "fadeIn"
    | "slideLeft"
    | "slideRight"
    | "slideUp"
    | "slideDown"
    | "zoomIn"
    | "typewriter"
    | "none";
  enterDelay: number = 0;  // 帧数延迟，默认 0
  exit: "fadeOut" | "slideOut" | "zoomOut" | "none";
  exitAt?: number;          // 相对于场景开始的帧数
}
```

**理由**:

- 清晰的动画类型定义
- 支持入场/出场动画分离
- enterDelay 允许错开多个层的动画时间

### Decision 3: 场景类型语义

**选择**: 基于叙事角色分类

| Type      | 用途                    | 典型时长 | 视觉元素                     |
| --------- | ----------------------- | -------- | ---------------------------- |
| `intro`   | 视频开场，引入主题      | 10-15s   | logo、标题、简短文字         |
| `feature` | 主要内容，展示功能/概念 | 20-60s   | 截图、图表、动画             |
| `code`    | 代码演示                | 30-90s   | 代码块、语法高亮、打字机效果 |
| `outro`   | 视频结尾，总结/CTA      | 10-15s   | 标题、链接、感谢             |

**理由**:

- 符合视频制作最佳实践（Fireship、Theo 等）
- 类型决定了默认的视觉风格和动画
- 便于 Agent 理解和生成

**备选方案**:

1. ❌ 保留 `url/text` → 对视频制作无意义
2. ❌ 添加更多类型（如 `diagram`、`comparison`）→ 可在 feature 中通过 visualLayers 实现

### Decision 4: Agent 指令更新

**选择**: 完全重写 script-agent 指令，提供清晰的输出示例

**关键更新**:

1. 明确场景类型定义（intro/feature/code/outro）
2. 强调 `visualLayers` 结构和用法
3. 提供完整的 JSON 输出示例
4. 添加时长规划指导

**理由**:

- Agent 需要明确指令才能输出正确格式
- 示例比描述更有效
- 时长规划对视频质量至关重要

## Risks / Trade-offs

### Risk 1: Agent 输出格式错误

- **影响**: 生成的脚本不符合 Schema
- **可能性**: 中（Agent 可能误解指令）
- **缓解**:
  - 提供多个示例
  - Zod 验证输出
  - 失败时提供清晰错误信息

### Risk 2: Renderer 渲染失败

- **影响**: 视频生成失败
- **可能性**: 低（Schema 已统一）
- **缓解**:
  - 保持 renderer 代码不变
  - 完整的集成测试
  - 错误时提供详细日志

### Risk 3: 测试覆盖不足

- **影响**: 新功能有 bug
- **可能性**: 中
- **缓解**:
  - 每个新 Schema 有单元测试
  - 端到端测试覆盖主流程

### Trade-off 1: 灵活性 vs 复杂度

- **选择**: 增加 `visualLayers` 提高灵活性
- **代价**: Schema 更复杂，Agent 更难生成正确格式
- **接受理由**: 现代教程视频需要多视觉层（代码 + 截图 + 文字叠加）

## Open Questions

1. **visualLayers 最大数量限制?**
   - 当前设计无限制
   - 建议限制为 3-5 层（性能考虑）
   - 待讨论

2. **scene type 是否需要扩展?**
   - 当前 4 种类型足够
   - 未来可能需要: `comparison`、`quiz`、`sponsor`
   - 暂时保持 4 种

3. **animation 配置复杂度?**
   - 当前支持基本动画
   - 是否需要更复杂的配置（贝塞尔曲线、关键帧）?
   - 建议先实现基础，后续迭代

4. **迁移工具是否需要 GUI?**
   - 当前设计为 CLI
   - 是否需要交互式迁移?
   - 建议先实现 CLI，根据反馈迭代

---

## Implementation Findings (代码分析)

> 本节记录了对现有代码库的深入分析结果，揭示了实现过程中需要解决的具体问题。

### 问题总览

| #   | 问题                           | 位置                                       | 影响                               |
| --- | ------------------------------ | ------------------------------------------ | ---------------------------------- |
| 1   | CLI 临时绕过方案               | `src/cli/index.ts`                         | 场景数据转换不完整                 |
| 2   | screenshotResources key 不匹配 | `src/mastra/workflows/video-generation.ts` | 截图资源无法正确映射到 visualLayer |
| 3   | Agent 输出旧 Schema            | `src/mastra/agents/script-agent.ts`        | 生成的数据格式不符合预期           |
| 4   | totalDuration 计算错误         | `src/mastra/workflows/video-generation.ts` | 视频时长不准确                     |
| 5   | screenshot-agent 逻辑需要重写  | `src/mastra/agents/screenshot-agent.ts`    | 不支持 visualLayers                |
| 6   | VisualLayer 到组件映射缺失     | `packages/renderer/`                       | 无法渲染多视觉层                   |
| 7   | transition 配置缺失            | 未实现                                     | 场景间无转场动画                   |
| 8   | 类型定义不完整                 | `src/types/`                               | 缺少关键字段                       |
| 9   | 验证逻辑缺失                   | 未实现                                     | 无法校验 Schema 合规性             |

### 详细分析

#### 问题 1: CLI 临时绕过方案

**发现位置**: `src/cli/index.ts`

**现状**:

```typescript
// 临时方案：CLI 中手动构造符合 Schema B 的场景数据
// 这是一个绕过方案，应该由 Agent 自动生成正确格式
const scenes = input.scenes || [
  { id: 'intro-1', type: 'intro', title: input.title, narration: '', duration: 10, visualLayers: [...] },
  // ...
]
```

**影响**:

- Agent 输出格式与 CLI 期望格式不一致
- 临时方案掩盖了真正的问题

**建议**: 统一 Agent 输出格式与 Schema B 一致

---

#### 问题 2: screenshotResources Key 不匹配

**发现位置**: `src/mastra/workflows/video-generation.ts`

**现状**:

```typescript
// 当前代码使用 scene.order 作为 key
const screenshotResources: Record<string, ScreenshotResult> = {};
scenes.forEach((scene, index) => {
  screenshotResources[scene.order] = screenshots[index]; // ❌ 错误
});

// 但 renderer 期望使用 visualLayer.id 作为 key
// 或者使用 scene.id 作为 key
```

**影响**: 截图资源无法正确映射到对应的 visualLayer

**建议**:

- 方案 A: 使用 `scene.id` 作为 key
- 方案 B: 使用 `visualLayer.id` 作为 key，flatten visualLayers

---

#### 问题 3: Agent 输出旧 Schema

**发现位置**: `src/mastra/agents/script-agent.ts`

**现状**: Agent 仍然输出 Schema A 格式（url/text），而非 Schema B（intro/feature/code/outro）

**示例**:

```typescript
// 当前 Agent 输出
{
  "scenes": [
    { "type": "url", "content": "https://...", "screenshot": {...} },  // ❌ 旧格式
    { "type": "text", "content": "Some text" }  // ❌ 旧格式
  ]
}

// 应该输出
{
  "scenes": [
    { "type": "intro", "id": "intro-1", "title": "...", "narration": "...", "duration": 10, "visualLayers": [...] },
    { "type": "feature", "id": "feature-1", ... }
  ]
}
```

**建议**: 完全重写 script-agent 的 system prompt

---

#### 问题 4: totalDuration 计算错误

**发现位置**: `src/mastra/workflows/video-generation.ts`

**现状**:

```typescript
// 当前使用固定值或错误计算
const totalDuration = scenes.length * 10; // ❌ 假设每个场景 10 秒

// 正确做法：累加每个场景的 duration
const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
```

**影响**: 视频时长与实际不匹配，导致渲染问题

---

#### 问题 5: screenshot-agent 逻辑需要重写

**发现位置**: `src/mastra/agents/screenshot-agent.ts`

**现状**: Agent 逻辑基于旧的 url/text 结构，不支持新的 visualLayers

**需要更新**:

1. 遍历 visualLayers 而非 scenes
2. 根据 layer.type 决定截图策略
3. 支持多种截图模式（fullPage、element、viewport）
4. 返回每个 layer 的截图结果

---

#### 问题 6: VisualLayer 到组件映射缺失

**发现位置**: `packages/renderer/src/`

**现状**: Renderer 当前只有固定的 Scene 组件（IntroScene、FeatureScene 等），不支持动态渲染 visualLayers

**需要实现**:

```typescript
// 需要新增组件
<VisualLayerRenderer layer={visualLayer} />
  -> <ScreenshotLayer /> 或 <CodeLayer /> 或 <TextLayer />
```

---

#### 问题 7: transition 配置缺失

**发现位置**: 未实现

**现状**: 当前 Schema 没有定义 transition 字段

**需要添加**:

```typescript
interface SceneTransition {
  type: "fade" | "slide" | "wipe" | "none";
  duration: number; // 帧数
}
```

---

#### 问题 8: 类型定义不完整

**发现位置**: `src/types/`

**缺失字段**:

- `Scene.visualLayers[]`
- `VisualLayer.*`
- `AnimationConfig.enter` (当前是必填，应有默认值)
- `SceneTransition`

---

#### 问题 9: 验证逻辑缺失

**发现位置**: 未实现

**现状**: 没有 Zod schema 验证 Agent 输出

**需要实现**:

```typescript
import { z } from 'zod';

export const VisualLayerSchema = z.object({...});
export const SceneSchema = z.object({...});
export const ScriptOutputSchema = z.object({...});

// 验证函数
export function validateScriptOutput(output: unknown) {
  return ScriptOutputSchema.safeParse(output);
}
```

---

### 实现优先级建议

| 优先级 | 问题         | 原因         |
| ------ | ------------ | ------------ |
| P0     | 问题 3, 4    | 影响核心流程 |
| P1     | 问题 1, 2, 5 | 影响数据流   |
| P2     | 问题 6       | 影响渲染     |
| P3     | 问题 7, 8, 9 | 增强功能     |

---

### 关键技术决策

#### visualLayers 扁平化方案

由于 Renderer 组件结构限制，建议采用扁平化策略：

```typescript
// 展平 visualLayers 到顶级
interface FlattenedScene {
  id: string;
  type: "intro" | "feature" | "code" | "outro";
  title: string;
  narration: string;
  duration: number;

  // 扁平化的视觉层（而非嵌套数组）
  screenshotLayer?: ScreenshotLayer;
  codeLayer?: CodeLayer;
  textLayer?: TextLayer;
}
```

**理由**:

- 简化 Renderer 组件逻辑
- 与现有 Scene 组件兼容
- 保持 schema 的扩展性
