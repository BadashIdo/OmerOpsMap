import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { db } from './db.js'; // Import the mock data

// A simple Vite plugin to mock API responses
const mockApiPlugin = () => ({
  name: 'mock-api',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/api/sites') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(db.sites));
        return;
      }
      if (req.url === '/api/streets') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(db.streets));
        return;
      }
      if (req.url.startsWith('/api/live-messages')) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(db['live-messages']));
        return;
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), mockApiPlugin()], // Add the mock API plugin
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
