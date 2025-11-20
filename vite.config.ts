import path from 'node:path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      // Proxy API calls to avoid CORS in development
      // Requests starting with /basic or /user will be forwarded to the real API
      '/basic': {
        target: 'https://api.kezekshi.kz:39443',
        changeOrigin: true,
        secure: false,
      },
      '/user': {
        target: 'https://api.kezekshi.kz:39443',
        changeOrigin: true,
        secure: false,
      },
      '/dashboard': {
        target: 'https://api.kezekshi.kz:39443',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

// Example fetch request using the /basic/login endpoint
fetch('/basic/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'your_username',
    password: 'your_password',
  }),
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error))
