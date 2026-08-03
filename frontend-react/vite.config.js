// frontend-react/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        // ============================================================
        //  OTIMIZAÇÃO DO BUNDLE - CODE SPLITTING
        // ============================================================
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separar bibliotecas grandes em chunks separados
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'chart-vendor': ['recharts'],
                    'styled-vendor': ['styled-components'],
                    'socket-vendor': ['socket.io-client'],
                    'date-vendor': ['date-fns'],
                }
            }
        },
        // Minificação mais agressiva
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: process.env.NODE_ENV === 'production',
                drop_debugger: process.env.NODE_ENV === 'production',
                pure_funcs: ['console.log', 'console.debug']
            }
        },
        // Separar CSS em arquivos diferentes
        cssCodeSplit: true,
        // Desabilitar source maps em produção
        sourcemap: process.env.NODE_ENV !== 'production',
        // Aumentar limite de aviso para chunks
        chunkSizeWarningLimit: 500,
        // Gerar relatório de build
        reportCompressed: true
    },
    // Otimizações para desenvolvimento
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            'styled-components',
            'recharts'
        ]
    }
})