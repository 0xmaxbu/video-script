---
created: 2026-03-27T09:00:25.487Z
title: Integrate Skills into Mastra Agents
area: general
files:
  - src/mastra/agents/script-agent.ts
  - src/mastra/agents/visual-agent.ts
  - src/mastra/agents/research-agent.ts
  - src/mastra/agents/compose-agent.ts
  - src/mastra/agents/screenshot-agent.ts
---

## Problem

Phase 15 requirement: Skills (e.g. `ui-ux-pro-max`, `remotion-best-practices`) should be loaded and injected into Mastra Agent instructions so agents can leverage curated skill content at runtime.

Currently all agents use static hardcoded `instructions` strings. No skill loading mechanism exists. The agents don't reference `.agents/skills/` or `.opencode/skills/` content.

## Solution

1. Read skill SKILL.md files at agent initialization time from `.agents/skills/<name>/SKILL.md`
2. Inject relevant skill content into each agent's `instructions` string
3. Relevant skills per agent:
   - `script-agent`: `remotion-best-practices`, `content-engine`
   - `visual-agent`: `ui-ux-pro-max`, `remotion-best-practices`
   - `research-agent`: `deep-research`
   - `compose-agent`: `remotion-best-practices`
4. Consider a `loadSkill(name)` utility in `src/mastra/utils/` that reads and returns skill content
5. Skills can be concatenated after the base instructions string

TBD: Whether to load all relevant skills eagerly or implement lazy/conditional loading.
