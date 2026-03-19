import { describe, it, expect } from "vitest";
import { parseScriptFromLLMOutput } from "../json-parser";

describe("JSON Parser", () => {
  describe("parseScriptFromLLMOutput", () => {
    it("should parse single complete JSON", () => {
      const input = `\`\`\`json
{"title":"Test","totalDuration":180,"scenes":[{"id":"s1","type":"intro","title":"A","narration":"X","duration":10}]}
\`\`\``;
      const result = parseScriptFromLLMOutput(input);
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Test");
    });

    it("should select highest score when multiple complete JSONs", () => {
      const input = `\`\`\`json
{"title":"Low","totalDuration":100,"scenes":[]}
\`\`\`
\`\`\`json
{"title":"High","totalDuration":200,"scenes":[{"id":"s1","type":"intro","title":"A","narration":"X","duration":10},{"id":"s2","type":"feature","title":"B","narration":"Y","duration":20}]}
\`\`\``;
      const result = parseScriptFromLLMOutput(input);
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("High");
      expect(result.candidatesTried).toBe(2);
    });

    it("should parse complete JSON when one is truncated", () => {
      const input = `\`\`\`json
{"title":"Complete","totalDuration":180,"scenes":[{"id":"s1","type":"intro","title":"A","narration":"X","duration":10}]}
\`\`\`
\`\`\`json
{"title":"Truncated","totalDuration":90,"scenes":[`;
      const result = parseScriptFromLLMOutput(input);
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Complete");
    });

    it("should extract JSON using brace counting when all truncated but balanced", () => {
      const input = `\`\`\`json
{"title":"Balanced","totalDuration":180,"scenes":[{"id":"s1","type":"intro","title":"A","narration":"X","duration":10}]}`;
      const result = parseScriptFromLLMOutput(input);
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Balanced");
    });

    it("should fail when all JSONs are truncated and unbalanced", () => {
      const input = `\`\`\`json
{"title":"Unbalanced","totalDuration":180,"scenes":[`;
      const result = parseScriptFromLLMOutput(input);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should fail when no JSON markers present", () => {
      const input = "This is not JSON at all";
      const result = parseScriptFromLLMOutput(input);
      expect(result.success).toBe(false);
      expect(result.error).toBe("No valid JSON found");
    });
  });
});
