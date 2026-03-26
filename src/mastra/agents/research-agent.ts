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

## RELATIONSHIP TAGS (D-02):

Mark the relationship between chunks using these tags:
- [relationship: 原因] - Why something works or matters (cause/reason)
- [relationship: 对比] - Comparing alternatives or before/after
- [relationship: 示例] - Concrete code or use case example
- [relationship: 注意事项] - Warnings or important notes

A chunk can have multiple relationship tags. Example:
### 1. NoInfer 工具类型 [priority: important][relationship: 示例]

\`NoInfer<T>\` 用于阻止类型推断...

[relationship: 原因] 解决闭包中类型收窄丢失的问题

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

### 1. 闭包中的类型收窄 [priority: essential][relationship: 原因]

在之前的版本中，闭包内的类型收窄会丢失。现在 TypeScript 能够正确追踪闭包中的类型守卫。

[relationship: 原因] 这个改进解决了长期困扰开发者的类型推断问题，让回调函数中的类型安全得到保障。

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

### 2. NoInfer 工具类型 [priority: important][relationship: 示例][relationship: 注意事项]

新增 \`NoInfer<T>\` 工具类型，用于阻止类型推断。

\`\`\`typescript
type From<T> = T extends string ? string : NoInfer<T>;
// NoInfer 防止 T 被推断为 string
\`\`\`

[relationship: 注意事项] NoInfer 只在类型推导的上下文中生效，手动指定类型时不受影响。

[2] https://www.typescriptlang.org/docs/handbook/utility-types.html

### 3. 更智能的类型收窄 [priority: important][relationship: 对比]

相比 5.3 及之前版本，5.4 在联合类型和条件类型的收窄上更加精准。

[relationship: 对比] 旧版本：在函数返回后无法保持收窄状态；新版本：return 语句后的类型被正确保留。

[3] https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/

---
## 信息来源索引

[1] TypeScript 5.4 发布公告 - https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/
[2] TypeScript Handbook - https://www.typescriptlang.org/docs/handbook/utility-types.html
[3] TypeScript 5.4 类型收窄改进 - https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/
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
        sourceIndex.set(parseInt(num), {
          title: srcTitle.trim(),
          url: url.trim(),
        });
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
          ? (priorityMatch[1] as
              | "essential"
              | "important"
              | "supporting"
              | "skip")
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

/**
 * 多轮深度研究
 *
 * 三轮研究流程：
 * - Round 1: 基础研究，从所有链接和文档中提取关键信息
 * - Round 2: 识别信息空白，补充更多来源
 * - Round 3: 提取具体示例和类比，加深理解
 *
 * 每轮输出喂入下一轮 prompt，最终合并三轮 Markdown。
 */
export async function runDeepResearch(input: {
  title: string;
  links: string[];
  document?: string;
}): Promise<string> {
  const { title, links, document } = input;

  const linksSection =
    links.length > 0
      ? `## 参考链接\n${links.map((l, i) => `${i + 1}. ${l}`).join("\n")}`
      : "";

  const docSection = document ? `## 补充文档\n\n${document}` : "";

  // Round 1: 基础研究
  const round1Prompt = `# 研究任务: ${title}

${linksSection}

${docSection}

请对以上内容进行全面研究，提取关键信息，按照输出格式输出结构化 Markdown。
重点关注：核心概念、主要特性、实际用法。`;

  const round1Result = await researchAgent.generate(round1Prompt);
  const round1Md = round1Result.text;

  // Round 2: 识别空白，补充来源
  const round2Prompt = `# 研究任务: ${title} - 第二轮深化

## 第一轮研究结果

${round1Md}

---

请基于以上第一轮研究结果，识别信息空白和不清晰的地方：
1. 哪些概念缺少具体解释？
2. 哪些特性缺少对比说明（before/after）？
3. 是否有遗漏的重要特性？

请补充这些缺失内容，使用 [relationship: 对比] 或 [relationship: 原因] 标记新增内容。
按照相同 Markdown 格式输出补充研究。`;

  const round2Result = await researchAgent.generate(round2Prompt);
  const round2Md = round2Result.text;

  // Round 3: 提取具体示例和类比
  const round3Prompt = `# 研究任务: ${title} - 第三轮示例提炼

## 第一轮研究结果

${round1Md}

## 第二轮深化结果

${round2Md}

---

请基于以上两轮研究结果，专注提取：
1. 具体的代码示例（真实可运行的代码片段）
2. 易于理解的类比说明（将复杂概念类比为日常事物）
3. 常见误用场景和正确做法对比

使用 [relationship: 示例] 标记代码示例，[relationship: 对比] 标记误用/正确对比。
按照相同 Markdown 格式输出。`;

  const round3Result = await researchAgent.generate(round3Prompt);
  const round3Md = round3Result.text;

  // 合并三轮结果
  return mergResearchRounds(title, round1Md, round2Md, round3Md);
}

/**
 * 合并多轮研究结果
 * 以第一轮为主体，追加二、三轮的新内容
 */
function mergResearchRounds(
  title: string,
  round1: string,
  round2: string,
  round3: string,
): string {
  return `# ${title} - 深度研究报告

## 第一轮：基础研究

${round1}

---

## 第二轮：深化补充

${round2}

---

## 第三轮：示例提炼

${round3}
`;
}
