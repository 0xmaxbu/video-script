---
phase: 14-animation-engine
plan: GAP-06
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/renderer/src/utils/animation-utils.ts
  - packages/renderer/src/remotion/components/KineticSubtitle.tsx
  - tests/e2e/video-playback-test/script.json
  - tests/e2e/video-playback-test/screenshots/scene-002-hero-screenshot.png
autonomous: true
gap_closure: true
requirements: [ANIM-01, ANIM-03, ANIM-04, ANIM-05, ANIM-06]

must_haves:
  truths:
    - "ENTER_ANIMATION_CONFIG is exported from animation-utils.ts"
    - "KineticSubtitle words render with visible spaces in rendered video output"
    - "Test fixture script.json has a screenshot-type visualLayer in scene-2"
    - "Test fixture script.json has text-type visualLayers in the outro scene"
    - "screenshots/ directory contains a real PNG file matching the screenshot layer"
  artifacts:
    - path: "packages/renderer/src/utils/animation-utils.ts"
      provides: "ENTER_ANIMATION_CONFIG with export keyword on the const declaration"
      contains: "export const ENTER_ANIMATION_CONFIG"
    - path: "packages/renderer/src/remotion/components/KineticSubtitle.tsx"
      provides: "word spans with marginRight instead of gap on container"
      contains: "marginRight"
    - path: "tests/e2e/video-playback-test/script.json"
      provides: "fixture with screenshot layer and bullet text layers"
      contains: "screenshot"
    - path: "tests/e2e/video-playback-test/screenshots/scene-002-hero-screenshot.png"
      provides: "real PNG image for screenshot layer rendering"
  key_links:
    - from: "packages/renderer/src/utils/animation-utils.ts"
      to: "ENTER_ANIMATION_CONFIG"
      via: "export const keyword"
      pattern: "export const ENTER_ANIMATION_CONFIG"
    - from: "KineticSubtitle.tsx"
      to: "word span style"
      via: "marginRight on each word span"
      pattern: "marginRight"
    - from: "tests/e2e/video-playback-test/script.json"
      to: "ScreenshotLayer + BulletList"
      via: "screenshot type visualLayer + text type visualLayers in outro"
      pattern: '"type": "screenshot"'
---

<objective>
Close the 4 remaining verification gaps for Phase 14 Animation Engine:

1. Export `ENTER_ANIMATION_CONFIG` from animation-utils.ts (missing `export` keyword — ANIM-01 partial)
2. Fix KineticSubtitle word spacing (gap CSS produces concatenated text in Playwright headless — ANIM-06 partial)
3. Add screenshot-type visualLayer to test fixture (Ken Burns + parallax unverifiable without it — ANIM-03, ANIM-04)
4. Add text-type visualLayers to outro scene (stagger unverifiable without bullet items — ANIM-05)

Purpose: All 4 gaps are either trivial one-line code fixes or test fixture additions. No architecture change needed — the animation code (Ken Burns, parallax, stagger) is already wired correctly; it's just unexercised due to a sparse fixture.

Output: animation-utils.ts with exported ENTER_ANIMATION_CONFIG, KineticSubtitle.tsx with space-correct word rendering, script.json with screenshot + bullet scenes, one test PNG image.
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/workflows/execute-plan.md
@~/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/14-animation-engine/14-CONTEXT.md
@.planning/phases/14-animation-engine/14-VERIFICATION.md
@.planning/phases/14-animation-engine/14-GAP-05-SUMMARY.md

<interfaces>
<!-- Key types and contracts the executor needs. No codebase exploration needed. -->

From packages/renderer/src/utils/animation-utils.ts (line 23 — the bug):

```typescript
// CURRENT (broken — missing export):
const ENTER_ANIMATION_CONFIG: Record<
  AnimationConfig["enter"],
  { preset: SpringPresetName; durationFrames: number }
> = { ... };

// FIXED (add export keyword):
export const ENTER_ANIMATION_CONFIG: Record<
  AnimationConfig["enter"],
  { preset: SpringPresetName; durationFrames: number }
> = { ... };
```

From packages/renderer/src/remotion/components/KineticSubtitle.tsx (line 81 — the bug):

