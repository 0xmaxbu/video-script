import {
  spring,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimationConfigSchema, SceneNarrativeType } from "../types.js";
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
