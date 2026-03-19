import { describe, it, expect } from "vitest";
import {
  ResearchOutputSchema,
  ScriptOutputSchema,
  SceneSchema,
  SceneTransitionSchema,
  VisualLayerSchema,
} from "../../src/types/index.js";
import {
  SceneScriptSchema,
  ScriptOutputSchema as RendererScriptOutputSchema,
  VisualLayerSchema as RendererVisualLayerSchema,
} from "../../packages/renderer/src/types.js";

describe("Pipeline Schema Validation", () => {
  describe("Research to Script Schema Conversion", () => {
    it("should accept valid research output", () => {
      const researchOutput = {
        title: "TypeScript Generics",
        overview: "Learn about TypeScript generics",
        keyPoints: [
          {
            title: "What are Generics",
            description: "Generics allow type-safe reuse",
          },
        ],
        scenes: [
          {
            sceneTitle: "Intro",
            duration: 10,
            description: "Introduction",
            screenshotSubjects: ["typescriptlang.org"],
          },
        ],
        sources: [
          {
            url: "https://typescriptlang.org",
            title: "TS Docs",
            keyContent: "Generics",
          },
        ],
      };

      expect(ResearchOutputSchema.safeParse(researchOutput).success).toBe(true);
    });
  });

  describe("Script Output Schema Validation", () => {
    const validScene = {
      id: "scene-1",
      type: "intro" as const,
      title: "Introduction",
      narration: "Welcome to the video",
      duration: 12,
    };

    it("should accept valid script output", () => {
      const scriptOutput = {
        title: "Test Video",
        totalDuration: 120,
        scenes: [validScene],
      };

      expect(ScriptOutputSchema.safeParse(scriptOutput).success).toBe(true);
    });

    it("should accept script with all scene types", () => {
      const scriptOutput = {
        title: "Full Video",
        totalDuration: 300,
        scenes: [
          {
            id: "1",
            type: "intro",
            title: "Intro",
            narration: "Welcome",
            duration: 10,
          },
          {
            id: "2",
            type: "feature",
            title: "Feature",
            narration: "Main content",
            duration: 60,
          },
          {
            id: "3",
            type: "code",
            title: "Code",
            narration: "Code example",
            duration: 45,
          },
          {
            id: "4",
            type: "outro",
            title: "Outro",
            narration: "Goodbye",
            duration: 10,
          },
        ],
      };

      expect(ScriptOutputSchema.safeParse(scriptOutput).success).toBe(true);
    });

    it("should accept script with visualLayers", () => {
      const scriptOutput = {
        title: "Visual Video",
        totalDuration: 120,
        scenes: [
          {
            ...validScene,
            visualLayers: [
              {
                id: "layer-1",
                type: "screenshot" as const,
                position: { x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
                content: "https://example.com/screenshot.png",
                animation: { enter: "fadeIn", enterDelay: 0, exit: "fadeOut" },
              },
            ],
          },
        ],
      };

      expect(ScriptOutputSchema.safeParse(scriptOutput).success).toBe(true);
    });

    it("should accept script with transitions", () => {
      const scriptOutput = {
        title: "Transition Video",
        totalDuration: 120,
        scenes: [
          {
            id: "1",
            type: "intro",
            title: "Intro",
            narration: "Welcome",
            duration: 10,
          },
          {
            id: "2",
            type: "feature",
            title: "Feature",
            narration: "Content",
            duration: 30,
            transition: { type: "fade", duration: 0.4 },
          },
          {
            id: "3",
            type: "outro",
            title: "Outro",
            narration: "Goodbye",
            duration: 10,
          },
        ],
      };

      expect(ScriptOutputSchema.safeParse(scriptOutput).success).toBe(true);
    });
  });

  describe("Scene Schema Validation", () => {
    it("should validate scene with all required fields", () => {
      const scene = {
        id: "scene-1",
        type: "feature" as const,
        title: "Feature Title",
        narration: "Feature narration text",
        duration: 45,
      };

      expect(SceneSchema.safeParse(scene).success).toBe(true);
    });

    it("should validate scene with visualLayers array", () => {
      const scene = {
        id: "scene-1",
        type: "feature" as const,
        title: "Feature Title",
        narration: "Feature narration text",
        duration: 45,
        visualLayers: [
          {
            id: "layer-1",
            type: "screenshot" as const,
            position: { x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
            content: "https://example.com/image.png",
            animation: { enter: "slideUp", enterDelay: 0, exit: "slideOut" },
          },
          {
            id: "layer-2",
            type: "text" as const,
            position: {
              x: "center" as const,
              y: "center" as const,
              width: "auto" as const,
              height: "auto" as const,
              zIndex: 1,
            },
            content: "Important text",
            animation: { enter: "fadeIn", enterDelay: 0.5, exit: "fadeOut" },
          },
        ],
      };

      expect(SceneSchema.safeParse(scene).success).toBe(true);
    });

    it("should validate scene with transition", () => {
      const scene = {
        id: "scene-1",
        type: "feature" as const,
        title: "Feature Title",
        narration: "Feature narration text",
        duration: 45,
        transition: { type: "slide", duration: 0.3 },
      };

      expect(SceneSchema.safeParse(scene).success).toBe(true);
    });

    it("should reject scene with invalid type", () => {
      const scene = {
        id: "scene-1",
        type: "invalid" as any,
        title: "Invalid Scene",
        narration: " narration",
        duration: 10,
      };

      expect(SceneSchema.safeParse(scene).success).toBe(false);
    });

    it("should reject scene with negative duration", () => {
      const scene = {
        id: "scene-1",
        type: "intro" as const,
        title: "Invalid Duration",
        narration: " narration",
        duration: -5,
      };

      expect(SceneSchema.safeParse(scene).success).toBe(false);
    });
  });

  describe("VisualLayer Schema Validation", () => {
    it("should validate screenshot layer", () => {
      const layer = {
        id: "layer-1",
        type: "screenshot" as const,
        position: { x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
        content: "https://github.com/owner/repo",
        animation: { enter: "fadeIn", enterDelay: 0, exit: "fadeOut" },
      };

      expect(VisualLayerSchema.safeParse(layer).success).toBe(true);
    });

    it("should validate code layer", () => {
      const layer = {
        id: "layer-1",
        type: "code" as const,
        position: {
          x: 0,
          y: 0,
          width: "full" as const,
          height: "auto" as const,
          zIndex: 0,
        },
        content: "const x = 1;",
        animation: { enter: "typewriter", enterDelay: 0, exit: "fadeOut" },
      };

      expect(VisualLayerSchema.safeParse(layer).success).toBe(true);
    });

    it("should validate text layer", () => {
      const layer = {
        id: "layer-1",
        type: "text" as const,
        position: {
          x: "center" as const,
          y: "bottom" as const,
          width: "auto" as const,
          height: "auto" as const,
          zIndex: 1,
        },
        content: "Important callout",
        animation: { enter: "slideUp", enterDelay: 0.5, exit: "slideOut" },
      };

      expect(VisualLayerSchema.safeParse(layer).success).toBe(true);
    });

    it("should reject layer with invalid animation enter type", () => {
      const layer = {
        id: "layer-1",
        type: "text" as const,
        position: { x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
        content: "Bad animation",
        animation: {
          enter: "spinAround" as any,
          enterDelay: 0,
          exit: "fadeOut",
        },
      };

      expect(VisualLayerSchema.safeParse(layer).success).toBe(false);
    });

    it("should reject layer with invalid type", () => {
      const layer = {
        id: "layer-1",
        type: "video" as any,
        position: { x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
        content: "invalid",
        animation: { enter: "fadeIn", enterDelay: 0, exit: "fadeOut" },
      };

      expect(VisualLayerSchema.safeParse(layer).success).toBe(false);
    });
  });

  describe("SceneTransition Schema Validation", () => {
    it("should validate fade transition", () => {
      expect(
        SceneTransitionSchema.safeParse({ type: "fade", duration: 0.4 })
          .success,
      ).toBe(true);
    });

    it("should validate slide transition", () => {
      expect(
        SceneTransitionSchema.safeParse({ type: "slide", duration: 0.3 })
          .success,
      ).toBe(true);
    });

    it("should validate wipe transition", () => {
      expect(
        SceneTransitionSchema.safeParse({ type: "wipe", duration: 0.5 })
          .success,
      ).toBe(true);
    });

    it("should validate none transition", () => {
      expect(
        SceneTransitionSchema.safeParse({ type: "none", duration: 0 }).success,
      ).toBe(true);
    });

    it("should reject invalid transition type", () => {
      expect(
        SceneTransitionSchema.safeParse({ type: "zoom" as any, duration: 0.3 })
          .success,
      ).toBe(false);
    });

    it("should reject negative duration", () => {
      expect(
        SceneTransitionSchema.safeParse({ type: "fade", duration: -0.1 })
          .success,
      ).toBe(false);
    });
  });

  describe("Renderer Schema Consistency", () => {
    it("should validate renderer scene script schema", () => {
      const scene = {
        id: "scene-1",
        type: "feature" as const,
        title: "Feature",
        narration: "Content",
        duration: 30,
        visualLayers: [
          {
            id: "layer-1",
            type: "screenshot" as const,
            position: { x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
            content: "https://example.com/image.png",
            animation: { enter: "fadeIn", enterDelay: 0, exit: "fadeOut" },
          },
        ],
      };

      expect(SceneScriptSchema.safeParse(scene).success).toBe(true);
    });

    it("should validate renderer script output schema", () => {
      const script = {
        title: "Test Video",
        totalDuration: 120,
        scenes: [
          {
            id: "1",
            type: "intro" as const,
            title: "Intro",
            narration: "Welcome",
            duration: 10,
          },
          {
            id: "2",
            type: "feature" as const,
            title: "Feature",
            narration: "Content",
            duration: 60,
          },
        ],
      };

      expect(RendererScriptOutputSchema.safeParse(script).success).toBe(true);
    });

    it("should validate renderer visual layer schema", () => {
      const layer = {
        id: "layer-1",
        type: "code" as const,
        position: { x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
        content: "const x = 1;",
        animation: { enter: "typewriter", enterDelay: 0, exit: "fadeOut" },
      };

      expect(RendererVisualLayerSchema.safeParse(layer).success).toBe(true);
    });
  });

  describe("Pipeline Data Flow", () => {
    it("should support full pipeline data structure", () => {
      const pipelineData = {
        research: {
          title: "TypeScript Generics",
          overview: "Understanding TypeScript generics",
          keyPoints: [
            { title: "Basics", description: "Generic basics" },
            { title: "Advanced", description: "Advanced patterns" },
          ],
          scenes: [
            {
              sceneTitle: "Intro",
              duration: 10,
              description: "Intro",
              screenshotSubjects: ["tslang.org"],
            },
          ],
          sources: [
            {
              url: "https://typescriptlang.org",
              title: "TS Docs",
              keyContent: "Generics",
            },
          ],
        },
        script: {
          title: "TypeScript Generics",
          totalDuration: 180,
          scenes: [
            {
              id: "scene-1",
              type: "intro",
              title: "Introduction",
              narration: "Welcome to the video about TypeScript generics",
              duration: 12,
              visualLayers: [
                {
                  id: "layer-1",
                  type: "screenshot",
                  position: {
                    x: 0,
                    y: 0,
                    width: 1920,
                    height: 1080,
                    zIndex: 0,
                  },
                  content: "https://typescriptlang.org",
                  animation: {
                    enter: "slideUp",
                    enterDelay: 0,
                    exit: "slideOut",
                  },
                },
              ],
              transition: { type: "fade", duration: 0.4 },
            },
            {
              id: "scene-2",
              type: "feature",
              title: "Generic Basics",
              narration: "Let's learn about generic types...",
              duration: 45,
              visualLayers: [
                {
                  id: "layer-1",
                  type: "screenshot",
                  position: {
                    x: "left",
                    y: "top",
                    width: 1152,
                    height: "auto",
                    zIndex: 0,
                  },
                  content: "https://github.com/microsoft/TypeScript",
                  animation: {
                    enter: "slideRight",
                    enterDelay: 0,
                    exit: "slideOut",
                  },
                },
                {
                  id: "layer-2",
                  type: "code",
                  position: {
                    x: "right",
                    y: "center",
                    width: 768,
                    height: "auto",
                    zIndex: 1,
                  },
                  content: "function identity<T>(arg: T): T { return arg; }",
                  animation: {
                    enter: "fadeIn",
                    enterDelay: 0.5,
                    exit: "fadeOut",
                  },
                },
              ],
              transition: { type: "slide", duration: 0.3 },
            },
            {
              id: "scene-3",
              type: "outro",
              title: "Summary",
              narration: "Thanks for watching",
              duration: 10,
              visualLayers: [
                {
                  id: "layer-1",
                  type: "text",
                  position: {
                    x: "center",
                    y: "center",
                    width: "auto",
                    height: "auto",
                    zIndex: 0,
                  },
                  content: "Thanks for watching!",
                  animation: {
                    enter: "zoomIn",
                    enterDelay: 0,
                    exit: "zoomOut",
                  },
                },
              ],
            },
          ],
        },
      };

      expect(
        ResearchOutputSchema.safeParse(pipelineData.research).success,
      ).toBe(true);
      expect(ScriptOutputSchema.safeParse(pipelineData.script).success).toBe(
        true,
      );
    });

    it("should validate that 50% of scenes can have transitions", () => {
      const scenes = [
        {
          id: "1",
          type: "intro",
          title: "Intro",
          narration: "Welcome",
          duration: 10,
        },
        {
          id: "2",
          type: "feature",
          title: "Feature",
          narration: "Content",
          duration: 30,
          transition: { type: "fade", duration: 0.4 },
        },
        {
          id: "3",
          type: "code",
          title: "Code",
          narration: "Code example",
          duration: 45,
          transition: { type: "slide", duration: 0.3 },
        },
        {
          id: "4",
          type: "outro",
          title: "Outro",
          narration: "Goodbye",
          duration: 10,
        },
      ];

      const scenesWithTransition = scenes.filter((s) => s.transition);
      const transitionRatio = scenesWithTransition.length / scenes.length;

      expect(transitionRatio).toBeGreaterThanOrEqual(0.5);
      expect(
        ScriptOutputSchema.safeParse({
          title: "Test",
          totalDuration: 95,
          scenes,
        }).success,
      ).toBe(true);
    });
  });
});
