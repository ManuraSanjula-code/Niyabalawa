import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Custom plugin to copy preload script
const copyPreloadPlugin = () => ({
  name: 'copy-preload',
  buildStart() {
    const distElectron = path.resolve(__dirname, 'dist-electron');
    if (!existsSync(distElectron)) {
      mkdirSync(distElectron, { recursive: true });
    }
    copyFileSync(
      path.resolve(__dirname, 'electron/preload.js'),
      path.resolve(distElectron, 'preload.js')
    );
    console.log('✅ Copied preload.js to dist-electron');
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    copyPreloadPlugin(),
    react(),
    electron([
      {
        // Main process entry file
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      }
    ]),
    renderer()
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});

