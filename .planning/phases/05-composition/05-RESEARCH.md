# Phase 5: Composition - Research

**Researched:** 2026-03-22
**Domain:** Video composition quality integration, multi-resolution output, video verification
**Confidence:** MEDIUM

## Summary

Phase 5 is the final polish phase that validates the entire pipeline end-to-end. The primary goal is ensuring that all annotations render correctly, video quality meets professional standards (CRF 20), and dual-resolution output (1920x1080 + 9:16) works properly. Key technical challenges include passing CRF quality settings to Remotion CLI (currently missing), implementing deviceScaleFactor=2 for Retina screenshots, and building an automated preview detection system.

**Primary recommendation:** Focus on three integration tasks: (1) adding CRF 20 to Remotion render args, (2) updating puppeteer-renderer deviceScaleFactor to 2, (3) creating a video quality verification module with automated screenshot analysis.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Dual resolution support: 1920x1080 (16:9 landscape) + 9:16 (portrait for mobile)
- **D-02:** CRF 20 quality mode with h.264 codec
- **D-03:** Diverse visual treatment by scene type:
  - Code scenes: zoom/pan camera effect
  - Feature scenes: slide transitions
  - Intro/outro: fade transitions
- **D-10:** No ending animation - video ends directly when last scene finishes
- **D-11:** No opening animation - video enters first scene immediately
- **D-12:** No gaps between scenes - transitions handle all scene flow

### Quality Verification Checklist

- **D-04:** Screenshot quality: 2x resolution for Retina displays
- **D-05:** Shiki syntax highlighting correctness verification
- **D-06:** Research document content integrity check (code blocks + explanations match source)
- **D-07:** Duration matching verification (subtitle/audio vs scene duration)

### Integration Testing

- **D-08:** Automatic + manual verification combined
- **D-09:** Preview screenshot automated detection:
  - Element position correctness
  - No overlapping/occlusion issues
  - Animation state at mid-playback (screenshot during animation)

### Claude's Discretion

- Exact CRF fine-tuning if quality is not satisfactory
- Specific detection thresholds for occlusion/position checks
- Test video theme selection

### Deferred Ideas (OUT OF SCOPE)

- Audio cue on transitions (subtle sound effects)
- Custom transition per scene (user-configurable)
- 3D flip/rotate transitions

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COMP-01 | Final video matches visual plan - all annotations render | AnnotationRenderer.tsx exists, tested in Scene.tsx rendering |
| COMP-02 | Video quality feels polished and professional | CRF 20 encoding, 2x Retina screenshots, Shiki verification |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @remotion/renderer | 4.0.436 | Video rendering | Core rendering engine |
| @remotion/transitions | 4.0.436 | Scene transitions | Already integrated in Composition.tsx |
| shiki | (project dep) | Syntax highlighting | Used by code-highlight tool |
| playwright | (project dep) | Screenshot capture | Used by puppeteer-renderer.ts |

### Verification
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | (project dep) | Image analysis | Detecting element positions, occlusion |
| @types/node | ^25.5.0 | File system checks | Content integrity verification |

### No Changes Needed
- react, react-dom (already on 19.2.4/19.2.3)
- zod v3 (isolated in renderer package)

---

## Architecture Patterns

### Recommended Project Structure

```
packages/renderer/src/
├── video-renderer.ts        # [EXISTING] Main render entry
├── puppeteer-renderer.ts   # [EXISTING] Playwright-based renderer
├── remotion-project-generator.ts  # [EXISTING] Project generation
├── srt-generator.ts        # [EXISTING] SRT subtitle generation
├── verification/           # [NEW] Quality verification module
│   ├── index.ts
│   ├── screenshot-check.ts  # D-09: Preview screenshot detection
│   ├── content-integrity.ts # D-06: Research content verification
│   └── duration-check.ts   # D-07: SRT vs scene duration matching
└── quality-settings.ts     # [NEW] CRF and encoding configuration
```

