# Phase 18: 14-gap-03-bash - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 18-14-gap-03-bash
**Areas discussed:** 测试题材与输入材料, 运行方式, 审核交付物, 人工审核重点, todo 并入范围

---

## 测试题材与输入材料

| Option               | Description                                                            | Selected |
| -------------------- | ---------------------------------------------------------------------- | -------- |
| 项目自身能力         | 用项目自身能力做题材，比如动画引擎 / Remotion 动效 / Phase 14 相关内容 | ✓        |
| 外部真实技术主题     | 用外部真实技术主题，比如框架新特性或工具教程                           |          |
| 外部主题但偏视觉展示 | 选更适合截图和动画展示的外部技术主题                                   |          |

**User's choice:** 项目自身能力
**Notes:** 用户进一步锁定具体主题为 `Phase 14 Animation Engine`。

| Option                 | Description            | Selected |
| ---------------------- | ---------------------- | -------- |
| 标题 + 链接            | 只提供标题和真实链接   | ✓        |
| 标题 + 本地文档        | 只提供标题和本地文档   |          |
| 标题 + 链接 + 本地文档 | 同时提供链接和本地文档 |          |

**User's choice:** 标题 + 链接
**Notes:** 用户同时选择高意图用户画像，因此虽然没有本地文档，输入仍应是认真准备过的精选链接，而不是随意喂料。

| Option                      | Description                      | Selected |
| --------------------------- | -------------------------------- | -------- |
| `Phase 14 Animation Engine` | 直接围绕 Phase 14 动画引擎做主题 | ✓        |
| `TypeScript 5.4 新特性`     | 用外部技术内容做主题             |          |
| 自定义主题                  | 用户自由指定其他主题             |          |

**User's choice:** `Phase 14 Animation Engine`
**Notes:** 该主题最利于人工核验动画效果是否真实落地。

| Option     | Description                | Selected |
| ---------- | -------------------------- | -------- |
| 最普通用户 | 只给标题，材料很少         |          |
| 稍认真用户 | 标题 + 若干链接            |          |
| 高意图用户 | 输入更有目的性，材料更认真 | ✓        |

**User's choice:** 高意图用户
**Notes:** 即使最终输入形式是标题 + 链接，也要模拟认真准备材料的真实用户，而不是最低可用输入。

---

## 运行方式

| Option   | Description                             | Selected |
| -------- | --------------------------------------- | -------- |
| 一把跑完 | 直接 `create --no-review`，完整走到出片 |          |
| 分两段跑 | 先 `create`，再 `resume`                |          |
| 两种都跑 | 一把跑完 + 暂停恢复链路都验证           | ✓        |

**User's choice:** 两种都跑
**Notes:** 既要验证完整直通链路，也要验证暂停/恢复链路。

---

## 审核交付物

| Option     | Description                                                                                          | Selected |
| ---------- | ---------------------------------------------------------------------------------------------------- | -------- |
| 只看 MP4   | 只审核最终视频文件                                                                                   |          |
| MP4 + SRT  | 视频加字幕文件                                                                                       |          |
| 完整产物包 | `output.mp4` / `output.srt` / `script.json` / `research.json` / `screenshots/` / `quality-report.md` | ✓        |

**User's choice:** 完整产物包
**Notes:** 人工审核要能追溯脚本、截图和质量报告，不只盯最终成片。

---

## 人工审核重点

| Option             | Description                          | Selected |
| ------------------ | ------------------------------------ | -------- |
| 动画优先           | 主要看动画观感                       |          |
| 内容优先           | 主要看讲解和结构                     |          |
| 两者都看但动画优先 | 同时审查内容与动效，但优先盯动画质量 | ✓        |

**User's choice:** 两者都看但动画优先
**Notes:** 重点看转场、节奏、Ken Burns、字幕动效，以及这些能力是否真的体现在最终视频里。

| Option          | Description                          | Selected |
| --------------- | ------------------------------------ | -------- |
| 简单通过/不通过 | 一句结论 + 简短意见                  |          |
| 问题清单        | 列出缺陷列表                         |          |
| 三级结论        | `通过` / `可接受但需优化` / `不通过` | ✓        |

**User's choice:** 三级结论
**Notes:** 该结论格式更适合后续决定是推进下一阶段还是回头继续打磨。

---

## todo 并入范围

| Option | Description                              | Selected |
| ------ | ---------------------------------------- | -------- |
| 不并入 | 保持 Tailwind 布局系统事项在当前阶段之外 | ✓        |
| 并入   | 将该 todo 折叠进 Phase 18 范围           |          |

**User's choice:** 不并入
**Notes:** `2026-03-27-integrate-tailwind-css-into-scene-layout-system.md` 与当前 bash 模拟用户测试边界不一致，保留为已审阅但 deferred 的事项。

---

## the agent's Discretion

- 真实链接的最终筛选数量与命令组织细节由后续 planning / execution 决定
- 人工审核结果的汇总呈现格式由后续 agent 决定

## Deferred Ideas

- `2026-03-27-integrate-tailwind-css-into-scene-layout-system.md` — reviewed but not folded into Phase 18 scope
