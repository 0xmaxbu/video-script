import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      zod: path.resolve(__dirname, "src/__mocks__/zod.ts"),
      "zod/v4": path.resolve(__dirname, "src/__mocks__/zod.ts"),
      "zod/v3": path.resolve(__dirname, "src/__mocks__/zod.ts"),
    },
  },
  test: {},
});
