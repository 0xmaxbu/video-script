import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseResearchMarkdown,
  filterEssentialContent,
  runDeepResearch,
} from "../research-agent.js";

// vi.hoisted ensures mockGenerate is available inside vi.mock factory (which is hoisted)
const { mockGenerate } = vi.hoisted(() => ({
  mockGenerate: vi.fn(),
}));

// Mock @mastra/core/agent so Agent instances (including researchAgent) have a mocked generate
vi.mock("@mastra/core/agent", () => {
  function Agent() {
    return { generate: mockGenerate };
  }
  return { Agent };
});

// Also mock the tools so the agent doesn't try to fetch anything
vi.mock("../../tools/web-fetch.js", () => ({
  webFetchTool: {},
}));

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

      const supporting = result.sections.find((s) =>
        s.heading.includes("次要改进"),
      );
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

      const h3 = result.sections.find((s) =>
        s.heading.includes("闭包类型收窄"),
      );
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

describe("runDeepResearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call researchAgent.generate three times (3 rounds)", async () => {
    mockGenerate
      .mockResolvedValueOnce({
        text: "# Round 1\n\n## Overview [priority: essential]\nFirst pass results.\n\n---\n## 信息来源索引\n\n[1] Source - https://example.com\n",
      })
      .mockResolvedValueOnce({
        text: "# Round 2\n\n## Gap Analysis [priority: important]\nGap filling results.\n\n---\n## 信息来源索引\n\n[1] Source - https://example.com\n[2] New Source - https://example.com/2\n",
      })
      .mockResolvedValueOnce({
        text: "# Round 3\n\n## Examples [priority: essential]\nConcrete examples.\n\n---\n## 信息来源索引\n\n[1] Source - https://example.com\n",
      });

    await runDeepResearch({
      title: "Test Topic",
      links: ["https://example.com"],
    });

    expect(mockGenerate).toHaveBeenCalledTimes(3);
  });

  it("should pass title and links in the first round prompt", async () => {
    const roundText =
      "# Result\n\n## Section [priority: essential]\nContent.\n\n---\n## 信息来源索引\n\n[1] S - https://example.com\n";
    mockGenerate.mockResolvedValue({ text: roundText });

    await runDeepResearch({
      title: "My Topic",
      links: ["https://example.com/doc"],
    });

    const firstCallArg = mockGenerate.mock.calls[0][0] as string;
    expect(firstCallArg).toContain("My Topic");
    expect(firstCallArg).toContain("https://example.com/doc");
  });

  it("should include round 1 output in round 2 prompt", async () => {
    const round1Text =
      "# R1\n\n## Section [priority: essential]\nRound 1 findings.\n\n---\n## 信息来源索引\n\n[1] S - https://example.com\n";
    mockGenerate.mockResolvedValue({ text: round1Text });

    await runDeepResearch({ title: "My Topic", links: [] });

    const secondCallArg = mockGenerate.mock.calls[1][0] as string;
    expect(secondCallArg).toContain("Round 1 findings");
  });

  it("should include round 1 and round 2 output in round 3 prompt", async () => {
    mockGenerate
      .mockResolvedValueOnce({
        text: "# R1\n\n## Sec [priority: essential]\nRound1.\n\n---\n## 信息来源索引\n\n[1] S - https://example.com\n",
      })
      .mockResolvedValueOnce({
        text: "# R2\n\n## Sec [priority: important]\nRound2.\n\n---\n## 信息来源索引\n\n[1] S - https://example.com\n",
      })
      .mockResolvedValueOnce({
        text: "# R3\n\n## Sec [priority: essential]\nRound3.\n\n---\n## 信息来源索引\n\n[1] S - https://example.com\n",
      });

    await runDeepResearch({ title: "Topic", links: [] });

    const thirdCallArg = mockGenerate.mock.calls[2][0] as string;
    expect(thirdCallArg).toContain("Round1");
    expect(thirdCallArg).toContain("Round2");
  });

  it("should return merged markdown combining all three rounds", async () => {
    mockGenerate
      .mockResolvedValueOnce({
        text: "# T\n\n## A [priority: essential]\nAlpha content.\n\n---\n## 信息来源索引\n\n[1] S - https://example.com\n",
      })
      .mockResolvedValueOnce({
        text: "# T\n\n## B [priority: important]\nBeta content.\n\n---\n## 信息来源索引\n\n[1] S - https://example.com\n",
      })
      .mockResolvedValueOnce({
        text: "# T\n\n## C [priority: essential]\nGamma content.\n\n---\n## 信息来源索引\n\n[1] S - https://example.com\n",
      });

    const result = await runDeepResearch({ title: "T", links: [] });

    expect(result).toContain("Alpha content");
    expect(result).toContain("Beta content");
    expect(result).toContain("Gamma content");
  });

  it("should work with optional document parameter", async () => {
    const roundText =
      "# T\n\n## Sec [priority: essential]\nContent.\n\n---\n## 信息来源索引\n\n[1] S - https://example.com\n";
    mockGenerate.mockResolvedValue({ text: roundText });

    await runDeepResearch({
      title: "T",
      links: [],
      document: "Some additional context doc",
    });

    const firstCallArg = mockGenerate.mock.calls[0][0] as string;
    expect(firstCallArg).toContain("Some additional context doc");
  });
});
