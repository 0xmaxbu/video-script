import {
  spring,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  AnimationConfigSchema,
  SceneNarrativeType,
  KenBurnsWaypoint,
} from "../types.js";
import type { z } from "zod";

type AnimationConfig = z.infer<typeof AnimationConfigSchema>;

export const SPRING_PRESETS = {
  snappy: { damping: 12, stiffness: 100 },
  smooth: { damping: 100, stiffness: 200 },
  soft: { damping: 100, stiffness: 150 },
  punchy: { damping: 100, stiffness: 300 },
  bouncy: { damping: 8, stiffness: 200 },
} as const;

type SpringPresetName = keyof typeof SPRING_PRESETS;

export const ENTER_ANIMATION_CONFIG: Record<
  AnimationConfig["enter"],
  { preset: SpringPresetName; durationFrames: number }
> = {
  fadeIn: { preset: "smooth", durationFrames: 15 },
  slideUp: { preset: "smooth", durationFrames: 12 },
  slideDown: { preset: "smooth", durationFrames: 12 },
  slideLeft: { preset: "smooth", durationFrames: 12 },
  slideRight: { preset: "smooth", durationFrames: 12 },
  slideIn: { preset: "smooth", durationFrames: 12 },
  zoomIn: { preset: "snappy", durationFrames: 18 },
  typewriter: { preset: "smooth", durationFrames: 0 },
  none: { preset: "smooth", durationFrames: 0 },
};

export function useEnterAnimation(animation: AnimationConfig): {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
} {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterFrame = Math.max(0, frame - animation.enterDelay * fps);

  const { preset, durationFrames } = ENTER_ANIMATION_CONFIG[animation.enter];

  const springConfig: {
    frame: number;
    fps: number;
    config: (typeof SPRING_PRESETS)[SpringPresetName] & { mass: number };
    durationInFrames?: number;
  } = {
    frame: enterFrame,
    fps,
    config: { ...SPRING_PRESETS[preset], mass: 1 },
  };

  if (durationFrames > 0) {
    springConfig.durationInFrames = durationFrames;
  }

  const springProgress = spring(springConfig);

  const opacity = interpolate(
    enterFrame,
    [0, 30],
    animation.enter === "fadeIn" ? [0, 1] : [1, 1],
    { extrapolateRight: "clamp" },
  );

  const translateX = interpolate(
    springProgress,
    [0, 1],
    animation.enter === "slideLeft" || animation.enter === "slideIn"
      ? [100, 0]
      : animation.enter === "slideRight"
        ? [-100, 0]
        : [0, 0],
  );

  const translateY = interpolate(
    springProgress,
    [0, 1],
    animation.enter === "slideUp"
      ? [100, 0]
      : animation.enter === "slideDown"
        ? [-100, 0]
        : [0, 0],
  );

  const scale = interpolate(
    springProgress,
    [0, 1],
    animation.enter === "zoomIn" ? [0.8, 1] : [1, 1],
  );

  return { opacity, translateX, translateY, scale };
}

export function useExitAnimation(animation: AnimationConfig): {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
} {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (animation.exitAt === undefined || animation.exit === "none") {
    return { opacity: 1, translateX: 0, translateY: 0, scale: 1 };
  }

  const exitStartFrame = animation.exitAt * fps;
  const exitDuration = 30;

  if (frame < exitStartFrame) {
    return { opacity: 1, translateX: 0, translateY: 0, scale: 1 };
  }

  const exitFrame = frame - exitStartFrame;

  const opacity = interpolate(
    exitFrame,
    [0, exitDuration],
    animation.exit === "fadeOut" || animation.exit === "zoomOut"
      ? [1, 0]
      : animation.exit === "slideOut"
        ? [1, 0]
        : [1, 1],
    { extrapolateRight: "clamp" },
  );

  const translateX = interpolate(
    exitFrame,
    [0, exitDuration],
    animation.exit === "slideOut" ? [0, 100] : [0, 0],
    { extrapolateRight: "clamp" },
  );

  const translateY = interpolate(
    exitFrame,
    [0, exitDuration],
    animation.exit === "slideOut" ? [0, 100] : [0, 0],
    { extrapolateRight: "clamp" },
  );

  const scale = interpolate(
    exitFrame,
    [0, exitDuration],
    animation.exit === "zoomOut" ? [1, 0.8] : [1, 1],
    { extrapolateRight: "clamp" },
  );

  return { opacity, translateX, translateY, scale };
}

