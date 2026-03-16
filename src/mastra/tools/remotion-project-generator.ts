import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import fs from "fs";
import path from "path";

const SceneSchema = z.object({
  id: z.string(),
  type: z.enum(["intro", "feature", "code", "outro"]),
  title: z.string(),
  narration: z.string(),
  duration: z.number(),
  code: z
    .object({
      language: z.string(),
      code: z.string(),
      highlightLines: z.array(z.number()).optional(),
    })
    .optional(),
});

const ScriptSchema = z.object({
  title: z.string(),
  totalDuration: z.number(),
  scenes: z.array(SceneSchema),
});

export const remotionProjectGeneratorTool = createTool({
  id: "remotion-project-generator",
  description: "生成 Remotion 项目结构，包含组件文件和配置文件",
  inputSchema: z.object({
    script: ScriptSchema.describe("视频脚本数据"),
    screenshotDir: z.string().describe("截图目录路径"),
    outputDir: z.string().describe("项目输出目录"),
    projectConfig: z
      .object({
        width: z.number().default(1920),
        height: z.number().default(1080),
        fps: z.number().default(30),
      })
      .optional()
      .describe("视频配置"),
  }),
  outputSchema: z.object({
    projectPath: z.string().describe("生成的项目路径"),
    videoConfig: z.object({
      resolution: z.string(),
      fps: z.number(),
      duration: z.number(),
    }),
    readyForRender: z.boolean().describe("项目是否准备好渲染"),
    error: z.string().optional().describe("错误信息"),
  }),
  execute: async ({ script, screenshotDir, outputDir, projectConfig }) => {
    try {
      const config = {
        width: projectConfig?.width ?? 1920,
        height: projectConfig?.height ?? 1080,
        fps: projectConfig?.fps ?? 30,
      };

      const projectName = `video-${Date.now()}`;
      const projectPath = path.join(outputDir, projectName);

      fs.mkdirSync(projectPath, { recursive: true });
      fs.mkdirSync(path.join(projectPath, "src"), { recursive: true });
      fs.mkdirSync(path.join(projectPath, "public"), { recursive: true });

      const rootContent = generateRootFile(script.title);
      fs.writeFileSync(path.join(projectPath, "src", "Root.tsx"), rootContent);

      const compositionContent = generateCompositionFile(script);
      fs.writeFileSync(
        path.join(projectPath, "src", "Composition.tsx"),
        compositionContent,
      );

      const indexContent = generateIndexFile();
      fs.writeFileSync(path.join(projectPath, "src", "index.ts"), indexContent);

      const packageJsonContent = generatePackageJson(projectName);
      fs.writeFileSync(
        path.join(projectPath, "package.json"),
        packageJsonContent,
      );

      const tsConfigContent = generateTsConfig();
      fs.writeFileSync(
        path.join(projectPath, "tsconfig.json"),
        tsConfigContent,
      );

      const remotionConfigContent = generateRemotionConfig();
      fs.writeFileSync(
        path.join(projectPath, "remotion.config.ts"),
        remotionConfigContent,
      );

      if (fs.existsSync(screenshotDir)) {
        const images = fs.readdirSync(screenshotDir);
        for (const image of images) {
          const srcPath = path.join(screenshotDir, image);
          const destPath = path.join(projectPath, "public", image);
          if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }

      return {
        projectPath,
        videoConfig: {
          resolution: `${config.width}x${config.height}`,
          fps: config.fps,
          duration: script.totalDuration,
        },
        readyForRender: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      return {
        projectPath: "",
        videoConfig: {
          resolution: "1920x1080",
          fps: 30,
          duration: 0,
        },
        readyForRender: false,
        error: `生成项目失败: ${errorMessage}`,
      };
    }
  },
});

function generateRootFile(title: string): string {
  const safeId = title.replace(/[^a-zA-Z0-9]/g, "-");
  return `import React from "react";
import { Composition } from "remotion";
import { VideoComposition } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="${safeId}"
      component={VideoComposition}
      durationInFrames={9000}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
`;
}

function generateCompositionFile(script: z.infer<typeof ScriptSchema>): string {
  const scenesCode = script.scenes
    .map((scene) => {
      const codeField = scene.code
        ? `, code: ${JSON.stringify(scene.code)}`
        : "";
      return `    {
      id: "${scene.id}",
      type: "${scene.type}",
      title: ${JSON.stringify(scene.title)},
      narration: ${JSON.stringify(scene.narration)},
      duration: ${scene.duration}${codeField}
    }`;
    })
    .join(",\n");

  return `import React from "react";
import { Sequence, useVideoConfig, AbsoluteFill, Img } from "remotion";

const scenes = [
${scenesCode}
];

const sceneImages: Record<string, string> = {};

export const VideoComposition: React.FC = () => {
  const { fps } = useVideoConfig();
  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {scenes.map((scene) => {
        const durationInFrames = Math.ceil(scene.duration * fps);
        const from = currentFrame;
        currentFrame += durationInFrames;

        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={durationInFrames}
          >
            <Scene scene={scene} imagePath={sceneImages[scene.id]} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

interface SceneProps {
  scene: typeof scenes[0];
  imagePath?: string;
}

const Scene: React.FC<SceneProps> = ({ scene, imagePath }) => {
  const containerStyle: React.CSSProperties = {
    backgroundColor: scene.type === "outro" || scene.type === "intro" ? "#1a1a1a" : "white",
    color: scene.type === "outro" || scene.type === "intro" ? "white" : "black",
    fontFamily: "sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    textAlign: "center",
    width: "100%",
    height: "100%",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: scene.type === "intro" || scene.type === "outro" ? 100 : 60,
    fontWeight: "bold",
    marginBottom: 40,
  };

  if (scene.type === "intro" || scene.type === "outro") {
    return (
      <AbsoluteFill style={containerStyle}>
        <h1 style={titleStyle}>{scene.title}</h1>
        <div style={{ fontSize: 40, opacity: 0.8 }}>{scene.narration}</div>
      </AbsoluteFill>
    );
  }

  if (scene.type === "feature") {
    return (
      <AbsoluteFill style={containerStyle}>
        <h1 style={titleStyle}>{scene.title}</h1>
        {imagePath && (
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Img src={imagePath} style={{ maxWidth: "100%", maxHeight: "100%" }} />
          </div>
        )}
        <div style={{ fontSize: 32, marginTop: 20 }}>{scene.narration}</div>
      </AbsoluteFill>
    );
  }

  if (scene.type === "code" && scene.code) {
    return (
      <AbsoluteFill style={{ ...containerStyle, backgroundColor: "#282c34", color: "#abb2bf", alignItems: "flex-start", textAlign: "left" }}>
        <h1 style={{ ...titleStyle, color: "white", fontSize: 50, width: "100%", textAlign: "center" }}>{scene.title}</h1>
        <pre style={{ flex: 1, width: "100%", padding: 40, overflow: "hidden", fontSize: 24, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
          {scene.code.code}
        </pre>
        <div style={{ fontSize: 32, width: "100%", textAlign: "center" }}>{scene.narration}</div>
      </AbsoluteFill>
    );
  }

  return null;
};
`;
}

function generateIndexFile(): string {
  return `import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
`;
}

function generatePackageJson(projectName: string): string {
  const pkg = {
    name: projectName,
    version: "1.0.0",
    description: "Generated video project",
    scripts: {
      start: "remotion studio",
      build: "remotion render Video out/video.mp4",
    },
    dependencies: {
      remotion: "^4.0.0",
      react: "^18.2.0",
      "react-dom": "^18.2.0",
    },
    devDependencies: {
      "@types/react": "^18.2.0",
      typescript: "^5.0.0",
    },
  };

  return JSON.stringify(pkg, null, 2);
}

function generateTsConfig(): string {
  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      module: "ES2022",
      moduleResolution: "bundler",
      jsx: "react-jsx",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    include: ["src/**/*"],
  };

  return JSON.stringify(tsconfig, null, 2);
}

function generateRemotionConfig(): string {
  return `import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
`;
}
