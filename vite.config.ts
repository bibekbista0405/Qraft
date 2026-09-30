import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Relative base so the build works at a domain root or under a sub-path (e.g. GitHub Pages).
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { chunkSizeWarningLimit: 700 },
  test: { include: ["src/**/*.test.ts"] },
});
