// Mendengarkan event 'push' dari server
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Waktu Sholat', body: 'Mari tunaikan ibadah.' };

  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/logo192.png', // Ikon kecil di status bar Android
    vibrate: [200, 100, 200],
    data: { url: self.location.origin }, // Data tambahan untuk diklik
    tag: 'prayer-notification' // Mencegah tumpukan notifikasi yang sama
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Menangani klik pada notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});