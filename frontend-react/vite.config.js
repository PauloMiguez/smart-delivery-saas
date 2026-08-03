import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            },
            '/socket.io': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                ws: true
            }
        }
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'chart-vendor': ['recharts'],
                    'styled-vendor': ['styled-components'],
                    'socket-vendor': ['socket.io-client'],
                    'date-vendor': ['date-fns'],
                    'icons-vendor': ['react-icons'],
                    'axios-vendor': ['axios'],
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: false,
                drop_debugger: false,
                pure_funcs: []
            }
        },
        cssCodeSplit: true,
        sourcemap: true,
        chunkSizeWarningLimit: 500,
        reportCompressed: true
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'styled-components',
            'recharts',
            'socket.io-client',
            'axios'
        ]
    },
    resolve: {
        alias: {
            'react-icons': 'react-icons'
        }
    }
})
