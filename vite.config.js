import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "./",
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      three: resolve(__dirname, "node_modules/three"),
      "three/examples/jsm": resolve(
        __dirname,
        "node_modules/three/examples/jsm"
      ),
    },
  },
});
