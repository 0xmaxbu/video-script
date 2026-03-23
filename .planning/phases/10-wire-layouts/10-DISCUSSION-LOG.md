# Phase 10: Wire Phase 2 Layouts into Composition — Discussion Log

**Date:** 2026-03-23
**Participants:** User + Claude (discuss-phase workflow)
**Language:** 中文

---

## 背景探索

**Claude 发现的关键架构问题：**

现有 `10-CONTEXT.md`（当天早些时候写的）的 D-02 说要向生成的 `package.json` 添加 `@video-script/renderer: workspace:*`——这是**无效的**，因为生成的项目在 monorepo 外独立目录运行 `npm install`，`workspace:*` 协议在这种情况下会失败。

通过扫描代码库，发现了更好的方案：`packages/renderer/src/remotion/Scene.tsx` **已经完全集成了**布局路由（Phase 7），包含 `getLayoutComponent()`、`convertToVisualScene()` 和 `InlineScene` 降级方案——它只需要被用作渲染入口点即可。

---

## 讨论问题 1：渲染策略

**问题：** Phase 10 应该如何集成布局？

**提供的三个选项：**

1. 修复生成路径（bundle packages/renderer 进生成项目）
2. **跳过生成，直接从 packages/renderer 渲染**（推荐）
3. 混合方案（生成时复制预构建文件）

**用户选择：** 选项 2 — 跳过生成，直接使用 packages/renderer

**理由：** packages/renderer 已经是完整的 Remotion 项目，有自己的 node_modules/@remotion/cli，无需额外 npm install，也不存在 workspace:\* 问题。

---

## 讨论问题 2：截图图片加载方式

**问题：** packages/renderer 中的布局组件如何接收截图数据？

**提供的三个选项：**

1. 文件路径（本地路径，Scene.tsx 用 `<Img src="file:///...">`）
2. **Base64 data URI via --props**（推荐）
3. HTTP 静态服务（本地临时 HTTP 服务器）

**用户选择：** 选项 2 — Base64 data URI

**理由：** Remotion 已有 `--props /path/to/props.json` 机制，Composition.tsx 已有 `images?: Record<string, string>` 接口，Scene.tsx 已有 `convertToVisualScene()` 做映射，layout 组件无需修改。

---

## 讨论问题 3：截图质量问题

**提问：** Phase 10 是否需要解决 ORB blocking（远程 URL 被浏览器拦截）和截图质量问题？

**用户决定：** 截图质量问题推迟到下一个 phase，Phase 10 只确保布局路由路径连通并正确渲染。

---

## 最终决策汇总

| 决策 | 内容                                              |
| ---- | ------------------------------------------------- |
| D-01 | 直接从 packages/renderer 目录运行 remotion render |
| D-02 | 废弃（workspace:\* 方案无效，被 D-01 替代）       |
| D-03 | 通过 `--props /tmp/xxx.json` 传递 props 文件      |
| D-04 | 截图以 base64 data URI 格式放入 images 字段       |
| D-05 | InlineScene 降级方案保持不变                      |
| D-06 | 截图质量问题推迟到下一 phase                      |

---

_Discussion completed: 2026-03-23_
