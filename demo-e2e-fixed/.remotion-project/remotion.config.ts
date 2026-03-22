const path = require("path");
const { Config } = require("@remotion/cli/config");

Config.overrideWebpackConfig((currentConfiguration) => {
  // Point @remotion/studio to its ESM entry instead of CJS entry
  // This fixes the subpath import issue (e.g., @remotion/studio/renderEntry)
  const studioEsmPath = path.join(__dirname, "node_modules", "@remotion", "studio", "dist", "esm", "index.mjs");
  const { alias } = currentConfiguration.resolve || {};
  
  // Remove the problematic @remotion/studio alias entirely
  // so subpaths resolve correctly through normal node_modules resolution
  const newAlias = Object.fromEntries(
    Object.entries(alias || {}).filter(([key]) => key !== "@remotion/studio")
  );
  
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: newAlias,
    },
  };
});
