import { describe, it, expect } from "vitest";

describe("KineticSubtitle Word Processing Logic", () => {
  describe("word splitting", () => {
    it("splits text into words by whitespace", () => {
      const text = "Hello world this is test";
      const words = text.split(/\s+/);
      expect(words).toEqual(["Hello", "world", "this", "is", "test"]);
    });

    it("handles single word", () => {
      const text = "Hello";
      const words = text.split(/\s+/);
      expect(words).toEqual(["Hello"]);
    });

    it("handles multiple spaces between words", () => {
      const text = "Hello    world";
      const words = text.split(/\s+/);
      expect(words).toEqual(["Hello", "world"]);
    });

    it("handles leading and trailing spaces", () => {
      const text = "  Hello world  ";
      const words = text.split(/\s+/);
      expect(words).toEqual(["", "Hello", "world", ""]);
    });

    it("returns empty array for empty string", () => {
      const text = "";
      const words = text.split(/\s+/);
      expect(words).toEqual([""]);
    });
  });

  describe("activeIndex calculation without timestamps", () => {
    function calculateActiveIndex(
      frame: number,
      durationInFrames: number,
      wordCount: number,
    ): number {
      return Math.min(
        Math.floor((frame / durationInFrames) * wordCount),
        wordCount - 1,
      );
    }

    it("returns 0 at frame 0", () => {
      expect(calculateActiveIndex(0, 100, 5)).toBe(0);
    });

    it("returns wordCount-1 at final frame", () => {
      expect(calculateActiveIndex(100, 100, 5)).toBe(4);
    });

    it("returns middle index at middle frame", () => {
      expect(calculateActiveIndex(50, 100, 5)).toBe(2);
    });

    it("clamps to wordCount-1 even if frame exceeds duration", () => {
      expect(calculateActiveIndex(150, 100, 5)).toBe(4);
    });

    it("handles single word (always index 0)", () => {
      expect(calculateActiveIndex(0, 100, 1)).toBe(0);
      expect(calculateActiveIndex(50, 100, 1)).toBe(0);
      expect(calculateActiveIndex(100, 100, 1)).toBe(0);
    });

    it("distributes indices evenly across frames", () => {
      const wordCount = 4;
      const duration = 100;
      for (let frame = 0; frame <= duration; frame += 25) {
        const index = calculateActiveIndex(frame, duration, wordCount);
        const expectedMax = Math.floor((frame / duration) * wordCount);
        expect(index).toBeLessThanOrEqual(expectedMax + 1);
      }
    });
  });

  describe("activeIndex calculation with wordTimestamps", () => {
    function findActiveIndexFromTimestamps(
      currentTime: number,
      wordTimestamps: Array<{ word: string; start: number; end: number }>,
      wordCount: number,
    ): number {
      const activeIndex = wordTimestamps.findIndex(
        (ts) => currentTime >= ts.start && currentTime < ts.end,
      );
      if (activeIndex === -1) {
        const lastTs = wordTimestamps[wordTimestamps.length - 1];
        return currentTime >= lastTs.end ? wordCount - 1 : 0;
      }
      return activeIndex;
    }

    const wordTimestamps = [
      { word: "Hello", start: 0, end: 0.5 },
      { word: "world", start: 0.5, end: 1.0 },
      { word: "this", start: 1.0, end: 1.5 },
      { word: "is", start: 1.5, end: 2.0 },
      { word: "test", start: 2.0, end: 2.5 },
    ];

    it("returns 0 at time 0.25 (first word active)", () => {
      expect(findActiveIndexFromTimestamps(0.25, wordTimestamps, 5)).toBe(0);
    });

    it("returns 1 at time 0.75 (second word active)", () => {
      expect(findActiveIndexFromTimestamps(0.75, wordTimestamps, 5)).toBe(1);
    });

    it("returns last index when time exceeds all timestamps", () => {
      expect(findActiveIndexFromTimestamps(3.0, wordTimestamps, 5)).toBe(4);
    });

    it("returns 0 when time is before first timestamp", () => {
      expect(findActiveIndexFromTimestamps(-0.1, wordTimestamps, 5)).toBe(0);
    });

    it("handles exact end time of last word as active", () => {
      expect(findActiveIndexFromTimestamps(2.5, wordTimestamps, 5)).toBe(4);
    });

    it("returns correct index for each word boundary", () => {
      expect(findActiveIndexFromTimestamps(0.5, wordTimestamps, 5)).toBe(1);
      expect(findActiveIndexFromTimestamps(1.0, wordTimestamps, 5)).toBe(2);
      expect(findActiveIndexFromTimestamps(1.5, wordTimestamps, 5)).toBe(3);
      expect(findActiveIndexFromTimestamps(2.0, wordTimestamps, 5)).toBe(4);
    });
  });

  describe("word classification (past/active/future)", () => {
    function classifyWords(activeIndex: number, wordCount: number) {
      let past = 0;
      let active = 0;
      let future = 0;

      for (let i = 0; i < wordCount; i++) {
        if (i === activeIndex) {
          active++;
        } else if (i < activeIndex) {
          past++;
        } else {
          future++;
        }
      }

      return { past, active, future };
    }

    it("classifies correctly when activeIndex is 0", () => {
      const result = classifyWords(0, 5);
      expect(result).toEqual({ past: 0, active: 1, future: 4 });
    });

    it("classifies correctly when activeIndex is middle", () => {
      const result = classifyWords(2, 5);
      expect(result).toEqual({ past: 2, active: 1, future: 2 });
    });

    it("classifies correctly when activeIndex is last", () => {
      const result = classifyWords(4, 5);
      expect(result).toEqual({ past: 4, active: 1, future: 0 });
    });

    it("classifies correctly for single word", () => {
      const result = classifyWords(0, 1);
      expect(result).toEqual({ past: 0, active: 1, future: 0 });
    });

    it("total always equals wordCount", () => {
      for (let activeIndex = 0; activeIndex < 5; activeIndex++) {
        const result = classifyWords(activeIndex, 5);
        expect(result.past + result.active + result.future).toBe(5);
      }
    });

    it("always exactly one active word", () => {
      for (let activeIndex = 0; activeIndex < 5; activeIndex++) {
        const result = classifyWords(activeIndex, 5);
        expect(result.active).toBe(1);
      }
    });
  });
});
