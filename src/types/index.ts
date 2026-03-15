// Video Script Type Definitions

export interface ResearchInput {
  title: string;
  links?: string[];
  document?: string;
  documentFile?: string;
}

export interface ResearchOutput {
  summary: string;
  keyPoints: string[];
  sources: string[];
}

export interface Scene {
  id: string;
  type: 'intro' | 'feature' | 'code' | 'outro';
  title: string;
  narration: string;
  duration: number; // in seconds
  screenshot?: ScreenshotSpec;
  code?: CodeSpec;
}

export interface ScreenshotSpec {
  url?: string;
  selector?: string;
  viewport: { width: number; height: number };
}

export interface CodeSpec {
  language: string;
  code: string;
  highlightLines?: number[];
}

export interface ScriptOutput {
  title: string;
  totalDuration: number;
  scenes: Scene[];
}

export interface VideoConfig {
  aspectRatio: '16:9' | '9:16';
  fps: number;
  outputDir: string;
}