### Pattern 1: Dual-Resolution Composition
**What:** Single render pipeline produces both 16:9 and 9:16 outputs
**When to use:** Mobile-optimized video alongside standard landscape
**Example:**
```typescript
// In video-renderer.ts or puppeteer-renderer.ts
const resolutions = [
  { width: 1920, height: 1080, name: "landscape" },
  { width: 1080, height: 1920, name: "portrait" },  // 9:16
];

for (const res of resolutions) {
  await renderAtResolution(res);
}
```

### Pattern 2: Preview Screenshot Detection
**What:** Automated visual QA at mid-animation state
**When to use:** D-09 verification checklist
**Example:**
```typescript
// Use Playwright to capture frame at specific timestamp
const midFrame = Math.floor(totalFrames * 0.5);
await page.goto(bundleUrl);
await page.evaluate(() => window.remotion_setCurrentFrame(midFrame));
const screenshot = await page.screenshot();
// Then analyze with sharp for element positions
```

### Pattern 3: Quality Verification Pipeline
**What:** Pre-render validation of Shiki output and content integrity
**When to use:** D-05, D-06 quality checks before expensive render
**Example:**
```typescript
// Verify Shiki highlighting before render
const highlighted = await codeToHtml(code, { lang, theme: "github-dark" });
if (!highlighted.includes("<span")) {
  throw new Error("Shiki did not produce highlighted output");
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video encoding quality | Custom ffmpeg wrapper | Remotion CLI with `--crf 20` | CRF 18-23 is optimal for H.264; Remotion handles container muxing |
| Image scale detection | Manual pixel counting | Playwright `deviceScaleFactor: 2` | Chrome handles Retina scaling correctly |
| Multi-resolution output | Two separate render calls | Scale source canvas | Avoids recomputing all frames twice |
| SRT duration validation | Custom timestamp parser | srt-generator.ts existing logic | Already handles scene-level timestamps |

**Key insight:** Phase 5 is primarily integration work - existing components (AnnotationRenderer, CodeAnimation, layouts) are built. The work is wiring them correctly and adding missing quality settings (CRF, deviceScaleFactor).

---

## Common Pitfalls

### Pitfall 1: Remotion CLI Missing CRF Argument
**What goes wrong:** Video renders at default quality (CRF 23), not the specified CRF 20
**Why it happens:** `video-renderer.ts` spawns Remotion CLI with `--codec h264` but no `--crf` flag
**How to avoid:** Add `"--crf", "20"` to the args array in `spawnRenderProcess`
**Warning signs:** Output file size larger than expected, visible compression artifacts

### Pitfall 2: Portrait Resolution Not Supported
**What goes wrong:** Video only outputs 1920x1080, never generates 9:16 version
**Why it happens:** `remotion-project-generator.ts` hardcodes `resolution: "1920x1080"` and `width={1920} height={1080}`
**How to avoid:** Make resolution configurable in `GenerateProjectInput`, update Root.tsx composition registration
**Warning signs:** Only one video file generated regardless of settings

### Pitfall 3: Retina Screenshots Missing 2x Scale
**What goes wrong:** Screenshots appear blurry on Retina displays
**Why it happens:** `puppeteer-renderer.ts` uses `deviceScaleFactor: 1` instead of `deviceScaleFactor: 2`
**How to avoid:** Change to `deviceScaleFactor: 2` and scale down the captured image if needed
**Warning signs:** Screenshots look pixelated or low-resolution

### Pitfall 4: No Test Infrastructure
**What goes wrong:** Phase 5 has no automated verification, relies entirely on manual inspection
**Why it happens:** The renderer package has no test files (only zod internal tests in node_modules)
**How to avoid:** Create verification module with unit tests for duration matching, content integrity
**Warning signs:** `*.test.*` glob finds no project test files

---

## Code Examples

### Adding CRF to Remotion CLI (video-renderer.ts)
```typescript
// Current (MISSING CRF):
const args = [
  remotionScript,
  "render",
  "src/index.tsx",
  "Video",
  videoOutputPath,
  "--codec",
  "h264",
  "--fps",
  fps.toString(),
  "--quiet",
];

