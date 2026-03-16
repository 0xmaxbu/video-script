import { describe, it, expect } from "vitest";

function deriveType(
  visualType: string,
  index: number,
  totalScenes: number,
): string {
  return visualType === "code"
    ? "code"
    : visualType === "screenshot"
      ? "feature"
      : index === 0
        ? "intro"
        : index === totalScenes - 1
          ? "outro"
          : "feature";
}

function deriveDuration(
  duration: number | undefined,
  startTime: number | undefined,
  endTime: number | undefined,
): number {
  return (
    duration ??
    (startTime !== undefined && endTime !== undefined
      ? endTime - startTime
      : 30)
  );
}

describe("videoGenerationWorkflow", () => {
  it("should export a workflow with the correct id", async () => {
    const { videoGenerationWorkflow } =
      await import("../video-generation-workflow");
    expect(videoGenerationWorkflow).toBeDefined();
    expect((videoGenerationWorkflow as { id?: string }).id).toBe(
      "video-generation-workflow",
    );
  });

  it("should have steps defined (not empty)", async () => {
    const { videoGenerationWorkflow } =
      await import("../video-generation-workflow");
    const steps = (videoGenerationWorkflow as { steps?: unknown }).steps;
    expect(steps).toBeDefined();
    expect(Object.keys(steps as object).length).toBeGreaterThan(0);
  });
});

describe("mapStep (inline duration logic)", () => {
  it("should derive duration from startTime/endTime when duration is missing", () => {
    expect(deriveDuration(undefined, 0, 10)).toBe(10);
  });

  it("should use explicit duration when provided", () => {
    expect(deriveDuration(15, 0, 10)).toBe(15);
  });

  it("should fall back to 30s when no timing info available", () => {
    expect(deriveDuration(undefined, undefined, undefined)).toBe(30);
  });
});

describe("mapStep (inline scene type logic)", () => {
  it("should set type=intro for first scene", () => {
    expect(deriveType("text", 0, 3)).toBe("intro");
  });

  it("should set type=outro for last scene", () => {
    expect(deriveType("text", 2, 3)).toBe("outro");
  });

  it("should set type=feature for middle text scene", () => {
    expect(deriveType("text", 1, 3)).toBe("feature");
  });

  it("should set type=code when visualType=code", () => {
    expect(deriveType("code", 1, 3)).toBe("code");
  });

  it("should set type=feature when visualType=screenshot", () => {
    expect(deriveType("screenshot", 1, 3)).toBe("feature");
  });

  it("should set type=feature when visualType=diagram", () => {
    expect(deriveType("diagram", 1, 3)).toBe("feature");
  });
});
