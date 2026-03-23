import { z } from "zod";

// Visual type enum
export const VisualTypeEnum = z.enum([
  "screenshot",
  "code",
  "text",
  "diagram",
  "image",
]);
export type VisualType = z.infer<typeof VisualTypeEnum>;

// Position schema
export const PositionSchema = z.object({
  x: z.union([z.number().min(0), z.enum(["left", "center", "right"])]),
  y: z.union([z.number().min(0), z.enum(["top", "center", "bottom"])]),
  width: z.union([z.number().min(0), z.literal("auto"), z.literal("full")]),
  height: z.union([z.number().min(0), z.literal("auto"), z.literal("full")]),
  zIndex: z.number().default(0),
});

// Animation config
export const AnimationConfigSchema = z.object({
  enter: z.enum([
    "fadeIn",
    "slideLeft",
    "slideRight",
    "slideUp",
    "slideDown",
    "slideIn",
    "zoomIn",
    "typewriter",
    "none",
  ]),
  enterDelay: z.number().default(0),
  exit: z.enum(["fadeOut", "slideOut", "zoomOut", "none"]),
  exitAt: z.number().optional(),
});

// D-03: Base ScreenshotConfigSchema (common fields)
// Renderer-specific fields (maxLines, padding, theme) extend in packages/renderer/src/types.ts
export const ScreenshotConfigBaseSchema = z.object({
  background: z.string().default("#1E1E1E"),
  width: z.number().int().positive().default(1920),
  fontSize: z.number().int().positive().default(14),
  fontFamily: z.string().default("Fira Code"),
});
export type ScreenshotConfigBase = z.infer<typeof ScreenshotConfigBaseSchema>;
