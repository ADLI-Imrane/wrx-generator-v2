import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // In dev, the Worker (wrangler dev on :8787) owns /api and short links.
  server: { port: 5173, proxy: { '/api': 'http://localhost:8787' } },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) =>
          id.includes('qr-code-styling')
            ? 'qr'
            : id.includes('world-atlas') || id.includes('d3-geo') || id.includes('topojson')
              ? 'map'
              : undefined,
      },
    },
  },
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], include: ['src/**/*.test.{ts,tsx}'] },
});
