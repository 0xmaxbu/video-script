import { Config } from "@remotion/cli/config";

Config.overrideWidth(1920);
Config.overrideHeight(1080);

// Use Rspack instead of Webpack to avoid pnpm monorepo path resolution issues
// Rspack is a Rust-based bundler that handles paths correctly
Config.setExperimentalRspackEnabled(true);
