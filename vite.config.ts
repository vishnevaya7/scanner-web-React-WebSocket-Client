import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', // Позволяет доступ с других устройств
        proxy: {
            '/api': {
                target: process.env.VITE_API_URL || 'http://192.168.0.101:8000',
                changeOrigin: true,
                secure: false,
            },
            '/ws': {
                target: process.env.VITE_WS_URL || 'ws://192.168.0.101:8000',
                ws: true,
                changeOrigin: true,
            }
        }
    }
})