import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,   // Permite acceso desde Docker
    port: 8080,   // Puerto del frontend
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://backend:5000", // Nombre del servicio en docker-compose
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
