# Phase 3: Research & Content - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Deep content extraction from reference links and engaging narration scripts for technical tutorial videos. Research agent performs content extraction, a dedicated quality agent validates output, and script agent generates narration with scene segmentation. This phase does NOT include visual design, animation, or video rendering.

</domain>

<decisions>
## Implementation Decisions

### Research Depth & Structure
- **D-01:** 单次深度研究（不做多轮迭代）
  - 原因：当前 pipeline 测试显示 research agent 连真实内容都没能提取（链接解析到 placeholder）。核心问题是 Turndown + Readability 集成不稳定。先把单次深度做稳，v2 再考虑多轮迭代。
- **D-02:** 层级化分块，关系标签
  - 增加关系标签：原因、对比、示例、注意事项
  - Research agent 输出带关系标记，script agent 能重建叙事逻辑

### Narration Style & Scene Structure
- **D-03:** Narration tone = 教程友好
  - 讲解型，像老师上课。适合 tutorial 定位。
- **D-04:** Scene distribution = 内容驱动 + 默认值
  - Agent 根据内容特性数量自动分配场景数，用户可通过 CLI flag 覆盖
  - 场景类型：intro, feature, code, outro

### Video Duration Strategy
- **D-05:** 视频时长 = 固定 10-15 分钟，CLI 可配置
  - 用户通过 `--duration` flag 设置目标时长
- **D-06:** 内容弹性处理
  - 内容少了：增加示例展示
  - 内容多了：压缩不重要的内容（supporting 级别）

### Code Scene Display
- **D-07:** 代码展示 = 镜头拉近/平移效果
  - 代码图片保持完整，但视频里用镜头方式依次展示
  - 镜头从远处显示全貌（代码太小看不清）→ 拉近到关键代码段（清晰但看不到全部）→ 快速移动到下一段关键代码
  - 类似于"相机穿过代码"的浏览效果

### Multi-Topic Handling
- **D-08:** 多 topic 分开处理
  - 每个 topic 独立生成研究 + 脚本
  - 用户传多个链接/ topics 时，自动拆分

### Research Failure Handling
- **D-09:** Research 失败处理
  - Retry 3 次，仍失败则告知用户具体失败原因
  - 无 fallback 到 prompt engineering

### Quality Assurance
- **D-10:** Input 层验证（web fetch 后）
  - 组合验证方案：
    - 字数阈值：< 500 字 = 可疑
    - 占位符检测：发现 `placeholder`、`example.com` = 失败
    - HTML 结构验证：检查是否包含 `<p>`、`<code>` 等关键标签
  - 任一检测失败 → retry 3 次 → 都失败则报告具体失败原因
- **D-11:** Output 层验证
  - **Zod Schema 验证**：定义 ResearchOutput schema，解析时验证 priority tags、source index 格式
  - **独立 LLM 评估 Agent**：专门执行 output quality 评估
    - 评估维度：内容深度、逻辑连贯性、幻觉检测
    - 不 blocking，但记录质量分数
    - 最低质量分数时警告用户

### Claude's Discretion
- 具体的镜头运动速度和时间曲线细节
- Zod schema 的具体字段定义
- LLM 评估 Agent 的具体 prompt 模板
- 示例增加的策略（具体增加哪些类型的示例）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Agent Implementations
- `src/mastra/agents/research-agent.ts` — Research Agent 当前实现（需要修改）
- `src/mastra/agents/script-agent.ts` — Script Agent 当前实现（需要修改）

### Research Pipeline
- `src/mastra/tools/web-fetch.ts` — Web fetch 工具
- `.planning/STATE.md` — Pipeline 测试发现：research agent 链接解析到 placeholder

### Type Definitions
- `src/types/` — Zod schemas for research、script validation（需新增 quality schema）

### Phase 2 Context
- `.planning/phases/02-layout-system/02-CONTEXT.md` — 布局系统决策（视觉层与内容层分离）
- `packages/renderer/src/remotion/layouts/` — 所有布局组件（script agent 输出的 scene 会被这些消费）

### Design References
- `.planning/PROJECT.md` — PPT layout 参考，VIS-01 到 VIS-10 需求

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `webFetchTool` — 已有 web fetch 工具，集成在 research agent
- `parseResearchMarkdown()` — 已有 markdown 解析函数
- `filterEssentialContent()` — 已有 essential content 过滤函数
- `estimateNarrationDuration()` — 已有时长估算函数
- `segmentNarration()` — 已有口播分段函数
- Zod v4 — 项目已使用，可用于 schema 验证

### Established Patterns
- Mastra Agent 框架 — 新增评估 agent 应遵循相同模式
- Agent instructions — 包含详细的 output format 规范
- Scene types: intro、feature、code、outro — script agent 已定义

### Integration Points
- Research → Script：research markdown → script JSON
- Script → Visual Agent：scene 列表 + highlights → layout descriptions
- Quality Agent：独立评估，输出 quality score，不 blocking 主流程

</code_context>

<deferred>
## Deferred Ideas

### Research & Content (v2)
- 多轮迭代研究 + gap analysis + follow-up（当前单次深度做稳后再规划）
- 用户可配置的示例增加策略

### 未来考虑
- 多语言 narration 支持（当前只支持中文）
- 不同平台的时长预设（B站 vs Twitter vs YouTube Shorts）

</deferred>

---

*Phase: 03-research-content*
*Context gathered: 2026-03-22*
