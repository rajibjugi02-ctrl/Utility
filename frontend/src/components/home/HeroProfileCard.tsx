'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UAParser } from 'ua-parser-js';
import {
  Clock,
  Smartphone,
  Monitor,
  Battery,
  KeyRound,
  X,
  User,
  ExternalLink,
  Github,
  Instagram,
  Activity,
  Radio,
  Lock,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

// Fallback Canvas Red Eye Banner jika video belum selesai dimuat
const CanvasRedEyeBanner: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const petals = Array.from({ length: 18 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 10 + Math.random() * 12,
      speedY: 1.2 + Math.random() * 1.5,
      speedX: 0.4 + Math.random() * 0.8,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      color: ['#FF1E42', '#E60026', '#B8001F', '#FF5C77'][Math.floor(Math.random() * 4)],
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Dark crimson gradient background
      const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width);
      grad.addColorStop(0, '#3a0208');
      grad.addColorStop(0.6, '#150103');
      grad.addColorStop(1, '#050001');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Glowing Anime Red Eye effect
      const eyeX = width / 2;
      const eyeY = height * 0.45;
      const eyeRadius = Math.min(width, height) * 0.22;

      ctx.save();
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#FF1E42';
      ctx.fillStyle = '#E60026';
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#100002';
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeX - eyeRadius * 0.25, eyeY - eyeRadius * 0.25, eyeRadius * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Floating crimson petals
      petals.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;

        if (p.y > height + 20) p.y = -20;
        if (p.x > width + 20) p.x = -20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full object-cover" />;
};

export const HeroProfileCard: React.FC = () => {
  const {
    userCustomName,
    setUserCustomName,
    isAdmin,
    setIsAdmin,
  } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    os: 'Windows 11',
    browser: 'Chrome',
    isMobile: false,
  });

  const [battery, setBattery] = useState<{
    level: number;
    charging: boolean;
    supported: boolean;
  }>({
    level: 100,
    charging: false,
    supported: false,
  });

  const [timeStr, setTimeStr] = useState('10.45.22 WIB');
  const [pingMs, setPingMs] = useState(42);
  const [customNameInput, setCustomNameInput] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  // Admin Modal state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCustomNameInput(userCustomName || '');

    // 1. Accurate OS & Browser Detection
    const detectAccurateDevice = async () => {
      let os = 'Windows 11';
      let browser = 'Browser';
      let isMobile = false;

      try {
        const parser = new UAParser();
        const res = parser.getResult();
        os = res.os.name || 'Desktop';
        browser = res.browser.name || 'Browser';
        isMobile = res.device.type === 'mobile' || res.device.type === 'tablet';

        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

        // Accurate Browser Detection
        if (typeof navigator !== 'undefined') {
          // Check Brave browser
          if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function') {
            try {
              const isBrave = await (navigator as any).brave.isBrave();
              if (isBrave) {
                browser = 'Brave';
              }
            } catch {}
          }

          if (browser === 'Browser' || browser === 'Chrome') {
            if (/Edg\//i.test(ua)) {
              browser = 'Edge';
            } else if (/OPR\/|Opera/i.test(ua)) {
              browser = 'Opera';
            } else if (/Vivaldi/i.test(ua)) {
              browser = 'Vivaldi';
            } else if (/SamsungBrowser/i.test(ua)) {
              browser = 'Samsung Internet';
            } else if (/UCBrowser/i.test(ua)) {
              browser = 'UC Browser';
            } else if (/Firefox\//i.test(ua)) {
              browser = 'Firefox';
            } else if (/Chrome\//i.test(ua)) {
              browser = 'Chrome';
            } else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) {
              browser = 'Safari';
            }
          }

          // Accurate OS & Platform Detection
          const isIPad =
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
            /iPad/i.test(ua);
          const isIPhone = /iPhone|iPod/i.test(ua);
          const isAndroid = /Android/i.test(ua);

          if (isIPad) {
            os = 'iPadOS';
            isMobile = true;
          } else if (isIPhone) {
            os = 'iOS';
            isMobile = true;
          } else if (isAndroid) {
            const match = ua.match(/Android\s([0-9\.]+)/i);
            const ver = match ? ` ${match[1].split('.')[0]}` : '';
            os = `Android${ver}`;
            isMobile = true;
          } else if (/Macintosh|Mac OS X/i.test(ua)) {
            os = 'macOS';
            isMobile = false;
          } else if (/CrOS/i.test(ua)) {
            os = 'ChromeOS';
            isMobile = false;
          } else if (/Linux/i.test(ua)) {
            os = 'Linux';
            isMobile = false;
          } else if (/Windows/i.test(ua) || os === 'Windows') {
            isMobile = false;
            os = 'Windows 11';

            // User-Agent Client Hints API for Windows 11 vs Windows 10
            if ((navigator as any).userAgentData?.getHighEntropyValues) {
              try {
                const hints = await (navigator as any).userAgentData.getHighEntropyValues([
                  'platform',
                  'platformVersion',
                ]);
                if (hints.platformVersion) {
                  const major = parseInt(hints.platformVersion.split('.')[0] || '0', 10);
                  if (major >= 13) {
                    os = 'Windows 11';
                  } else if (major > 0 && major < 13) {
                    os = 'Windows 10';
                  }
                }
              } catch {}
            }
          }
        }
      } catch {}

      setDeviceInfo({
        os,
        browser,
        isMobile,
      });
    };

    detectAccurateDevice();

    // 2. Battery API
    let batteryObj: any = null;
    const updateBattery = () => {
      if (batteryObj) {
        setBattery({
          level: Math.round(batteryObj.level * 100),
          charging: batteryObj.charging,
          supported: true,
        });
      }
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery()
        .then((b: any) => {
          batteryObj = b;
          updateBattery();
          b.addEventListener('levelchange', updateBattery);
          b.addEventListener('chargingchange', updateBattery);
        })
        .catch(() => {
          setBattery({ level: 100, charging: false, supported: false });
        });
    }

    // 3. Live Clock in WIB (UTC+7)
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTimeStr(`${hours}.${minutes}.${seconds} WIB`);
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // 4. Ping measurement
    const measurePing = () => {
      const start = performance.now();
      fetch('/api/ping')
        .then(() => {
          const diff = Math.round(performance.now() - start);
          setPingMs(Math.max(18, Math.min(diff, 380)));
        })
        .catch(() => {
          setPingMs(Math.floor(35 + Math.random() * 20));
        });
    };
    measurePing();
    const pingInterval = setInterval(measurePing, 15000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pingInterval);
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', updateBattery);
        batteryObj.removeEventListener('chargingchange', updateBattery);
      }
    };
  }, [userCustomName]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (customNameInput.trim()) {
      setUserCustomName(customNameInput.trim());
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setAdminError('');

    setTimeout(() => {
      if (adminPass === 'admin123' || adminPass === 'zaestraa' || adminPass === 'kuro123') {
        setIsAdmin(true, {
          token: 'root_session_' + Date.now(),
          loginTime: new Date().toISOString(),
          permissions: ['ALL_PERMISSIONS'],
        });
        setShowAdminModal(false);
        setAdminPass('');
      } else {
        setAdminError('Sandi root/admin tidak cocok!');
      }
      setIsVerifying(false);
    }, 600);
  };

  if (!mounted) {
    return (
      <section className="w-full max-w-5xl mx-auto pt-2 pb-2 px-3 sm:px-4">
        <div className="neo-card p-6 rounded-3xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo h-80 animate-pulse" />
      </section>
    );
  }

  return (
    <section className="w-full max-w-5xl mx-auto pt-2 pb-2 px-3 sm:px-4 relative z-10">
      {/* Neo-Brutalist Main Card - Landscape on Desktop Window, Vertical on Mobile */}
      <div className="neo-card p-4 sm:p-5 md:p-6 rounded-3xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo flex flex-col md:flex-row gap-5 md:gap-6 items-stretch">
        
        {/* Sisi Kiri (Desktop) / Atas (Mobile): Bingkai Video Potret Vertikal Permanen */}
        <div className="w-full md:w-[270px] lg:w-[290px] shrink-0 aspect-[3/4] md:aspect-auto rounded-2xl border-2 border-[#121212] shadow-[4px_4px_0px_#121212] overflow-hidden bg-black relative">
          {!videoError ? (
            <video
              src="/banner-permanent.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover pointer-events-none select-none"
              onError={() => setVideoError(true)}
            />
          ) : (
            <CanvasRedEyeBanner />
          )}
        </div>

        {/* Sisi Kanan: Informasi Kreator, Form Nama Pengguna, dan 7 Baris Telemetri */}
        <div className="flex-1 flex flex-col justify-between space-y-3.5 sm:space-y-4">
          {/* Baris Atas: Label NAMA KREATOR + Icon Lingkaran User */}
          <div className="flex items-center justify-between pt-0.5">
            <div>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[var(--neo-text-muted)] block">
                NAMA KREATOR
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--neo-text)]">
                {userCustomName ? userCustomName : 'zaestraa'}
              </h2>
            </div>

            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex items-center justify-center text-[var(--neo-text)] shadow-sm">
              <User className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </div>
          </div>

          {/* Horizontal Divider */}
          <div className="h-0.5 bg-[var(--neo-border)] w-full opacity-60" />

          {/* Kotak Input Berbingkai Tegas: MASUKKAN NAMA PENGGUNA */}
          <div className="p-3 sm:p-4 rounded-2xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[var(--neo-text)] whitespace-nowrap">
                MASUKKAN NAMA PENGGUNA
              </span>
              <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-[var(--neo-border)] whitespace-nowrap shrink-0">
                1 Perangkat Terdeteksi
              </span>
            </div>

            <form onSubmit={handleSaveName} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Contoh: Vin (1 kata)"
                value={customNameInput}
                onChange={(e) => setCustomNameInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl neo-input text-xs sm:text-sm font-semibold border-2 border-[var(--neo-border)] bg-[var(--neo-surface)]"
              />
              <button
                type="submit"
                className="neo-btn neo-btn-primary px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm shrink-0 cursor-pointer"
              >
                {savedToast ? 'Tersimpan!' : 'Simpan'}
              </button>
            </form>
          </div>

          {/* 7 Baris Telemetri Real-Time */}
          <div className="space-y-2.5 sm:space-y-3 pt-1 text-xs sm:text-[13px]">
            {/* Row 1: Status */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[var(--neo-text)] font-bold shrink-0">
                <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                <span>Status</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-black text-emerald-500 shrink-0">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>

            {/* Row 2: Region */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[var(--neo-text)] font-bold shrink-0">
                <span>Region</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[var(--neo-text)] shrink-0">
                <span>🇮🇩</span>
                <span>Indonesia</span>
              </div>
            </div>

            {/* Row 3: Perangkat */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[var(--neo-text)] font-bold shrink-0">
                {deviceInfo.isMobile ? (
                  <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--neo-text-muted)] shrink-0" />
                ) : (
                  <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--neo-text-muted)] shrink-0" />
                )}
                <span>Perangkat</span>
              </div>
              <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] font-bold text-[10px] sm:text-[11px] px-2.5 py-1 rounded-full border-2 border-[var(--neo-border)] shadow-sm whitespace-nowrap shrink-0">
                {deviceInfo.os} • {deviceInfo.browser}
              </span>
            </div>

            {/* Row 4: Baterai */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[var(--neo-text)] font-bold shrink-0">
                <Battery className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--neo-text-muted)] shrink-0" />
                <span>Baterai</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-14 sm:w-16 h-2.5 sm:h-3 rounded-full border border-[var(--neo-border)] bg-[var(--neo-bg)] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${battery.level}%` }}
                  />
                </div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase text-emerald-500">
                  {battery.charging ? 'MENGISI' : 'AKTIF'}
                </span>
                <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] font-bold text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full border border-[var(--neo-border)] whitespace-nowrap shrink-0">
                  {battery.supported ? `${battery.level}%` : 'OPTIMAL'}
                </span>
              </div>
            </div>

            {/* Row 5: Network */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[var(--neo-text)] font-bold shrink-0">
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--neo-text-muted)] shrink-0" />
                <span>Network</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] font-mono font-bold text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full border-2 border-[var(--neo-border)] shadow-sm whitespace-nowrap shrink-0">
                  {pingMs} MS
                </span>
              </div>
            </div>

            {/* Row 6: Jam */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[var(--neo-text)] font-bold shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--neo-text-muted)] shrink-0" />
                <span>Jam</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] font-mono font-black text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full border-2 border-[var(--neo-border)] shadow-sm whitespace-nowrap shrink-0">
                  {timeStr}
                </span>
              </div>
            </div>

            {/* Row 7: Role */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[var(--neo-text)] font-bold shrink-0">
                <span>Role</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] font-bold text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full border-2 border-[var(--neo-border)] whitespace-nowrap shrink-0">
                  {isAdmin ? 'ADMIN' : 'MEMBER'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAdminModal(true)}
                  className="neo-btn px-2.5 sm:px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#121212] text-white dark:bg-[#F4F4F0] dark:text-[#121212] border border-[var(--neo-border)] shadow-sm cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isAdmin ? 'Keluar' : 'Login'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Baris Tautan Sosial Pembuat (Creator Socials) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 mt-3">
        <a
          href="https://www.instagram.com/zaestraa/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full px-4 py-2.5 rounded-2xl neo-card bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo-sm hover:shadow-neo transition-all flex items-center justify-between text-xs font-black text-[var(--neo-text)] group"
        >
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-500" />
            <span>IG @zaestraa (Instagram)</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[var(--neo-text-muted)] group-hover:text-[var(--neo-text)] transition-colors" />
        </a>

        <a
          href="https://github.com/rajibjugi02-ctrl"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full px-4 py-2.5 rounded-2xl neo-card bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo-sm hover:shadow-neo transition-all flex items-center justify-between text-xs font-black text-[var(--neo-text)] group"
        >
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4 text-[var(--neo-text)]" />
            <span>GitHub Repo (@rajibjugi02-ctrl)</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[var(--neo-text-muted)] group-hover:text-[var(--neo-text)] transition-colors" />
        </a>
      </div>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xs neo-card p-5 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--neo-border)]">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-[var(--neo-text)]">
                    {isAdmin ? 'Status Akses Root' : 'Autentikasi Admin'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="p-1 rounded-full text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isAdmin ? (
                <div className="space-y-3">
                  <p className="text-xs text-[var(--neo-text-muted)]">
                    Anda sedang login dengan hak akses Administrator.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdmin(false, null);
                      setShowAdminModal(false);
                    }}
                    className="w-full py-2 rounded-xl bg-rose-500 text-white font-bold text-xs shadow-sm hover:bg-rose-600"
                  >
                    Logout Admin
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAdminAuth} className="space-y-3">
                  <p className="text-[11px] text-[var(--neo-text-muted)]">
                    Masukkan password akses sistem admin:
                  </p>
                  <input
                    type="password"
                    placeholder="Password admin..."
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl neo-input text-xs border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] font-mono"
                    autoFocus
                  />
                  {adminError && (
                    <p className="text-[10px] text-rose-500 font-bold">{adminError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={isVerifying || !adminPass}
                    className="w-full py-2 rounded-xl neo-btn neo-btn-primary font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isVerifying ? 'Memverifikasi...' : 'Masuk Admin'}</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
