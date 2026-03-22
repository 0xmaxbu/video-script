# Phase 3: Research & Content - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 03-research-content
**Areas discussed:** Research depth + chunk structure, Narration style + scene structure, Research quality assurance, Video duration strategy, Code display

---

## Research Depth

| Option | Description | Selected |
|--------|-------------|----------|
| 单次深度研究 | 一次尽可能全面提取，不做多轮迭代 | ✓ |
| 多轮迭代研究 | 第一轮抓取，第二轮补充缺失 | |
| Claude 决定 | 信任 Claude 的判断 | |

**User's choice:** 单次深度研究
**Notes:** 当前 pipeline 测试显示 research agent 连真实内容都没能提取。核心问题是 Turndown + Readability 集成不稳定。多轮迭代的价值在内容提取本身就失败的情况下无法体现。

---

## Chunk Structure

| Option | Description | Selected |
|--------|-------------|----------|
| 保持现状（flat priority） | 概述 + 多个特性 + 建议，只有优先级 | |
| 层级化分块 | 增加问题/方案/代码/注意事项关系标签 | ✓ |
| Claude 决定 | 信任 Claude 的判断 | |

**User's choice:** 层级化分块
**Notes:** 关系标签：原因、对比、示例、注意事项。Research agent 输出带关系标记，script agent 能重建叙事逻辑。

---

## Narration Tone

| Option | Description | Selected |
|--------|-------------|----------|
| 教程友好 | 讲解型，像老师上课，适合学习 | ✓ |
| 技术吐槽 | 轻松调侃，承认痛点，有个性 | |
| Claude 决定 | 信任 Claude 的判断 | |

**User's choice:** 教程友好
**Notes:** 适合 tutorial 定位。

---

## Scene Distribution

| Option | Description | Selected |
|--------|-------------|----------|
| 内容驱动 + 默认值 | Agent 根据内容自动分配，用户可覆盖 | ✓ |
| 固定模板 | 简单模板，例如 1 intro + 3 feature + 1 outro | |
| Claude 决定 | 信任 Claude 的判断 | |

**User's choice:** 内容驱动 + 默认值
**Notes:** Agent 根据内容特性数量自动决定场景数，用户可通过 CLI flag 覆盖。

---

## Video Duration

**Discussion:** 内容准备固定 10-15 分钟。用户通过 CLI flag 设置。

**User's decision:**
- 固定 10-15 分钟，CLI 可配置
- 内容少了：增加示例展示
- 内容多了：压缩不重要的内容（supporting 级别）

---

## Code Display

**Clarification:** 代码图片保持完整，但视频里用镜头拉近/平移的方式依次展示。

**User's description:**
1. 镜头从远处显示全貌（代码太小看不清）
2. 拉近到关键代码段（清晰但看不到全部）
3. 快速移动到下一段关键代码

类似于"相机穿过代码"的浏览效果。

---

## Research Quality Assurance

**Input validation:**
- 组合验证：字数阈值（< 500 字可疑）+ 占位符检测 + HTML 结构验证
- Retry 3 次，仍失败则告知用户具体失败原因
- 无 fallback

**Output validation:**
- Zod Schema 验证：定义 ResearchOutput schema，验证 priority tags、source index 格式
- 独立 LLM 评估 Agent：专门执行 output quality 评估（内容深度、逻辑连贯性、幻觉检测）
- 不 blocking，记录质量分数

---

## Additional Topics Discussed

1. **多 topic 处理：** 分开处理，每个 topic 独立生成研究 + 脚本
2. **Research 失败处理：** Retry 3 次，告知失败原因，无 fallback
3. **来源引用展示：** Narration 里口头提就好

---

*Phase: 03-research-content*
*Discussion date: 2026-03-22*
