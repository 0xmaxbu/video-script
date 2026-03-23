/**
 * Scene Adapter - D-01
 *
 * Transforms SceneScript (renderer format) to VisualScene (layout format).
 * This adapter bridges the gap between the renderer's scene structure and
 * the professional layout templates that expect VisualScene data.
 *
 * Core principle: Visual follows narration
 * - All visual elements are bound to narration timeline
 */

import type {
  SceneScript,
  VisualLayer,
  SceneHighlight,
  CodeHighlight,
  LayoutTemplate,
  Annotation,
} from "../types.js";

// =============================================================================
// VisualScene Types (local definitions matching @video-script/types structure)
// =============================================================================

export interface NarrationBinding {
  triggerText: string;
  segmentIndex: number;
  appearAt: number;
}

export interface NarrationSegment {
  text: string;
  startTime: number;
  endTime: number;
}

export interface NarrationTimeline {
  text: string;
  duration: number;
  segments: NarrationSegment[];
}

export interface ScreenshotResource {
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
  narrationBinding: NarrationBinding;
}

export interface TextElement {
  content: string;
  role: "title" | "subtitle" | "bullet" | "quote";
  position: "top" | "center" | "bottom";
  narrationBinding: NarrationBinding;
}

export interface VisualScene {
  sceneId: string;
  layoutTemplate: LayoutTemplate;
  narrationTimeline: NarrationTimeline;
  mediaResources: ScreenshotResource[];
  textElements: TextElement[];
  annotations: Annotation[];
  animationPreset: "fast" | "medium" | "slow" | "dramatic";
  transition: {
    type: "fade" | "slide" | "wipe" | "flip" | "clockWipe" | "iris" | "none";
    duration: number;
  };
}

// =============================================================================
// Layout Inference - D-01a
// =============================================================================

/**
 * Maps scene type to default layout when layoutTemplate is not set.
 * Per D-01 decision:
 * - intro -> hero-fullscreen
 * - feature -> split-horizontal (or text-over-image if has code)
 * - code -> code-focus
 * - outro -> bullet-list
 */
export function inferLayoutFromType(
  type: SceneScript["type"],
  visualLayers?: VisualLayer[],
): LayoutTemplate {
  switch (type) {
    case "intro":
      return "hero-fullscreen";
    case "feature":
      // If visualLayers contains code, prefer text-over-image
      if (visualLayers?.some((l) => l.type === "code")) {
        return "text-over-image";
      }
      return "split-horizontal";
    case "code":
      return "code-focus";
    case "outro":
      return "bullet-list";
    default:
      return "inline";
  }
}

// =============================================================================
// VisualLayer to MediaResource Conversion
// =============================================================================

/**
 * Maps VisualLayer type to ScreenshotResource role.
 */
function mapLayerTypeToRole(
  layerType: VisualLayer["type"],
): ScreenshotResource["role"] {
  switch (layerType) {
    case "screenshot":
    case "code":
      return "primary";
    case "image":
    case "diagram":
      return "secondary";
    case "text":
    default:
      return "background";
  }
}

/**
 * Maps VisualLayer type to ScreenshotResource type.
 */
function mapLayerTypeToScreenshotType(
  layerType: VisualLayer["type"],
): ScreenshotResource["type"] {
  switch (layerType) {
    case "screenshot":
      return "documentation";
    case "code":
      return "codeSnippet";
    case "image":
      return "hero";
    case "diagram":
      return "feature";
    case "text":
    default:
      return "article";
  }
}

/**
 * Converts VisualLayer[] to mediaResources format.
 * Per D-01b: Each layer becomes a ScreenshotResource with narration binding.
 */
export function convertVisualLayersToResources(
  visualLayers: VisualLayer[] | undefined,
  sceneId: string,
): ScreenshotResource[] {
  if (!visualLayers || visualLayers.length === 0) {
    return [];
  }

  return visualLayers.map((layer) => {
    const resourceId = `${sceneId}-${layer.id}`;
    return {
      id: resourceId,
      type: mapLayerTypeToScreenshotType(layer.type),
      url: `local://${resourceId}`, // Placeholder URL for local resources
      role: mapLayerTypeToRole(layer.type),
      narrationBinding: {
        triggerText: layer.content.slice(0, 50), // First 50 chars as trigger
        segmentIndex: 0,
        appearAt: 0,
      },
    };
  });
}

// =============================================================================
// Highlights to Annotations Conversion
// =============================================================================

/**
 * Converts SceneHighlight to Annotation format.
 */
