import path from "node:path";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      tailwindcss: path.resolve(
        __dirname,
        "./node_modules/tailwindcss/index.css"
      ),
    },
    preserveSymlinks: true,
  },
});
