import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const frontendRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, frontendRoot, '');
  const apiPort = env.VITE_API_PORT || '3010';

  return {
    root: frontendRoot,
    envDir: frontendRoot,
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': `http://localhost:${apiPort}`
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  };
});
