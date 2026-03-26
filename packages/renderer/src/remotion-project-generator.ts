import { mkdir, writeFile, cp } from "fs/promises";
import { spawn } from "child_process";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { ScriptOutput, ScriptOutputSchema } from "./types.js";

// __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// D-02c: Use proper schemas instead of z.any() for transition and annotations
const GenerateProjectInputSchema = z.object({
  script: ScriptOutputSchema,
  screenshotResources: z.record(z.string(), z.string()),
  outputPath: z.string().min(1),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
});

export interface GenerateProjectInput {
  script: ScriptOutput;
  screenshotResources: Record<string, string>;
  outputPath: string;
  width?: number;
  height?: number;
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
    const { script, screenshotResources, outputPath, width, height } =
      validated;

    const projectPath = resolve(outputPath);
    const srcPath = join(projectPath, "src");
    const scenesPath = join(srcPath, "scenes");
    const publicPath = join(projectPath, "public");

    await mkdir(projectPath, { recursive: true });
    await mkdir(srcPath, { recursive: true });
    await mkdir(scenesPath, { recursive: true });
    await mkdir(publicPath, { recursive: true });

    let processedScreenshotResources: Record<string, string> = {};
    if (screenshotResources) {
      const { existsSync, readFileSync } = await import("fs");
      for (const [key, srcPath] of Object.entries(screenshotResources)) {
        if (existsSync(srcPath)) {
          try {
            const buffer = readFileSync(srcPath);
            const base64 = buffer.toString("base64");
            const filename = srcPath.split("/").pop() || `${key}.png`;
            const ext = filename.split(".").pop()?.toLowerCase() || "png";
            const mimeType =
              ext === "png"
                ? "image/png"
                : ext === "jpg" || ext === "jpeg"
                  ? "image/jpeg"
                  : "image/png";
            processedScreenshotResources[key] =
              `data:${mimeType};base64,${base64}`;
          } catch {
            console.warn(`Failed to read screenshot: ${srcPath}`);
          }
        }
      }
    }

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
        "@remotion/transitions": "4.0.436",
        "@remotion/player": "4.0.436",
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

    const indexContent = `import React, { useRef, useEffect } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@remotion/player";
import { VideoComposition } from "./remotion/Composition";

// Expose variables for puppeteer renderer setup
const script = (window as any).remotion_script || { scenes: [{ duration: 10 }] };
const images = (window as any).remotion_screenshotResources || {};

const App = () => {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    (window as any).remotion_setFrame = (frame: number) => {
      if (playerRef.current) {
        playerRef.current.seekTo(frame);
      }
    };
  }, []);

  return (
    <Player
      ref={playerRef}
      component={VideoComposition}
      inputProps={{ script, images }}
      durationInFrames={Math.ceil((script.scenes.length || 1) * 30 * 30)}
      compositionWidth={${width}}
      compositionHeight={${height}}
      fps={30}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    StrictMode ? <StrictMode><App /></StrictMode> : <App />
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
import { VideoComposition } from "./remotion/Composition";

// D-02c: Proper schema definitions instead of z.any()
const PositionSchema = z.object({
  x: z.union([z.number(), z.enum(["left", "center", "right"])]),
  y: z.union([z.number(), z.enum(["top", "center", "bottom"])]),
  width: z.union([z.number(), z.literal("auto"), z.literal("full")]),
  height: z.union([z.number(), z.literal("auto"), z.literal("full")]),
  zIndex: z.number().default(0),
});

const AnimationConfigSchema = z.object({
  enter: z.enum(["fadeIn", "slideLeft", "slideRight", "slideUp", "slideDown", "slideIn", "zoomIn", "typewriter", "none"]),
  enterDelay: z.number().default(0),
  exit: z.enum(["fadeOut", "slideOut", "zoomOut", "none"]),
  exitAt: z.number().optional(),
});

const VisualLayerSchema = z.object({
  id: z.string(),
  type: z.enum(["screenshot", "code", "text", "diagram", "image"]),
  position: PositionSchema,
  content: z.string(),
  animation: AnimationConfigSchema,
});

const SceneTransitionSchema = z.object({
  type: z.enum(["fade", "slide", "wipe", "flip", "clockWipe", "iris", "none"]),
  duration: z.number().min(0).max(1),
});

const AnnotationTargetSchema = z.object({
  type: z.enum(["text", "region", "code-line"]),
  textMatch: z.string().optional(),
  lineNumber: z.number().int().positive().optional(),
  region: z.enum(["top-left", "top-right", "center", "bottom-left", "bottom-right"]).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});

const AnnotationSchema = z.object({
  type: z.enum(["circle", "underline", "arrow", "box", "highlight", "number", "crossout", "checkmark"]),
  target: AnnotationTargetSchema,
  style: z.object({
    color: z.enum(["attention", "highlight", "info", "success"]),
    size: z.enum(["small", "medium", "large"]),
  }),
  narrationBinding: z.object({
    triggerText: z.string(),
    segmentIndex: z.number().int().nonnegative(),
    appearAt: z.number().nonnegative(),
  }),
});

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
        visualLayers: z.array(VisualLayerSchema).optional(),
        transition: SceneTransitionSchema.optional(),
        annotations: z.array(AnnotationSchema).optional(),
      })
    ),
  }),
  images: z.record(z.string(), z.string()).optional(),
  compositionId: z.enum(["Video", "VideoPortrait"]).optional(),
});

export const RemotionRoot: React.FC = () => {
  const script = ${JSON.stringify(script)};
  const images = ${JSON.stringify(processedScreenshotResources)};
  const totalDuration = script.scenes.length * 30;

  return (
    <>
      <Composition
        id="Video"
        component={VideoComposition as any}
        durationInFrames={Math.ceil(totalDuration * 30)}
        fps={30}
        width={${validated.width}}
        height={${validated.height}}
        schema={compositionSchema}
        defaultProps={{
          script,
          images,
        }}
      />
      <Composition
        id="VideoPortrait"
        component={VideoComposition as any}
        durationInFrames={Math.ceil(totalDuration * 30)}
        fps={30}
        width={1080}
        height={1920}
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

    // Copy Phase 14 compiled components to temp project.
    // At runtime, __dirname = packages/renderer/dist/
    // These compiled .js files have all type-only imports erased and only
    // depend on remotion + @remotion/transitions (already in temp package.json).
    await cp(join(__dirname, "utils"), join(srcPath, "utils"), {
      recursive: true,
    });
    await cp(join(__dirname, "remotion"), join(srcPath, "remotion"), {
      recursive: true,
    });


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
        resolution: `${width}x${height}`,
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
