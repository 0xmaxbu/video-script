import { Config } from "@remotion/cli/config";

// Remotion configuration for video-script renderer
// NOTE: Due to pnpm monorepo + webpack 5 incompatibility, complex webpack configs don't work.
// This minimal config only fixes critical issues.
// See .planning/phases/14-animation-engine/14-GAP-04-BLOCKER.md for details.

Config.overrideWidth(1920);
Config.overrideHeight(1080);

// Fix broken @remotion/studio alias that causes subpath export resolution to fail
Config.overrideWebpackConfig((config) => {
  // Remove the broken @remotion/studio alias - let webpack use package.json exports
  if (config.resolve?.alias && typeof config.resolve.alias === "object" && !Array.isArray(config.resolve.alias)) {
    const alias = { ...config.resolve.alias } as { [key: string]: string | false | string[] };
    if ("@remotion/studio" in alias) {
      delete alias["@remotion/studio"];
    }
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias,
      },
    };
  }
  return config;
});
