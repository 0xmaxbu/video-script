import { describe, it, expect } from "vitest";
import { LLM_TEST_TIMEOUT } from "./llm-helpers.js";

describe("Script Agent LLM Integration Tests", () => {
  // Skip all tests in this describe block - they require LLM credentials and are flaky
  const testMeta = { timeout: LLM_TEST_TIMEOUT };

  it.skip(
    "should generate script output from research data",
    testMeta,
    async () => {
      // Skipped - requires LLM and uses custom prompts not matching generateScriptPrompt format

      const { scriptAgent } =
        await import("../../src/mastra/agents/script-agent.js");

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

      const result = await scriptAgent.generate([
        {
          role: "user",
          content: `根据以下研究数据生成视频脚本：

${JSON.stringify(minimalResearch, null, 2)}

输出JSON格式，包含title, totalDuration, scenes数组。每个场景必须有id, type, title, narration, duration字段。`,
        },
      ]);

      const textContent =
        typeof result.text === "string"
          ? result.text
          : JSON.stringify(result.text);

      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      expect(jsonMatch).not.toBeNull();

      const parsed = JSON.parse(jsonMatch![0]);

      expect(parsed).toHaveProperty("title");
      expect(parsed).toHaveProperty("scenes");
      expect(Array.isArray(parsed.scenes)).toBe(true);
      expect(parsed.scenes.length).toBeGreaterThan(0);

      for (const scene of parsed.scenes) {
        expect(scene).toHaveProperty("id");
        expect(scene).toHaveProperty("type");
        expect(scene).toHaveProperty("title");
        expect(scene).toHaveProperty("narration");
        expect(scene).toHaveProperty("duration");
        expect(["intro", "feature", "code", "outro"]).toContain(scene.type);
        expect(typeof scene.duration).toBe("number");
        expect(scene.duration).toBeGreaterThan(0);
      }

      if (parsed.totalDuration) {
        expect(typeof parsed.totalDuration).toBe("number");
      }
    },
  );

  it.skip(
    "should generate scenes with proper duration ranges",
    testMeta,
    async () => {
      // Skipped - requires LLM and uses custom prompts not matching generateScriptPrompt format

      const { scriptAgent } =
        await import("../../src/mastra/agents/script-agent.js");

      const researchData = {
        title: "React Hooks",
        segments: [
          {
            order: 1,
            sentence: "React Hooks let you use state in function components.",
            links: [],
          },
          {
            order: 2,
            sentence: "useState returns a state variable and a setter.",
            links: [],
          },
          { order: 3, sentence: "useEffect runs after render.", links: [] },
        ],
      };

      const result = await scriptAgent.generate([
        {
          role: "user",
          content: `为一个包含 intro, feature, code, outro 的视频生成脚本。

研究数据：${JSON.stringify(researchData)}`,
        },
      ]);

      const textContent =
        typeof result.text === "string"
          ? result.text
          : JSON.stringify(result.text);

      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      expect(jsonMatch).not.toBeNull();

      const parsed = JSON.parse(jsonMatch![0]);

      expect(parsed.scenes).toBeDefined();
      expect(Array.isArray(parsed.scenes)).toBe(true);

      const types = parsed.scenes.map((s) => s.type);
      const uniqueTypes = [...new Set(types)];

      expect(uniqueTypes.length).toBeGreaterThanOrEqual(2);

      for (const scene of parsed.scenes) {
        const duration = scene.duration;
        const type = scene.type;

        if (type === "intro" || type === "outro") {
          expect(duration).toBeGreaterThanOrEqual(5);
          expect(duration).toBeLessThanOrEqual(30);
        } else if (type === "feature") {
          expect(duration).toBeGreaterThanOrEqual(15);
          expect(duration).toBeLessThanOrEqual(120);
        } else if (type === "code") {
          expect(duration).toBeGreaterThanOrEqual(20);
          expect(duration).toBeLessThanOrEqual(180);
        }
      }
    },
  );

  it.skip(
    "should generate narration with highlights but no visualLayers",
    testMeta,
    async () => {
      // Skipped - requires LLM and uses custom prompts not matching generateScriptPrompt format

      const { scriptAgent, generateScriptPrompt } =
        await import("../../src/mastra/agents/script-agent.js");

      // 使用正确的 prompt 格式
      const researchMd = `# JavaScript 箭头函数

## 概述 [priority: essential]

箭头函数是 ES6 引入的新语法，用于定义匿名函数。

## 语法特性 [priority: important]

### 1. 简洁语法 [priority: essential]
箭头函数使用 => 语法，比传统函数更简洁。

### 2. this 绑定 [priority: important]
箭头函数不绑定自己的 this 值。

## 代码示例 [priority: essential]

\`\`\`javascript
const add = (a, b) => a + b;
\`\`\`
`;

      const result = await scriptAgent.generate([
        {
          role: "user",
          content: generateScriptPrompt(researchMd),
        },
      ]);

      const textContent =
        typeof result.text === "string"
          ? result.text
          : JSON.stringify(result.text);

      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      expect(jsonMatch).not.toBeNull();

      const parsed = JSON.parse(jsonMatch![0]);

      // 验证基本结构
      expect(parsed).toHaveProperty("title");
      expect(parsed).toHaveProperty("scenes");
      expect(Array.isArray(parsed.scenes)).toBe(true);

      // 新架构：Script Agent 输出 narration 和 highlights，不输出 visualLayers
      // visualLayers 由 Visual Agent 生成
      for (const scene of parsed.scenes || []) {
        // 验证场景有 narration
        expect(scene).toHaveProperty("narration");
        expect(scene).toHaveProperty("duration");
        expect(scene).toHaveProperty("id");
        expect(scene).toHaveProperty("type");

        // 如果有 highlights，验证结构
        if (scene.highlights && scene.highlights.length > 0) {
          for (const highlight of scene.highlights) {
            expect(highlight).toHaveProperty("text");
            expect(highlight).toHaveProperty("importance");
            expect(highlight).toHaveProperty("timeInScene");
          }
        }

        // 确保没有 visualLayers（由 Visual Agent 负责）
        expect(scene).not.toHaveProperty("visualLayers");
      }
    },
  );
});
