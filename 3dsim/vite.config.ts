import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { slicerBridgePlugin } from './server/slicerPlugin.ts';

// https://vite.dev/config/
export default defineConfig({
  base: '/3dsim/',
  plugins: [react(), tailwindcss(), slicerBridgePlugin()],
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'lucide-react': path.resolve(import.meta.dirname, './src/components/icons/MinimalIcons.tsx'),
    },
  },
  build: {
    outDir: process.env.VERCEL ? 'dist' : '../public/3dsim',
    emptyOutDir: true,
  },
  server: {
    port: 3001,
    cors: true,
    watch: {
      ignored: ['**/temp_**/**', '**/*.gcode', '**/*.3mf', '**/result.json'],
    },
  },
});