```typescript
// CURRENT containerStyle (broken — gap doesn't work in Playwright headless):
const containerStyle: React.CSSProperties = {
  ...
  gap: "4px 2px",  // ← DELETE THIS LINE
};

// word span rendering (add trailing space to each word):
{words.map((word, i) => {
  ...
  return (
    <span key={i} style={style}>
      {word}{" "}   {/* ← Add {" "} after {word} */}
    </span>
  );
})}
```

From src/utils/screenshot-finder.ts — screenshot naming convention:

```typescript
// Files are matched by: exact match, scene-NNN-layerId.png, or scene-NNN prefix
// For scene index 1 (scene-2 in the fixture), layer id "hero-screenshot":
// → file should be: screenshots/scene-002-hero-screenshot.png
```

From packages/renderer/src/utils/sceneAdapter.ts — textElements for BulletList:

```typescript
// Text-type visualLayers become bullet textElements:
if (layer.type === "text") {
  visualTextElements.push({ content: layer.content, role: "bullet", ... });
}
// outro scene type auto-infers layoutTemplate = "bullet-list"
```

From tests/e2e/video-playback-test/script.json — current fixture structure:

```json
// scene-1: intro, empty visualLayers
// scene-2: feature, has code-type visualLayer (needs a screenshot layer added)
// scene-3: outro, empty visualLayers (needs text-type layers for stagger)
```

</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix animation-utils.ts export and KineticSubtitle word spacing</name>
  <files>
    packages/renderer/src/utils/animation-utils.ts
    packages/renderer/src/remotion/components/KineticSubtitle.tsx
  </files>
  <read_first>
    - packages/renderer/src/utils/animation-utils.ts — read before editing; confirm `const ENTER_ANIMATION_CONFIG` is on exactly one line with no `export`
    - packages/renderer/src/remotion/components/KineticSubtitle.tsx — read before editing; confirm `gap: "4px 2px"` is in containerStyle and `{word}` is inside the span without trailing space
  </read_first>
  <action>
**Fix 1 — animation-utils.ts:**
On the `const ENTER_ANIMATION_CONFIG` declaration (line 23), add the `export` keyword:

Change:

```typescript
const ENTER_ANIMATION_CONFIG: Record<
```

To:

```typescript
export const ENTER_ANIMATION_CONFIG: Record<
```

That is the complete change. One token added. Do NOT modify any other line.

**Fix 2 — KineticSubtitle.tsx:**

Step A: Remove `gap: "4px 2px"` from `containerStyle`. Delete that line entirely from the style object.

Step B: In the `words.map()` return, add `{" "}` after `{word}` inside the span:

Change:

```tsx
return (
  <span key={i} style={style}>
    {word}
  </span>
);
```

To:

```tsx
return (
  <span key={i} style={style}>
    {word}{" "}
  </span>
);
```

This applies to the single `return` statement inside the `words.map()` — the one that renders all words with their respective style. Do NOT change the single-word early return at lines 23-27 (the `words.length === 1` branch).
</action>
<verify>
<automated>grep -n "export const ENTER_ANIMATION_CONFIG" packages/renderer/src/utils/animation-utils.ts && echo "✓ ENTER_ANIMATION_CONFIG exported" || echo "✗ MISSING export"</automated>
<automated>grep -n "gap:" packages/renderer/src/remotion/components/KineticSubtitle.tsx && echo "✗ gap: still present — should be removed" || echo "✓ gap: removed"</automated>
<automated>grep -n '{" "}' packages/renderer/src/remotion/components/KineticSubtitle.tsx || grep -n '{" "}' packages/renderer/src/remotion/components/KineticSubtitle.tsx && echo "✓ trailing space present" || echo "✗ trailing space missing"</automated>
<automated>cd packages/renderer && npx tsc --noEmit 2>&1 | grep -E "error TS" | grep -v "node_modules" | head -10; echo "tsc exit: $?"</automated>
</verify>
<done> - `grep "export const ENTER_ANIMATION_CONFIG" packages/renderer/src/utils/animation-utils.ts` returns a match - `grep "gap:" packages/renderer/src/remotion/components/KineticSubtitle.tsx` returns nothing (gap removed) - The word map `return` contains `{" "}` after `{word}` - TypeScript compilation has no new errors (pre-existing errors still OK)
</done>
</task>

