---
status: investigating
trigger: "compose-render-failures: video-script compose 命令运行后报错，视频无法生成"
created: 2026-03-27T00:00:00Z
updated: 2026-03-27T03:00:00Z
---

## Current Focus

<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED ROOT CAUSE — CodeAnimation.tsx 以空字符串 code="" 调用时，totalChars=0，导致 interpolate(frame, [0, 0*1], [0, 0]) → inputRange [0,0] 崩溃
test: 已通过代码追踪验证：scene type=code 无 visualLayers → codeContent="" → totalChars=0 → speed=1 → [0, totalChars*speed] = [0, 0]
expecting: 修复方案：在 CodeAnimation 中当 code 为空时提前 return，或在 Scene.tsx 中当 code 为空时不渲染 CodeAnimation
next_action: ROOT CAUSE FOUND — 等待修复指令

## Symptoms

<!-- Written during gathering, then IMMUTABLE -->

expected: video-script compose <dir> 成功生成 MP4 视频
actual: 失败，报两个错误（按顺序出现）：

1. 首次运行：Cannot find module 'react' — 生成的 Remotion 项目 node_modules 中没有 react
2. 手动安装 react 后再次运行：inputRange must be strictly monotonically increasing but got [0,0]
   errors: |
   ❌ Error: inputRange must be strictly monotonically increasing but got [0,0]
   at Command.<anonymous> (file:///Volumes/SN350-1T/dev/video-script/dist/cli/index.js:697:19)
   reproduction:
3. video-script create "Tailwind CSS v4 New Features" — research + script + screenshot 全成功
4. video-script compose ~/simple-videos/2026/13-3_23-3_29/tailwind-css-v4-new-features — 报错
   started: 首次跑完整流程，之前从未成功过

## Eliminated

<!-- APPEND only - prevents re-investigating -->

- hypothesis: Cannot find module 'react' is the primary issue
  evidence: project-generator.ts dependencies 中没有 react，但已发现为次要问题，主要问题是 inputRange [0,0]
  timestamp: 2026-03-27T00:00:00Z

- hypothesis: scene.duration = 0 导致 Composition.tsx 中 durationInFrames = 0
  evidence: 生成的 Root.tsx 显示所有 11 个 scene 的 duration 均为正数（20/55/40/45/35/50/35/45/30/25/25）
  timestamp: 2026-03-27T01:00:00Z

- hypothesis: animation-utils.ts useKenBurns/useParallax 中 interpolate([0, durationInFrames]) 是触发点
  evidence: ScreenshotLayer 仅在有 screenshot/diagram/image 类型的 visualLayer 时渲染；本次测试用例所有 scene 的 visualLayers=0，ScreenshotLayer 从未渲染
  timestamp: 2026-03-27T02:00:00Z

- hypothesis: layout 组件中的 interpolate 调用是触发点
  evidence: 所有 layout 组件只用 interpolate(springProgress, [0, 1], ...) 形式，不用 [0, durationInFrames]；且 layoutTemplate=undefined 时走 InlineScene 路径，不进入 layout 组件
  timestamp: 2026-03-27T02:30:00Z

## Evidence

<!-- APPEND only - facts discovered -->

- timestamp: 2026-03-27T00:00:00Z
  checked: pre-investigation key findings
  found: |
  - 生成的项目目录：~/simple-videos/2026/13-3_23-3_29/tailwind-css-v4-new-features
  - project-generator.ts 的 package.json dependencies 中没有 react
  - @remotion/transitions 在运行时 require('react') 导致 Module Not Found
  - script.json 中 totalDuration: 360，但 scenes 时长之和是 405（不一致）
  - scene-7 的 narration 是双重 JSON 编码
  - Composition.tsx 中：TransitionSeries 用 Math.ceil(scene.duration \* fps) 计算每个 scene 的 durationInFrames
  - inputRange [0,0] 错误来自 Remotion 动画框架（interpolate 函数），说明某个 scene 的 durationInFrames 为 0
    implication: durationInFrames 为 0 → scene.duration 为 0 或 undefined

- timestamp: 2026-03-27T01:00:00Z
  checked: 生成的 Root.tsx 各 scene duration
  found: 所有 11 个 scene duration 均为正数，durationInFrames=12150 正确
  implication: Composition.tsx 层面的 durationInFrames 不是 0，问题在组件内部

- timestamp: 2026-03-27T02:00:00Z
  checked: layout 组件（10个）和 component 文件中的 interpolate 调用
  found: layout 组件只用 interpolate(spring_progress, [0,1], ...) 安全形式；components 中 animation-utils.ts 用 [0, durationInFrames]，但 ScreenshotLayer 需要有 screenshot/diagram/image 类型 visualLayer 才渲染
  implication: 所有 scene visualLayers=0 → ScreenshotLayer 不渲染 → animation-utils.ts 不被调用

- timestamp: 2026-03-27T03:00:00Z
  checked: CodeAnimation.tsx line 110 和 Scene.tsx code 场景路径
  found: |
  Scene.tsx line 219-256: type="code" 场景无条件渲染 <CodeAnimation code={codeContent} />
  Scene.tsx line 122-123: codeContent = visualLayers?.find(l=>l.type==="code")?.content || ""
  当 visualLayers 为空时 codeContent = "" → code=""
  CodeAnimation.tsx line 63: totalChars = code.length = 0
  CodeAnimation.tsx line 66-69: sceneFrames=durationInFrames, speed=calculateTypewriterSpeed(0, sceneFrames)=max(1,ceil(0/effectiveFrames))=1
  CodeAnimation.tsx line 110: interpolate(frame, [0, totalChars*speed], [0, totalChars])
  = interpolate(frame, [0, 0*1], [0, 0])
  = interpolate(frame, [0, 0], [0, 0])
  → inputRange [0, 0] → CRASH
  implication: ROOT CAUSE CONFIRMED。测试用例中 scene-3(code) 和 scene-8(code) 均无 visualLayers，
  两者都会触发此 bug。只要有 type=code 的场景且没有包含代码内容的 visualLayer，就必然崩溃。

## Resolution

<!-- OVERWRITE as understanding evolves -->

root_cause: |
CodeAnimation.tsx line 110 中：当 code="" 时，totalChars=0，导致
interpolate(frame, [0, 0], [0, 0]) → inputRange 严格单调递增条件不满足 → Remotion 抛出
"inputRange must be strictly monotonically increasing but got [0,0]"

触发路径：

1. script.json 中 type=code 的 scene（scene-3, scene-8）没有 visualLayers
2. adaptScriptForRenderer 不修改 visualLayers（无 visual.json）
3. Scene.tsx → InlineScene → type=code 分支无条件调用 <CodeAnimation code="" />
4. CodeAnimation：totalChars=0 → interpolate(frame, [0, 0*1], ...) → CRASH

fix: |
方案A（推荐）：在 CodeAnimation.tsx 中，当 code 为空时提前 return：
if (!code || code.trim() === "") return <AbsoluteFill style={containerStyle}><div>No code content</div></AbsoluteFill>;

方案B：在 Scene.tsx 的 type=code 分支，只在 codeContent 非空时渲染 CodeAnimation：
if (codeContent) { <CodeAnimation code={codeContent} /> } else { <PlaceholderCodeView title={title} /> }

方案C（根本修复）：在 CodeAnimation.tsx line 110，当 totalChars=0 时跳过 interpolate：
const charsRevealed = totalChars === 0 ? 0 : Math.floor(interpolate(frame, [0, totalChars * speed], ...));

verification: [empty until verified]
files_changed: []
