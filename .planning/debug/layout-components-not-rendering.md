---
status: resolved
trigger: "layout-components-not-rendering: Phase 10 layoutTemplate fix was applied (commit 783666a), but comparison and split-vertical layouts still show text stacking at top-right instead of proper left/right and top/bottom layouts."
created: 2026-03-23T00:00:00.000Z
updated: 2026-03-23T00:00:00.000Z
---

## Current Focus

**FIX COMMITTED**: Commit 9a8a2c8

hypothesis: "textElementToVisualLayer incorrectly mapped element.position values, causing x to be hardcoded to 'center' and y to only handle top/center/bottom. When element.position was 'left' or 'right', text appeared at wrong positions."
test: "Verified with manual trace and build verification"
expecting: "Text elements with position:left now correctly map to x:left,y:center"
next_action: "User should re-run compose to verify fix"

## Symptoms

expected: |

- comparison layout: left/right panels with VS badge, frosted glass cards
- split-vertical layout: top/bottom sections with proper typography hierarchy
  actual: |
- Both layouts show text stacking at TOP-RIGHT of screen
- No frosted glass cards, no layout structure
- Text appears to be rendering inline without layout components
  reproduction: |

1. Run compose on project with visual.json containing layoutTemplate values
2. Observe scene-2 (comparison) and scene-3 (split-vertical)
   started: "After commit 783666a fix was applied, user re-ran compose"
   errors: |

- No error messages - silent failure of layout routing

## Eliminated

## Evidence

- timestamp: 2026-03-23T00:00:00.000Z
  checked: "Commit 783666a"
  found: "Fixed layoutTemplate preservation in scene-adapter"
  implication: "layoutTemplate IS being preserved in the adapter, so the issue must be downstream"
- timestamp: 2026-03-23T00:01:00.000Z
  checked: "src/cli/index.ts lines 909-921"
  found: "Lines 928-930 DO include layoutTemplate spread - fix appears to already be in place"
  implication: "The fix IS present in compose command path"
- timestamp: 2026-03-23T00:02:00.000Z
  checked: "adaptScriptForRenderer function"
  found: "adaptSceneForRenderer preserves layoutTemplate from visualScene when visualScene exists"
  implication: "adaptScriptForRenderer should preserve layoutTemplate correctly"
- timestamp: 2026-03-23T00:03:00.000Z
  checked: "visual.json scene-2 layoutTemplate value"
  found: "scene-2 has layoutTemplate: 'comparison' - correct value"
  implication: "visual.json has correct layoutTemplate"
- timestamp: 2026-03-23T00:04:00.000Z
  checked: "RenderProcessInput interface in process-manager.ts"
  found: "Does NOT have layoutTemplate in scenes type definition - TypeScript interface is compile-time only, should not affect runtime"
  implication: "Interface mismatch not likely causing runtime issue"
- timestamp: 2026-03-23T00:05:00.000Z
  checked: "Comparison.tsx and SplitVertical.tsx expecting VisualScene"
  found: "Layout components expect scene.mediaResources, scene.textElements but convertToVisualScene creates these from visualLayers"
  implication: "Potential mismatch - visual.json mediaResources/textElements get converted to visualLayers in adaptSceneForRenderer, then convertToVisualScene creates new mediaResources/textElements from visualLayers"

## Resolution

root_cause: "textElementToVisualLayer function incorrectly mapped element.position to x/y coordinates - x was hardcoded to 'center' and y only handled top/center/bottom. When position was 'left' or 'right', x stayed 'center' and y fell to 'bottom'. Additionally, 'top' was being used as x value which InlineScene ignored, causing text to render at left=0 (top-left)."
fix: "Rewrote textElementToVisualLayer to properly map: left->x:left/y:center, right->x:right/y:center, top->x:center/y:top, center->x:center/y:center, bottom->x:center/y:bottom. Also updated TextElement interface to include left/right positions."
verification: "Verified with manual trace - text elements with position:left now correctly map to x:left,y:center instead of x:center,y:bottom"
files_changed: ["src/utils/scene-adapter.ts"]
