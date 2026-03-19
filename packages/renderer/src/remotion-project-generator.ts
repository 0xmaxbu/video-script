import { mkdir, writeFile } from "fs/promises";
import { spawn } from "child_process";
import { join, resolve } from "path";
import { z } from "zod";
import { ScriptOutput } from "./types.js";

const GenerateProjectInputSchema = z.object({
  script: z.object({
    title: z.string(),
    totalDuration: z.number().positive(),
    scenes: z.array(
      z.object({
        id: z.string(),
        type: z.enum(["intro", "feature", "code", "outro"]),
        title: z.string(),
        narration: z.string(),
        duration: z.number().positive(),
        visualLayers: z
          .array(
            z.object({
              id: z.string(),
              type: z.enum(["screenshot", "code", "text", "diagram", "image"]),
              position: z.object({
                x: z.union([z.number(), z.enum(["left", "center", "right"])]),
                y: z.union([z.number(), z.enum(["top", "center", "bottom"])]),
                width: z.union([
                  z.number(),
                  z.literal("auto"),
                  z.literal("full"),
                ]),
                height: z.union([
                  z.number(),
                  z.literal("auto"),
                  z.literal("full"),
                ]),
                zIndex: z.number().default(0),
              }),
              content: z.string(),
              animation: z.object({
                enter: z.enum([
                  "fadeIn",
                  "slideLeft",
                  "slideRight",
                  "slideUp",
                  "slideDown",
                  "zoomIn",
                  "typewriter",
                  "none",
                ]),
                enterDelay: z.number().default(0),
                exit: z.enum(["fadeOut", "slideOut", "zoomOut", "none"]),
                exitAt: z.number().optional(),
              }),
            }),
          )
          .optional(),
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

export async function generateRemotionProject(
  input: GenerateProjectInput,
): Promise<GenerateProjectOutput> {
  try {
    const validated = GenerateProjectInputSchema.parse(input);
    const { script, screenshotResources, outputPath } = validated;

    const projectPath = resolve(outputPath);
    const srcPath = join(projectPath, "src");
    const scenesPath = join(srcPath, "scenes");
    const publicPath = join(projectPath, "public");

    await mkdir(projectPath, { recursive: true });
    await mkdir(srcPath, { recursive: true });
    await mkdir(scenesPath, { recursive: true });
    await mkdir(publicPath, { recursive: true });

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
        "@remotion/bundler": "4.0.436",
        "@remotion/cli": "4.0.436",
        "@remotion/renderer": "4.0.436",
        "@remotion/studio": "4.0.436",
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

    // Install dependencies so remotion binary is available
    await new Promise<void>((resolve, reject) => {
      const npm = spawn("npm", ["install", "--ignore-scripts"], {
        cwd: projectPath,
        stdio: "pipe",
      });
      let stderr = "";
      npm.stderr?.on("data", (data: Buffer) => {
        stderr += data.toString();
      });
      npm.on("close", (code: number | null) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed: ${stderr}`));
        }
      });
      npm.on("error", (err) => {
        reject(err);
      });
    });

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

    // Create remotion.config.ts to fix webpack alias issue with @remotion/studio
    // The @remotion/bundler aliases @remotion/studio to dist/index.js which breaks
    // subpath imports like @remotion/studio/renderEntry. We override to use the
    // ESM entry which properly supports subpath resolution.
    const remotionConfigContent = `const path = require("path");
const { Config } = require("@remotion/cli/config");

Config.overrideWebpackConfig((currentConfiguration) => {
  // Point @remotion/studio to its ESM entry instead of CJS entry
  // This fixes the subpath import issue (e.g., @remotion/studio/renderEntry)
  const studioEsmPath = path.join(__dirname, "node_modules", "@remotion", "studio", "dist", "esm", "index.mjs");
  const { alias } = currentConfiguration.resolve || {};
  
  // Remove the problematic @remotion/studio alias entirely
  // so subpaths resolve correctly through normal node_modules resolution
  const newAlias = Object.fromEntries(
    Object.entries(alias || {}).filter(([key]) => key !== "@remotion/studio")
  );
  
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: newAlias,
    },
  };
});
`;

    await writeFile(
      join(projectPath, "remotion.config.ts"),
      remotionConfigContent,
    );

    const indexContent = `import { registerRoot } from "remotion";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    StrictMode ? <StrictMode><RemotionRoot /></StrictMode> : <RemotionRoot />
  );
}
`;

    await writeFile(join(srcPath, "index.tsx"), indexContent);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Remotion Video</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { width: 100%; height: 100%; overflow: hidden; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./index.js"></script>
</body>
</html>
`;

    await writeFile(join(projectPath, "index.html"), htmlContent);

    const rootContent = `import React from "react";
import { Composition } from "remotion";
import { z } from "zod";
import { VideoComposition } from "./Composition";

const compositionSchema = z.object({
  script: z.object({
    title: z.string(),
    totalDuration: z.number().positive(),
    scenes: z.array(
      z.object({
        id: z.string(),
        type: z.enum(["intro", "feature", "code", "outro"]),
        title: z.string(),
        narration: z.string(),
        duration: z.number().positive(),
        visualLayers: z.array(z.any()).optional(),
      })
    ),
    transitions: z.array(z.any()).optional(),
  }),
  images: z.record(z.string(), z.string()).optional(),
});

export const RemotionRoot: React.FC = () => {
  const script = ${JSON.stringify(script)};
  const images = ${JSON.stringify(screenshotResources)};
  const totalDuration = script.scenes.length * 30;

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

    const gitignore = `node_modules/
dist/
.DS_Store
*.log
.env
.env.local
`;

    await writeFile(join(projectPath, ".gitignore"), gitignore);

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
