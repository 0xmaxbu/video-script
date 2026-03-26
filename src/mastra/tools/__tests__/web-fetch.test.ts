import { describe, it, expect, vi, afterEach } from "vitest";
import { webFetchTool } from "../web-fetch";

// Helper to cast tool result
const castResult = (result: any) =>
  result as { content: string; title: string; url: string };

describe("webFetchTool", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("success cases", () => {
    it("should fetch and convert HTML to markdown", async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Page</title>
          </head>
          <body>
            <h1>Welcome</h1>
            <p>This is a test paragraph.</p>
            <a href="https://example.com">Link</a>
          </body>
        </html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        url: "https://example.com",
        text: () => Promise.resolve(mockHtml),
      });

      const result = castResult(
        await webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      );

      expect(result.title).toBe("Test Page");
      expect(result.content).toContain("# Welcome");
      expect(result.content).toContain("This is a test paragraph");
      expect(result.content).toContain("[Link](https://example.com)");
      expect(result.url).toBe("https://example.com");
    });

    it("should extract title from h1 if no title tag", async () => {
      const mockHtml = `
        <html>
          <body>
            <h1>Main Heading</h1>
            <p>Content</p>
          </body>
        </html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        url: "https://example.com",
        text: () => Promise.resolve(mockHtml),
      });

      const result = castResult(
        await webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      );

      expect(result.title).toBe("Main Heading");
    });

    it('should return "Untitled" when no title available', async () => {
      const mockHtml = "<html><body><p>No title here</p></body></html>";

      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        url: "https://example.com",
        text: () => Promise.resolve(mockHtml),
      });

      const result = castResult(
        await webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      );

      expect(result.title).toBe("Untitled");
    });

    it("should remove scripts and styles from HTML", async () => {
      const mockHtml = `
        <html>
          <head>
            <title>Test</title>
            <style>body { color: red; }</style>
            <script>alert('hi');</script>
          </head>
          <body>
            <p>Content</p>
          </body>
        </html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        url: "https://example.com",
        text: () => Promise.resolve(mockHtml),
      });

      const result = castResult(
        await webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      );

      expect(result.content).not.toContain("body { color: red; }");
      expect(result.content).not.toContain("alert");
      expect(result.content).toContain("Content");
    });

    it("should handle HTML entities correctly", async () => {
      const mockHtml = `
        <html>
          <body>
            <p>&lt;tag&gt; &amp; &nbsp; &quot;quote&quot; &#39;apostrophe&#39;</p>
          </body>
        </html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        url: "https://example.com",
        text: () => Promise.resolve(mockHtml),
      });

      const result = castResult(
        await webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      );

      expect(result.content).toContain("<tag>");
      expect(result.content).toContain("&");
      expect(result.content).toContain('"quote"');
    });
  });

  describe("error cases", () => {
    it("should throw error on 404 response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
        text: () => Promise.resolve("<html></html>"),
      });

      await expect(
        webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      ).rejects.toThrow("PAGE_NOT_FOUND");
    });

    it("should throw error on 5xx server error", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 503,
        ok: false,
        text: () => Promise.resolve("<html></html>"),
      });

      await expect(
        webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      ).rejects.toThrow("SERVER_ERROR");
    });

    it("should throw error on non-ok response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 403,
        ok: false,
        statusText: "Forbidden",
        text: () => Promise.resolve("<html></html>"),
      });

      await expect(
        webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      ).rejects.toThrow("HTTP 403");
    });

    it("should throw error on network failure", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(
        webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      ).rejects.toThrow();
    });

    it("should throw error on timeout", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";

      global.fetch = vi.fn().mockRejectedValue(abortError);

      await expect(
        webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      ).rejects.toThrow();
    });
  });

  describe("HTML to markdown conversion", () => {
    it("should convert headers correctly", async () => {
      const mockHtml = `
      <html><body>
        <h1>H1</h1>
        <h2>H2</h2>
        <h3>H3</h3>
        <h4>H4</h4>
        <h5>H5</h5>
        <h6>H6</h6>
      </body></html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        url: "https://example.com",
        text: () => Promise.resolve(mockHtml),
      });

      const result = castResult(
        await webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      );

      expect(result.content).toContain("# H1");
      expect(result.content).toContain("## H2");
      expect(result.content).toContain("### H3");
      expect(result.content).toContain("#### H4");
      expect(result.content).toContain("##### H5");
      expect(result.content).toContain("###### H6");
    });

    it("should convert bold and italic tags", async () => {
      const mockHtml = `
      <html><body>
        <p><strong>bold text</strong></p>
        <p><b>bold via b tag</b></p>
        <p><em>italic text</em></p>
        <p><i>italic via i tag</i></p>
      </body></html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        url: "https://example.com",
        text: () => Promise.resolve(mockHtml),
      });

      const result = castResult(
        await webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      );

      expect(result.content).toContain("**bold text**");
      expect(result.content).toContain("**bold via b tag**");
      expect(result.content).toContain("*italic text*");
      expect(result.content).toContain("*italic via i tag*");
    });

    it("should normalize excessive whitespace", async () => {
      const mockHtml = `
      <html><body>
        <p>Text    with     spaces</p>
        <p>Line 1</p>


        <p>Line 2</p>
      </body></html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        url: "https://example.com",
        text: () => Promise.resolve(mockHtml),
      });

      const result = castResult(
        await webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      );

      expect(result.content).toContain("Text with spaces");
      expect(result.content).not.toContain("    ");
    });
  });

  describe("edge cases", () => {
    it("should handle empty HTML body", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        url: "https://example.com",
        text: () => Promise.resolve("<html><body></body></html>"),
      });

      const result = castResult(
        await webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      );

      expect(result.content).toBe("");
      expect(result.title).toBe("Untitled");
    });

    it("should handle minimal HTML", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        url: "https://example.com",
        text: () => Promise.resolve("<html><body><p>Minimal</p></body></html>"),
      });

      const result = castResult(
        await webFetchTool.execute!({ url: "https://example.com" }, {} as any),
      );

      expect(result.content).toBe("Minimal");
    });

    it("should handle very long URLs", async () => {
      const longUrl = "https://example.com/" + "a".repeat(1000);

      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        url: longUrl,
        text: () => Promise.resolve("<html><body><p>Content</p></body></html>"),
      });

      const result = castResult(
        await webFetchTool.execute!({ url: longUrl }, {} as any),
      );

      expect(result.url).toBe(longUrl);
    });
  });
});
