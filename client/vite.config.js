import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Server routes are mounted at "/" (see server/src/index.js), so we
      // strip the "/api" prefix here in dev. In prod, set VITE_API_BASE to
      // point straight at the deployed server instead of using this proxy.
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
