import { resolve } from "path";
import { defineConfig } from "vite";

// The site was a single page until the code of conduct needed a stable URL of
// its own, so every page has to be listed here or Vite only builds index.html.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        about: resolve(__dirname, "about.html"),
        ambassador: resolve(__dirname, "ambassador.html"),
        conduct: resolve(__dirname, "code-of-conduct.html"),
      },
    },
  },
});
