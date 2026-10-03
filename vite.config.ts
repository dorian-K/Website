import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

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

// Emits /arithmetic-sw.js (from sw/arithmetic-sw.js) with the list of files /arithmetic needs
// at startup: the main entry chunk, its static imports and CSS, plus the global Bootstrap
// files from public/. Lazily loaded chunks (sims, wasm, ...) are left out on purpose.
const offlineArithmetic = (): Plugin => ({
  name: 'offline-arithmetic',
  apply: 'build',
  generateBundle(_options, bundle) {
    const urls = new Set<string>(['/arithmetic', '/assets/bootstrap.min.css', '/assets/bootstrap.bundle.min.js', '/favicon.ico']);
    const visit = (fileName: string) => {
      const chunk = bundle[fileName];
      if (!chunk || chunk.type !== 'chunk' || urls.has('/' + fileName)) return;
      urls.add('/' + fileName);
      chunk.viteMetadata?.importedCss.forEach((css) => urls.add('/' + css));
      chunk.imports.forEach(visit);
    };
    Object.values(bundle).forEach((file) => {
      if (file.type === 'chunk' && file.isEntry) visit(file.fileName);
    });
    const precache = [...urls].sort();
    const version = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12);
    const source = readFileSync(new URL('./sw/arithmetic-sw.js', import.meta.url), 'utf8')
      .replace('__CACHE_VERSION__', JSON.stringify(version))
      .replace('__PRECACHE_URLS__', JSON.stringify(precache, null, 2));
    this.emitFile({ type: 'asset', fileName: 'arithmetic-sw.js', source });
  },
});

export default defineConfig({
  plugins: [react(), viteServerConfig, offlineArithmetic()]
})