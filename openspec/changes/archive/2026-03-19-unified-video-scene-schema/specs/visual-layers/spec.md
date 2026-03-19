# Visual Layers Specification

## ADDED Requirements

### Requirement: Scene 支持多个视觉层

每个场景可以包含 0-5 个视觉层（visualLayers 数组），每层独立控制内容和动画。

#### Scenario: 多视觉层场景

- **WHEN** 场景需要同时显示代码和截图
- **THEN** visualLayers 数组包含两个 layer：一个 code 类型，一个 screenshot 类型

#### Scenario: 无视觉层场景

- **WHEN** 场景类型为 `intro` 或 `outro`
- **THEN** visualLayers 可以为空数组，仅显示文字

### Requirement: 视觉层必须有唯一标识符

每个 VisualLayer 必须有唯一的 `id` 字段。

#### Scenario: Layer ID 生成

- **WHEN** 创建新的 visualLayer
- **THEN** 系统生成唯一 ID（格式：`layer-{sceneId}-{n}`）

### Requirement: 视觉层必须有类型

每个 VisualLayer 必须有 `type` 字段，指定视觉内容类型。

支持的类型：

- `screenshot` - 网页截图
- `code` - 代码块
- `text` - 纯文本
- `diagram` - 流程图/架构图
- `image` - 静态图片
- `video` - 视频片段（未来）

#### Scenario: Screenshot 层

- **WHEN** visualLayer.type 为 `screenshot`
- **THEN** content 字段包含截图文件路径

#### Scenario: Code 层

- **WHEN** visualLayer.type 为 `code`
- **THEN** layer 包含 code 字段（language, code, highlightLines）

#### Scenario: Text 层

- **WHEN** visualLayer.type 为 `text`
- **THEN** content 字段包含要显示的文本

### Requirement: 视觉层支持布局控制

每个 VisualLayer 可选包含 `position` 字段，控制层的位置和大小。

#### Scenario: 居中布局

- **WHEN** position 未指定
- **THEN** 层默认居中显示，自动大小

#### Scenario: 自定义位置

- **WHEN** position 指定 x、y、width、height
- **THEN** 层按指定位置和大小渲染

#### Scenario: 分屏布局

- **WHEN** 两个 layer 分别设置 position.x 为 "left" 和 "right"
- **THEN** 两个层并排显示

### Requirement: 视觉层支持动画配置

每个 VisualLayer 可选包含 `animation` 字段，控制入场/出场动画。

#### Scenario: 淡入动画

- **WHEN** animation.type 为 `fadeIn`
- **THEN** 层在指定时长内从透明变为不透明

#### Scenario: 滑入动画

- **WHEN** animation.type 为 `slideIn`
- **THEN** 层从指定方向滑入（up/down/left/right）

#### Scenario: 打字机动画

- **WHEN** visualLayer.type 为 `code` 且 animation.type 为 `typewriter`
- **THEN** 代码逐字符显示，模拟打字效果

### Requirement: 视觉层支持 z-index 控制

每个 VisualLayer 可选包含 `position.zIndex` 字段，控制层叠顺序。

#### Scenario: 默认 z-index

- **WHEN** zIndex 未指定
- **THEN** 按 visualLayers 数组顺序渲染（后面的层在上面）

#### Scenario: 自定义 z-index

- **WHEN** zIndex 指定数值
- **THEN** 按 zIndex 数值排序渲染（数值大的在上面）

### Requirement: Screenshot 层支持配置

type 为 `screenshot` 的层可以包含 `screenshot` 配置字段。

#### Scenario: 字体配置

- **WHEN** screenshot.fontSize 指定
- **THEN** 截图中的代码使用指定字体大小

#### Scenario: 主题配置

- **WHEN** screenshot.theme 指定（如 "github-dark"）
- **THEN** 代码高亮使用指定主题

### Requirement: Code 层支持高亮

type 为 `code` 的层可以包含 `code.highlightLines` 字段。

#### Scenario: 行高亮

- **WHEN** highlightLines 包含 [2, 3, 5]
- **THEN** 第 2、3、5 行被高亮显示（背景色 + 边框）

#### Scenario: 无高亮

- **WHEN** highlightLines 未指定或为空
- **THEN** 代码正常显示，无特殊高亮

### Requirement: 视觉层数量限制

每个场景最多 5 个视觉层，避免性能问题和视觉混乱。

#### Scenario: 超出限制

- **WHEN** visualLayers.length > 5
- **THEN** 系统验证失败，抛出错误 `ERR_VISUAL_LAYERS_EXCEEDED`，提示用户减少视觉层数量

#### Scenario: 限制提示

- **WHEN** 场景包含 4-5 个视觉层
- **THEN** 系统输出警告，建议评估是否需要简化布局
