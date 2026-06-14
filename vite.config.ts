import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    nitro: {
      preset: "static",
      output: {
        dir: ".output",
        publicDir: "dist",
      },
    },
  },
});
