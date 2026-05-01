import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules\/(react|react-dom|scheduler)\// },
            { name: 'query-vendor', test: /node_modules\/@tanstack\// },
            { name: 'form-vendor', test: /node_modules\/(react-hook-form|@hookform|zod)\// },
            { name: 'ui-vendor', test: /node_modules\/(@base-ui|lucide-react|sonner)\// },
            { name: 'date-vendor', test: /node_modules\/date-fns\// },
          ],
        },
      },
    },
  },
});
