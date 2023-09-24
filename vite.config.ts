import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const viteServerConfig = {
  name: 'log-request-middleware',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET");
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      next();
    });
  }
};


export default defineConfig({
  plugins: [react(), viteServerConfig]
})