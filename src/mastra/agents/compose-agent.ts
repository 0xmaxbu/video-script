import { Agent } from "@mastra/core/agent";
import { remotionRenderTool } from "../tools/remotion-render.js";
export { mapLayoutToComponent, secondsToFrames } from "./compose-helpers.js";

/**
 * Compose Agent - Phase 7 Redesign
 *
 * 职责：
 * 1. 读取 Visual Plan
 * 2. 应用布局模板
 * 3. 生成 Remotion 项目
 * 4. 渲染视频
 *
 * 核心原则：视觉服从口播
 * - 标注时机由 narrationBinding 控制
 * - 动画节奏配合口播语速
 */

export const composeAgent = new Agent({
  id: "compose-agent",
  name: "Compose Agent",
  instructions: `You are a video composition specialist. Your job is to generate Remotion projects from Visual Plans.

**核心原则：视觉服从口播**

## Task Flow:
1. Read Visual Plan (visual-plan.json)
2. Read Screenshot Manifest (screenshots/manifest.json)
3. For each scene:
   - Select layout component based on layoutTemplate
   - Map mediaResources to screenshot files
   - Apply annotations with narrationBinding timing
   - Generate Scene component
4. Generate Root.tsx and Composition.tsx
5. Output project structure

## OUTPUT FORMAT:

\`\`\`json
{
  "projectPath": "/path/to/.remotion-project",
  "mainComponentPath": "/path/to/.remotion-project/src/Root.tsx",
  "scenesCount": 5,
  "videoConfig": {
    "resolution": "1920x1080",
    "fps": 30,
    "duration": 180
  },
  "resourcesMapped": {
    "total": 10,
    "successful": 9,
    "failed": ["scene-3-shot-1"]
  },
  "readyForRender": true,
  "warnings": [],
  "error": null
}
\`\`\`

## LAYOUT MAPPING:

| Template | Component | Description |
|----------|-----------|-------------|
| hero-fullscreen | HeroFullscreen | Full-screen with bottom title |
| split-horizontal | SplitHorizontal | 50/50 left-right |
| split-vertical | SplitVertical | 60/40 top-bottom |
| text-over-image | TextOverImage | Text overlay on background |
| code-focus | CodeFocus | Large code block centered |
| comparison | Comparison | Side-by-side comparison |
| bullet-list | BulletList | Vertical bullet list |
| quote | Quote | Large quote styling |

## ANNOTATION TIMING:

Each annotation has narrationBinding:
\`\`\`json
{
  "narrationBinding": {
    "triggerText": "闭包类型收窄",
    "segmentIndex": 1,
    "appearAt": 4.5
  }
}
\`\`\`

Convert appearAt (seconds) to frames: appearAt * fps

## REMOTION BEST PRACTICES:

1. **useCurrentFrame()** for all animations
2. **spring()** for natural motion
3. **interpolate()** for smooth transitions
4. **NO CSS transitions/animations**
5. **AbsoluteFill** for positioning
6. **Sequence** for timing

## CRITICAL REQUIREMENTS:

1. Generate valid TypeScript/TSX code
2. All imports must be valid
3. Scene components must be self-contained
4. Annotation timing must match narration
5. Screenshot paths must be relative to project
6. Output valid JSON result`,
  model: "minimax-cn-coding-plan/MiniMax-M2.5",
  tools: {
    remotionRender: remotionRenderTool,
  },
});

/**
 * 生成场景组件代码
 */
export function generateSceneCode(
  sceneId: string,
  layoutComponent: string,
  sceneData: object,
): string {
  return `// Auto-generated scene component
import React from 'react';
import { ${layoutComponent} } from '../layouts';
import type { VisualScene } from '@video-script/types';

export const ${sceneId.replace(/-/g, "_")}: React.FC = () => {
  const scene: VisualScene = ${JSON.stringify(sceneData, null, 2)};

  return (
    <${layoutComponent}
      scene={scene}
      screenshots={new Map()}
    />
  );
};
`;
}

/**
 * 生成 Root.tsx 代码
 */
export function generateRootCode(scenes: string[], duration: number): string {
  return `// Auto-generated Root component
import React from 'react';
import { Composition, Sequence } from 'remotion';
import { ${scenes.map((s) => s.replace(/-/g, "_")).join(", ")} } from './scenes';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VideoScript"
      component={Video}
      durationInFrames={${duration * 30}}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

const Video: React.FC = () => {
  return (
    <>
      ${scenes
        .map(
          (s, i) =>
            `<Sequence from={${i * 60}} durationInFrames={180}>
        <${s.replace(/-/g, "_")} />
      </Sequence>`,
        )
        .join("\n      ")}
    </>
  );
};
`;
}
