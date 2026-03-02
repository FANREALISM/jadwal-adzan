const { createClient } = require('@supabase/supabase-js');
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Ganti dengan URL dan Service Role Key dari Dashboard Supabase Anda
const supabase = createClient('https://phdgchwwtsadsurksprk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZGdjaHd3dHNhZHN1cmtzcHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzY1MTgsImV4cCI6MjA4NzQ1MjUxOH0.R-4J-n8dA2XDQCVI52qTDauo1RSFOPbZrikpN5xpSKc');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const broadcast = async () => {
  try {
    // 1. Ambil semua token dari Supabase
    const { data: profiles, error } = await supabase.from('profiles').select('fcm_token');
    
    if (error) throw error;

    // 2. Filter token agar unik dan tidak kosong
    const tokens = [...new Set(profiles.map(p => p.fcm_token).filter(t => t))];

    if (tokens.length > 0) {
      // 3. Gunakan sendEachForMulticast (Pengganti sendMulticast)
      const message = {
        notification: { 
          title: "Waktunya Sholat!", 
          body: "Adzan Bekasi/Cikarang sedang berkumandang." 
        },
        tokens: tokens
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      console.log(`✅ Berhasil mengirim ke ${response.successCount} perangkat.`);
      console.log(`❌ Gagal mengirim ke ${response.failureCount} perangkat.`);
    } else {
      console.log("⚠️ Tidak ada token ditemukan di database Supabase.");
    }
  } catch (err) {
    console.error("❌ Terjadi kesalahan:", err.message);
  } finally {
    process.exit();
  }
};

broadcast();