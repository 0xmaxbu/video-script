## Why

当前视频渲染效果较差，核心问题：

1. **图片渲染不工作** - Scene 组件的 visualLayers 没有正确渲染 screenshot
2. **缺少视觉特效** - 只有简单的 enter 动画，没有 exit 动画和转场效果
3. **无法验证渲染结果** - 没有通过 Playwright CLI 截图来验证渲染是否正确

需要通过 Playwright CLI 截图作为判断依据，确保图片和特效正常渲染后再进行增强开发。

## What Changes

### 第一阶段：验证和修复图片渲染

1. 修复 Scene.tsx 中 visualLayers 的渲染逻辑
2. 确保 ScreenshotLayer 正确使用本地文件路径而非 URL
3. 使用 Playwright CLI 截图验证渲染结果
4. 验证 visualLayers 的 enter 动画：frame=0 时 opacity=0，frame=15 时 opacity=1，slideUp 的 translateY 从 50px 过渡到 0px

### 第二阶段：增强视觉特效

1. 实现 Scene 组件的 TransitionSeries 转场支持
2. 让 Script Agent 生成完整的 transition 字段配置
3. 改进 ScreenshotLayer 实现：
   - exit 动画（fadeOut、slideOut、zoomOut）
   - exitAt 时机控制
   - 使用 spring 弹性动画替代 interpolate

## Capabilities

### New Capabilities

- `image-rendering-verification`: 通过 Playwright CLI 截图验证图片渲染是否正常
- `visual-layer-animation`: visualLayers 的 enter/exit 动画系统
- `scene-transition`: Scene 之间的转场效果（fade、slide、wipe）
- `spring-animation`: 使用 spring() 实现弹性动画效果

### Modified Capabilities

- `script-agent`: 扩展生成更详细的 visualLayers 和 transition 配置
- `remotion-renderer`: 支持 TransitionSeries 转场组件

## 验收标准

1. **截图渲染验证** - Playwright CLI 在 frame=0 截取的图片中，ScreenshotLayer 显示的本地图片可见（非空白、非错误占位符），像素覆盖面积 ≥ 50% 的预期区域

2. **enter 动画验证** - 在 frame=0 和 frame=30（1秒）分别截图，fadeIn 动画的 opacity 从 0.0 变化到 1.0；slideUp 动画的 translateY 从 100px 变化到 0px

3. **exit 动画验证** - 在场景结束前 frame=735（24.5秒@30fps）和场景结束 frame=900（30秒@30fps）分别截图，fadeOut 动画的 opacity 从 1.0 变化到 0.0；zoomOut 动画的 scale 从 1.0 变化到 0.8

4. **转场效果验证** - 在 Scene 切换时刻（上一场景最后一帧 vs 下一场景第一帧）截图，fade 转场显示交叉淡化效果；slide 转场显示从左向右滑动的视觉效果

5. **spring 动画验证** - 使用 spring({ damping: 15, stiffness: 100 }) 配置的 slideUp 动画，在 0.8 秒内完成弹性衰减振荡（通过对比 frame=0、frame=12、frame=24、frame=36 的位置确认）

## 不做什么

- 不实现音频/配音功能
- 不实现 9:16 画幅支持
- 不实现批量视频生成
- 不实现硬字幕烧录

## Impact

**影响的代码**:

- `packages/renderer/src/remotion/Scene.tsx` - Scene 组件
- `packages/renderer/src/remotion/components/ScreenshotLayer.tsx` - 截图层组件
- `packages/renderer/src/remotion/Composition.tsx` - 合成组件
- `src/mastra/agents/script-agent.ts` - 脚本代理

**新增依赖**:

- `@remotion/transitions` - 官方转场包
