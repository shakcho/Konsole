import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "konsole-logger": resolve(__dirname, "../../src/index.ts"),
    },
  },
});

