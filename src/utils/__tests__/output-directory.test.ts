import { describe, it, expect } from "vitest";
import path from "path";
import { slugify, generateOutputDirectory } from "../output-directory.js";

describe("slugify", () => {
  it("should convert ASCII title to kebab-case slug", async () => {
    const result = await slugify("TypeScript Generics Tutorial");
    expect(result).toBe("typescript-generics-tutorial");
  });

  it("should handle all-lowercase ASCII", async () => {
    const result = await slugify("hello world");
    expect(result).toBe("hello-world");
  });

  it("should strip leading and trailing hyphens", async () => {
    const result = await slugify("  hello world  ");
    expect(result).toBe("hello-world");
  });

  it("should collapse multiple spaces/punctuation into single hyphen", async () => {
    const result = await slugify("foo   bar---baz");
    expect(result).toBe("foo-bar-baz");
  });

  it("should convert Chinese title via pinyin", async () => {
    const result = await slugify("深入理解 TypeScript");
    // pinyin converts Chinese chars; result must be non-empty and kebab-case
    expect(result).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should produce lowercase output", async () => {
    const result = await slugify("UPPER CASE TITLE");
    expect(result).toBe(result.toLowerCase());
  });
});

describe("generateOutputDirectory", () => {
  it("should return correct structure for a standard mid-week date", async () => {
    // 2026-03-11 is a Wednesday, week 11
    // Monday 2026-03-09, Sunday 2026-03-15
    const date = new Date(2026, 2, 11); // month is 0-indexed
    const result = await generateOutputDirectory(
      "./output",
      "TypeScript Generics Tutorial",
      date,
    );
    expect(result).toBe(
      path.join(
        "./output",
        "2026",
        "11-3_9-3_15",
        "typescript-generics-tutorial",
      ),
    );
  });

  it("should handle Monday (start of week)", async () => {
    // 2026-03-09 is a Monday, week 11
    // Range: Mon 2026-03-09 → Sun 2026-03-15
    const date = new Date(2026, 2, 9);
    const result = await generateOutputDirectory("/base", "My Title", date);
    expect(result).toBe(path.join("/base", "2026", "11-3_9-3_15", "my-title"));
  });

  it("should handle Sunday (end of week)", async () => {
    // 2026-03-15 is a Sunday, still in same week 11
    const date = new Date(2026, 2, 15);
    const result = await generateOutputDirectory("/base", "My Title", date);
    expect(result).toBe(path.join("/base", "2026", "11-3_9-3_15", "my-title"));
  });

  it("should handle a cross-month week (e.g. Jan 26 - Feb 1 2026)", async () => {
    // 2026-01-28 is a Wednesday, week 5
    // Monday 2026-01-26, Sunday 2026-02-01
    const date = new Date(2026, 0, 28);
    const result = await generateOutputDirectory("output", "Cross Month", date);
    expect(result).toBe(
      path.join("output", "2026", "5-1_26-2_1", "cross-month"),
    );
  });

  it("should use current date when date param is omitted", async () => {
    const before = new Date();
    const result = await generateOutputDirectory("./out", "Test");
    const after = new Date();

    // Just verify it produces a non-empty string with the base path
    expect(result).toContain("out");
    expect(result.length).toBeGreaterThan("./out".length);

    // Year should match current year
    const year = before.getFullYear();
    expect(result).toContain(String(year));

    void after; // suppress unused warning
  });

  it("should use basePath as prefix", async () => {
    const date = new Date(2026, 2, 11);
    const result = await generateOutputDirectory("/custom/path", "Title", date);
    expect(result.startsWith("/custom/path")).toBe(true);
  });
});
