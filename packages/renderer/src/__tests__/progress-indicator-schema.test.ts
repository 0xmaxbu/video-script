import { describe, it, expect } from "vitest";
import { SceneScriptSchema } from "../types.js";

const baseScene = {
  id: "s1",
  type: "feature",
  title: "Test",
  narration: "Test narration",
  duration: 5,
};

describe("SceneScript progressIndicator field", () => {
  it("is optional — scene without progressIndicator parses fine", () => {
    const result = SceneScriptSchema.parse(baseScene);
    expect(result.progressIndicator).toBeUndefined();
  });

  it("parses with progressIndicator enabled", () => {
    const result = SceneScriptSchema.parse({
      ...baseScene,
      progressIndicator: { enabled: true, total: 5, current: 2 },
    });
    expect(result.progressIndicator?.enabled).toBe(true);
    expect(result.progressIndicator?.total).toBe(5);
    expect(result.progressIndicator?.current).toBe(2);
  });

  it("parses with progressIndicator disabled", () => {
    const result = SceneScriptSchema.parse({
      ...baseScene,
      progressIndicator: { enabled: false, total: 3, current: 1 },
    });
    expect(result.progressIndicator?.enabled).toBe(false);
  });

  it("rejects total < 1", () => {
    expect(() =>
      SceneScriptSchema.parse({
        ...baseScene,
        progressIndicator: { enabled: true, total: 0, current: 1 },
      }),
    ).toThrow();
  });
});
