import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // mirror tsconfig's `@/*` → repo root
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // the integration suite drives a real server and shares one SQLite file
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