<task type="auto">
  <name>Task 2: Enhance test fixture with screenshot layer, bullet text layers, and test PNG</name>
  <files>
    tests/e2e/video-playback-test/script.json
    tests/e2e/video-playback-test/screenshots/scene-002-hero-screenshot.png
  </files>
  <read_first>
    - tests/e2e/video-playback-test/script.json — read before editing; understand current scene structure (scene-1 intro, scene-2 feature, scene-3 outro)
    - src/utils/screenshot-finder.ts — already read; naming: scene-002-hero-screenshot.png for sceneIndex=1, layerId=hero-screenshot
  </read_first>
  <action>
**Step A: Add screenshot layer to scene-2 (feature scene)**

In `script.json`, scene-2 (`"id": "scene-2"`) has one existing code-type visualLayer with `"id": "hero-code"`. Add a second visualLayer of type `"screenshot"` with `"id": "hero-screenshot"`:

```json
{
  "id": "hero-screenshot",
  "type": "screenshot",
  "position": {
    "x": "right",
    "y": "center",
    "width": 800,
    "height": 450,
    "zIndex": 2
  },
  "content": "TypeScript code example",
  "animation": {
    "enter": "fadeIn",
    "enterDelay": 0,
    "exit": "fadeOut",
    "exitAt": 9
  }
}
```

Add this to the `visualLayers` array of scene-2, after the existing `hero-code` layer.

**Step B: Add text visualLayers to scene-3 (outro scene) for bullet stagger**

Scene-3 (`"id": "scene-3"`) has `"type": "outro"` which auto-infers `layoutTemplate: "bullet-list"`. It currently has empty `visualLayers: []`. Add 3 text-type layers so `sceneAdapter` creates bullet `textElements` for stagger to act on:

```json
"visualLayers": [
  {
    "id": "bullet-1",
    "type": "text",
    "position": { "x": "center", "y": 300, "width": "full", "height": "auto", "zIndex": 1 },
    "content": "Write reusable, type-safe code",
    "animation": { "enter": "slideUp", "enterDelay": 0, "exit": "none", "exitAt": 9 }
  },
  {
    "id": "bullet-2",
    "type": "text",
    "position": { "x": "center", "y": 400, "width": "full", "height": "auto", "zIndex": 1 },
    "content": "Works with any data type",
    "animation": { "enter": "slideUp", "enterDelay": 0.3, "exit": "none", "exitAt": 9 }
  },
  {
    "id": "bullet-3",
    "type": "text",
    "position": { "x": "center", "y": 500, "width": "full", "height": "auto", "zIndex": 1 },
    "content": "Catch errors at compile time",
    "animation": { "enter": "slideUp", "enterDelay": 0.6, "exit": "none", "exitAt": 9 }
  }
]
```

**Step C: Create a real PNG test image for the screenshot layer**

Create `tests/e2e/video-playback-test/screenshots/` directory if it doesn't exist. Then create a minimal valid PNG file at:

`tests/e2e/video-playback-test/screenshots/scene-002-hero-screenshot.png`

Use this Node.js one-liner to create a valid 100×100 dark PNG using the Buffer approach (no extra deps needed):

```bash
node -e "
const fs = require('fs');
const path = require('path');

// Minimal valid 1×1 dark grey PNG (89 bytes)
// PNG signature + IHDR + IDAT + IEND
const pngBytes = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  // PNG signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  // IHDR length + type
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  // width=1, height=1
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,  // bit depth=8, color=RGB, crc
  0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  // IDAT length + type
  0x54, 0x08, 0xD7, 0x63, 0x60, 0x60, 0x60, 0x00,  // IDAT deflate data
  0x00, 0x00, 0x04, 0x00, 0x01, 0xE2, 0x21, 0xBC,  // IDAT crc
  0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,  // IEND length + type
  0x44, 0xAE, 0x42, 0x60, 0x82                      // IEND crc
]);

const dir = 'tests/e2e/video-playback-test/screenshots';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'scene-002-hero-screenshot.png'), pngBytes);
console.log('Created test PNG');
"
```

