import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(moduleId) {
          if (!moduleId.includes("/node_modules/")) {
            return undefined;
          }
          if (moduleId.includes("/msw/") || moduleId.includes("/@mswjs/")) {
            return "msw";
          }
          if (moduleId.includes("/@tanstack/")) {
            return "tanstack";
          }
          if (
            moduleId.includes("/react/") ||
            moduleId.includes("/react-dom/") ||
            moduleId.includes("/scheduler/")
          ) {
            return "react";
          }
          return "vendor";
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: 5173,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
