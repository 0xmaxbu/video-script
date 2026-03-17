import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import { ScriptOutput } from "../types/script";

// Input validation schema - matches new ScriptOutputSchema
const GenerateProjectInputSchema = z.object({
  script: z.object({
    title: z.string(),
    scenes: z.array(
      z.object({
        order: z.number().int().positive(),
        segmentOrder: z.number().int().positive(),
        type: z.enum(["url", "text"]),
        content: z.string(),
        screenshot: z
          .object({
            background: z.string().default("#1E1E1E"),
            maxLines: z.number().int().positive().optional(),
            width: z.number().int().positive().default(1920),
            fontSize: z.number().int().positive().default(14),
            fontFamily: z.string().default("Fira Code"),
            padding: z.number().int().optional(),
            theme: z.string().optional(),
          })
          .optional(),
        effects: z.array(z.any()).optional(),
      }),
    ),
    transitions: z.array(z.any()).optional(),
  }),
  screenshotResources: z.record(z.string(), z.string()),
  outputPath: z.string().min(1),
});

export interface GenerateProjectInput {
  script: ScriptOutput;
  screenshotResources: Record<string, string>;
  outputPath: string;
}

export interface GenerateProjectOutput {
  projectPath: string;
  mainComponentPath: string;
  scenesCount: number;
  videoConfig: {
    resolution: string;
    fps: number;
    duration: number;
  };
  success: boolean;
  error?: string;
}

/**
 * Generates a complete Remotion project from script data and screenshot resources
 */
