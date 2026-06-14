import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    nitro: {
      preset: "static",
      prerender: {
        routes: ["/"],
        crawlLinks: false,
      },
      output: {
        dir: ".output",
        publicDir: "dist",
      },
    },
  },
});
