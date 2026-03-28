/**
 * Scene Adapter - Phase 9
 *
 * This adapter converts Visual Agent output (visual.json) into renderer-compatible
 * visualLayers format. It bridges the gap between visualAgent output and what the
 * renderer expects.
 *
 * IMPORTANT: This is distinct from packages/renderer/src/utils/sceneAdapter.ts which handles
 * SceneScript -> VisualScene conversion for layout routing INSIDE the renderer process.
 * This adapter operates in the main CLI process during the compose step.
 *
 * Key transformations (from visual.json to visualLayers):
 * - mediaResources[] -> visualLayers[] with type: "screenshot"
 * - textElements[] -> visualLayers[] with type: "text"
 * - annotations[] -> visualLayers[] with type: "annotation"
 */

import type { SceneScript } from "../types/script.js";
import type { VisualLayer } from "@video-script/types";
import type { Annotation } from "@video-script/types";

// =============================================================================
// Visual JSON Types (from visualAgent output)
// =============================================================================

interface VisualAnnotation {
  type: string;
  target: {
    type: string;
    textMatch?: string;
    lineNumber?: number;
    region?: string;
    x?: number;
    y?: number;
  };
  style: {
    color: string;
    size: string;
  };
  narrationBinding: {
    triggerText: string;
    segmentIndex: number;
    appearAt: number;
  };
}

interface MediaResource {
  id: string;
  type:
    | "hero"
    | "ambient"
    | "headline"
    | "article"
    | "documentation"
    | "codeSnippet"
    | "changelog"
    | "feature";
  url: string;
  selector?: string;
  role: "primary" | "secondary" | "background";
  narrationBinding: {
    triggerText: string;
    segmentIndex: number;
    appearAt: number;
  };
}

interface TextElement {
  content: string;
  role: "title" | "subtitle" | "bullet" | "quote";
  position: "top" | "center" | "bottom" | "left" | "right";
  narrationBinding: {
    triggerText: string;
    segmentIndex: number;
    appearAt: number;
  };
}

interface VisualPlan {
  scenes: Array<{
    sceneId: string;
    layoutTemplate?: string;
    mediaResources?: MediaResource[];
    textElements?: TextElement[];
    annotations?: VisualAnnotation[];
    animationPreset?: "fast" | "medium" | "slow" | "dramatic";
    transition?: {
      type: "fade" | "slide" | "wipe" | "flip" | "clockWipe" | "iris" | "none";
      duration: number;
    };
  }>;
}

/**
 * Converts a MediaResource to a VisualLayer with type: "screenshot".
 */
function mediaResourceToVisualLayer(resource: MediaResource): VisualLayer {
  return {
    id: resource.id,
    type: "screenshot",
    position: {
      x: 0,
      y: 0,
      width: "full",
      height: "full",
      zIndex: 1,
    },
    content: resource.url,
    animation: {
      enter: "fadeIn",
      enterDelay: resource.narrationBinding.appearAt,
      exit: "none",
    },
  };
}

/**
 * Converts a TextElement to a VisualLayer with type: "text".
 */
function textElementToVisualLayer(
  element: TextElement,
  index: number,
): VisualLayer {
  // Map element.position (top/center/bottom/left/right) to x and y
  // Horizontal positions (left/right) affect x, vertical positions affect y
  let x: "left" | "center" | "right" = "center";
  let y: "top" | "center" | "bottom" = "center";

  if (element.position === "left") {
    x = "left";
    y = "center";
  } else if (element.position === "right") {
    x = "right";
    y = "center";
  } else if (element.position === "top") {
    x = "center";
    y = "top";
  } else if (element.position === "center") {
    x = "center";
    y = "center";
  } else if (element.position === "bottom") {
    x = "center";
    y = "bottom";
  }

  return {
    id: `text-${index}`,
    type: "text",
    position: {
      x,
      y,
      width: "auto",
      height: "auto",
      zIndex: 10,
    },
    content: element.content,
    animation: {
      enter: "fadeIn",
      enterDelay: element.narrationBinding.appearAt,
      exit: "none",
    },
  };
}

/**
 * Creates a map of sceneId -> visual scene data from visualPlan.
 */
function buildVisualPlanMap(
  visualPlan: VisualPlan,
): Map<string, VisualPlan["scenes"][0]> {
  const map = new Map<string, VisualPlan["scenes"][0]>();
  if (visualPlan.scenes) {
    for (const scene of visualPlan.scenes) {
      map.set(scene.sceneId, scene);
    }
  }
  return map;
}

/**
 * Adapts a single scene by merging visual plan data into visualLayers.
 * If visualPlan is provided, converts mediaResources, textElements, and annotations.
 * Falls back to existing visualLayers if visualPlan doesn't have data for this scene.
 */
export function adaptSceneForRenderer(
  scene: SceneScript,
  visualScene?: VisualPlan["scenes"][0],
): SceneScript {
  const visualLayers: VisualLayer[] = [];

  // Convert mediaResources to screenshot visualLayers
  if (visualScene?.mediaResources && visualScene.mediaResources.length > 0) {
    for (const resource of visualScene.mediaResources) {
      visualLayers.push(mediaResourceToVisualLayer(resource));
    }
  }

  // Convert textElements to text visualLayers
  if (visualScene?.textElements && visualScene.textElements.length > 0) {
    for (let i = 0; i < visualScene.textElements.length; i++) {
      visualLayers.push(
        textElementToVisualLayer(visualScene.textElements[i], i),
      );
    }
  }

  // Preserve layoutTemplate from visualScene if present
  const layoutTemplate = visualScene?.layoutTemplate;

  // Extract annotations from visualScene and cast to Annotation[] (schema-compatible)
  const annotations: Annotation[] | undefined =
    visualScene?.annotations && visualScene.annotations.length > 0
      ? (visualScene.annotations as unknown as Annotation[])
      : scene.annotations;

  // Use merged visualLayers if we have any, otherwise fall back to existing
  return {
    ...scene,
    layoutTemplate,
    visualLayers: visualLayers.length > 0 ? visualLayers : scene.visualLayers,
    annotations,
  };
}

/**
 * Adapts the entire script output by merging visual plan data into scenes.
 * Returns the adapted script with title and totalDuration derived from scenes.
 *
 * @param script - The script output from Script Agent (script.json)
 * @param visualPlan - The visual plan from Visual Agent (visual.json), optional
 *
 * Call this function in the compose step before passing script data to spawnRenderer.
 */
export function adaptScriptForRenderer(
  script: { title: string; scenes: SceneScript[] },
  visualPlan?: VisualPlan,
): {
  title: string;
  totalDuration: number;
  scenes: SceneScript[];
} {
  // Build a map of sceneId -> visualScene for efficient lookup
  const visualMap = visualPlan ? buildVisualPlanMap(visualPlan) : new Map();

  const adaptedScenes = script.scenes.map((scene) => {
    // Try to find matching visual scene by sceneId (e.g., "scene-1")
    // Also try by index-based id if sceneId format differs
    const visualScene = visualMap.get(scene.id);
    return adaptSceneForRenderer(scene, visualScene);
  });

  const totalDuration = adaptedScenes.reduce((sum, s) => sum + s.duration, 0);

  return {
    title: script.title,
    totalDuration,
    scenes: adaptedScenes,
  };
}
