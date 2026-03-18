import "dotenv/config";
import { describe, it, expect } from "vitest";
import { ScriptOutputSchema } from "../../../types/script.js";

describe("Script Agent Output", () => {
  describe("video-script-eqvy: Verify script-agent output contains required fields", () => {
    it("should output scenes with id, title, narration, duration fields", async () => {
      // Import the script agent
      const { scriptAgent } = await import("../script-agent.js");

      // Minimal research input
      const minimalResearch = {
        title: "TypeScript Basics",
        segments: [
          {
            order: 1,
            sentence: "TypeScript is a typed superset of JavaScript.",
            keyContent: JSON.stringify({ concept: "TypeScript" }),
            links: [],
          },
        ],
      };

      // Call the agent
      const result = await scriptAgent.generate([
        {
          role: "user",
          content: `根据以下研究数据生成视频脚本：

${JSON.stringify(minimalResearch, null, 2)}

请输出符合新 Schema 的 JSON：
{
  "title": "视频标题",
  "scenes": [
    {
      "id": "scene-1",
      "type": "intro|feature|code|outro",
      "title": "场景标题",
      "narration": "旁白文本",
      "duration": 10,
      "visualLayers": [...]
    }
  ]
}`,
        },
      ]);

      // Parse the response
      const textContent =
        typeof result.text === "string"
          ? result.text
          : JSON.stringify(result.text);

      // Extract JSON from response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      expect(jsonMatch).not.toBeNull();

      const parsed = JSON.parse(jsonMatch![0]);

      // Validate against ScriptOutputSchema
      const validation = ScriptOutputSchema.safeParse(parsed);

      if (!validation.success) {
        console.log("Validation errors:", validation.error.issues);
      }

      expect(validation.success).toBe(true);

      // Verify required fields in scenes
      if (validation.success) {
        expect(validation.data.scenes.length).toBeGreaterThan(0);

        for (const scene of validation.data.scenes) {
          // Required fields per design.md#Decision-4
          expect(scene).toHaveProperty("id");
          expect(scene).toHaveProperty("title");
          expect(scene).toHaveProperty("narration");
          expect(scene).toHaveProperty("duration");
          expect(scene).toHaveProperty("type");

          // Type should be one of the narrative types
          expect(["intro", "feature", "code", "outro"]).toContain(scene.type);

          // Duration should be positive
          expect(scene.duration).toBeGreaterThan(0);
        }
      }
    });
  });
});
