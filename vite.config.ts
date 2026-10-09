import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflareOutput } from "./build/cloudflare.mjs";
export default defineConfig({
  base: "./",
  plugins: [react(), cloudflareOutput()],
  build: { outDir: ".output/public", emptyOutDir: true },
});
