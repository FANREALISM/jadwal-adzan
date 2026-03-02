import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './firebase-config';

// --- KOMPONEN KARTU JADWAL DENGAN EFEK RIPPLE ---
const PrayerCard = ({ name, time, isActive }) => {
  const [ripples, setRipples] = useState([]);

  const createRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { x, y, id: Date.now() };
    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== newRipple.id)), 600);
  };

  return (
    <div 
      onClick={createRipple}
      className={`group relative overflow-hidden flex justify-between items-center p-6 rounded-[2.5rem] border transition-all duration-500 cursor-pointer select-none
        ${isActive 
          ? 'bg-emerald-500 border-emerald-400 scale-[1.02] shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)]' 
          : 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/60 hover:border-emerald-500/40'
        }`}
    >
      {ripples.map((r) => (
        <span key={r.id} className="absolute bg-white/20 rounded-full animate-ping pointer-events-none" 
          style={{ left: r.x, top: r.y, width: '100px', height: '100px', margin: '-50px 0 0 -50px' }} 
        />
      ))}
      <div className="flex items-center gap-4 pointer-events-none">
        <div className={`w-1 h-8 rounded-full transition-all duration-300 ${isActive ? 'bg-white' : 'bg-slate-800 group-hover:bg-emerald-500'}`}></div>
        <span className={`text-xs font-black uppercase tracking-[0.2em] ${isActive ? 'text-emerald-950' : 'text-slate-500 group-hover:text-emerald-400'}`}>{name}</span>
      </div>
      <span className={`text-3xl font-mono font-black transition-all duration-300 pointer-events-none ${isActive ? 'text-white' : 'text-slate-200'}`}>{time}</span>
    </div>
  );
};

