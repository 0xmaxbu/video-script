/**
 * Scene Adapter - Phase 9
 *
 * This adapter converts script output (highlights, codeHighlights) into renderer-compatible
 * visualLayers format. It bridges the gap between script agent output and what the
 * renderer expects.
 *
 * IMPORTANT: This is distinct from packages/renderer/src/utils/sceneAdapter.ts which handles
 * SceneScript -> VisualScene conversion for layout routing INSIDE the renderer process.
 * This adapter operates in the main CLI process during the compose step.
 *
 * Key transformations:
 * - highlights[] -> visualLayers[] with type: "text"
 * - codeHighlights[] -> visualLayers[] with type: "code"
 */

import type { SceneScript } from "../types/script.js";
import type { SceneHighlight, CodeHighlight, VisualLayer } from "@video-script/types";

/**
 * Converts a SceneHighlight to a VisualLayer with type: "text".
 * The visualLayer position uses "bottom" y-position for text overlay.
 */
function highlightToVisualLayer(highlight: SceneHighlight, _sceneId: string, index: number): VisualLayer {
  return {
    id: `highlight-${index}`,
    type: "text",
    position: {
      x: "center",
      y: "bottom",
      width: "auto",
      height: "auto",
      zIndex: 10,
    },
    content: highlight.text,
    animation: {
      enter: "fadeIn",
      enterDelay: highlight.timeInScene,
      exit: "none",
    },
  };
}

/**
 * Converts a CodeHighlight to a VisualLayer with type: "code".
 * The visualLayer uses full-width positioning for code display.
 */
function codeHighlightToVisualLayer(codeHighlight: CodeHighlight, _sceneId: string, index: number): VisualLayer {
  return {
    id: `code-highlight-${index}`,
    type: "code",
    position: {
      x: 0,
      y: 0,
      width: "full",
      height: "auto",
      zIndex: 5,
    },
    content: codeHighlight.codeText,
    animation: {
      enter: "fadeIn",
      enterDelay: codeHighlight.timeInScene,
      exit: "none",
    },
  };
}

/**
 * Adapts a single scene by converting highlights and codeHighlights into visualLayers.
 */
export function adaptSceneForRenderer(scene: SceneScript): SceneScript {
  const visualLayers: VisualLayer[] = [];

  // Convert highlights to text visual layers
  if (scene.highlights && scene.highlights.length > 0) {
    for (let i = 0; i < scene.highlights.length; i++) {
      visualLayers.push(highlightToVisualLayer(scene.highlights[i], scene.id, i));
    }
  }

  // Convert codeHighlights to code visual layers
  if (scene.codeHighlights && scene.codeHighlights.length > 0) {
    for (let i = 0; i < scene.codeHighlights.length; i++) {
      visualLayers.push(codeHighlightToVisualLayer(scene.codeHighlights[i], scene.id, i));
    }
  }

  return {
    ...scene,
    visualLayers: visualLayers.length > 0 ? visualLayers : scene.visualLayers,
  };
}

/**
 * Adapts the entire script output by converting highlights/codeHighlights to visualLayers.
 * Returns the adapted script with title and totalDuration derived from scenes.
 *
 * Call this function in the compose step before passing script data to spawnRenderer.
 */
export function adaptScriptForRenderer(script: { title: string; scenes: SceneScript[] }): {
  title: string;
  totalDuration: number;
  scenes: SceneScript[];
} {
  const adaptedScenes = script.scenes.map(adaptSceneForRenderer);
  const totalDuration = adaptedScenes.reduce((sum, s) => sum + s.duration, 0);

  return {
    title: script.title,
    totalDuration,
    scenes: adaptedScenes,
  };
}
