import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", "dist", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["server/**/*.ts", "shared/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
