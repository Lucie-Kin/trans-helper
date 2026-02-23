// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
// 	plugins: [react()],
// 	server: {
// 		host:true,
// 		port:5173,
// 		watch:{
// 			usePolling: true,
// 		},
// 		hmr: {
// 			protocol: "wss",
// 			host: "localhost",
// 			clientPort: 8443,
// 		},
// 	}
// });

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
