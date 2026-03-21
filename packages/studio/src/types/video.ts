export interface VideoMeta {
  id: string;
  title: string;
  path: string;
  outputMp4Path: string | null;
  outputSrtPath: string | null;
  scriptPath: string;
  duration: number;
  scenesCount: number;
  createdAt: string;
  modifiedAt: string;
}

export interface ScriptData {
  title: string;
  totalDuration: number;
  scenes: SceneData[];
}

export interface SceneData {
  id: string;
  type: "intro" | "feature" | "code" | "outro";
  title: string;
  narration: string;
  duration: number;
  transition?: {
    type: "fade" | "slide" | "wipe" | "flip" | "clockWipe" | "iris" | "none";
    duration: number;
  };
  visualLayers?: VisualLayerData[];
}

export interface VisualLayerData {
  id: string;
  type: "screenshot" | "code" | "text" | "diagram" | "image";
  position: {
    x: number | "left" | "center" | "right";
    y: number | "top" | "center" | "bottom";
    width: number | "auto" | "full";
    height: number | "auto" | "full";
    zIndex: number;
  };
  content: string;
  animation: {
    enter:
      | "fadeIn"
      | "slideLeft"
      | "slideRight"
      | "slideUp"
      | "slideDown"
      | "slideIn"
      | "zoomIn"
      | "typewriter"
      | "none";
    enterDelay: number;
    exit: "fadeOut" | "slideOut" | "zoomOut" | "none";
    exitAt?: number;
  };
}

export interface VideoDetail extends VideoMeta {
  script: ScriptData;
  screenshotResources: Record<string, string>;
}
