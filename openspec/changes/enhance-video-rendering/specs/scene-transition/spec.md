## ADDED Requirements

### Requirement: Scene 转场支持

Composition.tsx SHALL 使用 @remotion/transitions 的 TransitionSeries 实现 Scene 之间的转场效果。

#### Scenario: fade 交叉淡化转场

- **WHEN** scene.transition.type = "fade" 且 duration = 0.5
- **THEN** 场景切换 SHALL 使用交叉淡化效果，过渡时长 0.5 秒

#### Scenario: slide 滑动转场

- **WHEN** scene.transition.type = "slide" 且 direction = "from-left"
- **THEN** 新场景 SHALL 从左侧滑入，同时旧场景向右侧滑出

#### Scenario: wipe 擦除转场

- **WHEN** scene.transition.type = "wipe"
- **THEN** 新场景 SHALL 使用擦除效果覆盖旧场景

### Requirement: 转场配置格式

scene.transition SHALL 支持以下格式：

```typescript
{
  type: "fade" | "slide" | "wipe" | "flip" | "clockWipe" | "iris" | "none",
  duration: number,  // 秒数
  direction?: "from-left" | "from-right" | "from-top" | "from-bottom"
}
```

### Requirement: 转场时长限制

转场时长 SHALL 不超过 1 秒，避免过渡太慢影响观看体验。

### Requirement: 无转场场景

当 scene.transition.type = "none" 或未配置 transition 时，场景 SHALL 使用硬切（直接切换）。

### Requirement: TransitionSeries 替代 Sequence

Composition.tsx SHALL 将 `<Sequence>` 组件替换为 `<TransitionSeries>` 和 `<TransitionSeries.Sequence>`。
