import { describe, it, expect } from "vitest";
import { parseResearchMarkdown, filterEssentialContent } from "../research-agent.js";

describe("Research Agent - Markdown Output", () => {
  const sampleMd = `# TypeScript 5.4 新特性

## 概述 [priority: essential]

TypeScript 5.4 带来了多个重要更新。

[1] https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/

## 核心特性

### 1. 闭包类型收窄 [priority: essential]

闭包中的类型收窄现在可以正确追踪。

[1] https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/

### 2. NoInfer 工具类型 [priority: important]

新增 NoInfer<T> 工具类型。

[2] https://www.typescriptlang.org/docs/

## 次要改进 [priority: supporting]

一些小的改进。

[3] https://example.com/minor

---
## 信息来源索引

[1] TypeScript 5.4 发布公告 - https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/
[2] TypeScript Handbook - https://www.typescriptlang.org/docs/
[3] Minor Changes - https://example.com/minor
`;

  describe("parseResearchMarkdown", () => {
    it("should extract title", () => {
      const result = parseResearchMarkdown(sampleMd);
      expect(result.title).toBe("TypeScript 5.4 新特性");
    });

    it("should parse sections with priority", () => {
      const result = parseResearchMarkdown(sampleMd);
      expect(result.sections.length).toBeGreaterThan(0);

      const essential = result.sections.find((s) => s.heading.includes("概述"));
      expect(essential?.priority).toBe("essential");

      const supporting = result.sections.find((s) => s.heading.includes("次要改进"));
      expect(supporting?.priority).toBe("supporting");
    });

    it("should extract source references", () => {
      const result = parseResearchMarkdown(sampleMd);
      const closureSection = result.sections.find((s) =>
        s.heading.includes("闭包类型收窄"),
      );
      expect(closureSection?.sourceRefs).toContain(1);
    });

    it("should parse source index", () => {
      const result = parseResearchMarkdown(sampleMd);
      expect(result.sourceIndex.size).toBe(3);
      expect(result.sourceIndex.get(1)?.title).toBe("TypeScript 5.4 发布公告");
      expect(result.sourceIndex.get(1)?.url).toBe(
        "https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/",
      );
    });

    it("should extract section levels", () => {
      const result = parseResearchMarkdown(sampleMd);
      const h2 = result.sections.find((s) => s.heading === "概述");
      expect(h2?.level).toBe(2);

      const h3 = result.sections.find((s) => s.heading.includes("闭包类型收窄"));
      expect(h3?.level).toBe(3);
    });
  });

  describe("filterEssentialContent", () => {
    it("should only include essential and important sections", () => {
      const result = filterEssentialContent(sampleMd);
      expect(result).toContain("[priority: essential]");
      expect(result).toContain("[priority: important]");
      expect(result).not.toContain("[priority: supporting]");
    });

    it("should include source index in output", () => {
      const result = filterEssentialContent(sampleMd);
      expect(result).toContain("## 信息来源索引");
      expect(result).toContain("[1] TypeScript 5.4 发布公告");
    });

    it("should preserve title", () => {
      const result = filterEssentialContent(sampleMd);
      expect(result).toContain("# TypeScript 5.4 新特性");
    });
  });
});
