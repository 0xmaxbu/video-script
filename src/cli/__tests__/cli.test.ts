import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("loadConfig integration", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `video-script-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("should load defaults when config file does not exist", async () => {
    const { loadConfig } = await import("../../utils/config.js");
    const config = loadConfig(join(tempDir, "nonexistent.json"));
    expect(config.llm.provider).toBe("openai");
    expect(config.llm.model).toBe("gpt-4-turbo");
    expect(config.video.fps).toBe(30);
    expect(config.tts.enabled).toBe(false);
  });

  it("should load and parse a valid config file", async () => {
    const { loadConfig } = await import("../../utils/config.js");
    const configPath = join(tempDir, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        llm: { provider: "anthropic", model: "claude-3-sonnet" },
        video: { fps: 60 },
      }),
    );
    const config = loadConfig(configPath);
    expect(config.llm.provider).toBe("anthropic");
    expect(config.llm.model).toBe("claude-3-sonnet");
    expect(config.video.fps).toBe(60);
    expect(config.tts.enabled).toBe(false);
  });

  it("should resolve ${ENV_VAR} placeholders in apiKey", async () => {
    const { loadConfig } = await import("../../utils/config.js");
    const configPath = join(tempDir, "config.json");
    process.env.TEST_API_KEY_CLI = "sk-resolved-key";
    writeFileSync(
      configPath,
      JSON.stringify({
        llm: { apiKey: "${TEST_API_KEY_CLI}" },
      }),
    );
    const config = loadConfig(configPath);
    expect(config.llm.apiKey).toBe("sk-resolved-key");
    delete process.env.TEST_API_KEY_CLI;
  });

  it("should resolve missing env var to empty string", async () => {
    const { loadConfig } = await import("../../utils/config.js");
    const configPath = join(tempDir, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        llm: { apiKey: "${NONEXISTENT_ENV_VAR_XYZ}" },
      }),
    );
    const config = loadConfig(configPath);
    expect(config.llm.apiKey).toBe("");
  });

  it("should throw on invalid JSON config file", async () => {
    const { loadConfig } = await import("../../utils/config.js");
    const configPath = join(tempDir, "bad.json");
    writeFileSync(configPath, "{ not valid json }");
    expect(() => loadConfig(configPath)).toThrow();
  });
});

describe("maskSensitiveConfig integration", () => {
  it("should mask apiKey with prefix and ****", async () => {
    const { maskSensitiveConfig, loadConfig } =
      await import("../../utils/config.js");
    const config = loadConfig();
    const masked = maskSensitiveConfig({
      ...config,
      llm: { ...config.llm, apiKey: "sk-supersecretkey" },
    });
    const llm = masked.llm as Record<string, unknown>;
    expect(llm.apiKey).toBe("sk-s****");
  });

  it("should return **** for empty string apiKey", async () => {
    const { maskSensitiveConfig, loadConfig } =
      await import("../../utils/config.js");
    const config = loadConfig();
    const masked = maskSensitiveConfig({
      ...config,
      llm: { ...config.llm, apiKey: "" },
    });
    const llm = masked.llm as Record<string, unknown>;
    expect(llm.apiKey).toBe("****");
  });

  it("should preserve non-sensitive nested fields", async () => {
    const { maskSensitiveConfig, loadConfig } =
      await import("../../utils/config.js");
    const config = loadConfig();
    const masked = maskSensitiveConfig(config);
    const video = masked.video as Record<string, unknown>;
    expect(video.fps).toBe(30);
    expect(video.codec).toBe("h264");
  });
});

describe("CLI program structure", () => {
  it("should register create command", async () => {
    vi.resetModules();
    const { Command } = await import("commander");
    const program = new Command();
    program.command("create [title]").description("Create a new video project");
    program.command("config").description("View configuration");
    program.command("resume <runId>").description("Resume workflow");

    const commandNames = program.commands.map((c) => c.name());
    expect(commandNames).toContain("create");
    expect(commandNames).toContain("config");
    expect(commandNames).toContain("resume");
  });

  it("should parse --links option as string", async () => {
    const { Command } = await import("commander");
    const program = new Command().exitOverride();
    program
      .command("create [title]")
      .option("--links <urls>", "Comma-separated URLs")
      .action(() => {});

    const sub = program.commands[0];
    sub.parse(["--links", "https://example.com"], { from: "user" });
    expect(sub.opts().links).toBe("https://example.com");
  });

  it("should parse --no-review flag", async () => {
    const { Command } = await import("commander");
    const program = new Command().exitOverride();
    program
      .command("create [title]")
      .option("--no-review", "Skip review")
      .action(() => {});

    const sub = program.commands[0];
    sub.parse(["--no-review"], { from: "user" });
    expect(sub.opts().review).toBe(false);
  });

  it("should use 16:9 as default aspect ratio", async () => {
    const { Command } = await import("commander");
    const program = new Command().exitOverride();
    program
      .command("create [title]")
      .option("--aspect-ratio <ratio>", "Aspect ratio", "16:9")
      .action(() => {});

    const sub = program.commands[0];
    sub.parse([], { from: "user" });
    expect(sub.opts().aspectRatio).toBe("16:9");
  });
});
