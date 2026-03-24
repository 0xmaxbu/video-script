# Summary 14-03: KineticSubtitle + Transitions Cleanup

**Phase:** 14-animation-engine
**Status:** Complete

## Changes

### KineticSubtitle.tsx

Created `packages/renderer/src/remotion/components/KineticSubtitle.tsx`:

- Per-word active highlighting with yellow rounded-rect background
- AI Jason style: dark bg (rgba 0,0,0,0.8), white text, 36px font
- Active word: white + yellow highlight (rgba 255,215,0,0.3)
- Past words: dimmed white (0.5 opacity)
- Future words: more dimmed (0.25 opacity)
- Falls back to even timing when no wordTimestamps provided
- Edge cases: empty text → null, single word → always active

### Scene.tsx

- Replaced `Subtitle` with `KineticSubtitle` (1 import + 4 usages)
- KineticSubtitle applied in both layout rendering and InlineScene paths

### Transitions.tsx

- Deleted unused `Transition` wrapper component and its types
- Removed CSS `transition` property from HighlightBox (forbidden in Remotion)
- Preserved: TypewriterText, HighlightBox, AnimatedNumber

## Commits

- `a6e412d` feat/subtitle: create KineticSubtitle component with per-word highlighting
- `8877a8f` refactor/transitions: wire KineticSubtitle into Scene.tsx and clean up unused Transition

## Verification

- KineticSubtitle in Scene.tsx: 5 references
- Subtitle (old) in Scene.tsx: 0
- Transition export in Transitions.tsx: 0
- TypeScript: no new errors from our changes
