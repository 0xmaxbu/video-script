# Phase 18: 14-gap-03-bash - Research

**Researched:** 2026-03-28
**Domain:** Real CLI validation, artifact packaging, human video review handoff
**Confidence:** HIGH

<user_constraints>

## Locked Decisions

- **D-01:** 主题必须是项目自身能力，且锁定为 `Phase 14 Animation Engine`
- **D-02:** 输入形式必须是 `标题 + 真实链接`，不额外提供本地文档
- **D-03:** 必须覆盖两条真实 CLI 路径：`video-script create --no-review`，以及 `video-script create` 后再 `video-script resume`
- **D-04:** 交付物必须包含 `output.mp4`、`output.srt`、`script.json`、`research.json`、`screenshots/`、`quality-report.md`
- **D-05:** 人工审核以动画观感优先，重点看转场、节奏、Ken Burns、字幕动效是否真实进入最终视频
- **D-06:** 人工审核结论只能使用 `通过` / `可接受但需优化` / `不通过`

## Deferred / Out of Scope

- 不并入 `2026-03-27-integrate-tailwind-css-into-scene-layout-system.md`
- 不新增新的产品能力或替代 CLI 主链路；本阶段重点是验证与打包现有真实流程

</user_constraints>

## Summary

Phase 18 不需要新依赖，直接复用现有 `src/cli/index.ts`、质量评估 hooks、以及 `packages/renderer/src/puppeteer-renderer.ts` 即可完成真实 bash 驱动验证。最佳做法不是手工敲散乱命令，而是先锁定一份固定输入集与两个固定输出目录，然后通过预检脚本、产物打包脚本、以及审核模板把执行与人工审核都变成可重复流程。

研究确认了两个关键实现约束：

1. `video-script create --no-review` 会在一次命令中完成 `research → script → screenshot → compose`，并自动写入 `quality-report.md` 与 `output.srt`
2. `video-script resume` 依赖单一的 `.video-script/workflow-state.json`，因此 one-shot 与 pause/resume 两次真实运行必须串行执行，不能并行，否则 workflow state 会互相覆盖

另外，`create` / `resume` 两条路径当前没有对外暴露字幕开关，代码里 `showSubtitles` 默认是 `false`。这意味着 Phase 18 的人工审核必须显式记录“字幕动效是否出现在最终 MP4 中”，不能预先假定它一定存在；若缺失，应在审核结论中如实体现，而不是绕开真实 CLI 路径。

## Standard Stack

| Layer             | Reuse                                                                                              | Why                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| CLI orchestration | `src/cli/index.ts`                                                                                 | 已实现 `create`、`resume`、`compose` 与质量评估 hooks |
| Quality reporting | `src/utils/quality/run-script-quality-step.ts`, `src/utils/quality/run-screenshot-quality-step.ts` | 已保证 `quality-report.md` 非阻塞写入                 |
| Render path       | `packages/renderer/src/puppeteer-renderer.ts`                                                      | 已锁定为当前 monorepo 下真实可用的 MP4 渲染路径       |
| Output config     | `video-script.config.json`, `.env.example`, `src/utils/config.ts`                                  | 可在执行前检查 provider/key 是否齐备                  |

## Concrete Input Recommendation

使用固定标题：`Phase 14 Animation Engine`

使用固定精选链接（GitHub blob 链接，全部指向当前仓库真实材料，满足 D-01 / D-02 的“项目自身能力 + 真实链接”）：

1. `https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/.planning/phases/14-animation-engine/14-CONTEXT.md`
2. `https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/packages/renderer/src/remotion/Composition.tsx`
3. `https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/packages/renderer/src/remotion/components/ScreenshotLayer.tsx`
4. `https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/packages/renderer/src/remotion/components/KineticSubtitle.tsx`
5. `https://github.com/0xmaxbu/video-script/blob/48a82add83169057c9e04c93b343f775a580842f/.planning/phases/14-animation-engine/14-GAP-06-SUMMARY.md`

固定输出目录建议：

- `test-output/phase-18/one-shot`
- `test-output/phase-18/resume`

## Architecture Patterns

### Pattern 1: Deterministic output roots for reviewable runs

真实用户测试不应把产物散落到 `~/simple-videos/`。Phase 18 应显式传入 `--output`，把两次运行结果固定到 `test-output/phase-18/*`，这样后续脚本可以稳定检查 `research.json`、`script.json`、`screenshots/`、`quality-report.md`、`output.srt` 和最终视频文件。

