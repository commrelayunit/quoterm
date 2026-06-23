import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^quoterm\/style\.css$/, replacement: path.resolve(__dirname, "../../src/styles.css") },
      { find: /^quoterm\/styles\.css$/, replacement: path.resolve(__dirname, "../../src/styles.css") },
      { find: /^quoterm$/, replacement: path.resolve(__dirname, "../../src/index.ts") },
    ],
  },
  optimizeDeps: {
    exclude: ["quoterm"],
  },
});
