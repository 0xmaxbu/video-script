# Phase 14: Animation Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 14-animation-engine
**Areas discussed:** Animation Architecture, Ken Burns + Parallax, Scene Transitions, Kinetic Typography

---

## Area 1: Animation Architecture

| Option       | Description                                                             | Selected |
| ------------ | ----------------------------------------------------------------------- | -------- |
| 集中化       | Create animation-utils.ts, all components call unified functions        | ✓        |
| 分散但标准化 | Each component writes own animations but shares spring preset constants |          |
| 混合         | Layer components use utils, layouts keep own style                      |          |

**User's choice:** 集中化

| Option           | Description                                         | Selected |
| ---------------- | --------------------------------------------------- | -------- |
| 扩展 Schema      | Add duration, easing, staggerDelay fields           |          |
| 保持现有         | 4 fields sufficient, enter type determines behavior | ✓        |
| Agent discretion | Agent auto-selects based on enter type              |          |

**User's choice:** Agent decides → 保持现有字段

| Option | Description                                                  | Selected |
| ------ | ------------------------------------------------------------ | -------- |
| 是     | Layouts read scene.animation.enter + enterDelay              |          |
| 否     | Layouts keep own animations, Schema only for layers          |          |
| 部分   | Layouts read enter type + enterDelay, spring params internal | ✓        |

**User's choice:** Agent decides → 部分消费

| Option         | Description                                                    | Selected |
| -------------- | -------------------------------------------------------------- | -------- |
| 整合到动画系统 | Extract TypewriterText + HighlightBox logic, delete Transition | ✓        |
| 清理掉         | Delete all unused components                                   |          |
| Agent decides  |                                                                |          |

**User's choice:** Agent decides → 整合有用，删除无用

---

## Area 2: Ken Burns + Parallax

| Option             | Description                                               | Selected |
| ------------------ | --------------------------------------------------------- | -------- |
| 仅 screenshot 类型 | Ken Burns only for screenshot visualLayers                | ✓        |
| 整个场景背景       | Apply to full scene background (template-prompt-to-video) |          |
| Agent 可配置       | New kenBurns enter type in AnimationConfigSchema          |          |

**User's choice:** 仅用于 screenshot 类型的 visualLayer

| Option     | Description                                | Selected |
| ---------- | ------------------------------------------ | -------- |
| 自动交替   | Odd scenes zoom-in, even zoom-out          |          |
| Agent 配置 | New zoomDirection field                    |          |
| 按场景类型 | intro=zoom-in, feature=zoom-out, code=none | ✓        |

**User's choice:** 根据场景类型自动选择

| Option                   | Description                                    | Selected |
| ------------------------ | ---------------------------------------------- | -------- |
| 基于 zIndex              | Higher zIndex moves faster, lower moves slower | ✓        |
| 新增 parallaxFactor 字段 | parallaxFactor 0-1 in VisualLayer.position     |          |
| 固定 0.3x                | Only screenshot type, fixed speed              |          |
| 不实现                   | Skip parallax                                  |          |

**User's choice:** 基于 position.zIndex — zIndex 高的元素移动快，低的移动慢

| Option     | Description                        | Selected |
| ---------- | ---------------------------------- | -------- |
| 共存       | Ken Burns + parallax combined      |          |
| 互斥       | Disable parallax during Ken Burns  |          |
| 按场景类型 | intro=both, feature=Ken Burns only | ✓        |

**User's choice:** 根据场景类型自动选择

---

## Area 3: Scene Transitions

| Option        | Description                                          | Selected |
| ------------- | ---------------------------------------------------- | -------- |
| 补全          | Add flip, clockWise, iris from @remotion/transitions | ✓        |
| 不补全        | 3 types sufficient for AI Jason style                |          |
| Agent decides |                                                      |          |

**User's choice:** Agent decides → 补全

| Option        | Description                                           | Selected |
| ------------- | ----------------------------------------------------- | -------- |
| 是            | CSS filter blur transition (template-prompt-to-video) | ✓        |
| 否            | May conflict with Ken Burns                           |          |
| Agent decides |                                                       |          |

**User's choice:** Agent decides → 是

| Option             | Description                            | Selected |
| ------------------ | -------------------------------------- | -------- |
| 固定时长           | Keep current 30/45 frames              | ✓        |
| Agent 可配置       | New duration field in scene.transition |          |
| 按场景类型自动调整 | Already implemented                    |          |

**User's choice:** Agent decides → 固定

| Option            | Description                            | Selected |
| ----------------- | -------------------------------------- | -------- |
| 保持 linearTiming | Simple and reliable                    | ✓        |
| 新增 easing 选项  | linear, ease-in, ease-out, ease-in-out |          |
| Agent decides     |                                        |          |

**User's choice:** Agent decides → 保持 linearTiming

---

## Area 4: Kinetic Typography

| Option        | Description                                       | Selected |
| ------------- | ------------------------------------------------- | -------- |
| 逐词高亮      | Per-word active highlighting with TTS timestamps  | ✓        |
| 短语揭示      | segmentTranscript() grouping, 2-3 words per group |          |
| Agent decides |                                                   |          |

**User's choice:** Agent decides → 逐词高亮

| Option              | Description                            | Selected |
| ------------------- | -------------------------------------- | -------- |
| 全局启用            | All scene types use kinetic subtitles  | ✓        |
| 仅 code 场景        | Typewriter for code only               |          |
| feature/intro/outro | Per-word highlight for non-code scenes |          |

**User's choice:** Agent decides → 全局启用

| Option        | Description                                         | Selected |
| ------------- | --------------------------------------------------- | -------- |
| 是            | ElevenLabs character timestamps for word-level sync | ✓        |
| 否            | Static SRT only                                     |          |
| Agent decides |                                                     |          |

**User's choice:** Agent decides → 是

| Option        | Description                                         | Selected |
| ------------- | --------------------------------------------------- | -------- |
| AI Jason 风格 | Dark bg, white text, yellow rounded-rect highlights | ✓        |
| 当前风格      | Bottom subtitle bar, white text                     |          |
| Agent decides |                                                     |          |

**User's choice:** Agent decides → AI Jason 风格

---

## Agent's Discretion

Areas where user delegated decisions to the agent:

- AnimationConfigSchema expansion (decided: keep existing)
- Layout consumption pattern (decided: partial)
- Transitions.tsx cleanup (decided: integrate useful, delete unused)
- Ken Burns zoom range
- Parallax speed multipliers
- Transition type completion (decided: add all)
- Blur transition (decided: yes)
- Transition duration (decided: fixed)
- Easing curves (decided: linearTiming)
- Kinetic subtitle sync method (decided: per-word)
- Kinetic subtitle scope (decided: global)
- TTS timestamps (decided: yes)
- Subtitle style (decided: AI Jason)

## Deferred Ideas

- @remotion/motion-blur — v2.0
- Custom easing curves beyond spring
- EffectSchema alignment with new system
- Audio-synced animations — Phase 15+
- Particle/shape decorative elements — v2.0