export async function generateRemotionProject(
  input: GenerateProjectInput,
): Promise<GenerateProjectOutput> {
  try {
    // Validate input
    const validated = GenerateProjectInputSchema.parse(input);
    const { script, screenshotResources, outputPath } = validated;

    // Create project directories
    const projectPath = outputPath;
    const srcPath = join(projectPath, "src");
    const scenesPath = join(srcPath, "scenes");
    const publicPath = join(projectPath, "public");

    await mkdir(projectPath, { recursive: true });
    await mkdir(srcPath, { recursive: true });
    await mkdir(scenesPath, { recursive: true });
    await mkdir(publicPath, { recursive: true });

    // Generate package.json
    const packageJson = {
      name: `video-${script.title.toLowerCase().replace(/\s+/g, "-")}`,
      version: "0.1.0",
      type: "module",
      scripts: {
        start: "remotion preview",
        build: "remotion render src/index.ts Video --codec h264",
        test: "vitest run",
      },
      dependencies: {
        react: "^19.2.4",
        "@remotion/cli": "^4.0.435",
        "@remotion/renderer": "^4.0.435",
      },
      devDependencies: {
        "@types/node": "^25.5.0",
        "@types/react": "^19.2.14",
        "@types/react-dom": "^19.2.3",
        typescript: "^5.9.3",
        vitest: "^4.1.0",
      },
    };

    await writeFile(
      join(projectPath, "package.json"),
      JSON.stringify(packageJson, null, 2),
    );

    // Generate tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: "ES2022",
        module: "ES2022",
        moduleResolution: "bundler",
        jsx: "react-jsx",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        outDir: "./dist",
        rootDir: "./src",
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    };

    await writeFile(
      join(projectPath, "tsconfig.json"),
      JSON.stringify(tsConfig, null, 2),
    );

    // Generate src/index.ts (entry point)
    const indexContent = `import { registerRoot } from "@remotion/cli";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
`;

    await writeFile(join(srcPath, "index.ts"), indexContent);

    // Generate src/Root.tsx
    const rootContent = `import React from "react";
import { Composition } from "remotion";
import { z } from "zod";
import { VideoComposition } from "./Composition";

const compositionSchema = z.object({
  script: z.object({
    title: z.string(),
    scenes: z.array(
      z.object({
        order: z.number().int().positive(),
        segmentOrder: z.number().int().positive(),
        type: z.enum(["url", "text"]),
        content: z.string(),
        screenshot: z.any().optional(),
        effects: z.array(z.any()).optional(),
      })
    ),
    transitions: z.array(z.any()).optional(),
  }),
  images: z.record(z.string(), z.string()).optional(),
});

export const RemotionRoot: React.FC = () => {
  const script = ${JSON.stringify(script)};
  const images = ${JSON.stringify(screenshotResources)};
  const totalDuration = script.scenes.length * 30; // Calculate from scenes

  return (
    <>
      <Composition
        id="Video"
        component={VideoComposition as any}
        durationInFrames={Math.ceil(totalDuration * 30)}
        fps={30}
        width={1920}
        height={1080}
        schema={compositionSchema}
        defaultProps={{
          script,
          images,
        }}
      />
    </>
  );
};
`;

    await writeFile(join(srcPath, "Root.tsx"), rootContent);

    // Generate src/Composition.tsx
    const compositionContent = `import React from "react";
import { Sequence, useVideoConfig, AbsoluteFill } from "remotion";
import { Scene } from "./Scene";

export interface VideoCompositionProps {
  script: {
    title: string;
    totalDuration: number;
    scenes: Array<{
      id: string;
      type: "intro" | "feature" | "code" | "outro";
      title: string;
      narration: string;
      duration: number;
    }>;
  };
  images?: Record<string, string>;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  script,
  images,
}) => {
  const { fps } = useVideoConfig();
  let currentFrame = 0;

  if (!script || !script.scenes) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "red",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: 50,
        }}
      >
        No Script Data
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {script.scenes.map((scene) => {
        const durationInFrames = Math.ceil(scene.duration * fps);
        const from = currentFrame;
        currentFrame += durationInFrames;

        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={durationInFrames}
          >
            <Scene scene={scene} imagePath={images?.[scene.id]} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
`;

    await writeFile(join(srcPath, "Composition.tsx"), compositionContent);

    // Generate src/Scene.tsx
    const sceneContent = `import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { Subtitle } from "./Subtitle";

interface SceneProps {
  scene: {
    id: string;
    type: "intro" | "feature" | "code" | "outro";
    title: string;
    narration: string;
    duration: number;
  };
  imagePath: string | undefined;
}

export const Scene: React.FC<SceneProps> = ({ scene, imagePath }) => {
  const { type, title, narration } = scene;

  const containerStyle: React.CSSProperties = {
    backgroundColor: "white",
    color: "black",
    fontFamily: "sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    textAlign: "center",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 80,
    fontWeight: "bold",
    marginBottom: 40,
    zIndex: 1,
  };

  if (type === "intro" || type === "outro") {
    return (
      <AbsoluteFill
        style={{
          ...containerStyle,
          backgroundColor: "#1a1a1a",
          color: "white",
        }}
      >
        <h1 style={titleStyle}>{title}</h1>
        <Subtitle text={narration} />
      </AbsoluteFill>
    );
  }

  if (type === "feature") {
    return (
      <AbsoluteFill style={containerStyle}>
        <h1 style={{ ...titleStyle, fontSize: 60 }}>{title}</h1>
        {imagePath && (
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              padding: 20,
            }}
          >
            <Img
              src={imagePath}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                boxShadow: "0 0 20px rgba(0,0,0,0.2)",
              }}
            />
          </div>
        )}
        <Subtitle text={narration} />
      </AbsoluteFill>
    );
  }

  return null;
};
`;

    await writeFile(join(srcPath, "Scene.tsx"), sceneContent);

    // Generate src/Subtitle.tsx
    const subtitleContent = `import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface SubtitleProps {
  text: string;
}

export const Subtitle: React.FC<SubtitleProps> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        fontSize: 32,
        color: "white",
        textAlign: "center",
        maxWidth: "90%",
        opacity,
      }}
    >
      {text}
    </div>
  );
};
`;

    await writeFile(join(srcPath, "Subtitle.tsx"), subtitleContent);

    // Generate .gitignore
    const gitignore = `node_modules/
dist/
.DS_Store
*.log
.env
.env.local
`;

    await writeFile(join(projectPath, ".gitignore"), gitignore);

    // Generate README.md
    const readme = `# ${script.title}

Generated Remotion video project.

## Setup

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm start
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Video Duration

Total duration: ${script.scenes.length * 30} seconds
FPS: 30
Resolution: 1920x1080 (16:9)
`;

    await writeFile(join(projectPath, "README.md"), readme);

    // Return success result
    const totalDuration = script.scenes.length * 30;
    const result: GenerateProjectOutput = {
      projectPath,
      mainComponentPath: join(srcPath, "index.ts"),
      scenesCount: script.scenes.length,
      videoConfig: {
        resolution: "1920x1080",
        fps: 30,
        duration: totalDuration,
      },
      success: true,
    };

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      projectPath: "",
      mainComponentPath: "",
      scenesCount: 0,
      videoConfig: {
        resolution: "1920x1080",
        fps: 30,
        duration: 0,
      },
      success: false,
      error: errorMessage,
    };
  }
}
