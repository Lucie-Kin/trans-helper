import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
        plugins: [react()],
        define: {
                'import.meta.env.VITE_API_URL': JSON.stringify(process.env.API_URL || 'https://localhost:8443'),
        },
        server: {
                host: true,
                port: 5000,
                watch: {
                        usePolling: true,
                },
                allowedHosts: true,
        }
});
