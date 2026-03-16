import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { z } from "zod";

export const VideoConfigSchema = z.object({
  llm: z.object({
    provider: z.enum(["openai", "anthropic"]).default("openai"),
    model: z.string().default("gpt-4-turbo"),
    apiKey: z.string().optional(),
  }),
  tts: z.object({
    enabled: z.boolean().default(false),
    provider: z.string().default("edge-tts"),
    voice: z.string().default("zh-CN-XiaoxiaoNeural"),
  }),
  video: z.object({
    defaultAspectRatio: z.string().default("16:9"),
    fps: z.number().int().positive().default(30),
    codec: z.string().default("h264"),
  }),
  screenshot: z.object({
    browserPoolSize: z.number().int().positive().default(3),
    viewport: z.object({
      width: z.number().int().positive().default(1920),
      height: z.number().int().positive().default(1080),
    }),
  }),
});

export type VideoConfig = z.infer<typeof VideoConfigSchema>;

const SENSITIVE_KEYS = new Set([
  "apiKey",
  "api_key",
  "password",
  "secret",
  "token",
]);

// Resolves ${ENV_VAR} placeholders — regex: \$\{([^}]+)\} captures var name inside braces
function resolveEnvPlaceholders(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_match, envVar: string) => {
    return process.env[envVar] ?? "";
  });
}

export function loadConfig(configPath?: string): VideoConfig {
  const defaultPath = join(process.cwd(), "video-script.config.json");
  const filePath = configPath ?? defaultPath;

  if (!existsSync(filePath)) {
    return VideoConfigSchema.parse({});
  }

  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (
      parsed.llm &&
      typeof parsed.llm === "object" &&
      "apiKey" in parsed.llm &&
      typeof (parsed.llm as Record<string, unknown>).apiKey === "string"
    ) {
      (parsed.llm as Record<string, unknown>).apiKey = resolveEnvPlaceholders(
        (parsed.llm as Record<string, unknown>).apiKey as string,
      );
    }

    return VideoConfigSchema.parse(parsed);
  } catch (error) {
    throw new Error(
      `Failed to load config from ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function maskSensitiveConfig(
  config: VideoConfig,
): Record<string, unknown> {
  function maskValue(key: string, value: unknown): unknown {
    if (SENSITIVE_KEYS.has(key)) {
      if (typeof value === "string" && value.length > 0) {
        return value.substring(0, 4) + "****";
      }
      return "****";
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return maskObject(value as Record<string, unknown>);
    }
    return value;
  }

  function maskObject(obj: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, maskValue(k, v)]),
    );
  }

  return maskObject(config as unknown as Record<string, unknown>);
}
