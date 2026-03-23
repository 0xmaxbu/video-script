import { Agent } from "@mastra/core/agent";
import { playwrightScreenshotTool } from "../tools/playwright-screenshot.js";
import { analyzePageStructure } from "../tools/playwright-screenshot.js";

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
   - If type is informational: use AI-generated selector for precise capture
3. Save screenshots with consistent naming
4. Output screenshot manifest

## Screenshot Types & Strategies:

### Decorative (Full Page):
- **hero**: Full page screenshot, 1920x1080 viewport
- **ambient**: Full page screenshot, may use smaller viewport

### Informational (With AI-Guided Selector):
- **IMPORTANT**: Always prefer AI-generated selectors over DEFAULT_SELECTORS when available
- **headline**: Capture title area - AI analyzes page and generates precise selector
- **article**: Capture article content - AI selects best semantic region
- **documentation**: Capture docs content - AI finds relevant documentation sections
- **codeSnippet**: Capture code blocks - AI identifies syntax-highlighted regions
- **changelog**: Capture release notes - AI locates changelog sections
- **feature**: Capture feature list - AI detects feature showcases

## AI-Guided Selector Generation:

For informational screenshots:
1. Call generateAISelector({ url, contentHint: type, narrationContext })
2. Use the returned selector when calling playwrightScreenshotTool
3. If AI selector fails, fall back to DEFAULT_SELECTORS

## Tool Usage:

