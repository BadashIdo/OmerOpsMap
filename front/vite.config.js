import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow access from outside container
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Needed for hot reload in Docker on Windows
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
})
