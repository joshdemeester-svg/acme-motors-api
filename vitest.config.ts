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
      reporter: ["text", "text-summary", "json", "html", "lcov"],
      include: ["server/**/*.ts", "shared/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "server/index.ts",
        "server/vite.ts",
        "server/seo.ts",
        "server/static.ts",
        "server/demoData.ts",
        "server/seed-data.ts",
        "server/object_storage/**",
        "server/middleware/validation.ts",
        "**/node_modules/**",
      ],
      reportsDirectory: "./coverage",
      thresholds: {
        statements: 15,
        branches: 7,
        functions: 10,
        lines: 15,
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    sequence: {
      shuffle: true,
    },
    reporters: ["default", "junit"],
    outputFile: {
      junit: "./test-results/junit.xml",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
