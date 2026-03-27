import { describe, it, expect } from "vitest";
import { VisualLayerSchema, CalloutContentSchema } from "../types.js";

describe("CalloutContent schema", () => {
  it("parses valid highlight callout content", () => {
    const result = CalloutContentSchema.parse({
      text: "key!",
      style: "highlight",
    });
    expect(result.text).toBe("key!");
    expect(result.style).toBe("highlight");
  });
  it("parses arrow-label with direction", () => {
    const result = CalloutContentSchema.parse({
      text: "note",
      style: "arrow-label",
      arrowDirection: "right",
    });
    expect(result.arrowDirection).toBe("right");
  });
  it("rejects invalid style", () => {
    expect(() =>
      CalloutContentSchema.parse({ text: "x", style: "invalid" }),
    ).toThrow();
  });
});

describe("VisualLayerSchema callout type", () => {
  it("accepts callout type", () => {
    const layer = VisualLayerSchema.parse({
      id: "c1",
      type: "callout",
      position: { x: 100, y: 100, width: 400, height: 80, zIndex: 5 },
      content: JSON.stringify({ text: "Important!", style: "highlight" }),
      animation: { enter: "fadeIn", enterDelay: 0, exit: "fadeOut" },
    });
    expect(layer.type).toBe("callout");
  });
});
