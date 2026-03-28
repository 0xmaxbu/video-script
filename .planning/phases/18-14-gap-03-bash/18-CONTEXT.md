# Phase 18: 14-gap-03-bash - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

使用真实 bash 命令调用现有 `video-script` CLI，完成一次完整的视频生成模拟用户测试，产出最终视频与配套工件，由用户人工审核视频质量。该阶段验证真实主链路与最终成片质量，不新增产品能力。

</domain>

<decisions>
## Implementation Decisions

### 测试题材与输入材料

- **D-01:** 题材使用项目自身能力作为主题，不使用外部技术主题；本次具体主题锁定为 `Phase 14 Animation Engine`
- **D-02:** 输入材料采用 `标题 + 真实链接`，不额外提供本地文档；但输入应模拟高意图用户，链接需要是有目的且足以支撑完整讲解的精选材料

### 运行方式

- **D-03:** Phase 18 同时覆盖两条真实 CLI 路径：先执行一次 `video-script create --no-review` 的一把跑通流程，再执行一次 `video-script create` + `video-script resume` 的暂停恢复流程

### 审核交付物

- **D-04:** 人工审核不只看最终视频，必须交付完整产物包：`output.mp4`、`output.srt`、`script.json`、`research.json`、`screenshots/`、`quality-report.md`

### 人工审核重点与结论方式

- **D-05:** 人工审核时内容质量与动画表现两者都看，但以动画观感优先；重点关注转场、节奏、Ken Burns、字幕动效，以及这些效果是否真实出现在最终视频里
- **D-06:** 人工审核结论采用三级输出：`通过` / `可接受但需优化` / `不通过`

### the agent's Discretion

- 具体 bash 命令的组织方式、执行顺序中的细节编排、输出目录命名与人工审核时的结果汇总格式，可由后续 agent 自行决定
- 真实参考链接的最终筛选与数量，可由后续 research / planning 环节在不偏离主题的前提下自行确定

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 18 scope and carry-forward decisions

- `.planning/ROADMAP.md` — Phase 18 roadmap entry and scope anchor (`14-gap-03` bash simulation + full video generation + user review)
- `.planning/PROJECT.md` — locked architecture, especially the rule to use `packages/renderer/src/remotion/` directly and never render via simplified generated projects
- `.planning/STATE.md` — current project position, carry-forward decisions, and the fact that Phase 18 follows Phase 17 completion

### Prior phase context that constrains this phase

- `.planning/phases/14-animation-engine/14-CONTEXT.md` — canonical Phase 14 animation decisions, target quality bar, and renderer-side animation components/patterns
- `.planning/phases/14-animation-engine/14-GAP-03-CONTEXT.md` — original GAP-03 validation intent: real topic, full MP4 + SRT, and user-led quality review
- `.planning/phases/17-e2e-testing/17-CONTEXT.md` — non-blocking quality evaluation pattern, `quality-report.md` behavior, and project-root `test-output/` conventions established in the prior phase

### Real pipeline entry points

- `src/cli/index.ts` — actual `create`, `resume`, and compose flow; confirms `--no-review` behavior, pause/resume path, artifact generation, and quality hooks
- `src/utils/quality/run-script-quality-step.ts` — script quality evaluation integration point in the create flow
- `src/utils/quality/run-screenshot-quality-step.ts` — screenshot quality evaluation integration point in the screenshot/compose flow
- `src/utils/augment-screenshot-layers.ts` — screenshot layer augmentation before final render

### Final rendering path

- `packages/renderer/src/puppeteer-renderer.ts` — current locked render path for real video generation in the pnpm monorepo setup
- `packages/renderer/src/remotion/Composition.tsx` — scene transition implementation that should be visible in the final rendered output
- `packages/renderer/src/remotion/components/ScreenshotLayer.tsx` — screenshot animation layer including Ken Burns and enter/exit behavior
- `packages/renderer/src/remotion/components/KineticSubtitle.tsx` — animated subtitle behavior to verify in final output

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/cli/index.ts`: already exposes the exact user-facing paths this phase needs to exercise (`create`, `create --no-review`, `resume`)
- `src/cli/index.ts` `runScreenshotAndCompose(...)`: existing helper that covers the screenshot-to-compose path for one-shot execution
- `src/utils/quality/run-script-quality-step.ts` and `src/utils/quality/run-screenshot-quality-step.ts`: existing non-blocking quality hooks that automatically enrich the artifact bundle during runs
- `packages/renderer/src/puppeteer-renderer.ts`: existing real renderer path for final MP4 generation without depending on the broken Remotion webpack bundler path

### Established Patterns

- Real pipeline artifacts are already emitted into the chosen output directory (`research.json`, `research.md`, `script.json`, `screenshots/`, `output.srt`, rendered video)
- Quality evaluation is additive and non-blocking: failures warn and write report state, but do not abort the main video generation flow
- Renderer architecture is props-driven and must flow into the existing `packages/renderer/src/remotion/` components rather than any generated simplified Remotion project

### Integration Points

- Bash-driven validation should enter only through the public CLI commands, not by calling internal helpers directly
- The paused workflow state created by `video-script create` is the handoff point for validating the separate `video-script resume` path
- Human review happens against the generated artifact set inside the chosen output directory after each real run completes

</code_context>

<specifics>
## Specific Ideas

- 本次模拟用户测试不是在补功能，而是在验证真实用户通过 bash 调用项目时，Phase 14 的动画能力是否真的落到了最终成片里
- 题材锁定为动画引擎本身，目的是让审核者更容易观察 Ken Burns、转场、节奏和字幕动效是否兑现
- 审核时要保留完整工件包，而不是只给一个 MP4，因为脚本、研究结果、截图与质量报告都是人工定位问题的重要证据
- 审核结论不做 Claude 预判，仍然由用户看完视频后给出最终三级判断

</specifics>

<deferred>
## Deferred Ideas

### Reviewed Todos (not folded)

- `2026-03-27-integrate-tailwind-css-into-scene-layout-system.md` — 已审阅但不并入 Phase 18。原因：该事项属于布局系统能力扩展，不属于“用真实 bash 路径生成完整视频并做人审”的当前阶段边界

None beyond the reviewed todo above.

</deferred>

---

_Phase: 18-14-gap-03-bash_
_Context gathered: 2026-03-28_
