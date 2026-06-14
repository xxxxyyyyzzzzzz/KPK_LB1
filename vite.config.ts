import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: {
    preset: "static",
    output: {
      dir: ".output",
      publicDir: "dist",
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
