## ADDED Requirements

### Requirement: visualLayers enter 动画

ScreenshotLayer SHALL 支持 enter 动画，通过 `animation.enter` 和 `animation.enterDelay` 配置。

#### Scenario: fadeIn 淡入动画

- **WHEN** layer.animation.enter = "fadeIn" 且 enterDelay = 0
- **THEN** 该 layer SHALL 从完全透明（opacity=0）渐变到完全不透明（opacity=1），动画时长 1 秒（30 帧 @ 30fps）

#### Scenario: slideUp 向上滑入动画

- **WHEN** layer.animation.enter = "slideUp" 且 enterDelay = 0
- **THEN** 该 layer SHALL 从 y 偏移 100px 位置滑动到正确位置（translateY: 100→0），同时 opacity 从 0 到 1，动画时长 1 秒（30 帧 @ 30fps）

#### Scenario: 多层 enterDelay 错开

- **WHEN** 场景包含 3 个 visualLayers，enterDelay 分别为 0、0.5、1.0 秒
- **THEN** 这些 layer SHALL 按顺序依次入场，形成视觉节奏

### Requirement: visualLayers exit 动画

ScreenshotLayer SHALL 支持 exit 动画，通过 `animation.exit` 和 `animation.exitAt` 配置。

#### Scenario: fadeOut 淡出动画

- **WHEN** layer.animation.exit = "fadeOut" 且 exitAt = 29（场景共 30 秒）
- **THEN** 在 29 秒时该 layer SHALL 开始淡出，在 30 秒时完全消失（opacity: 1→0，持续 1 秒 / 30 帧 @ 30fps）

#### Scenario: slideOut 滑出动画

- **WHEN** layer.animation.exit = "slideOut"
- **THEN** 该 layer SHALL 沿滑动方向移出屏幕，动画时长 1 秒（30 帧 @ 30fps）

#### Scenario: zoomOut 缩小淡出

- **WHEN** layer.animation.exit = "zoomOut"
- **THEN** 该 layer SHALL 同时缩小（scale: 1→0.8）并淡出（opacity: 1→0），动画时长 1 秒（30 帧 @ 30fps）

### Requirement: 动画时长

enter/exit 动画默认时长 SHALL 是 1 秒（30 帧 @ 30fps）。

### Requirement: 动画插值使用 interpolate

动画插值 SHALL 使用 Remotion 的 `interpolate()` 函数，并设置 `extrapolateRight: "clamp"` 防止值超出范围。
