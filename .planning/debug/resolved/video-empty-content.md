---
status: resolved
trigger: "视频生成成功（11 scenes, 405s），但播放后只有几个标题，没有实际内容（截图、代码、文字等视觉层）"
created: 2026-03-27T00:00:00Z
updated: 2026-03-27T13:00:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED — file:// prefix in runScreenshotAndCompose caused copyFileSync to fail with ENOENT, so screenshots were never copied to public/ directory
test: Removed file:// prefix; build passes clean; commit c96dd5d applied
expecting: User confirms new video render shows actual screenshot content
next_action: User to re-run compose on real project to verify

## Symptoms

expected: 视频每个场景应该有：背景图/截图、覆盖的文字标题、代码动画等视觉元素
actual: 视频只显示几个标题文字，其余都是黑屏或空白背景
errors: 无报错，compose 命令成功完成 (11 scenes, 405s)
reproduction: video-script create → video-script compose → 视频内容为空
started: 首次成功生成视频，之前一直在修复 inputRange crash 问题

## Eliminated

- hypothesis: "Scene.tsx 渲染逻辑错误"
  evidence: Scene.tsx InlineScene 正确渲染 visualLayers，但 visualLayers 根本就是空的
  timestamp: 2026-03-27

- hypothesis: "图片路径错误（images map 映射错）"
  evidence: images map 完全是空的 {}，因为 scene.visualLayers 是空的，forEach 根本没执行
  timestamp: 2026-03-27

## Evidence

- timestamp: 2026-03-27
  checked: script.json 所有 11 个 scenes
  found: 所有 scenes 只有 highlights/codeHighlights 字段，没有任何 visualLayers 字段
  implication: adaptScriptForRenderer 的 fallback 路径 `scene.visualLayers` 也是 undefined

- timestamp: 2026-03-27
  checked: screenshots/ 目录内容
  found: 目录为空（仅有 . 和 ..），没有任何 .png 文件
  implication: 截图阶段的 agent 运行了但没有实际保存任何截图文件

- timestamp: 2026-03-27
  checked: screenshot agent 的 CLI 调用指令
  found: 指令写的是 'If type is "url", capture a webpage screenshot; if type is "text", generate a text image'
  implication: 但场景 type 都是 intro/feature/code/outro，agent 根本不知道要截哪些 URL

- timestamp: 2026-03-27
  checked: src/utils/scene-adapter.ts adaptScriptForRenderer()
  found: 当 visualPlan 为 undefined 时，visualMap 是空 Map，每个 scene 的 visualScene 是 undefined，所有 visualLayers 是空数组，最终 fallback 到 scene.visualLayers（也是 undefined）
  implication: 整条链路完全没有截图内容

- timestamp: 2026-03-27
  checked: compose 命令中的 images 构建逻辑 (line 855-869)
  found: images map 仅从 scene.visualLayers 中构建，当 visualLayers 为空时 images = {}
  implication: 传入 renderer 的 images 是空对象

- timestamp: 2026-03-27
  checked: 生成的 Root.tsx 文件
  found: 所有 scenes 都没有 visualLayers，没有 images prop
  implication: Remotion 渲染时每个 feature 场景只有黑色背景，code 场景只有空 CodeAnimation，intro/outro 场景只有标题

## Resolution

root_cause: |
三层问题叠加：

1. [主因] screenshot 阶段的 agent 指令错误：说"if type is url capture screenshot"，但场景 type 是 intro/feature/code/outro，没有 URL 信息，agent 不执行截图 → screenshots/ 目录为空
2. [次因] script.json 中的 scenes 没有 visualLayers 字段（ScriptAgent 不生成 visualLayers）
3. [次因] adaptScriptForRenderer() 在没有 visual.json 时，既不利用 screenshots 目录现有文件，也没有从 scene.sourceRef/highlights 等信息生成任何视觉内容
   结果：images map 为空，所有 visualLayers 为空 → 视频内容为空

fix: |
四项修复，全部在 src/cli/index.ts：

1. compose 命令 spawnRenderer 调用：从 adaptedScript.scenes 改为 finalScenes（已在上一轮部分完成）
2. compose 命令 finalScenes 注入逻辑（已存在）：从 screenshots/ 目录自动为无 visualLayers 的 scene 注入 bg screenshot layer
3. runScreenshotAndCompose 函数（helper）：
   - 修复 screenshot agent 指令：改为"对 feature/code 场景截图，从 research.json 提取真实 URL"
   - 添加 finalScenes2 自动注入块
   - spawnRenderer 改为使用 finalScenes2
4. resume 命令的 compose 阶段：
   - 修复 screenshot agent 指令（同上）
   - 添加 finalScenes3 自动注入块
   - spawnRenderer 改为使用 finalScenes3
5. screenshot 子命令：修复 agent 指令（同上，从 research.json 提取 URL）

verification: |

- npm run typecheck → 零错误（仅有预存在的 workspace 导出警告）
- npm run build → 零错误
- compose 命令重新跑测试项目（11 placeholder PNGs）→ 成功渲染 405s 视频
- 生成的 Root.tsx 验证：11 处 visualLayers、22 处 screenshot 引用、正确的截图文件路径
- fix/compose commit c96dd5d: 移除 file:// 前缀，copyFileSync 可正常复制截图到 public/ 目录

files_changed:

- src/cli/index.ts
