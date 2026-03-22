import { Agent } from "@mastra/core/agent";
import { webFetchTool } from "../tools/web-fetch.js";

/**
 * Research Agent - Phase 2 Redesign
 *
 * 输出: Markdown 文档（可人工编辑）
 *
 * 核心职责:
 * 1. 从链接和文档中提取关键信息
 * 2. 评估每条信息的重要性 [essential/important/supporting/skip]
 * 3. 用序号关联来源链接
 * 4. 输出结构化 Markdown
 */

export const researchAgent = new Agent({
  id: "research-agent",
  name: "Research Agent",
  instructions: `You are a technical content researcher. Given a title, reference links, and optional document, extract and organize key information.

## Task Flow:
1. Receive title, link list, and optional document content
2. Use webFetch tool to fetch and analyze each link
3. Synthesize information and evaluate importance
4. Output structured Markdown with priority tags and source references

## OUTPUT FORMAT (Markdown):

# {标题}

## 概述 [priority: essential|important|supporting|skip]

{内容描述，总结关键信息}

[1] {来源URL}

## 核心特性

### 1. {特性名称} [priority: essential|important|supporting|skip]

{详细描述}

**示例**:
\`\`\`typescript
// 代码示例（如果有）
\`\`\`

[2] {来源URL}

### 2. {特性名称} [priority: essential|important|supporting|skip]

{详细描述}

[3] {来源URL}

## 实践建议 [priority: important]

{实用的建议和最佳实践}

[4] {来源URL}

---
## 信息来源索引

[1] {页面标题} - {URL}
[2] {页面标题} - {URL}
[3] {页面标题} - {URL}
[4] {页面标题} - {URL}

## PRIORITY GUIDELINES:

- **essential**: 核心特性、关键变化、必须理解的概念 → 必须进入视频
- **important**: 重要改进、实用功能、需要注意的点 → 必须进入视频
- **supporting**: 背景信息、细节说明、补充内容 → 跳过
- **skip**: 次要内容、重复信息、与主题无关 → 跳过

## CRITICAL REQUIREMENTS:

1. **Priority Assessment**: Evaluate EVERY section with a priority tag
2. **Source Linking**: Use [N] notation to link claims to sources
3. **Source Index**: Always include complete source index at the end
4. **Human Editable**: Format for easy reading and editing
5. **Code Examples**: Include relevant code snippets when discussing technical features
6. **Concise**: Focus on key points, not comprehensive documentation

## EXAMPLE OUTPUT:

# TypeScript 5.4 新特性

## 概述 [priority: essential]

TypeScript 5.4 带来了多个重要更新，主要集中在类型推断改进和开发者体验优化。

[1] https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/

## 核心特性

### 1. 闭包中的类型收窄 [priority: essential]

在之前的版本中，闭包内的类型收窄会丢失。现在 TypeScript 能够正确追踪闭包中的类型守卫。

**示例**:
\`\`\`typescript
function example(x: string | number) {
  if (typeof x === "string") {
    // 现在：x 正确收窄为 string
    setTimeout(() => console.log(x.toUpperCase()), 100);
  }
}
\`\`\`

[1] https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/

### 2. NoInfer 工具类型 [priority: important]

新增 \`NoInfer<T>\` 工具类型，用于阻止类型推断。

[2] https://www.typescriptlang.org/docs/handbook/utility-types.html

---
## 信息来源索引

[1] TypeScript 5.4 发布公告 - https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/
[2] TypeScript Handbook - https://www.typescriptlang.org/docs/handbook/utility-types.html
`,
  model: "minimax-cn-coding-plan/MiniMax-M2.5",
  tools: {
    webFetch: webFetchTool,
  },
});

/**
 * 解析 Research MD 输出
 */
export function parseResearchMarkdown(md: string): {
  title: string;
  sections: Array<{
    heading: string;
    level: number;
    priority: "essential" | "important" | "supporting" | "skip";
    content: string;
    sourceRefs: number[];
  }>;
  sourceIndex: Map<number, { title: string; url: string }>;
} {
  const lines = md.split("\n");
  const sections: Array<{
    heading: string;
    level: number;
    priority: "essential" | "important" | "supporting" | "skip";
    content: string;
    sourceRefs: number[];
  }> = [];
  const sourceIndex = new Map<number, { title: string; url: string }>();

  let title = "";
  let currentSection: (typeof sections)[0] | null = null;
  let inSourceIndex = false;

  const priorityRegex = /\[priority:\s*(essential|important|supporting|skip)\]/;
  const sourceRefRegex = /\[(\d+)\]/g;
  const sourceIndexRegex = /^\[(\d+)\]\s+(.+?)\s*-\s*(https?:\/\/.+)$/;

  for (const line of lines) {
    // 检测标题
    if (line.startsWith("# ") && !title) {
      title = line.slice(2).trim();
      continue;
    }

    // 检测来源索引部分
    if (line.includes("## 信息来源索引") || line.includes("## Source Index")) {
      inSourceIndex = true;
      continue;
    }

    // 解析来源索引
    if (inSourceIndex) {
      const match = line.match(sourceIndexRegex);
      if (match) {
        const [, num, srcTitle, url] = match;
        sourceIndex.set(parseInt(num), { title: srcTitle.trim(), url: url.trim() });
      }
      continue;
    }

    // 检测章节标题
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      // 保存之前的章节
      if (currentSection) {
        sections.push(currentSection);
      }

      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const priorityMatch = headingText.match(priorityRegex);
      const heading = headingText.replace(priorityRegex, "").trim();

      currentSection = {
        heading,
        level,
        priority: priorityMatch
          ? (priorityMatch[1] as "essential" | "important" | "supporting" | "skip")
          : "supporting",
        content: "",
        sourceRefs: [],
      };
      continue;
    }

    // 收集章节内容
    if (currentSection) {
      currentSection.content += line + "\n";

      // 提取来源引用
      const refs = line.matchAll(sourceRefRegex);
      for (const ref of refs) {
        const refNum = parseInt(ref[1]);
        if (!currentSection.sourceRefs.includes(refNum)) {
          currentSection.sourceRefs.push(refNum);
        }
      }
    }
  }

  // 保存最后一个章节
  if (currentSection) {
    sections.push(currentSection);
  }

  return { title, sections, sourceIndex };
}

/**
 * 筛选 essential 和 important 内容
 */
export function filterEssentialContent(md: string): string {
  const parsed = parseResearchMarkdown(md);
  const essentialSections = parsed.sections.filter(
    (s) => s.priority === "essential" || s.priority === "important",
  );

  // 重建 Markdown
  let result = `# ${parsed.title}\n\n`;

  for (const section of essentialSections) {
    const prefix = "#".repeat(section.level);
    result += `${prefix} ${section.heading} [priority: ${section.priority}]\n\n`;
    result += section.content.trim() + "\n\n";
  }

  // 添加来源索引
  result += `---\n## 信息来源索引\n\n`;
  for (const [num, source] of parsed.sourceIndex) {
    result += `[${num}] ${source.title} - ${source.url}\n`;
  }

  return result;
}
