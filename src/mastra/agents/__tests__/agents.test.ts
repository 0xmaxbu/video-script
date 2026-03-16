import { describe, it, expect } from "vitest";

describe("Agents Integration", () => {
  describe("Research Agent", () => {
    it("should be defined with correct id and name", async () => {
      const { researchAgent } = await import("../research-agent");
      expect(researchAgent.id).toBe("research-agent");
      expect(researchAgent.name).toBe("Research Agent");
    });
  });

  describe("Script Agent", () => {
    it("should be defined with correct id and name", async () => {
      const { scriptAgent } = await import("../script-agent");
      expect(scriptAgent.id).toBe("script-agent");
      expect(scriptAgent.name).toBe("Script Agent");
    });
  });

  describe("Screenshot Agent", () => {
    it("should be defined with correct id and name", async () => {
      const { screenshotAgent } = await import("../screenshot-agent");
      expect(screenshotAgent.id).toBe("screenshot-agent");
      expect(screenshotAgent.name).toBe("Screenshot Agent");
    });
  });

  describe("Compose Agent", () => {
    it("should be defined with correct id and name", async () => {
      const { composeAgent } = await import("../compose-agent");
      expect(composeAgent.id).toBe("compose-agent");
      expect(composeAgent.name).toBe("Compose Agent");
    });
  });
});
