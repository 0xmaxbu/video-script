import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { readdirSync, statSync, readFileSync, existsSync } from "fs";
import { homedir } from "os";

const VIDEOS_DIR = resolve(homedir(), "simple-videos");

function getVideoMeta(basePath: string, relativePath: string) {
  const scriptPath = resolve(basePath, "script.json");
  const outputMp4Path = resolve(basePath, "output.mp4");
  const outputSrtPath = resolve(basePath, "output.srt");

  if (!existsSync(scriptPath)) return null;

  try {
    const script = JSON.parse(readFileSync(scriptPath, "utf-8"));
    const stats = statSync(basePath);

    return {
      id: relativePath.replace(/\//g, "--"),
      title: script.title || "Untitled",
      path: relativePath,
      outputMp4Path: existsSync(outputMp4Path) ? outputMp4Path : null,
      outputSrtPath: existsSync(outputSrtPath) ? outputSrtPath : null,
      scriptPath,
      duration: script.totalDuration || 0,
      scenesCount: script.scenes?.length || 0,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  } catch {
    return null;
  }
}

function scanVideosRecursively(dir: string, basePath: string = dir): any[] {
  const videos: any[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;

      const fullPath = resolve(dir, entry.name);

      if (entry.isDirectory()) {
        // Check if this directory contains a video project
        if (existsSync(resolve(fullPath, "script.json"))) {
          const relativePath = fullPath.replace(basePath + "/", "");
          const meta = getVideoMeta(fullPath, relativePath);
          if (meta) videos.push(meta);
        }

        // Also scan subdirectories
        videos.push(...scanVideosRecursively(fullPath, basePath));
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return videos;
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "video-api",
      configureServer(server) {
        // GET /api/videos - list all videos
        server.middlewares.use("/api/videos", (req, res) => {
          if (req.method !== "GET") {
            res.statusCode = 405;
            res.end("Method Not Allowed");
            return;
          }

          try {
            const videos = scanVideosRecursively(VIDEOS_DIR);
            // Sort by modified date, newest first
            videos.sort((a, b) =>
              new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
            );
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ videos }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to scan videos" }));
          }
        });

        // GET /api/videos/:id - get single video details
        server.middlewares.use("/api/video/", (req, res) => {
          if (req.method !== "GET") {
            res.statusCode = 405;
            res.end("Method Not Allowed");
            return;
          }

          const id = req.url?.split("?")[0].replace("/", "");
          if (!id) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Video ID required" }));
            return;
          }

          const relativePath = id.replace(/--/g, "/");
          const videoDir = resolve(VIDEOS_DIR, relativePath);

          if (!existsSync(videoDir)) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Video not found" }));
            return;
          }

          try {
            const scriptPath = resolve(videoDir, "script.json");
            const script = JSON.parse(readFileSync(scriptPath, "utf-8"));

            // Load screenshots as base64
            const screenshotsDir = resolve(videoDir, "screenshots");
            const images: Record<string, string> = {};

            if (existsSync(screenshotsDir)) {
              const screenshotFiles = readdirSync(screenshotsDir);
              for (const file of screenshotFiles) {
                if (file.endsWith(".png") || file.endsWith(".jpg")) {
                  const filePath = resolve(screenshotsDir, file);
                  const base64 = readFileSync(filePath).toString("base64");
                  images[file.replace(/\.[^.]+$/, "")] = `data:image/png;base64,${base64}`;
                }
              }
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              id,
              title: script.title,
              script,
              images,
              path: relativePath,
            }));
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Failed to load video" }));
          }
        });

        // Serve video files
        server.middlewares.use("/api/media/", (req, res) => {
          const filePath = req.url?.split("?")[0];
          if (!filePath) {
            res.statusCode = 400;
            res.end("Bad Request");
            return;
          }

          const fullPath = resolve(VIDEOS_DIR, filePath.replace(/^\//, ""));

          if (!existsSync(fullPath)) {
            res.statusCode = 404;
            res.end("Not Found");
            return;
          }

          // Set appropriate content type
          if (fullPath.endsWith(".mp4")) {
            res.setHeader("Content-Type", "video/mp4");
          } else if (fullPath.endsWith(".png")) {
            res.setHeader("Content-Type", "image/png");
          } else if (fullPath.endsWith(".jpg") || fullPath.endsWith(".jpeg")) {
            res.setHeader("Content-Type", "image/jpeg");
          }

          const content = readFileSync(fullPath);
          res.end(content);
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3456,
  },
});
