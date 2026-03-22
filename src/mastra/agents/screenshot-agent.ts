import { Agent } from "@mastra/core/agent";
import { playwrightScreenshotTool } from "../tools/playwright-screenshot.js";

/**
 * Screenshot Agent - Phase 5 Redesign
 *
 * 智能截图：
 * - 装饰性截图（hero/ambient）：全页面截图
 * - 信息性截图（headline/article/documentation/codeSnippet/changelog/feature）：
 *   使用 CSS selector 定位特定区域
 */

export const screenshotAgent = new Agent({
  id: "screenshot-agent",
  name: "Screenshot Agent",
  instructions: `You are a professional screenshot capture specialist.

## Task Flow:
1. Receive Visual Plan with mediaResources
2. For each resource:
   - If type is decorative (hero/ambient): capture full page
   - If type is informational: use selector to capture specific region
3. Save screenshots with consistent naming
4. Output screenshot manifest

## Screenshot Types & Strategies:

### Decorative (Full Page):
- **hero**: Full page screenshot, 1920x1080 viewport
- **ambient**: Full page screenshot, may use smaller viewport

### Informational (With Selector):
- **headline**: Capture title area (selector: h1, .headline, .title, header)
- **article**: Capture article content (selector: article, .content, .post-body, main)
- **documentation**: Capture docs content (selector: .docs-content, .markdown-body, article)
- **codeSnippet**: Capture code blocks (selector: pre, code, .highlight, .code-block)
- **changelog**: Capture release notes (selector: .changelog, .release-notes, #releases)
- **feature**: Capture feature list (selector: .features, .feature-list, ul.features)

## Tool Usage:

For each screenshot, call playwrightScreenshotTool with:
\`\`\`json
{
  "url": "https://example.com",
  "selector": "h1, .headline",  // optional, for informational screenshots
  "viewport": { "width": 1920, "height": 1080 },
  "outputDir": "/path/to/output",
  "filename": "scene-1-shot-1.png"
}
\`\`\`

## Output Format:

\`\`\`json
{
  "screenshots": [
    {
      "sceneId": "scene-1",
      "resourceId": "shot-1",
      "filename": "scene-1-shot-1.png",
      "type": "headline",
      "success": true,
      "dimensions": { "width": 1920, "height": 600 },
      "capturedAt": "2024-03-22T10:30:00Z"
    }
  ],
  "summary": {
    "total": 5,
    "successful": 4,
    "failed": 1,
    "errors": [
      { "sceneId": "scene-3", "error": "Timeout waiting for selector" }
    ]
  }
}
\`\`\`

## CRITICAL REQUIREMENTS:
1. **ALWAYS** call playwrightScreenshotTool for EVERY mediaResource
2. For informational screenshots, generate appropriate selector
3. Handle errors gracefully - don't fail the entire batch
4. Use consistent naming: {sceneId}-{resourceId}.png
5. Return valid JSON only (no markdown blocks)

## Selector Fallback Strategy:
If primary selector doesn't work, try fallbacks:
- headline: ["h1", "header h1", ".headline", ".title"]
- article: ["article", "main", ".content", ".post-body"]
- documentation: [".docs-content", ".markdown-body", "article", "main"]
- codeSnippet: ["pre", "code", ".highlight", ".code-block"]
- changelog: [".changelog", ".release-notes", "#releases", "article"]
- feature: [".features", ".feature-list", "ul.features", ".grid"]
`,
  model: "minimax-cn-coding-plan/MiniMax-M2.5",
  tools: {
    playwrightScreenshotTool: playwrightScreenshotTool as any,
  },
});

/**
 * 截图类型的默认选择器映射
 */
export const DEFAULT_SELECTORS: Record<string, string[]> = {
  headline: ["h1", "header h1", ".headline", ".title", "#title"],
  article: ["article", "main", ".content", ".post-body", ".article-body"],
  documentation: [
    ".docs-content",
    ".markdown-body",
    "article",
    "main",
    ".content",
  ],
  codeSnippet: ["pre", "code", ".highlight", ".code-block", ".syntax-highlight"],
  changelog: [
    ".changelog",
    ".release-notes",
    "#releases",
    "article",
    ".version-history",
  ],
  feature: [
    ".features",
    ".feature-list",
    "ul.features",
    ".grid",
    ".cards",
  ],
};

/**
 * 判断是否为信息性截图
 */
export function isInformationalScreenshot(
  type: string,
): type is keyof typeof DEFAULT_SELECTORS {
  return type in DEFAULT_SELECTORS;
}

/**
 * 获取截图选择器
 */
export function getSelectors(
  type: string,
  customSelector?: string,
): string[] {
  if (customSelector) {
    return [customSelector];
  }

  if (isInformationalScreenshot(type)) {
    return DEFAULT_SELECTORS[type];
  }

  // 装饰性截图不需要选择器
  return [];
}

/**
 * 生成截图文件名
 */
export function generateFilename(
  sceneId: string,
  resourceId: string,
): string {
  return `${sceneId}-${resourceId}.png`;
}

/**
 * 解析 Visual Plan 中的媒体资源
 */
export function parseMediaResources(visualPlan: {
  scenes: Array<{
    sceneId: string;
    mediaResources: Array<{
      id: string;
      type: string;
      url: string;
      selector?: string;
    }>;
  }>;
}): Array<{
  sceneId: string;
  resourceId: string;
  type: string;
  url: string;
  selector: string | undefined;
  filename: string;
}> {
  const resources: Array<{
    sceneId: string;
    resourceId: string;
    type: string;
    url: string;
    selector: string | undefined;
    filename: string;
  }> = [];

  for (const scene of visualPlan.scenes) {
    for (const resource of scene.mediaResources) {
      resources.push({
        sceneId: scene.sceneId,
        resourceId: resource.id,
        type: resource.type,
        url: resource.url,
        selector: resource.selector,
        filename: generateFilename(scene.sceneId, resource.id),
      });
    }
  }

  return resources;
}
