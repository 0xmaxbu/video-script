# Summary 14-02: Ken Burns, Parallax, Exit Animations, Stagger

**Phase:** 14-animation-engine
**Status:** Complete

## Changes

### ScreenshotLayer.tsx

- Added `sceneType` prop for Ken Burns direction
- `useKenBurns()`: intro=zoom-in, feature=zoom-out, code=none
- `useParallax()`: intro only, zIndex-proportional movement
- Ken Burns + parallax merged into existing transform alongside enter/exit

### VisualLayerRenderer.tsx + Scene.tsx

- `sceneType` prop flows from Scene.tsx → VisualLayerRenderer → ScreenshotLayer
- No visual regression in existing enter/exit animations

### TextLayer.tsx + CodeLayer.tsx

- Both now use `useEnterAnimation()` + `useExitAnimation()` from animation-utils
- Full enter AND exit animation support (previously exit-only on ScreenshotLayer)
- CodeLayer gains scale transform (was missing)

### BulletList.tsx

- `staggerDelay(index, 10)` replaces inline `index * 10`
- `SPRING_PRESETS.smooth` replaces inline `{ damping: 100, stiffness: 200 }`

## Commits

- `f234d4e` feat/screenshot: add Ken Burns and parallax effects to ScreenshotLayer
- `670d43a` feat/layers: add exit animations to TextLayer and CodeLayer
- `3fa8c99` refactor/bulletlist: use centralized staggerDelay and SPRING_PRESETS
- `6c64cd2` fix/layers: resolve exactOptionalPropertyTypes and import path for BulletList

## Verification

- useKenBurns in ScreenshotLayer: 2 occurrences
- useExitAnimation in TextLayer: 2 occurrences
- useExitAnimation in CodeLayer: 2 occurrences
- staggerDelay in BulletList: 2 occurrences
- TypeScript: 0 new errors
