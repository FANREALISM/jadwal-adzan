import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: { 
        enabled: true, 
        type: 'module' 
      },
      workbox: {
        // 1. Gabungkan pola glob untuk menyimpan aset statis secara offline
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
        
        // 2. Memastikan Service Worker segera aktif tanpa menunggu tab ditutup
        skipWaiting: true,
        clientsClaim: true,

        runtimeCaching: [
          // Cache untuk Script dan Style (StaleWhileRevalidate)
          {
            urlPattern: ({ request }) => 
              request.destination === 'script' || 
              request.destination === 'style',
            handler: 'StaleWhileRevalidate',
          },
          // 3. Cache khusus untuk Audio agar Adzan tetap bunyi saat offline
          {
            urlPattern: ({ request }) => request.destination === 'audio',
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 30, // Simpan selama 30 hari
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
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
            type: 'image/png',
            purpose: 'any maskable' // Tambahan agar ikon bagus di Android
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