### Pattern 2: Package after run, not during run

CLI 自身会写出研究、脚本、截图、质量报告与最终视频，但不会统一产出 `output.mp4` 这个标准名。因此 Phase 18 应在真实运行结束后增加“打包”步骤：验证必须文件存在、把渲染出的 `phase-14-animation-engine.mp4` 复制为 `output.mp4`、记录截图数量与 `ffprobe` 元数据，再交给人工审核。

### Pattern 3: Sequential workflow-state ownership

`resume` 依赖全局 workflow state 文件，因此 one-shot 与 pause/resume 两次验证必须严格串行：先完成 one-shot，再清理或覆盖 workflow state，最后执行 create/resume。不要把两条路径拆到并行 wave。

### Pattern 4: Review docs must record presence/absence, not assume success

Phase 18 是验证阶段，不是预设通过阶段。审核模板必须把“Ken Burns 是否可见”“转场是否真实出现”“字幕动效是否进入最终视频”写成待观察项，并允许记录缺失。

## Common Pitfalls

### Pitfall 1: 直接使用 `video-script resume`，但未确认 workflow state 指向本次输出目录

`resume` 不接受输出目录参数，只读取 `.video-script/workflow-state.json`。如果不先校验 state 中的 `outputDir`，就可能恢复错误的旧流程。

### Pitfall 2: 把 slugged MP4 当成最终交付名

渲染器默认按标题 slug 生成视频文件，而 D-04 要求审核包中存在 `output.mp4`。必须增加打包步骤来标准化文件名。

### Pitfall 3: 把 `quality-report.md` 误当作 gate

Phase 17 已锁定质量评估为 non-blocking。Phase 18 只能把 report 作为人工审核证据，不能因为 warning/error 就跳过产物打包或用户评审。

### Pitfall 4: 默认假设字幕动效已渲染进 MP4

当前 `create` / `resume` 主链路没有暴露 `showSubtitles` 开关。审核包必须明确记录最终 MP4 中字幕动效是否真实可见，而不是仅凭 `output.srt` 存在就判定成功。

## Verification Strategy

推荐执行与验证口径：

1. **预检** — `npm run build && npm run typecheck`，并检查 `video-script.config.json` 与所需 LLM key
2. **one-shot** — 运行 `node dist/cli/index.js create ... --no-review --output test-output/phase-18/one-shot`
3. **pause/resume** — 运行 `node dist/cli/index.js create ... --output test-output/phase-18/resume`，确认 state 为 `suspended`，再运行 `node dist/cli/index.js resume`
4. **打包** — 对每个输出目录执行产物检查、标准化 `output.mp4`、收集 `ffprobe` 与截图数量
5. **人审** — 按模板记录 `通过 / 可接受但需优化 / 不通过`

## Recommended Plan Split

| Plan  | Focus                                            | Why                                        |
| ----- | ------------------------------------------------ | ------------------------------------------ |
| 18-01 | 固定输入集、审核模板、预检/打包脚本              | 先锁定 deterministic context，减少执行歧义 |
| 18-02 | one-shot `create --no-review` 真跑 + 打包        | 独立验证一把跑通链路与完整工件             |
| 18-03 | `create` + `resume` 真跑 + 双运行审核 checkpoint | 验证暂停恢复链路并把两次运行交给用户判定   |

## Sources

- `src/cli/index.ts`
- `src/utils/quality/run-script-quality-step.ts`
- `src/utils/quality/run-screenshot-quality-step.ts`
- `src/utils/augment-screenshot-layers.ts`
- `packages/renderer/src/puppeteer-renderer.ts`
- `packages/renderer/src/remotion/Composition.tsx`
- `packages/renderer/src/remotion/components/ScreenshotLayer.tsx`
- `packages/renderer/src/remotion/components/KineticSubtitle.tsx`
- `.planning/phases/14-animation-engine/14-CONTEXT.md`
- `.planning/phases/14-animation-engine/14-GAP-03-CONTEXT.md`
- `.planning/phases/14-animation-engine/14-GAP-05-SUMMARY.md`
- `.planning/phases/14-animation-engine/14-GAP-06-SUMMARY.md`
- `.planning/phases/17-e2e-testing/17-CONTEXT.md`
- `.planning/phases/17-e2e-testing/17-SUMMARY.md`
