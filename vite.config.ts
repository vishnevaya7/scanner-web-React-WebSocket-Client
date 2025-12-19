// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: true, // Для IP-доступа
        proxy: {
            '/auth': {
                target: 'http://localhost:8000', // localhost вместо IP
                changeOrigin: true,
                secure: false,
            },
            '/ws': {
                target: 'ws://localhost:8000', // ws://localhost:8000/ws
                ws: true,
                changeOrigin: true,
            },
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});