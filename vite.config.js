import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        adminproduct: resolve(__dirname, 'adminproduct.html'),
        adminorders: resolve(__dirname, 'adminorders.html'),
        adminusers: resolve(__dirname, 'adminusers.html'),
        adminlogin: resolve(__dirname, 'adminlogin.html'),
      },
    },
  },
});