import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const projectId = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || 'organizr-skip';
  const functionsRegion = env.FIREBASE_FUNCTIONS_REGION || 'us-central1';
  const functionsName = env.FIREBASE_FUNCTIONS_NAME || 'api';
  const functionsOrigin = env.FIREBASE_FUNCTIONS_EMULATOR_ORIGIN || 'http://127.0.0.1:5001';
  const functionsPath = `/${projectId}/${functionsRegion}/${functionsName}`;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: functionsOrigin,
          changeOrigin: true,
          rewrite: (requestPath) => `${functionsPath}${requestPath}`,
        },
      },
    },
  };
});
