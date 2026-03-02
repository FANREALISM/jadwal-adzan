import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "https://esm.sh/web-push@3.6.6"

serve(async (req) => {
  // 1. Setup Supabase Client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 2. Konfigurasi WebPush (Gunakan Private Key Anda di Env Supabase)
  webpush.setVapidDetails(
    'mailto:[EMAIL_ADDRESS]',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  )

  // 3. Ambil semua langganan dari tabel
  const { data: subs } = await supabase.from('user_subscriptions').select('*')

  // 4. Kirim notifikasi ke semua (Looping)
  if (subs) {
    const pushPromises = subs.map((sub) => {
      return webpush.sendNotification(
        sub.subscription_json,
        JSON.stringify({
          title: "Waktu Sholat Tiba",
          body: "Mari berhenti sejenak dan tunaikan ibadah.",
          icon: "/logo192.png"
        })
      ).catch(err => console.error("Kirim gagal:", err))
    })
    await Promise.all(pushPromises)
  }

  return new Response("OK", { status: 200 })
})