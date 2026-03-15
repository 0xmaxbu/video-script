import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { codeToHtml } from "shiki";

export const codeHighlightTool = createTool({
  id: "code-highlight",
  description:
    "Highlight source code using Shiki with support for multiple languages",
  inputSchema: z.object({
    code: z.string().min(1).describe("The source code to highlight"),
    language: z
      .string()
      .min(1)
      .describe(
        "Programming language (javascript, typescript, python, go, rust, etc.)",
      ),
    highlightLines: z
      .array(z.number().int().positive())
      .optional()
      .describe("Line numbers to highlight (1-indexed)"),
    generateScreenshot: z
      .boolean()
      .optional()
      .default(false)
      .describe("Whether to generate a screenshot (not implemented in MVP)"),
  }),
  outputSchema: z.object({
    html: z.string().describe("Highlighted code in HTML format"),
    imagePath: z.nullable(z.string()).describe("Screenshot path (null in MVP)"),
  }),
  execute: async ({ code, language, generateScreenshot }) => {
    try {
      // Convert code to highlighted HTML using Shiki
      const html = await codeToHtml(code, {
        lang: language,
        theme: "github-dark",
      });

      // In MVP phase, always return null for imagePath
      // Screenshot generation will be implemented in a future phase
      const imagePath = generateScreenshot ? null : null;

      return {
        html,
        imagePath,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("unknown language")) {
          throw new Error(
            `UNSUPPORTED_LANGUAGE: Language "${language}" is not supported by Shiki`,
          );
        }
        throw new Error(`Failed to highlight code: ${error.message}`);
      }
      throw new Error("Failed to highlight code: Unknown error");
    }
  },
});
