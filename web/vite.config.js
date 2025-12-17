import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from "path";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
        dedupe: ["react", "react-dom"],
    },
    server: {
      host: '127.0.0.1',
      port: 8081,
      proxy: {
        '/guests': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    }
});
