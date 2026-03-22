import { describe, it, expect } from "vitest";
import {
  estimateNarrationDuration,
  segmentNarration,
  extractKeyTerms,
} from "../script-agent.js";

describe("Script Agent - Narration Utilities", () => {
  describe("estimateNarrationDuration", () => {
    it("should estimate Chinese text duration", () => {
      const text = "欢迎观看本视频，今天我们将介绍 TypeScript 的新特性。";
      const duration = estimateNarrationDuration(text);
      // 约 20 个中文字符 = ~6 秒
      expect(duration).toBeGreaterThan(4);
      expect(duration).toBeLessThan(10);
    });

    it("should estimate English text duration", () => {
      const text = "Welcome to this video about TypeScript new features.";
      const duration = estimateNarrationDuration(text);
      // 约 8 个英文单词 = ~3 秒
      expect(duration).toBeGreaterThan(2);
      expect(duration).toBeLessThan(6);
    });

    it("should handle mixed Chinese and English", () => {
      const text = "TypeScript 5.4 带来了重要的类型推断改进。";
      const duration = estimateNarrationDuration(text);
      expect(duration).toBeGreaterThan(1);
      expect(duration).toBeLessThan(8);
    });
  });

  describe("segmentNarration", () => {
    it("should split text at sentence boundaries", () => {
      const text = "这是第一句。这是第二句。这是第三句。";
      const segments = segmentNarration(text);

      expect(segments.length).toBeGreaterThanOrEqual(2);
      expect(segments[0].text).toContain("第一句");
    });

    it("should include timing information", () => {
      const text = "这是第一句。这是第二句。";
      const segments = segmentNarration(text);

      expect(segments[0].startTime).toBe(0);
      expect(segments[0].endTime).toBeGreaterThan(0);

      if (segments.length > 1) {
        expect(segments[1].startTime).toBe(segments[0].endTime);
      }
    });

    it("should handle empty text", () => {
      const segments = segmentNarration("");
      expect(segments).toHaveLength(0);
    });

    it("should handle text without punctuation", () => {
      const text = "这是一段没有标点的长文本内容";
      const segments = segmentNarration(text);

      // 应该作为一个整体返回
      expect(segments.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("extractKeyTerms", () => {
    it("should extract English terms", () => {
      const text = "TypeScript 5.4 带来了 NoInfer 工具类型";
      const terms = extractKeyTerms(text);

      expect(terms).toContain("TypeScript");
      expect(terms).toContain("NoInfer");
    });

    it("should extract quoted content", () => {
      const text = '这个功能叫做"类型收窄"，"重要特性"也需要关注';
      const terms = extractKeyTerms(text);

      expect(terms).toContain("类型收窄");
      expect(terms).toContain("重要特性");
    });

    it("should return unique terms", () => {
      const text = "TypeScript 和 TypeScript 是同一个东西";
      const terms = extractKeyTerms(text);

      const tsCount = terms.filter((t) => t === "TypeScript").length;
      expect(tsCount).toBe(1);
    });
  });
});