For each screenshot, call playwrightScreenshotTool with:
\`\`\`json
{
  "url": "https://example.com",
  "selector": "h1, .headline",  // AI-generated or fallback
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
      "selectorUsed": "article.docs-content",
      "success": true,
      "dimensions": { "width": 1920, "height": 600 },
      "capturedAt": "2024-03-22T10:30:00Z"
    }
  ],
  "summary": {
    "total": 5,
    "successful": 4,
    "failed": 1,
    "aiSelectorSuccess": 3,
    "fallbackUsed": 1,
    "errors": [
      { "sceneId": "scene-3", "error": "Timeout waiting for selector" }
    ]
  }
}
\`\`\`

## CRITICAL REQUIREMENTS:
1. **ALWAYS** call playwrightScreenshotTool for EVERY mediaResource
2. For informational screenshots, call generateAISelector first
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
  codeSnippet: [
    "pre",
    "code",
    ".highlight",
    ".code-block",
    ".syntax-highlight",
  ],
  changelog: [
    ".changelog",
    ".release-notes",
    "#releases",
    "article",
    ".version-history",
  ],
  feature: [".features", ".feature-list", "ul.features", ".grid", ".cards"],
};

export interface GenerateAISelectorInput {
  url: string;
  contentHint: string;
  narrationContext: string;
}

export interface GenerateAISelectorResult {
  selector: string;
  reasoning: string;
  usedFallback: boolean;
}

/**
 * AI-guided selector generation
 * Analyzes page structure and generates precise CSS selector based on context
 */
export async function generateAISelector(
  input: GenerateAISelectorInput,
): Promise<GenerateAISelectorResult> {
  const { url, contentHint, narrationContext } = input;

  try {
    const pageStructure = await analyzePageStructure(
      url,
      contentHint as "documentation" | "code" | "article",
    );

    if (
      !pageStructure.semanticRegions ||
      pageStructure.semanticRegions.length === 0
    ) {
      return {
        selector: getDefaultSelectorForType(contentHint),
        reasoning: "No semantic regions found, using default selector",
        usedFallback: true,
      };
    }

    const relevantRegion = selectBestRegion(
      pageStructure.semanticRegions,
      contentHint,
      narrationContext,
      pageStructure.headings,
    );

    return {
      selector: relevantRegion.selector,
      reasoning: relevantRegion.reasoning,
      usedFallback: false,
    };
  } catch (error) {
    console.error(`AI selector generation failed: ${error}`);
    return {
      selector: getDefaultSelectorForType(contentHint),
      reasoning: `AI analysis failed (${error}), using default selector`,
      usedFallback: true,
    };
  }
}

function selectBestRegion(
  regions: Array<{ name: string; selector: string }>,
  contentHint: string,
  narrationContext: string,
  headings: string[],
): { selector: string; reasoning: string } {
  const contextLower = narrationContext.toLowerCase();
  const hintLower = contentHint.toLowerCase();

  let bestRegion = regions[0];
  let bestScore = 0;

  for (const region of regions) {
    let score = 0;
    const regionLower = region.name.toLowerCase();

    if (contextLower.includes(hintLower)) {
      score += 2;
    }

    for (const heading of headings) {
      const headingLower = heading.toLowerCase();
      if (regionLower.includes(headingLower.substring(0, 20))) {
        score += 1;
      }
    }

    const contentWords = contextLower.split(/\s+/).filter((w) => w.length > 4);
    for (const word of contentWords) {
      if (regionLower.includes(word)) {
        score += 0.5;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestRegion = region;
    }
  }

  return {
    selector: bestRegion.selector,
    reasoning: `Selected "${bestRegion.name}" based on content analysis (score: ${bestScore})`,
  };
}

function getDefaultSelectorForType(type: string): string {
  const selectors = DEFAULT_SELECTORS[type];
  return selectors?.[0] || "article";
}

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
export function getSelectors(type: string, customSelector?: string): string[] {
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
export function generateFilename(sceneId: string, resourceId: string): string {
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

export interface AnalyzeFailureInput {
  url: string;
  failedSelector: string;
  errorMessage: string;
  contentHint: string;
}

export interface AnalyzeFailureResult {
  improvedSelector: string;
  reason: string;
  alternativeSelectors: string[];
}

export async function analyzeFailureAndSuggestSelector(
  input: AnalyzeFailureInput,
): Promise<AnalyzeFailureResult> {
  const { url, failedSelector, errorMessage, contentHint } = input;

  try {
    const pageStructure = await analyzePageStructure(
      url,
      contentHint as "documentation" | "code" | "article",
    );

    if (
      !pageStructure.semanticRegions ||
      pageStructure.semanticRegions.length === 0
    ) {
      const fallback = getDefaultSelectorForType(contentHint);
      return {
        improvedSelector: fallback,
        reason: `Failed selector "${failedSelector}" not found. No semantic regions detected, using default.`,
        alternativeSelectors: DEFAULT_SELECTORS[contentHint] || ["article"],
      };
    }

    let reason = "";
    if (errorMessage.includes("SELECTOR_NOT_FOUND")) {
      reason = `Selector "${failedSelector}" not found on page.`;
    } else if (errorMessage.includes("Timeout")) {
      reason = `Timeout waiting for "${failedSelector}". Element may have dynamic loading.`;
    } else {
      reason = `Screenshot failed: ${errorMessage}`;
    }

    const alternatives: string[] = [];
    const usedSelectors = new Set<string>([failedSelector]);

    for (const region of pageStructure.semanticRegions) {
      if (!usedSelectors.has(region.selector)) {
        alternatives.push(region.selector);
        usedSelectors.add(region.selector);
      }
      if (alternatives.length >= 2) break;
    }

    if (alternatives.length === 0) {
      const defaults = DEFAULT_SELECTORS[contentHint] || ["article"];
      for (const sel of defaults) {
        if (!usedSelectors.has(sel)) {
          alternatives.push(sel);
          usedSelectors.add(sel);
        }
        if (alternatives.length >= 2) break;
      }
    }

    const improvedSelector =
      alternatives[0] || getDefaultSelectorForType(contentHint);

    return {
      improvedSelector,
      reason: `${reason} Found ${pageStructure.semanticRegions.length} semantic regions. Selected "${improvedSelector}".`,
      alternativeSelectors: alternatives.slice(0, 2),
    };
  } catch (error) {
    console.error(`Failure analysis failed: ${error}`);
    return {
      improvedSelector: getDefaultSelectorForType(contentHint),
      reason: `Failure analysis error: ${error}. Using default selector.`,
      alternativeSelectors: DEFAULT_SELECTORS[contentHint]?.slice(0, 2) || [
        "article",
      ],
    };
  }
}

export interface CaptureWithRetryInput {
  url: string;
  selector?: string;
  contentHint: string;
  narrationContext: string;
  maxRetries?: number;
  viewport?: { width: number; height: number };
  outputDir?: string;
  filename?: string;
}

export interface CaptureWithRetryResult {
  imagePath: string | null;
  selectorUsed: string;
  success: boolean;
  attempts: Array<{
    selector: string;
    error?: string;
  }>;
}

export async function captureWithRetry(
  input: CaptureWithRetryInput,
): Promise<CaptureWithRetryResult> {
  const {
    url,
    selector,
    contentHint,
    narrationContext: _narrationContext,
    maxRetries = 2,
    viewport = { width: 1920, height: 1080 },
    outputDir = "./output/screenshots",
    filename,
  } = input;

  let currentSelector = selector;
  const attempts: Array<{ selector: string; error?: string }> = [];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const selectorToUse =
      currentSelector || getDefaultSelectorForType(contentHint);
    attempts.push({ selector: selectorToUse });

    try {
      const result = await (playwrightScreenshotTool as any).execute({
        url,
        selector: selectorToUse,
        viewport,
        outputDir,
        filename,
      });

      return {
        imagePath: result.imagePath as string,
        selectorUsed: selectorToUse,
        success: true,
        attempts,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      attempts[attempts.length - 1].error = errorMsg;

      console.error(`Screenshot attempt ${attempt + 1} failed: ${errorMsg}`);

      if (attempt < maxRetries) {
        const analysis = await analyzeFailureAndSuggestSelector({
          url,
          failedSelector: selectorToUse,
          errorMessage: errorMsg,
          contentHint,
        });

        console.log(
          `Retrying with selector "${analysis.improvedSelector}": ${analysis.reason}`,
        );

        currentSelector = analysis.improvedSelector;

        if (analysis.alternativeSelectors.length > 1) {
          for (let i = 1; i < analysis.alternativeSelectors.length; i++) {
            if (currentSelector !== analysis.alternativeSelectors[i]) {
              currentSelector = analysis.alternativeSelectors[i];
              break;
            }
          }
        }
      }
    }
  }

  return {
    imagePath: null,
    selectorUsed: attempts[attempts.length - 1].selector,
    success: false,
    attempts,
  };
}
