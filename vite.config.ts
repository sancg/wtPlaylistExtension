import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    outDir: 'dist',
    modulePreload: false,

    rollupOptions: {
      input: {
        popup: 'src/pages/popup/popup.html',
        // viewer: 'public/html/pages/playlist_viewer.html',
        sidePanel: 'src/pages/side_panel/side-panel.html',

        // scripts
        contentScript: resolve(__dirname, 'src/scripts/content/contentScript.ts'),
        injectButtonUI: resolve(__dirname, 'src/scripts/content/injectButtonUI.ts'),
        background: resolve(__dirname, 'src/scripts/background/background.ts'),
      },

      output: {
        // put UI bundles in app/ui/
        entryFileNames(chunk) {
          if (chunk.name === 'background') return 'assets/app/scripts/background/[name].js';

          if (chunk.name === 'contentScript' || chunk.name === 'injectButtonUI')
            return 'assets/app/scripts/content/[name].js';

          return 'assets/app/ui/[name].js';
        },

        chunkFileNames(_chunkInfo) {
          // Never create shared chunks for content scripts
          // if (chunkInfo.facadeModuleId?.includes('content/')) {
          //   return 'assets/app/scripts/content/[name].js';
          // }

          // background cannot use shared chunks either
          // if (chunkInfo.facadeModuleId?.includes('background/')) {
          //   return 'assets/app/scripts/background/[name].js';
          // }

          // UI can share chunks
          return 'assets/app/bundler/[name]-[hash].js';
        },

        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
