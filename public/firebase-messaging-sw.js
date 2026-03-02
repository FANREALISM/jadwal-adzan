// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "API_KEY_ANDA",
  projectId: "PROJECT_ID_ANDA",
  messagingSenderId: "SENDER_ID_ANDA",
  appId: "APP_ID_ANDA"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
    tag: 'adzan-notification', // Mencegah penumpukan notifikasi
    requireInteraction: true   // Notifikasi tidak hilang sampai diklik
  };

  // Menampilkan notifikasi sistem
  self.registration.showNotification(notificationTitle, notificationOptions);
});