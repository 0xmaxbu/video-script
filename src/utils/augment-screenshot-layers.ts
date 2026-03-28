/**
 * augment-screenshot-layers — extracted from src/cli/index.ts
 *
 * Reads image dimensions for every screenshot-type visual layer and injects:
 *   - naturalSize: { width, height }
 *   - kenBurnsWaypoints: pan/zoom waypoints for the renderer
 *
 * Shared between main CLI flow and TEST-01 fixture pipeline.
 */

import sharp from "sharp";
import type { SceneScript } from "../types/script.js";
import type { KenBurnsWaypoint } from "../types/index.js";

const MAX_WEB_HEIGHT = 5400;

/**
 * Auto-generate pan waypoints for a web screenshot.
 * Produces an overview waypoint followed by one waypoint per 1080-px section.
 */
export function generateWebPageWaypoints(
  imgW: number,
  imgH: number,
  durationSeconds: number,
  fps: number,
): KenBurnsWaypoint[] {
  const CONTAINER_W = 1920;
  const CONTAINER_H = 1080;
  const effectiveH = Math.min(imgH, MAX_WEB_HEIGHT);
  const overviewScale = Math.min(CONTAINER_W / imgW, CONTAINER_H / effectiveH);
  const totalFrames = Math.round(durationSeconds * fps);

  // Image already fits in the frame — no panning needed
  if (imgH <= CONTAINER_H) {
    return [
      {
        focalX: 0.5,
        focalY: 0.5,
        scale: overviewScale,
        holdFrames: totalFrames,
      },
    ];
  }

  const numSections = Math.ceil(effectiveH / CONTAINER_H);

  // Allocate ≈0.5 s for the overview, 70% of total for section holds, rest for travel
  const overviewHoldFrames = Math.min(
    Math.round(fps * 0.5),
    Math.round(totalFrames * 0.15),
  );
  const sectionHoldFrames = Math.round((totalFrames * 0.7) / numSections);

  // Maximum focalY so the bottom of the image stays on-screen at scale = 1
  const maxFocalY = Math.max(0.5, 1 - CONTAINER_H / 2 / imgH);

  const waypoints: KenBurnsWaypoint[] = [
    {
      focalX: 0.5,
      focalY: 0.5,
      scale: overviewScale,
      holdFrames: overviewHoldFrames,
      travelFrames: 15, // 0.5 s zoom-in: overview → first section
    },
  ];

  for (let i = 0; i < numSections; i++) {
    const sectionCenterY = (i + 0.5) * CONTAINER_H;
    const focalY = Math.min(maxFocalY, sectionCenterY / imgH);
    waypoints.push({
      focalX: 0.5,
      focalY,
      scale: 1.0,
      holdFrames: sectionHoldFrames,
      travelFrames: 12, // 0.4 s camera travel: section → next section
    });
  }

  return waypoints;
}

/**
 * For each screenshot-type layer in scenes, read the image dimensions and
 * inject `naturalSize` + `kenBurnsWaypoints` so the renderer can pan/zoom.
 *
 * @param scenes  - Scene list (from adaptScriptForRenderer or direct fixture)
 * @param images  - Map of "<sceneId>-<layerId>" → absolute image path
 * @param fps     - Frames per second (for waypoint frame calculations)
 * @returns New scene array with screenshot layers augmented in-place (immutable)
 */
export async function augmentScreenshotLayers(
  scenes: SceneScript[],
  images: Record<string, string>,
  fps: number,
): Promise<SceneScript[]> {
  return Promise.all(
    scenes.map(async (scene) => {
      if (!scene.visualLayers || scene.visualLayers.length === 0) return scene;

      const augmentedLayers = await Promise.all(
        scene.visualLayers.map(async (layer) => {
          if (layer.type !== "screenshot") return layer;
          const imgPath = images[`${scene.id}-${layer.id}`];
          if (!imgPath) return layer;

          try {
            const metadata = await sharp(imgPath).metadata();
            let imgW = metadata.width ?? 1920;
            let imgH = metadata.height ?? 1080;

            // Cap image to 4800×2700 before rendering (crop, not scale)
            const MAX_W = 4800;
            const MAX_H = 2700;
            if (imgW > MAX_W || imgH > MAX_H) {
              const cropW = Math.min(imgW, MAX_W);
              const cropH = Math.min(imgH, MAX_H);
              await sharp(imgPath)
                .extract({ left: 0, top: 0, width: cropW, height: cropH })
                .toFile(imgPath + ".tmp.png");
              const { rename } = await import("fs/promises");
              await rename(imgPath + ".tmp.png", imgPath);
              imgW = cropW;
              imgH = cropH;
            }

            const waypoints = generateWebPageWaypoints(
              imgW,
              imgH,
              scene.duration,
              fps,
            );
            return {
              ...layer,
              naturalSize: { width: imgW, height: imgH },
              kenBurnsWaypoints: waypoints,
            };
          } catch {
            // If sharp fails, leave the layer untouched
            return layer;
          }
        }),
      );

      return { ...scene, visualLayers: augmentedLayers };
    }),
  );
}
