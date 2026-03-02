const admin = require("firebase-admin");
const cron = require("node-cron");
const axios = require("axios");

// 1. Koneksi ke Firebase menggunakan Service Account
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Ganti dengan FCM Token yang muncul di console browser/React Anda
const registrationToken = "ew7cwViS5MVQviIzFceCsT:APA91bGLpFbJfBOAjxYYx9NklzK_DAGpfgVxBfVb79oY_B2rHNjLXbgx6E1DjuPe53q-Fuxz4Frbren_uSH2N5MuCrsdWaOlJ6bru3pnl1MQIdu7sqENEt8";

// 2. Fungsi Kirim Notifikasi
const sendAdzanPush = (prayerName) => {
  const message = {
    notification: {
      title: `Waktunya Sholat ${prayerName}`,
      body: `Allahu Akbar! Sudah masuk waktu ${prayerName}. Mari sholat berjamaah.`
    },
    // Menambahkan data agar frontend bisa memutar suara
    data: {
      action: "play_adzan",
      prayer: prayerName
    },
    token: registrationToken
  };

  admin.messaging().send(message)
    .then((response) => {
      console.log(`[${new Date().toLocaleTimeString()}] Notifikasi ${prayerName} sukses:`, response);
    })
    .catch((error) => {
      console.error("Gagal kirim notifikasi:", error);
    });
};

// 3. Penjaga Waktu (Cron Job) - Jalan setiap 1 menit
cron.schedule("* * * * *", async () => {
  const now = new Date();
  // Format waktu HH:mm (Contoh: 12:05)
  const currentTime = now.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  }).replace('.', ':');

  console.log(`Checking time: ${currentTime}...`);

  try {
    // Ambil jadwal sholat berdasarkan koordinat (Contoh: Jakarta)
    const lat = "-6.2000";
    const lon = "106.8166";
    const response = await axios.get(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=11`);
    const timings = response.data.data.timings;

    const prayerList = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

    for (const prayer of prayerList) {
      // Jika waktu sekarang sama dengan jadwal dari API
      if (timings[prayer] === currentTime) {
        console.log(`Mencocokkan! Waktunya ${prayer}. Mengirim notifikasi...`);
        sendAdzanPush(prayer);
      }
    }
  } catch (error) {
    console.error("Gagal mengambil data API:", error.message);
  }
});

console.log("Backend Adzan Pro aktif. Menunggu waktu sholat...");