export function useKenBurns(sceneType: SceneNarrativeType): {
  scale: number;
  translateX: number;
  translateY: number;
} {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  if (sceneType === "code") {
    return { scale: 1, translateX: 0, translateY: 0 };
  }

  if (sceneType === "intro") {
    const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.1], {
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.ease),
    });
    return { scale, translateX: 0, translateY: 0 };
  }

  const scale = interpolate(frame, [0, durationInFrames], [1.1, 1.0], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  return { scale, translateX: 0, translateY: 0 };
}

export function useParallax(
  zIndex: number,
  baseSpeed: number = 30,
): {
  translateX: number;
  translateY: number;
} {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const speed = baseSpeed * (zIndex + 1);

  const translateX = interpolate(frame, [0, durationInFrames], [0, speed], {
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(
    frame,
    [0, durationInFrames],
    [0, speed * 0.5],
    { extrapolateRight: "clamp" },
  );

  return { translateX, translateY };
}

export function staggerDelay(index: number, delayPerItem: number = 10): number {
  return index * delayPerItem;
}

/**
 * Web-page pan animation: camera travels between focal waypoints on a
 * 1:1-pixel web screenshot.
 *
 * Coordinate model:
 *   container = 1920 × 1080 (video frame), overflow: hidden
 *   image     = naturalSize.width × naturalSize.height at CSS scale `scale`
 *   focalX/Y  = 0-1 fractions of the image
 *
 * Translation formula (transform-origin: 0 0):
 *   tx = containerW/2  − focalX * imgW * scale
 *   ty = containerH/2  − focalY * imgH * scale
 *
 * Overview waypoint: scale = min(1920/imgW, 1080/effectiveImgH)
 * Zoom-in waypoint:  scale = 1.0  (1 image pixel = 1 screen pixel)
 *
 * Maximum image height considered for overview: MAX_WEB_HEIGHT (5 × 1080 px).
 */
export const MAX_WEB_HEIGHT = 5400;

export function useWebPagePan(
  waypoints: KenBurnsWaypoint[],
  naturalSize: { width: number; height: number },
): { scale: number; translateX: number; translateY: number } {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const CONTAINER_W = 1920;
  const CONTAINER_H = 1080;
  const imgW = naturalSize.width;
  const imgH = naturalSize.height;

  const toXY = (s: number, fx: number, fy: number) => ({
    translateX: CONTAINER_W / 2 - fx * imgW * s,
    translateY: CONTAINER_H / 2 - fy * imgH * s,
  });

  if (!waypoints || waypoints.length === 0) {
    const effectiveH = Math.min(imgH, MAX_WEB_HEIGHT);
    const overviewScale = Math.min(
      CONTAINER_W / imgW,
      CONTAINER_H / effectiveH,
    );
    return { scale: overviewScale, ...toXY(overviewScale, 0.5, 0.5) };
  }

  if (waypoints.length === 1) {
    const wp = waypoints[0];
    return { scale: wp.scale, ...toXY(wp.scale, wp.focalX, wp.focalY) };
  }

  // ── Build timeline (identical structure to useAdvancedKenBurns) ──────────
  const totalHoldFrames = waypoints.reduce((sum, wp) => sum + wp.holdFrames, 0);
  const numTravelSegments = waypoints.length - 1;
  const totalTravelFrames = Math.max(
    numTravelSegments,
    durationInFrames - totalHoldFrames,
  );
  const travelFramesPerSegment = totalTravelFrames / numTravelSegments;

  interface Seg {
    startFrame: number;
    endFrame: number;
    type: "hold" | "travel";
    waypointIdx?: number;
    fromIdx?: number;
    toIdx?: number;
  }

  const timeline: Seg[] = [];
  let cursor = 0;
  for (let i = 0; i < waypoints.length; i++) {
    if (waypoints[i].holdFrames > 0) {
      timeline.push({
        startFrame: cursor,
        endFrame: cursor + waypoints[i].holdFrames,
        type: "hold",
        waypointIdx: i,
      });
      cursor += waypoints[i].holdFrames;
    }
    if (i < waypoints.length - 1) {
      timeline.push({
        startFrame: cursor,
        endFrame: cursor + travelFramesPerSegment,
        type: "travel",
        fromIdx: i,
        toIdx: i + 1,
      });
      cursor += travelFramesPerSegment;
    }
  }

  const seg =
    timeline.find((s) => frame >= s.startFrame && frame < s.endFrame) ??
    timeline[timeline.length - 1];

  let scale: number, focalX: number, focalY: number;

  if (seg.type === "hold") {
    const wp = waypoints[seg.waypointIdx!];
    scale = wp.scale;
    focalX = wp.focalX;
    focalY = wp.focalY;
  } else {
    const fromWp = waypoints[seg.fromIdx!];
    const toWp = waypoints[seg.toIdx!];
    const segLen = seg.endFrame - seg.startFrame;
    const rawProgress = segLen > 0 ? (frame - seg.startFrame) / segLen : 1;
    const eased = Easing.inOut(Easing.ease)(
      Math.min(1, Math.max(0, rawProgress)),
    );
    scale = interpolate(eased, [0, 1], [fromWp.scale, toWp.scale]);
    focalX = interpolate(eased, [0, 1], [fromWp.focalX, toWp.focalX]);
    focalY = interpolate(eased, [0, 1], [fromWp.focalY, toWp.focalY]);
  }

  return { scale, ...toXY(scale, focalX, focalY) };
}

/**
 * Multi-focal Ken Burns: camera travels between focal waypoints with optional
 * hold phases at each waypoint. Each waypoint specifies a focal point
 * (focalX/focalY as 0-1 fractions of the image) and zoom scale.
 *
 * Timeline: hold at wp[0] → travel to wp[1] → hold at wp[1] → travel to wp[2] → …
 * Travel frames are distributed evenly across all transition segments.
 */
export function useAdvancedKenBurns(waypoints: KenBurnsWaypoint[]): {
  scale: number;
  translateX: number;
  translateY: number;
} {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  if (!waypoints || waypoints.length === 0) {
    return { scale: 1, translateX: 0, translateY: 0 };
  }

  if (waypoints.length === 1) {
    const wp = waypoints[0];
    const scale = wp.scale;
    return {
      scale,
      translateX: width * scale * (0.5 - wp.focalX),
      translateY: height * scale * (0.5 - wp.focalY),
    };
  }

  // Build timeline segments
  const totalHoldFrames = waypoints.reduce((sum, wp) => sum + wp.holdFrames, 0);
  const numTravelSegments = waypoints.length - 1;
  const totalTravelFrames = Math.max(
    numTravelSegments,
    durationInFrames - totalHoldFrames,
  );
  const travelFramesPerSegment = totalTravelFrames / numTravelSegments;

  interface TimelineSegment {
    startFrame: number;
    endFrame: number;
    type: "hold" | "travel";
    waypointIdx?: number;
    fromIdx?: number;
    toIdx?: number;
  }

  const timeline: TimelineSegment[] = [];
  let cursor = 0;

  for (let i = 0; i < waypoints.length; i++) {
    // Hold at waypoint i
    if (waypoints[i].holdFrames > 0) {
      timeline.push({
        startFrame: cursor,
        endFrame: cursor + waypoints[i].holdFrames,
        type: "hold",
        waypointIdx: i,
      });
      cursor += waypoints[i].holdFrames;
    }
    // Travel to next waypoint
    if (i < waypoints.length - 1) {
      timeline.push({
        startFrame: cursor,
        endFrame: cursor + travelFramesPerSegment,
        type: "travel",
        fromIdx: i,
        toIdx: i + 1,
      });
      cursor += travelFramesPerSegment;
    }
  }

  // Find active segment (clamp to last if past end)
  const seg =
    timeline.find((s) => frame >= s.startFrame && frame < s.endFrame) ??
    timeline[timeline.length - 1];

  let scale: number, focalX: number, focalY: number;

  if (seg.type === "hold") {
    const wp = waypoints[seg.waypointIdx!];
    scale = wp.scale;
    focalX = wp.focalX;
    focalY = wp.focalY;
  } else {
    const fromWp = waypoints[seg.fromIdx!];
    const toWp = waypoints[seg.toIdx!];
    const segLen = seg.endFrame - seg.startFrame;
    const rawProgress = segLen > 0 ? (frame - seg.startFrame) / segLen : 1;
    const eased = Easing.inOut(Easing.ease)(
      Math.min(1, Math.max(0, rawProgress)),
    );

    scale = interpolate(eased, [0, 1], [fromWp.scale, toWp.scale]);
    focalX = interpolate(eased, [0, 1], [fromWp.focalX, toWp.focalX]);
    focalY = interpolate(eased, [0, 1], [fromWp.focalY, toWp.focalY]);
  }

  return {
    scale,
    translateX: width * scale * (0.5 - focalX),
    translateY: height * scale * (0.5 - focalY),
  };
}
