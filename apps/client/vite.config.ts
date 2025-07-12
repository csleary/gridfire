import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "build"
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@gridfire/shared/abi": path.resolve(__dirname, "../../shared/src/abi"),
      "@gridfire/shared/types": path.resolve(__dirname, "../../shared/src/types")
    }
  },
  server: {
    proxy: {
      "/api": "http://localhost:5000"
    }
  }
});
