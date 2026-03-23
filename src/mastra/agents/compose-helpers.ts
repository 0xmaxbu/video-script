/**
 * Compose Agent - Pure helper functions (no external dependencies)
 */

export function mapLayoutToComponent(template: string): string {
  const mapping: Record<string, string> = {
    "hero-fullscreen": "HeroFullscreen",
    "split-horizontal": "SplitHorizontal",
    "split-vertical": "SplitVertical",
    "text-over-image": "TextOverImage",
    "code-focus": "CodeFocus",
    comparison: "Comparison",
    "bullet-list": "BulletList",
    quote: "Quote",
  };
  return mapping[template] || "HeroFullscreen";
}

export function secondsToFrames(seconds: number, fps: number = 30): number {
  return Math.round(seconds * fps);
}
