import { describe, it, expect, vi, afterEach } from "vitest";
import { codeHighlightTool } from "../code-highlight";

vi.mock("shiki", () => ({
  codeToHtml: vi.fn(),
}));

describe("codeHighlightTool", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("success cases", () => {
    it("should highlight code with supported language", async () => {
      const mockHtml = "<pre><code><span>highlighted</span></code></pre>";

      const { codeToHtml } = await import("shiki");
      (codeToHtml as any).mockResolvedValue(mockHtml);

      const result = (await codeHighlightTool.execute!(
        { code: 'console.log("hello");', language: "javascript" },
        {} as any,
      )) as { html: string; imagePath: string | null };

      expect(result.html).toBe(mockHtml);
      expect(result.imagePath).toBeNull();
      expect(codeToHtml).toHaveBeenCalledWith('console.log("hello");', {
        lang: "javascript",
        theme: "github-dark",
      });
    });

    it("should support multiple programming languages", async () => {
      const mockHtml = "<pre><code>highlighted</code></pre>";

      const { codeToHtml } = await import("shiki");
      (codeToHtml as any).mockResolvedValue(mockHtml);

      const languages = ["python", "rust", "go", "typescript", "java"];

      for (const lang of languages) {
        (codeToHtml as any).mockClear();

        await codeHighlightTool.execute!(
          { code: "code sample", language: lang },
          {} as any,
        );

        expect(codeToHtml).toHaveBeenCalledWith("code sample", {
          lang,
          theme: "github-dark",
        });
      }
    });

    it("should use github-dark theme", async () => {
      const mockHtml = "<pre><code>highlighted</code></pre>";

      const { codeToHtml } = await import("shiki");
      (codeToHtml as any).mockResolvedValue(mockHtml);

      await codeHighlightTool.execute!(
        { code: "const x = 1;", language: "typescript" },
        {} as any,
      );

      expect(codeToHtml).toHaveBeenCalledWith(expect.any(String), {
        lang: "typescript",
        theme: "github-dark",
      });
    });

    it("should return null imagePath in MVP phase", async () => {
      const { codeToHtml } = await import("shiki");
      (codeToHtml as any).mockResolvedValue(
        "<pre><code>highlighted</code></pre>",
      );

      const result = (await codeHighlightTool.execute!(
        {
          code: "code sample",
          language: "javascript",
          generateScreenshot: true,
        },
        {} as any,
      )) as { html: string; imagePath: string | null };

      expect(result.imagePath).toBeNull();
    });

    it("should handle code with special HTML characters", async () => {
      const mockHtml = "<pre><code>&lt;tag&gt;</code></pre>";

      const { codeToHtml } = await import("shiki");
      (codeToHtml as any).mockResolvedValue(mockHtml);

      const codeWithSpecialChars = 'const html = "<div>test</div>";';

      await codeHighlightTool.execute!(
        { code: codeWithSpecialChars, language: "javascript" },
        {} as any,
      );

      expect(codeToHtml).toHaveBeenCalledWith(codeWithSpecialChars, {
        lang: "javascript",
        theme: "github-dark",
      });
    });

    it("should handle very long code blocks", async () => {
      const mockHtml = "<pre><code>highlighted long code</code></pre>";

      const { codeToHtml } = await import("shiki");
      (codeToHtml as any).mockResolvedValue(mockHtml);

      const longCode = Array(1000).fill('console.log("line");').join("\n");

      const result = (await codeHighlightTool.execute!(
        { code: longCode, language: "javascript" },
        {} as any,
      )) as { html: string; imagePath: string | null };

      expect(result.html).toBe(mockHtml);
      expect(codeToHtml).toHaveBeenCalled();
    });
  });

  describe("error cases", () => {
    it("should throw error for unsupported language", async () => {
      const { codeToHtml } = await import("shiki");
      (codeToHtml as any).mockRejectedValue(
        new Error("unknown language: invalid-lang"),
      );

      await expect(
        codeHighlightTool.execute!(
          { code: "code", language: "invalid-lang" },
          {} as any,
        ),
      ).rejects.toThrow("UNSUPPORTED_LANGUAGE");
    });

    it("should throw error when Shiki fails", async () => {
      const { codeToHtml } = await import("shiki");
      (codeToHtml as any).mockRejectedValue(
        new Error("Shiki processing error"),
      );

      await expect(
        codeHighlightTool.execute!(
          { code: "code", language: "javascript" },
          {} as any,
        ),
      ).rejects.toThrow("Failed to highlight code");
    });

    it("should throw error on unknown exception", async () => {
      const { codeToHtml } = await import("shiki");
      (codeToHtml as any).mockRejectedValue("not an error object");

      await expect(
        codeHighlightTool.execute!(
          { code: "code", language: "javascript" },
          {} as any,
        ),
      ).rejects.toThrow("Failed to highlight code: Unknown error");
    });
  });

  describe("edge cases", () => {
    it("should handle code with only whitespace", async () => {
      const mockHtml = "<pre><code>   </code></pre>";

      const { codeToHtml } = await import("shiki");
      (codeToHtml as any).mockResolvedValue(mockHtml);

      const result = (await codeHighlightTool.execute!(
        { code: "   \n\n   ", language: "javascript" },
        {} as any,
      )) as { html: string; imagePath: string | null };

      expect(result.html).toBe(mockHtml);
    });

    it("should handle code with unicode characters", async () => {
      const mockHtml = "<pre><code>highlighted unicode</code></pre>";

      const { codeToHtml } = await import("shiki");
      (codeToHtml as any).mockResolvedValue(mockHtml);

      const codeWithUnicode = 'const emoji = "😀🎉"; // Unicode test';

      await codeHighlightTool.execute!(
        { code: codeWithUnicode, language: "javascript" },
        {} as any,
      );

      expect(codeToHtml).toHaveBeenCalledWith(
        codeWithUnicode,
        expect.any(Object),
      );
    });

    it("should handle generateScreenshot parameter", async () => {
      const { codeToHtml } = await import("shiki");
      (codeToHtml as any).mockResolvedValue(
        "<pre><code>highlighted</code></pre>",
      );

      const resultTrue = (await codeHighlightTool.execute!(
        {
          code: "code",
          language: "javascript",
          generateScreenshot: true,
        },
        {} as any,
      )) as { html: string; imagePath: string | null };

      const resultFalse = (await codeHighlightTool.execute!(
        {
          code: "code",
          language: "javascript",
          generateScreenshot: false,
        },
        {} as any,
      )) as { html: string; imagePath: string | null };

      expect(resultTrue.imagePath).toBeNull();
      expect(resultFalse.imagePath).toBeNull();
    });

    it("should handle mixed indentation", async () => {
      const mockHtml = "<pre><code>highlighted</code></pre>";

      const { codeToHtml } = await import("shiki");
      (codeToHtml as any).mockResolvedValue(mockHtml);

      const codeWithMixedIndent =
        "function test() {\n\t  const x = 1;\n    return x;\n}";

      await codeHighlightTool.execute!(
        { code: codeWithMixedIndent, language: "javascript" },
        {} as any,
      );

      expect(codeToHtml).toHaveBeenCalledWith(
        codeWithMixedIndent,
        expect.any(Object),
      );
    });
  });
});
