import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { 
        enabled: true, 
        type: 'module' 
      },
      workbox: {
        // Mencegah error precache pada file yang sering berubah di mode dev
        runtimeCaching: [
          {
            urlPattern: ({ request }) => 
              request.destination === 'script' || 
              request.destination === 'style',
            handler: 'StaleWhileRevalidate',
          },
        ],
      },
      manifest: {
        name: 'Adzan Pro Precision',
        short_name: 'AdzanPro',
        description: 'Aplikasi Jadwal Sholat Presisi',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        icons: [
          { 
            src: 'logo192.png', 
            sizes: '192x192', 
            type: 'image/png' 
          },
          { 
            src: 'logo512.png', 
            sizes: '512x512', 
            type: 'image/png' 
          }
        ]
      }
    })
  ],
  server: {
    headers: {
      "Service-Worker-Allowed": "/",
    },
  },
})