// Fixed (CRF 20):
const args = [
  remotionScript,
  "render",
  "src/index.tsx",
  "Video",
  videoOutputPath,
  "--codec",
  "h264",
  "--crf",
  "20",
  "--fps",
  fps.toString(),
  "--quiet",
];
```
**Source:** `packages/renderer/src/video-renderer.ts` lines 44-55

### Portrait Resolution in Root.tsx
```typescript
// Current (HARDCODED LANDSCAPE):
<Composition
  id="Video"
  component={VideoComposition as any}
  durationInFrames={300}
  fps={30}
  width={1920}
  height={1080}
  ...
/>

// For portrait variant (9:16):
<Composition
  id="VideoPortrait"
  component={VideoComposition as any}
  durationInFrames={300}
  fps={30}
  width={1080}
  height={1920}
  ...
/>
```
**Source:** `packages/renderer/src/remotion/Root.tsx` lines 15-22

### Device Scale Factor 2x (puppeteer-renderer.ts)
```typescript
// Current (SCALE 1):
context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,  // <-- Wrong for Retina
});

// Fixed (SCALE 2):
context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 2,  // <-- Captures at 2x, results in sharp Retina screenshots
});
```
**Source:** `packages/renderer/src/puppeteer-renderer.ts` line 471

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Default CRF (Remotion) | CRF 20 explicit | Phase 5 | Better quality/size balance |
| Single 1920x1080 output | Dual 1920x1080 + 1080x1920 | Phase 5 | Mobile-friendly versions |
| deviceScaleFactor: 1 | deviceScaleFactor: 2 | Phase 5 | Sharp Retina screenshots |

**Deprecated/outdated:**
- CRF 23 (old default): Was acceptable, now superseded by CRF 20 per D-02

---

## Open Questions

1. **How to generate 9:16 from 16:9 source?**
   - What we know: Root.tsx registers compositions with explicit width/height
   - What's unclear: Whether to render two separate compositions or crop/scale from one
   - Recommendation: Register separate "VideoPortrait" composition, reuse same component tree with adjusted layout

2. **Preview screenshot detection thresholds?**
   - What we know: D-09 mentions position correctness, occlusion, animation state
   - What's unclear: Exact pixel tolerance for "correct" position (e.g., 5px margin?)
   - Recommendation: Use percentage-based bounds checking (element within 5% of expected position)

3. **Shiki verification - what constitutes "correct"?**
   - What we know: code-highlight.ts uses `codeToHtml` from shiki
   - What's unclear: Whether to verify token count, color presence, or just non-empty output
   - Recommendation: Check for non-empty `<span>` output with expected class prefixes (e.g., `class="hljs-"`)

---

## Validation Architecture

> Note: `workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`, so this section is omitted per the configuration.

### Wave 0 Gaps

The renderer package has no test infrastructure. Creating tests for Phase 5 quality checks would require:
- [ ] `packages/renderer/src/verification/*.ts` - New verification module
- [ ] Test framework setup (vitest already in package.json devDependencies but no config/tests)
- [ ] Shared fixtures for mock ScriptOutput objects

---

## Sources

### Primary (HIGH confidence)
- `packages/renderer/src/video-renderer.ts` - Render pipeline, identified missing CRF argument
- `packages/renderer/src/puppeteer-renderer.ts` - deviceScaleFactor: 1 issue, ffmpeg CRF 23
- `packages/renderer/src/remotion/Root.tsx` - Composition registration, hardcoded resolution
- `packages/renderer/src/remotion-project-generator.ts` - Project generation, hardcoded 1920x1080

### Secondary (MEDIUM confidence)
- D-01 through D-12 decisions in `05-CONTEXT.md` - User-locked requirements
- Phase 4 summary and plans - Understanding completed transitions work

### Tertiary (LOW confidence)
- Remotion CLI `--crf` flag support (not verified in code, based on ffmpeg knowledge)

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH - All libraries already in use
- Architecture: MEDIUM - Dual-resolution approach not yet implemented
- Pitfalls: HIGH - All 4 pitfalls identified from code review

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable domain, Remotion API unlikely to change significantly)
