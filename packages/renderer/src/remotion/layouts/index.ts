/**
 * Layout Templates - Phase 6
 *
 * 8 个精心设计的布局模板
 *
 * 核心原则：视觉服从口播
 * - 所有元素通过 narrationBinding 控制出现时机
 */

export { HeroFullscreen } from "./HeroFullscreen.js";
export { SplitHorizontal } from "./SplitHorizontal.js";
export { SplitVertical } from "./SplitVertical.js";
export { TextOverImage } from "./TextOverImage.js";
export { CodeFocus } from "./CodeFocus.js";
export { Comparison } from "./Comparison.js";
export { BulletList } from "./BulletList.js";
export { Quote } from "./Quote.js";
export { Grid } from "./Grid.js";
export { FrostedCard } from "./FrostedCard.js";

import type { ReactNode } from "react";
import type { VisualScene } from "@video-script/types";

/**
 * 布局组件的通用 Props
 */
export interface LayoutProps {
  scene: VisualScene;
  screenshots: Map<string, string>; // resourceId -> filePath
  children?: ReactNode;
}

/**
 * 获取布局组件
 */
export function getLayoutComponent(
  template: string,
): React.ComponentType<LayoutProps> | null {
  switch (template) {
    case "hero-fullscreen":
      return HeroFullscreen;
    case "split-horizontal":
      return SplitHorizontal;
    case "split-vertical":
      return SplitVertical;
    case "text-over-image":
      return TextOverImage;
    case "code-focus":
      return CodeFocus;
    case "comparison":
      return Comparison;
    case "bullet-list":
      return BulletList;
    case "quote":
      return Quote;
    default:
      return null;
  }
}
