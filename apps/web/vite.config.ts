import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
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
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            query: ['@tanstack/react-query'],
          },
        },
      },
    },
  };
});
