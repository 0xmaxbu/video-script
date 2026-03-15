import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { playwrightScreenshotTool } from "../playwright-screenshot";
import { existsSync, mkdirSync } from "fs";

vi.mock("fs");
vi.mock("playwright", () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

describe("playwrightScreenshotTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (existsSync as any).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("success cases", () => {
    it("should capture full page screenshot", async () => {
      const mockPage = {
        goto: vi.fn(),
        screenshot: vi.fn(),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      const result = (await playwrightScreenshotTool.execute!(
        { url: "https://example.com" },
        {} as any,
      )) as { imagePath: string; url: string };

      expect(result.url).toBe("https://example.com");
      expect(result.imagePath).toContain("screenshot-");
      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.goto).toHaveBeenCalledWith("https://example.com", {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      expect(mockPage.screenshot).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it("should capture element screenshot when selector is provided", async () => {
      const mockElement = {
        screenshot: vi.fn(),
      };

      const mockPage = {
        goto: vi.fn(),
        waitForSelector: vi.fn(),
        $: vi.fn().mockResolvedValue(mockElement),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      const result = (await playwrightScreenshotTool.execute!(
        { url: "https://example.com", selector: ".header" },
        {} as any,
      )) as { imagePath: string; url: string };

      expect(result.url).toBe("https://example.com");
      expect(mockPage.waitForSelector).toHaveBeenCalledWith(".header", {
        timeout: 10000,
      });
      expect(mockElement.screenshot).toHaveBeenCalled();
    });

    it("should use default viewport dimensions", async () => {
      const mockPage = {
        goto: vi.fn(),
        screenshot: vi.fn(),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      await playwrightScreenshotTool.execute!(
        { url: "https://example.com" },
        {} as any,
      );

      expect(mockBrowser.newPage).toHaveBeenCalledWith({
        viewport: { width: 1920, height: 1080 },
      });
    });

    it("should use custom viewport dimensions", async () => {
      const mockPage = {
        goto: vi.fn(),
        screenshot: vi.fn(),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      await playwrightScreenshotTool.execute!(
        { url: "https://example.com", viewport: { width: 1280, height: 720 } },
        {} as any,
      );

      expect(mockBrowser.newPage).toHaveBeenCalledWith({
        viewport: { width: 1280, height: 720 },
      });
    });
  });

  describe("error cases", () => {
    it("should throw error when selector not found", async () => {
      const mockPage = {
        goto: vi.fn(),
        waitForSelector: vi.fn(),
        $: vi.fn().mockResolvedValue(null),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      await expect(
        playwrightScreenshotTool.execute!(
          { url: "https://example.com", selector: ".not-found" },
          {} as any,
        ),
      ).rejects.toThrow("SELECTOR_NOT_FOUND");
    });

    it("should throw error on page load timeout", async () => {
      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn().mockRejectedValue(new Error("Timeout")),
          screenshot: vi.fn(),
        }),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      await expect(
        playwrightScreenshotTool.execute!(
          { url: "https://example.com" },
          {} as any,
        ),
      ).rejects.toThrow("TIMEOUT");
    });

    it("should throw error on invalid URL", async () => {
      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue({
          goto: vi
            .fn()
            .mockRejectedValue(new Error("net::ERR_NAME_NOT_RESOLVED")),
          screenshot: vi.fn(),
        }),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      await expect(
        playwrightScreenshotTool.execute!(
          { url: "https://invalid-url-xyz.com" },
          {} as any,
        ),
      ).rejects.toThrow("INVALID_URL");
    });

    it("should throw generic error on other exceptions", async () => {
      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn().mockRejectedValue(new Error("Some other error")),
          screenshot: vi.fn(),
        }),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      await expect(
        playwrightScreenshotTool.execute!(
          { url: "https://example.com" },
          {} as any,
        ),
      ).rejects.toThrow("Failed to capture screenshot");
    });

    it("should close browser even on error", async () => {
      const mockBrowser = {
        newPage: vi.fn().mockRejectedValue(new Error("Browser launch error")),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      try {
        await playwrightScreenshotTool.execute!(
          { url: "https://example.com" },
          {} as any,
        );
      } catch {
        // exception expected here
      }

      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle URLs with special characters", async () => {
      const mockPage = {
        goto: vi.fn(),
        screenshot: vi.fn(),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      const specialUrl = "https://example.com/path?query=value&other=123#hash";

      await playwrightScreenshotTool.execute!({ url: specialUrl }, {} as any);

      expect(mockPage.goto).toHaveBeenCalledWith(
        specialUrl,
        expect.any(Object),
      );
    });

    it("should handle very large viewport dimensions", async () => {
      const mockPage = {
        goto: vi.fn(),
        screenshot: vi.fn(),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      await playwrightScreenshotTool.execute!(
        { url: "https://example.com", viewport: { width: 4096, height: 2160 } },
        {} as any,
      );

      expect(mockBrowser.newPage).toHaveBeenCalledWith({
        viewport: { width: 4096, height: 2160 },
      });
    });
  });
});