function convertSceneHighlightToAnnotation(
  highlight: SceneHighlight,
  _index: number,
): Annotation {
  return {
    type: highlight.annotationSuggestion === "number" ? "number" : highlight.annotationSuggestion,
    target: {
      type: "text",
      textMatch: highlight.text,
    },
    style: {
      color: highlight.importance === "critical" ? "attention" :
             highlight.importance === "high" ? "highlight" : "info",
      size: "medium",
    },
    narrationBinding: {
      triggerText: highlight.text,
      segmentIndex: highlight.segmentIndex,
      appearAt: highlight.timeInScene,
    },
  };
}

/**
 * Converts CodeHighlight to Annotation format.
 */
function convertCodeHighlightToAnnotation(
  codeHighlight: CodeHighlight,
): Annotation {
  return {
    type: codeHighlight.annotationType === "arrow" ? "arrow" :
          codeHighlight.annotationType,
    target: {
      type: "code-line",
      lineNumber: codeHighlight.codeLine,
      textMatch: codeHighlight.codeText,
    },
    style: {
      color: "highlight",
      size: "medium",
    },
    narrationBinding: {
      triggerText: codeHighlight.codeText,
      segmentIndex: 0,
      appearAt: codeHighlight.timeInScene,
    },
  };
}

/**
 * Converts highlights and codeHighlights to Annotation[].
 * Per D-01c: Combines both highlight types into unified annotation array.
 */
export function convertHighlightsToAnnotations(
  highlights: SceneHighlight[] | undefined,
  codeHighlights: CodeHighlight[] | undefined,
): Annotation[] {
  const annotations: Annotation[] = [];

  if (highlights && highlights.length > 0) {
    annotations.push(...highlights.map((h) => convertSceneHighlightToAnnotation(h, 0)));
  }

  if (codeHighlights && codeHighlights.length > 0) {
    annotations.push(...codeHighlights.map(convertCodeHighlightToAnnotation));
  }

  return annotations;
}

// =============================================================================
// Main Adapter Function
// =============================================================================

/**
 * Creates a basic narration timeline by splitting narration into segments.
 * For simple cases, creates a single segment spanning the full duration.
 */
function createNarrationTimeline(
  narration: string,
  duration: number,
): NarrationTimeline {
  return {
    text: narration,
    duration,
    segments: [
      {
        text: narration,
        startTime: 0,
        endTime: duration,
      },
    ],
  };
}

/**
 * Creates text elements from scene title.
 * Per D-01d: Title becomes the primary text element.
 */
function createTextElements(
  title: string,
  _narration: string,
  _duration: number,
): TextElement[] {
  return [
    {
      content: title,
      role: "title",
      position: "top",
      narrationBinding: {
        triggerText: title,
        segmentIndex: 0,
        appearAt: 0,
      },
    },
  ];
}

/**
 * Main adapter function that transforms SceneScript to VisualScene.
 *
 * Per D-01:
 * - Maps SceneScript.id -> VisualScene.sceneId
 * - Maps SceneScript.title -> VisualScene.textElements[0]
 * - Maps SceneScript.narration -> VisualScene.narrationTimeline.text
 * - Maps SceneScript.duration -> VisualScene.narrationTimeline.duration
 * - Maps SceneScript.visualLayers -> VisualScene.mediaResources
 * - Maps SceneScript.highlights + codeHighlights -> VisualScene.annotations
 * - Uses layoutTemplate if set, otherwise calls inferLayoutFromType()
 * - Sets animationPreset: "medium" as default
 * - Copies transition if present, otherwise defaults to { type: "fade", duration: 0.5 }
 */
export function convertToVisualScene(
  scene: SceneScript,
  _imagePaths: Record<string, string>,
): VisualScene {
  // Determine layout template
  const layoutTemplate: LayoutTemplate = scene.layoutTemplate
    ? scene.layoutTemplate
    : inferLayoutFromType(scene.type, scene.visualLayers);

  // Convert visual layers to media resources
  const mediaResources = convertVisualLayersToResources(
    scene.visualLayers,
    scene.id,
  );

  // Convert highlights to annotations
  const annotations = convertHighlightsToAnnotations(
    scene.highlights,
    scene.codeHighlights,
  );

  // Create narration timeline
  const narrationTimeline = createNarrationTimeline(
    scene.narration,
    scene.duration,
  );

  // Create text elements
  const textElements = createTextElements(
    scene.title,
    scene.narration,
    scene.duration,
  );

  // Handle transition with default
  const transition = scene.transition
    ? { type: scene.transition.type, duration: scene.transition.duration }
    : { type: "fade" as const, duration: 0.5 };

  return {
    sceneId: scene.id,
    layoutTemplate,
    narrationTimeline,
    mediaResources,
    textElements,
    annotations,
    animationPreset: "medium",
    transition,
  };
}
