## ADDED Requirements

### Requirement: spring() 弹性动画

ScreenshotLayer SHALL 使用 spring() 函数实现弹性动画效果，替代部分 interpolate() 动画。

#### Scenario: 使用 spring 实现平滑入场

- **WHEN** 使用 spring({ frame, fps, config: { damping: 15, stiffness: 100 } })
- **THEN** 动画 SHALL 在 0.8 秒内完成弹性衰减振荡（通过对比 frame=0、frame=12、frame=24、frame=36 的位置确认），overshoot 不超过目标位置的 10%

#### Scenario: spring 动画配置

spring() SHALL 支持以下配置参数：

- `damping`: 阻尼系数，控制弹性衰减（默认 10）
- `stiffness`: 刚度系数，控制弹性强度（默认 100）
- `mass`: 质量系数（默认 1）

### Requirement: spring 与 interpolate 结合

spring() SHALL 与 interpolate() 结合使用：

- spring() 生成驱动值（0 到 1）
- interpolate() 将驱动值映射到实际效果值

#### Scenario: 弹簧驱动的位置动画

- **WHEN** 使用 spring 驱动 translateX 值
- **THEN** 元素 SHALL 以弹簧物理效果移动到目标位置

### Requirement: 适用场景

spring 动画 SHALL 用于：

- 需要弹跳效果的元素入场
- 需要自然减速的滑动效果
- 需要强调的缩放动画

### Requirement: 非弹性动画仍用 interpolate

简单的淡入淡出（fadeIn/fadeOut）和固定方向的滑动仍使用 interpolate()，因为 spring() 不适合这类简单动画。
