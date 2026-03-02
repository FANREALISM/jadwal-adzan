import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { createClient } from '@supabase/supabase-js';

// Konfigurasi Firebase (Tetap pakai untuk Messaging)
const firebaseConfig = {
  apiKey: "AIzaSyBLzp5v_mIVzNGxSZnDldbNCucRuNGGU8E",
  authDomain: "adzan-e1a92.firebaseapp.com",
  projectId: "adzan-e1a92",
  storageBucket: "adzan-e1a92.firebasestorage.app",
  messagingSenderId: "224719070900",
  appId: "1:224719070900:web:ce9ccbf9b8801ca9ef19e1"
};

// Konfigurasi Supabase
const supabaseUrl = 'https://phdgchwwtsadsurksprk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZGdjaHd3dHNhZHN1cmtzcHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzY1MTgsImV4cCI6MjA4NzQ1MjUxOH0.R-4J-n8dA2XDQCVI52qTDauo1RSFOPbZrikpN5xpSKc';
export const supabase = createClient(supabaseUrl, supabaseKey);

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    const status = await Notification.requestPermission();
    if (status === 'granted') {
      const currentToken = await getToken(messaging, { 
        // PASTI KAN KODE INI SAMA PERSIS DENGAN DI FIREBASE CONSOLE
        vapidKey: 'BLG0uLaLVMVb36804gz3laJYwdbpRKRi2LAa9dg38s0I2J6J_QHfknnV824DwJY1A77dHj-GyWHzcbBPZeH_mxY' 
      });
      return currentToken;
    }
  } catch (err) {
    console.error('Error VAPID:', err);
  }
  return null;
};