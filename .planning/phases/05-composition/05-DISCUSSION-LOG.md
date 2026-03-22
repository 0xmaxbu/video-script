# Phase 5: Composition - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 05-composition
**Areas discussed:** Output format, Quality verification, Integration testing, Professional polish details

---

## Output Format

| Option | Description | Selected |
|--------|-------------|----------|
| 1920x1080 | Standard full HD, suitable for most platforms | ✓ |
| 1280x720 | 720p, for mobile/low bandwidth | |
| 2560x1440 | 2K, higher quality but larger files | |

**User's choice:** 1920x1080, but also needs 9:16 portrait for mobile

**Notes:** User wants dual resolution support for mobile (vertical video).

---

## Codec

| Option | Description | Selected |
|--------|-------------|----------|
| h.264 | Best compatibility, larger files | ✓ |
| h.265 | Smaller files ~30-50%, some old devices may not support | |

**User's choice:** h.264 (simpler compatibility)

---

## Quality Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Medium (~8 Mbps) | Balanced | |
| High (~15-20 Mbps) | Best quality, larger files | |
| CRF (recommended) | Constant quality, consistent per-frame | ✓ |

**User's choice:** CRF 20 (recommended default)

---

## Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Diverse transitions | Code=zoom, Feature=slide, Intro/Outro=fade | ✓ |
| Unified style | Consistent animation rhythm throughout | |

**User's choice:** Diverse transitions for richer visual experience

---

## Quality Verification Checklist

**User selected ALL items to verify:**
- Screenshot quality (2x resolution for Retina)
- Shiki syntax highlighting correctness
- Research document content integrity
- Duration matching (subtitle/audio vs scene)

---

## Integration Testing Approach

**User wants:**
1. Automatic + manual combined verification
2. During preview in Playwright, automatically capture screenshots and detect:
   - Element position correctness
   - Overlap/occlusion issues
   - Animation state at mid-playback

---

## Opening & Ending

| Aspect | Options | Selected |
|--------|---------|----------|
| Opening | Direct entry, Brand intro, Fade in | Direct entry |
| Ending | Direct cut, Fade to black, Brand outro | Direct cut |
| Between scenes | No gaps (transitions handle), Brief gap, With sound | No gaps |

**User's choices:** All direct/no gaps — transitions handle everything

---

## Deferred Ideas

- Audio cue on transitions (subtle sound effects) — deferred for future
- Custom transition per scene — deferred for future
- 3D flip/rotate transitions — deferred for future

---

*Phase: 05-composition*
*Context gathered: 2026-03-22*
