## Context

当前视频渲染存在以下问题：

1. **图片渲染不工作**：Scene.tsx 中的 visualLayers 没有正确渲染 screenshot 类型的层
2. **动画效果简单**：ScreenshotLayer 只有 enter 动画，没有 exit 动画
3. **缺少转场效果**：Scene 之间没有转场，使用的是简单的 Sequence 拼接
4. **无法验证**：没有通过 Playwright CLI 截图来验证渲染结果

**技术栈**：

- Remotion 4.0+ 用于视频合成
- @remotion/transitions 用于场景转场
- Playwright CLI 用于截图验证

## Goals / Non-Goals

**Goals:**

- 实现图片的正确渲染（通过 Playwright CLI 截图验证）
- 实现 visualLayers 的 enter/exit 动画系统
- 实现 Scene 之间的转场效果（fade、slide、wipe）
- 使用 spring() 替代部分 interpolate() 实现更自然的弹性动画

**Non-Goals:**

- 不实现音频/配音功能
- 不实现 9:16 画幅
- 不实现批量视频生成

## Decisions

### Decision 1: 使用 Playwright CLI 作为验证手段

**选择**：使用 Playwright CLI 截图验证渲染结果，而不是仅依赖代码审查

**理由**：

- Remotion 渲染是 React 组件，静态分析无法保证运行时正确性
- Playwright 可以真实渲染页面并截图，直观验证
- CLI 方式便于集成到 CI/CD

**替代方案考虑**：

- Vitest 单元测试：只能测试逻辑正确性，无法验证视觉效果
- 手动检查：不可靠，无法自动化

### Decision 2: 升级 Composition.tsx 使用 TransitionSeries

**选择**：使用 @remotion/transitions 的 TransitionSeries 替代简单的 Sequence

**理由**：

- TransitionSeries 提供专业的转场效果（fade、slide、wipe 等）
- 与 Remotion 官方集成，支持良好
- 可以通过 Script Agent 的 transition 字段配置

**实现方式**：

```tsx
import { TransitionSeries } from "@remotion/transitions";
import { fade, slide } from "@remotion/transitions";

<TransitionSeries>
  {scenes.map((scene) => (
    <TransitionSeries.Sequence durationInFrames={...}>
      <Scene scene={scene} />
    </TransitionSeries.Sequence>
  ))}
</TransitionSeries>
```

### Decision 3: 动画使用 spring() 替代 interpolate()

**选择**：对需要弹性效果的动画使用 spring()

**理由**：

- spring() 提供物理模拟的弹性动画，更自然
- interpolate() 适合线性/缓动动画
- 两者结合使用

**spring() 配置**：

- 平滑入场：`{ damping: 15, stiffness: 100 }`
- 弹跳效果：`{ damping: 8, stiffness: 200 }`
- 快速响应：`{ damping: 20, stiffness: 300 }`

### Decision 4: Script Agent 生成完整 transition 配置

**选择**：Script Agent 在生成 scene 时同时生成 transition 字段

**transition 字段格式**：

```typescript
{
  type: "fade" | "slide" | "wipe" | "flip" | "clockWipe" | "iris" | "cube" | "none",
  duration: number,  // 秒
  direction?: "from-left" | "from-right" | "from-top" | "from-bottom"
}
```

## Risks / Trade-offs

**[Risk] @remotion/transitions 包可能有版本兼容问题**
→ **Mitigation**: 锁定版本号，使用 `npm i --save-exact @remotion/transitions@x.x.x`

**[Risk] spring() 动画性能可能不如 interpolate()**
→ **Mitigation**: 仅在需要弹性效果的地方使用 spring()，简单的 opacity 动画仍使用 interpolate()

**[Risk] Playwright CLI 截图环境不一致**
→ **Mitigation**: 在本地开发环境验证通过后再提交

## Open Questions

1. 转场时长是否需要在 Script Agent 中根据场景时长动态调整？
2. 是否需要支持自定义转场效果（自定义 presentation）？
