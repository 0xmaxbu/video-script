/**
 * Layout Templates - Phase 6
 *
 * 8 个精心设计的布局模板
 *
 * 核心原则：视觉服从口播
 * - 所有元素通过 narrationBinding 控制出现时机
 */

import { HeroFullscreen } from "./HeroFullscreen.js";
import { SplitHorizontal } from "./SplitHorizontal.js";
import { SplitVertical } from "./SplitVertical.js";
import { TextOverImage } from "./TextOverImage.js";
import { CodeFocus } from "./CodeFocus.js";
import { Comparison } from "./Comparison.js";
import { BulletList } from "./BulletList.js";
import { Quote } from "./Quote.js";
import { Grid } from "./Grid.js";
import { FrostedCard } from "./FrostedCard.js";

export {
  HeroFullscreen,
  SplitHorizontal,
  SplitVertical,
  TextOverImage,
  CodeFocus,
  Comparison,
  BulletList,
  Quote,
  Grid,
  FrostedCard,
};

import type { ReactNode } from "react";
import type { VisualScene } from "../../utils/sceneAdapter.js";

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
