import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { playwrightScreenshotTool } from "../playwright-screenshot";
import { existsSync, mkdirSync } from "fs";

vi.mock("fs");
vi.mock("playwright", () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

// Mock sharp for zoom-to-region tests
const mockSharpInstance = {
  extract: vi.fn().mockReturnThis(),
  toFile: vi.fn().mockResolvedValue(undefined),
};
vi.mock("sharp", () => ({
  default: vi.fn(() => mockSharpInstance),
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
      expect(result.imagePath).toContain("scene-");
      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.goto).toHaveBeenCalledWith("https://example.com", {
        waitUntil: "networkidle",
        timeout: 60000,
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

  describe("dark mode", () => {
    it("should call emulateMedia with dark colorScheme when darkMode is true", async () => {
      const mockPage = {
        goto: vi.fn(),
        screenshot: vi.fn(),
        emulateMedia: vi.fn(),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      await playwrightScreenshotTool.execute!(
        { url: "https://example.com", darkMode: true },
        {} as any,
      );

      expect(mockPage.emulateMedia).toHaveBeenCalledWith({
        colorScheme: "dark",
      });
    });

    it("should NOT call emulateMedia when darkMode is false", async () => {
      const mockPage = {
        goto: vi.fn(),
        screenshot: vi.fn(),
        emulateMedia: vi.fn(),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      await playwrightScreenshotTool.execute!(
        { url: "https://example.com", darkMode: false },
        {} as any,
      );

      expect(mockPage.emulateMedia).not.toHaveBeenCalled();
    });

    it("should NOT call emulateMedia when darkMode is not specified", async () => {
      const mockPage = {
        goto: vi.fn(),
        screenshot: vi.fn(),
        emulateMedia: vi.fn(),
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

      expect(mockPage.emulateMedia).not.toHaveBeenCalled();
    });
  });

  describe("zoom-to-region (zoomToSelector)", () => {
    it("should capture full page then crop with sharp when zoomToSelector is provided", async () => {
      const mockElement = {
        boundingBox: vi.fn().mockResolvedValue({
          x: 100,
          y: 200,
          width: 400,
          height: 300,
        }),
      };

      const mockPage = {
        goto: vi.fn(),
        screenshot: vi.fn(),
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
        { url: "https://example.com", zoomToSelector: ".feature-section" },
        {} as any,
      )) as { imagePath: string; url: string };

      // Full page screenshot was taken
      expect(mockPage.screenshot).toHaveBeenCalledWith(
        expect.objectContaining({ fullPage: true }),
      );
      // Selector was waited for
      expect(mockPage.waitForSelector).toHaveBeenCalledWith(
        ".feature-section",
        {
          timeout: 10000,
        },
      );
      // Sharp extract was called with bounding box + padding
      expect(mockSharpInstance.extract).toHaveBeenCalledWith({
        left: 84, // 100 - 16
        top: 184, // 200 - 16
        width: 432, // 400 + 32
        height: 332, // 300 + 32
      });
      expect(mockSharpInstance.toFile).toHaveBeenCalled();
      expect(result.url).toBe("https://example.com");
    });

    it("should throw SELECTOR_NOT_FOUND when zoomToSelector element not found", async () => {
      const mockPage = {
        goto: vi.fn(),
        screenshot: vi.fn(),
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
          {
            url: "https://example.com",
            zoomToSelector: ".nonexistent",
          },
          {} as any,
        ),
      ).rejects.toThrow("SELECTOR_NOT_FOUND");
    });

    it("should throw BOUNDING_BOX_FAILED when element has no bounding box", async () => {
      const mockElement = {
        boundingBox: vi.fn().mockResolvedValue(null),
      };

      const mockPage = {
        goto: vi.fn(),
        screenshot: vi.fn(),
        waitForSelector: vi.fn(),
        $: vi.fn().mockResolvedValue(mockElement),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      await expect(
        playwrightScreenshotTool.execute!(
          {
            url: "https://example.com",
            zoomToSelector: ".hidden-element",
          },
          {} as any,
        ),
      ).rejects.toThrow("BOUNDING_BOX_FAILED");
    });

    it("should clamp crop coordinates to non-negative values when element is near page edge", async () => {
      const mockElement = {
        boundingBox: vi.fn().mockResolvedValue({
          x: 5, // Near left edge — padding would go negative
          y: 10, // Near top edge
          width: 200,
          height: 150,
        }),
      };

      const mockPage = {
        goto: vi.fn(),
        screenshot: vi.fn(),
        waitForSelector: vi.fn(),
        $: vi.fn().mockResolvedValue(mockElement),
      };

      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn(),
      };

      const { chromium } = await import("playwright");
      (chromium.launch as any).mockResolvedValue(mockBrowser);

      await playwrightScreenshotTool.execute!(
        { url: "https://example.com", zoomToSelector: ".near-edge" },
        {} as any,
      );

      expect(mockSharpInstance.extract).toHaveBeenCalledWith(
        expect.objectContaining({
          left: 0, // clamped from -11
          top: 0, // clamped from -6
        }),
      );
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
