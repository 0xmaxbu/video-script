# Unified Scene Schema Specification

## ADDED Requirements

### Requirement: Scene 必须有唯一标识符

每个场景必须有唯一的 `id` 字段，用于关联截图资源和支持场景追踪。

#### Scenario: 场景 ID 生成

- **WHEN** script-agent 生成新场景
- **THEN** 系统为每个场景分配唯一的 ID（格式：`scene-{n}` 或语义化名称如 `intro`, `outro`）

#### Scenario: 截图资源关联

- **WHEN** compose 命令构建 screenshotResources 映射
- **THEN** 映射的 key 与 scene.id 对应

### Requirement: Scene 必须有显式时长

每个场景必须有 `duration` 字段，指定该场景在视频中的持续时间（秒）。

#### Scenario: 时长计算

- **WHEN** script-agent 生成场景
- **THEN** 每个场景包含 duration 字段（正数，单位秒）

#### Scenario: 总时长验证

- **WHEN** 视频渲染开始
- **THEN** 系统验证所有场景的 duration 总和等于 script.totalDuration

### Requirement: Scene 必须有叙事类型

每个场景必须有 `type` 字段，值为 `intro`、`feature`、`code`、`outro` 之一。

#### Scenario: Intro 场景

- **WHEN** 场景类型为 `intro`
- **THEN** 场景用于视频开场，包含标题和简短介绍

#### Scenario: Feature 场景

- **WHEN** 场景类型为 `feature`
- **THEN** 场景用于主要内容展示，可包含截图、图表等视觉元素

#### Scenario: Code 场景

- **WHEN** 场景类型为 `code`
- **THEN** 场景用于代码演示，必须包含 code 字段

#### Scenario: Outro 场景

- **WHEN** 场景类型为 `outro`
- **THEN** 场景用于视频结尾，包含总结和行动号召

### Requirement: Scene 必须有标题和旁白

每个场景必须有 `title` 和 `narration` 字段。

#### Scenario: 标题显示

- **WHEN** 场景被渲染
- **THEN** title 作为场景的主标题显示

#### Scenario: 旁白字幕

- **WHEN** 场景被渲染
- **THEN** narration 用于生成字幕和（未来）配音

### Requirement: Script 必须有总时长

Script 输出必须有 `totalDuration` 字段，表示视频总时长。

#### Scenario: 总时长计算

- **WHEN** script-agent 生成脚本
- **THEN** totalDuration 等于所有场景 duration 之和

#### Scenario: 时长限制

- **WHEN** 脚本生成完成
- **THEN** totalDuration 必须在 180-600 秒之间（3-10 分钟）

### Requirement: 场景数量限制

Script 必须包含 1-30 个场景。

#### Scenario: 最小场景数

- **WHEN** 脚本生成完成
- **THEN** 至少包含 1 个场景

#### Scenario: 最大场景数

- **WHEN** 脚本生成完成
- **THEN** 最多包含 30 个场景

### Requirement: Schema 版本标识

Script 输出应包含 `schemaVersion` 字段，便于迁移和验证。

#### Scenario: 版本检查

- **WHEN** 系统读取 script.json
- **THEN** 检查 schemaVersion 字段，如果不存在则假定为旧版本并触发迁移

#### Scenario: 版本不兼容

- **WHEN** schemaVersion 大于当前支持的版本
- **THEN** 系统提示用户升级 video-script

---

## Implementation Notes

### 关于 screenshotResources 映射

**问题**: 当前代码使用 `scene.order` 作为 screenshotResources 的 key，但应该使用 `scene.id`

**正确实现**:

```typescript
// src/mastra/workflows/video-generation.ts
const screenshotResources: Record<string, ScreenshotResult> = {};

scenes.forEach((scene) => {
  // 场景级别的截图（如果存在）
  if (scene.screenshot) {
    screenshotResources[scene.id] = scene.screenshot;
  }

  // visualLayers 级别的截图
  scene.visualLayers?.forEach((layer) => {
    if (layer.type === "screenshot" && layer.screenshot) {
      screenshotResources[layer.id] = layer.screenshot;
    }
  });
});
```

### 关于 totalDuration 计算

**问题**: 当前使用 `scenes.length * 10` 错误计算，应该累加每个场景的 duration

**正确实现**:

```typescript
const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
```

### 关于场景 ID 唯一性

**要求**:

- 每个场景必须有唯一的 `id` 字段
- 格式建议: `{type}-{n}` (如 `intro-1`, `feature-1`, `code-2`)
- ID 用于:
  - screenshotResources 映射的 key
  - 日志追踪
  - 调试
