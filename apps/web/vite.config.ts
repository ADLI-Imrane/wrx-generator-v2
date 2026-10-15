import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseProxyTarget = env['SUPABASE_PROXY_TARGET'];

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@wrx/shared': path.resolve(__dirname, '../../packages/shared/src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        ...(supabaseProxyTarget && {
          '/supabase': {
            target: supabaseProxyTarget,
            changeOrigin: true,
            rewrite: (url: string) => url.replace(/^\/supabase/, ''),
          },
        }),
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      // Read by scripts/prerender.mjs to link the homepage CSS and preloads.
      manifest: true,
      rollupOptions: isSsrBuild
        ? {}
        : {
            input: {
              main: path.resolve(__dirname, 'index.html'),
              en: path.resolve(__dirname, 'en/index.html'),
            },
            output: {
              // The homepage only needs react; the router, query and auth clients stay with the app.
              manualChunks(id: string) {
                // Keep Vite's preload helper out of app-only chunks the homepage would then load.
                if (id.includes('preload-helper') || id.includes('commonjsHelpers'))
                  return 'runtime';
                if (!id.includes('node_modules')) return undefined;
                if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id))
                  return 'react';
                if (/react-router/.test(id)) return 'router';
                if (/@supabase/.test(id)) return 'supabase';
                if (/@tanstack/.test(id)) return 'query';
                return undefined;
              },
            },
          },
    },
  };
});
