import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Для resolve.alias

export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-datepicker'] // Кэшируем эти пакеты, чтобы избежать дубликатов
    },
    resolve: {
        alias: {
            react: path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
        }
    },
    server: {
        port: 80,
        host: true,
        proxy: {
            '/auth': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
            },
            '/ws': {
                target: 'http://localhost:8000',
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