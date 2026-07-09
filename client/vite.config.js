// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The "proxy" forwards any request starting with /api from the Vite dev server
// (localhost:5173) to our Express backend (localhost:4000). This means the
// frontend can just call fetch('/api/stats') with no CORS headaches in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
