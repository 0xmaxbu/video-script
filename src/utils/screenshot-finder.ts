import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export function findScreenshotFile(
  screenshotsDir: string,
  sceneIndex: number,
  layerId: string,
): string | null {
  const files = readdirSync(screenshotsDir).filter((f) => f.endsWith(".png"));

  const exactPath = join(screenshotsDir, `${layerId}.png`);
  if (existsSync(exactPath)) {
    return exactPath;
  }

  const scenePrefix = `scene-${String(sceneIndex + 1).padStart(3, "0")}`;
  const sceneLayerPattern = `${scenePrefix}-${layerId}.png`;
  const sceneLayerMatch = files.find((f) => f === sceneLayerPattern);
  if (sceneLayerMatch) {
    return join(screenshotsDir, sceneLayerMatch);
  }

  const scenePrefixMatch = files.find((f) => f.startsWith(scenePrefix));
  if (scenePrefixMatch) {
    return join(screenshotsDir, scenePrefixMatch);
  }

  return null;
}
