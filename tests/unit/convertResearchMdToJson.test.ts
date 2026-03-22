import { describe, it, expect } from "vitest";
import { convertResearchMdToJson } from "../../src/cli/phase8-cli-integration.js";

describe("convertResearchMdToJson", () => {
  it("should convert basic markdown to JSON", () => {
    const md = `# TypeScript 5.4 新特性

## 概述 [priority: essential]

TypeScript 5.4 带来了多个重要更新，主要集中在类型推断改进和开发者体验优化。

[1] https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/

## 核心特性

### 1. 闭包中的类型收窄 [priority: essential]

在之前的版本中，闭包内的类型收窄会丢失。现在 TypeScript 能够正确追踪闭包中的类型守卫。

[1] https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/

---
## 信息来源索引

[1] TypeScript 5.4 Release - https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/
`;

    const result = convertResearchMdToJson(md);

    expect(result.title).toBe("TypeScript 5.4 新特性");
    expect(result.segments).toBeDefined();
    expect(result.segments.length).toBeGreaterThan(0);

    // Check first segment is the overview
    const overview = result.segments.find((s) => s.sentence.includes("概述"));
    expect(overview).toBeDefined();
    expect(overview?.keyContent?.concept).toContain("概述");
  });

  it("should extract source links", () => {
    const md = `# Test Title

## Section One [priority: important]

Some content here.

[1] https://example.com/source1

---
## 信息来源索引

[1] Source One - https://example.com/source1
`;

    const result = convertResearchMdToJson(md);

    expect(result.title).toBe("Test Title");
    expect(result.segments.length).toBeGreaterThan(0);

    // Check that links were extracted
    const sectionWithLinks = result.segments.find((s) => s.links && s.links.length > 0);
    expect(sectionWithLinks).toBeDefined();
  });

  it("should handle empty markdown", () => {
    const md = "";
    const result = convertResearchMdToJson(md);

    expect(result.title).toBe("");
    expect(result.segments).toEqual([]);
  });

  it("should handle markdown with only title", () => {
    const md = `# Just a Title`;
    const result = convertResearchMdToJson(md);

    expect(result.title).toBe("Just a Title");
    expect(result.segments).toEqual([]);
  });

  it("should strip priority tags from headings", () => {
    const md = `# Test

## Important Section [priority: essential]

Content here.
`;

    const result = convertResearchMdToJson(md);

    expect(result.segments[0].sentence).toBe("Important Section");
    expect(result.segments[0].sentence).not.toContain("[priority:");
  });
});