If the minimal PNG bytes approach is tricky to get exactly right, use an alternative: use the `sharp` package (already installed) or use ImageMagick if available:

```bash
# Alternative A: use ffmpeg (installed)
ffmpeg -f lavfi -i color=color=0x1a1a2e:size=800x450:rate=1 -frames:v 1 \
  tests/e2e/video-playback-test/screenshots/scene-002-hero-screenshot.png -y

# Alternative B: use node canvas if available
# Alternative C: copy any existing PNG from the codebase
find . -name "*.png" -not -path "*/node_modules/*" 2>/dev/null | head -1
# then: cp <found-png> tests/e2e/video-playback-test/screenshots/scene-002-hero-screenshot.png
```

Use whichever approach works. The PNG only needs to be a valid image file that Playwright can render — it does NOT need to be visually meaningful.
</action>
<verify>
<automated>grep -c '"type": "screenshot"' tests/e2e/video-playback-test/script.json && echo "✓ screenshot layer present" || echo "✗ no screenshot layer"</automated>
<automated>grep -c '"type": "text"' tests/e2e/video-playback-test/script.json && echo "text layers counted" || echo "✗ no text layers"</automated>
<automated>test -f tests/e2e/video-playback-test/screenshots/scene-002-hero-screenshot.png && echo "✓ test PNG exists" || echo "✗ PNG missing"</automated>
<automated>node -e "const b = require('fs').readFileSync('tests/e2e/video-playback-test/screenshots/scene-002-hero-screenshot.png'); const isPng = b[0]===0x89 && b[1]===0x50 && b[2]===0x4E && b[3]===0x47; console.log(isPng ? '✓ valid PNG signature' : '✗ invalid PNG');"</automated>
<automated>node -e "const s = JSON.parse(require('fs').readFileSync('tests/e2e/video-playback-test/script.json','utf8')); const sc2 = s.scenes.find(x=>x.id==='scene-2'); const hasSS = sc2.visualLayers.some(l=>l.type==='screenshot'); const sc3 = s.scenes.find(x=>x.id==='scene-3'); const bullets = sc3.visualLayers.filter(l=>l.type==='text'); console.log('scene-2 screenshot layer:', hasSS, '| scene-3 text layers:', bullets.length);"</automated>
</verify>
<done> - `script.json` scene-2 visualLayers array contains an entry with `"type": "screenshot"` and `"id": "hero-screenshot"` - `script.json` scene-3 visualLayers array contains 3 entries with `"type": "text"` (bullet items) - `tests/e2e/video-playback-test/screenshots/scene-002-hero-screenshot.png` exists and has a valid PNG header (bytes 0x89 0x50 0x4E 0x47) - Node validation script confirms scene-2 has screenshot layer and scene-3 has 3 text layers
</done>
</task>

</tasks>

<verification>
After both tasks complete, run the full E2E compose to confirm the fixture renders without errors:

```bash
node dist/cli/index.js compose tests/e2e/video-playback-test/ 2>&1 | tail -20
```

Expected: MP4 produced successfully, no crash on screenshot layer rendering, BulletList renders with 3 bullet items.

Also run TypeScript check on the renderer package:

```bash
cd packages/renderer && npx tsc --noEmit 2>&1 | grep "error TS" | grep -v node_modules | wc -l
```

Expected: Same number of errors as before this plan (zero new errors introduced).
</verification>

<success_criteria>

- `export const ENTER_ANIMATION_CONFIG` present in animation-utils.ts (ANIM-01 gap closed)
- KineticSubtitle.tsx: `gap:` removed from containerStyle, `{" "}` added after each word (ANIM-06 gap closed)
- script.json scene-2 has a screenshot-type visualLayer with id "hero-screenshot" (enables Ken Burns/parallax verification — ANIM-03, ANIM-04)
- script.json scene-3 has 3 text-type visualLayers (enables stagger verification — ANIM-05)
- screenshots/scene-002-hero-screenshot.png exists with valid PNG header
- TypeScript compilation introduces no new errors
- `node dist/cli/index.js compose tests/e2e/video-playback-test/` completes without crashing
  </success_criteria>

<output>
After completion, create `.planning/phases/14-animation-engine/14-GAP-06-SUMMARY.md`
</output>
