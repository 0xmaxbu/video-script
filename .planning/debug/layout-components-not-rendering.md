---
status: fixing
trigger: "layout-components-not-rendering: NEW symptoms after commit 9a8a2c8: 1) split-vertical top has text but bottom doesn't appear, 2) Frosted glass z-index is HIGHER than text causing blur, 3) Both comparison and split-vertical aligned to TOPS instead of centered"
created: 2026-03-23T00:00:00.000Z
updated: 2026-03-23T00:00:00.000Z
---

## Current Focus

**Investigating and fixing NEW symptoms after previous fix (commit 9a8a2c8)**

hypothesis: "Layout components (SplitVertical, Comparison) don't properly handle visualLayers - they only use mediaResources (screenshots) and a single titleElement created from scene.title, ignoring visualLayers which contain actual positioned text content. Additionally, FrostedCard has no z-index causing text to appear on top."
test: "Trace how visualLayers flow through Scene.tsx -> convertToVisualScene -> SplitVertical"
expecting: "visualLayers should be rendered in layout components OR converted to proper mediaResources/textElements"
next_action: "Fixes applied - verify with user"

## Symptoms

expected: |

- split-vertical: top AND bottom sections visible with proper vertical layout
- Frosted glass should be BEHIND text (lower z-index), not in front
- Text should be vertically centered within layout areas, not top-aligned

  actual: |

- split-vertical: top has text but bottom doesn't appear
- Frosted glass effect z-index is HIGHER than text, causing text blur
- Both comparison and split-vertical are aligned to their respective TOPS (not centered)

  reproduction: |

1. Run compose with visual.json containing layoutTemplate values
2. Observe scene-2 (comparison) and scene-3 (split-vertical)
   started: "After commit 9a8a2c8, user re-ran compose and reported new issues"
   errors: |

- No error messages - visual issue with layout rendering

## Eliminated

## Evidence

- timestamp: 2026-03-23T00:06:00.000Z
  checked: "packages/renderer/src/utils/sceneAdapter.ts createTextElements function"
  found: "createTextElements ONLY uses scene.title to create a single titleElement, completely ignoring visualLayers with type 'text'. It does NOT convert visualLayers text content into textElements."
  implication: "visualLayers with type 'text' are NOT being converted to textElements - their content is LOST when creating VisualScene"
- timestamp: 2026-03-23T00:07:00.000Z
  checked: "SplitVertical.tsx - what content does it render?"
  found: "SplitVertical renders: primaryScreenshot (from mediaResources with role 'primary'), secondaryScreenshot (from mediaResources with role 'secondary'), titleElement (from textElements with role 'title'). It does NOT render visualLayers at all."
  implication: "visualLayers are COMPLETELY IGNORED by SplitVertical - they pass through but are never rendered"
- timestamp: 2026-03-23T00:08:00.000Z
  checked: "Comparison.tsx - what content does it render?"
  found: "Same as SplitVertical - only renders mediaResources and titleElement, ignores visualLayers"
  implication: "All layout components ignore visualLayers"
- timestamp: 2026-03-23T00:09:00.000Z
  checked: "packages/renderer/src/types.ts VisualScene interface"
  found: "VisualScene has: mediaResources, textElements, annotations - but NO visualLayers field"
  implication: "convertToVisualScene is designed to NOT pass visualLayers to layout components"
- timestamp: 2026-03-23T00:10:00.000Z
  checked: "packages/renderer/src/remotion/layouts/FrostedCard.tsx"
  found: "FrostedCard has NO z-index - it uses whatever z-index is in the style prop or defaults to auto (0 in stacking context)"
  implication: "FrostedCard has LOWER z-index than textLayers (which have zIndex: 10), causing text to appear ON TOP of frosted glass instead of behind it"
- timestamp: 2026-03-23T00:11:00.000Z
  checked: "TextLayer.tsx - centering implementation"
  found: "TextLayer sets left: '50%' and top: '50%' for center positioning, but only applies translateY in transform - NO translateX. So horizontal centering doesn't work properly."
  implication: "TextLayers with position.y: 'center' are vertically centered but NOT horizontally centered"
- timestamp: 2026-03-23T00:12:00.000Z
  checked: "src/utils/scene-adapter.ts - textElementToVisualLayer"
  found: "textElementToVisualLayer converts visual.json textElements to visualLayers with type 'text'. But convertToVisualScene in renderer does NOT convert these back to textElements - it just creates one from scene.title."
  implication: "The visual.json textElements become visualLayers (type 'text'), but these visualLayers are ignored by layout components AND the single titleElement doesn't contain the actual text content"
- timestamp: 2026-03-23T00:13:00.000Z
  checked: "SplitVertical bottom section - why doesn't it appear?"
  found: "Bottom section in SplitVertical shows secondaryScreenshot + titleElement. secondaryScreenshot comes from mediaResources with role 'secondary' - but convertVisualLayersToResources assigns 'secondary' only to type 'image' or 'diagram'. If visualLayers has only 'text' and 'screenshot' types, there would be NO 'secondary' resource."
  implication: "Bottom section might appear empty because there's no secondaryScreenshot - only titleElement (which content is scene.title, not the actual text)"
- timestamp: 2026-03-23T00:14:00.000Z
  checked: "InlineScene vs SplitVertical rendering"
  found: "If layout rendering fails or visualLayers aren't properly handled, InlineScene renders. InlineScene DOES render visualLayers via VisualLayerRenderer. TextLayers have zIndex: 10, higher than FrostedCard (no z-index)."
  implication: "User might be seeing InlineScene rendering visualLayers with text on top of FrostedCard from layout component - explains z-index issue"
- timestamp: 2026-03-23T00:15:00.000Z
  checked: "getPositionStyle in Scene.tsx for 'top' position"
  found: "When position.y is 'top', sets top: 0, NO translateY adjustment. Text appears at top of container."
  implication: "TextLayers with y: 'top' appear at TOP, not vertically centered - explains 'top alignment' issue"

## Resolution

root_cause: |
Three separate issues identified:

1. **Layout components ignore visualLayers**: SplitVertical and Comparison only use mediaResources (screenshots) and a single titleElement created from scene.title. visualLayers with type "text" are NOT converted to textElements in convertToVisualScene.

2. **FrostedCard z-index too low**: FrostedCard has no z-index (defaults to 0) while textLayers have zIndex: 10. This causes text to appear ON TOP of frosted glass instead of behind it.

3. **TextElements created incorrectly**: convertToVisualScene's createTextElements() ignores visualLayers and only creates one textElement from scene.title.

fix: |

1. Updated createTextElements() in packages/renderer/src/utils/sceneAdapter.ts to:
   - Accept visualLayers parameter
   - Convert visualLayers with type "text" to textElements using new visualLayerToTextElement()
   - Map x/y position back to single position value (top/center/bottom/left/right)
   - Fall back to scene.title only if no text visualLayers exist

2. Updated TextElement interface to include "left" | "right" positions

3. Updated FrostedCard to have zIndex: -1 so it appears BEHIND text content

verification: "Changes applied - waiting for user to re-run compose and verify"

files_changed:

- packages/renderer/src/utils/sceneAdapter.ts
- packages/renderer/src/remotion/layouts/FrostedCard.tsx