// --- KOMPONEN UTAMA ---
const App = () => {
  const [session, setSession] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationName, setLocationName] = useState("MENDETEKSI LOKASI...");
  const [hijriDate, setHijriDate] = useState(null);
  const [nextPrayer, setNextPrayer] = useState({ name: "-", countdown: "", isUrgent: false });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [notifiedPrayers, setNotifiedPrayers] = useState([]);
  const [isNotifyEnabled, setIsNotifyEnabled] = useState(false);
  
  const adzanAudio = useRef(null);

  useEffect(() => {
    adzanAudio.current = new Audio('/adzan.mp3');
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    if ("Notification" in window && Notification.permission === "granted") {
      setIsNotifyEnabled(true);
    }
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (schedule && isNotifyEnabled) {
      const timeStr = currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const nameMap = { Fajr: 'Subuh', Dhuhr: 'Dzuhur', Asr: 'Ashar', Maghrib: 'Maghrib', Isha: 'Isya' };
      
      Object.entries(schedule).forEach(([key, time]) => {
        if (nameMap[key] && time === timeStr && !notifiedPrayers.includes(key)) {
          triggerAdzan(nameMap[key]);
          setNotifiedPrayers(prev => [...prev, key]);
        }
      });
      if (timeStr === "00:00") setNotifiedPrayers([]); 
    }
  }, [currentTime, schedule, notifiedPrayers, isNotifyEnabled]);

  const triggerAdzan = (name) => {
    if (Notification.permission === "granted") {
      new Notification(`Waktu Sholat ${name} Tiba`, {
        body: `Mari tunaikan ibadah sholat ${name} untuk wilayah ${locationName}`,
        icon: '/logo192.png'
      });
    }
    if (adzanAudio.current) {
        adzanAudio.current.play().catch(() => console.log("Audio play blocked"));
    }
  };

  // FUNGSI DEMO
  const triggerDemo = () => {
    if (Notification.permission === "granted") {
      new Notification("Tes Notifikasi Berhasil", {
        body: "Ini adalah contoh tampilan notifikasi adzan Anda.",
        icon: '/logo192.png',
        tag: 'adzan-demo'
      });
    } else {
      alert("Izinkan notifikasi terlebih dahulu melalui tombol slide.");
    }
    if (adzanAudio.current) {
      adzanAudio.current.play().catch(() => alert("Klik layar sekali untuk mengizinkan suara."));
    }
  };

  const toggleNotification = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isNotifyEnabled) {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setIsNotifyEnabled(true);
          new Notification("Adzan Pro", { body: "Notifikasi Berhasil Diaktifkan!" });
        } else {
          alert("Silakan aktifkan izin di pengaturan browser.");
        }
      }
    } else {
      setIsNotifyEnabled(false);
    }
  };

  // --- Auth & Data ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const syncAllData = useCallback(async () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const [locRes, prayRes] = await Promise.all([
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`),
          fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=11`)
        ]);
        const locData = await locRes.json();
        const prayData = await prayRes.json();
        setLocationName((locData.city || "BEKASI").toUpperCase());
        if (prayData?.data) {
          setSchedule(prayData.data.timings);
          const h = prayData.data.date?.hijri;
          if (h) setHijriDate({ day: h.day, month: h.month.en, year: h.year });
          const events = [
            { name: "Nuzulul Qur'an", date: "6 Mar 2026", hijri: "17 Ramadhan" },
            { name: "Lailatul Qadar", date: "9 Mar 2026", hijri: "21 Ramadhan" },
            { name: "Idul Fitri 1447 H", date: "20 Mar 2026", hijri: "1 Syawal" }
          ].filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0));
          setUpcomingEvents(events);
        }
      } catch (err) { console.error(err); }
    });
  }, []);

  useEffect(() => { if (session) syncAllData(); }, [session, syncAllData]);

  useEffect(() => {
    if (schedule) {
      const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      const now = new Date();
      let target = null, targetT = null;
      for (let p of prayers) {
        const [h, m] = schedule[p].split(':').map(Number);
        const pD = new Date(); pD.setHours(h, m, 0);
        if (pD > now) { target = p; targetT = pD; break; }
      }
      if (!target) {
        target = 'Fajr';
        const [h, m] = schedule.Fajr.split(':').map(Number);
        targetT = new Date(); targetT.setDate(targetT.getDate() + 1); targetT.setHours(h, m, 0);
      }
      const diff = targetT - now;
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      const nameMap = { Fajr: 'Subuh', Dhuhr: 'Dzuhur', Asr: 'Ashar', Maghrib: 'Maghrib', Isha: 'Isya' };
      setNextPrayer({ name: nameMap[target], countdown: `${hours}j ${mins}m ${secs}d`, isUrgent: diff < 600000 });
    }
  }, [currentTime, schedule]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center p-4 sm:p-8 font-sans">
      {!session ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in duration-700">
          <h1 className="text-4xl font-black mb-8 tracking-tighter">ADZAN<span className="text-emerald-500">PRO</span></h1>
          <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="px-8 py-4 bg-white text-black rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Masuk dengan Google</button>
        </div>
      ) : (
        <div className="w-full max-w-lg animate-in slide-in-from-bottom-10 duration-1000">
          <header className="flex justify-between items-center mb-8 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">{session.user.email ? session.user.email[0].toUpperCase() : 'U'}</div>
              <div><p className="text-[10px] text-slate-500 font-bold uppercase">Wilayah</p><p className="text-sm font-black text-white">{locationName}</p></div>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/5 px-4 py-2 rounded-xl border border-red-500/10">Logout</button>
          </header>

          <section className={`relative overflow-hidden border rounded-[3rem] p-10 mb-8 transition-all duration-700 shadow-2xl ${nextPrayer.isUrgent ? 'bg-emerald-950/40 border-emerald-500 shadow-emerald-500/20' : 'bg-slate-900 border-slate-800'}`}>
             <div className="relative z-10 text-center">
              
              <div className="flex justify-between items-start mb-6 px-2 relative z-50">
                <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                    {hijriDate ? `${hijriDate.day} ${hijriDate.month} ${hijriDate.year} H` : "SINKRONISASI..."}
                  </span>
                </div>
                
                {/* BAGIAN TOGGLE & DEMO YANG SUDAH DIRAPIKAN */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isNotifyEnabled ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {isNotifyEnabled ? 'Adzan On' : 'Adzan Off'}
                    </span>
                    <button 
                      type="button"
                      onClick={toggleNotification}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 shadow-inner ${isNotifyEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm transform ${isNotifyEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  
                  {/* TOMBOL DEMO */}
                  <button 
                    onClick={triggerDemo}
                    className="text-[9px] font-black text-emerald-500/40 uppercase tracking-widest hover:text-emerald-400 transition-colors"
                  >
                    ⚡ Tes Notif
                  </button>
                </div>
              </div>

              <h2 className="text-7xl font-mono font-black text-white tracking-tighter mb-8 italic">{currentTime.toLocaleTimeString('en-GB', { hour12: false })}</h2>
              
              <div className={`inline-flex flex-col items-center gap-1 px-10 py-5 rounded-[2rem] border transition-all ${nextPrayer.isUrgent ? 'bg-emerald-500 border-emerald-400 animate-pulse' : 'bg-slate-800/50 border-slate-700'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${nextPrayer.isUrgent ? 'text-emerald-950' : 'text-slate-500'}`}>Menuju {nextPrayer.name}</p>
                <p className={`text-3xl font-mono font-black ${nextPrayer.isUrgent ? 'text-white' : 'text-emerald-400'}`}>{nextPrayer.countdown}</p>
              </div>
            </div>
          </section>

          <div className="mb-8 px-2">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">Momen Penting 2026</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {upcomingEvents.map((ev, i) => (
                <div key={i} className="flex-shrink-0 w-44 p-5 rounded-[2rem] bg-slate-900/40 border border-slate-800/50 group">
                  <p className="text-[9px] font-bold text-emerald-500 uppercase mb-1">{ev.hijri}</p>
                  <p className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">{ev.name}</p>
                  <p className="text-[10px] text-slate-500 mt-2">{ev.date}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 mb-12">
            {schedule ? ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((p) => {
              const nameMap = { Fajr: 'Subuh', Dhuhr: 'Dzuhur', Asr: 'Ashar', Maghrib: 'Maghrib', Isha: 'Isya' };
              return <PrayerCard key={p} name={nameMap[p]} time={schedule[p]} isActive={nextPrayer.name === nameMap[p]} />;
            }) : <div className="text-center py-10 text-slate-800 font-black animate-pulse uppercase tracking-widest text-xs">Menghubungkan ke Satelit...</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;