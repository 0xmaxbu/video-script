import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "zod/v4": path.resolve(__dirname, "node_modules/zod/lib/index.mjs"),
      "zod/v3": path.resolve(__dirname, "node_modules/zod/lib/index.mjs"),
    },
  },
  test: {},
});
