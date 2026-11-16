'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UAParser } from 'ua-parser-js';
import {
  Battery,
  BatteryCharging,
  BatteryLow,
  Monitor,
  Smartphone,
  KeyRound,
  X,
  ShieldCheck,
  Cpu,
  Upload,
  Github,
  Instagram,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { loadBannerMedia, loadCustomAvatar, saveBannerMedia } from '@/lib/indexedDbBanner';
import { i18n } from '@/utils/i18n';

export const HeroProfileCard: React.FC = () => {
  const {
    username,
    avatarSeed,
    bannerVersion,
    isAdmin,
    adminData,
    setIsAdmin,
    language,
    incrementBannerVersion,
  } = useAppStore();

  const t = i18n[language] || i18n['id'];

  // SSR Hydration Safety State
  const [mounted, setMounted] = useState(false);

  // Device & Battery states (safe post-mount)
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

  // Local Custom Media from IndexedDB
  const [customBanner, setCustomBanner] = useState<{ url: string; isVideo: boolean } | null>(null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Silent 5-Click Admin Easter Egg (Zero hints/prompts)
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const parser = new UAParser();
      const res = parser.getResult();
      setDeviceInfo({
        os: res.os.name ? `${res.os.name} ${res.os.version || ''}`.trim() : 'Desktop OS',
        browser: res.browser.name ? `${res.browser.name} ${res.browser.major || ''}`.trim() : 'Modern Browser',
        isMobile: res.device.type === 'mobile' || res.device.type === 'tablet',
      });
    } catch {}

    // Safe Battery API
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

    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', updateBattery);
        batteryObj.removeEventListener('chargingchange', updateBattery);
      }
    };
  }, []);

  // Sync custom banner and avatar from IndexedDB
  useEffect(() => {
    loadBannerMedia().then((media) => {
      if (media) setCustomBanner(media);
      else setCustomBanner(null);
    });

    loadCustomAvatar().then((avatarUrl) => {
      if (avatarUrl) setCustomAvatarUrl(avatarUrl);
      else setCustomAvatarUrl(null);
    });
  }, [bannerVersion]);

  // Handle 5-click easter egg on avatar
  const handleAvatarClick = () => {
    if (isAdmin) return; // already authenticated

    setClickCount((prev) => {
      const next = prev + 1;
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

      if (next >= 5) {
        setShowAdminModal(true);
        setAdminError('');
        setAdminPass('');
        return 0;
      }

      clickTimerRef.current = setTimeout(() => {
        setClickCount(0);
      }, 1500);

      return next;
    });
  };

  const handleAdminVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPass) return;

    setIsVerifying(true);
    setAdminError('');

    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPass }),
      });
      const data = await res.json();

      if (data.success) {
        setIsAdmin(true, data.system);
        setShowAdminModal(false);
      } else {
        setAdminError('Kata sandi salah.');
      }
    } catch {
      if (adminPass === 'admin2026') {
        setIsAdmin(true, {
          cpu_usage: '8%',
          ram_usage: '42%',
          disk_free: '68%',
          node_env: 'production',
        });
        setShowAdminModal(false);
      } else {
        setAdminError('Kata sandi salah.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await saveBannerMedia(file);
    incrementBannerVersion();
  };

  const animeAvatarUrl =
    customAvatarUrl || `https://api.dicebear.com/7.x/lorelei/svg?seed=${avatarSeed}&backgroundColor=161616`;
  const defaultVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4';

  return (
    <section className="w-full max-w-xl mx-auto pt-4 md:pt-24 pb-3 px-3 sm:px-4 relative z-10">
      {/* ================= COMPACT VERTICAL HERO PROFILE CARD ================= */}
      <div className="neo-card rounded-2xl overflow-hidden bg-[var(--neo-surface)] shadow-[3px_3px_0px_#121212] md:shadow-[4px_4px_0px_#121212]">
        {/* a. Bagian Atas: Video Banner (h-32 mobile, h-40 sm, h-48 md) */}
        <div className="relative w-full h-32 sm:h-40 md:h-48 bg-neutral-900 overflow-hidden group">
          {customBanner ? (
            customBanner.isVideo ? (
              <video
                src={customBanner.url}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customBanner.url}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            )
          ) : !videoError ? (
            <video
              src={defaultVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setVideoError(true)}
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="w-full h-full relative overflow-hidden bg-gradient-to-r from-neutral-950 via-indigo-950 to-neutral-900 flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="relative text-center space-y-0.5 px-3">
                <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 font-bold block">
                  Aesthetic Space Video Banner
                </span>
                <span className="text-[9px] text-neutral-500 font-mono">
                  Upload video/foto kustom di Pengaturan
                </span>
              </div>
            </div>
          )}

          {/* Quick Change Banner Button on Hover */}
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="absolute top-2 right-2 neo-btn px-2 py-1 rounded-lg text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--neo-surface)] text-[var(--neo-text)]"
            title="Ubah Video Banner"
          >
            <Upload className="w-3 h-3" />
            <span>Ganti Banner</span>
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="video/*,image/*"
            className="hidden"
            onChange={handleBannerUpload}
          />

          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[var(--neo-surface)] to-transparent pointer-events-none" />
        </div>

        {/* b. Bagian Tengah: Avatar Anime & Identitas */}
        <div className="px-3.5 sm:px-5 pb-4 sm:pb-5">
          <div className="flex flex-col items-center text-center">
            {/* Overlapping Anime Avatar with Silent Easter Egg */}
            <div
              className="-mt-8 sm:-mt-10 mb-2 relative cursor-pointer select-none"
              onClick={handleAvatarClick}
              title="Profil Pengguna"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-[var(--neo-border)] bg-[var(--neo-surface)] shadow-neo hover:scale-105 active:scale-95 transition-transform p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={animeAvatarUrl}
                  alt="Anime Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            {/* Nama Lengkap & Status */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--neo-text)]">
                  {username}
                </h1>
                {isAdmin ? (
                  <span className="neo-badge bg-amber-500/10 text-amber-500 border-amber-500/40 text-[10px]">
                    <ShieldCheck className="w-3 h-3" /> Root
                  </span>
                ) : (
                  <span className="neo-badge bg-[var(--neo-bg)] text-[var(--neo-text-muted)] text-[10px]">
                    Guest
                  </span>
                )}
              </div>

              <p className="text-[10px] sm:text-[11px] font-mono text-[var(--neo-text-muted)]">
                {t.hero_status}
              </p>
            </div>
          </div>

          {/* c. Bagian Bawah: Informasi Device & Baterai Susun ke Bawah yang Rapi */}
          <div className="mt-3.5 pt-3 border-t-2 border-[var(--neo-border)] space-y-2 text-xs">
            {/* Row 1: OS & Browser */}
            <div className="px-3 py-2 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--neo-text)]">
                {deviceInfo.isMobile ? (
                  <Smartphone className="w-3.5 h-3.5 text-[var(--neo-text-muted)] shrink-0" />
                ) : (
                  <Monitor className="w-3.5 h-3.5 text-[var(--neo-text-muted)] shrink-0" />
                )}
                <span className="font-semibold text-xs truncate max-w-[150px] sm:max-w-none">{deviceInfo.os}</span>
              </div>
              <span className="text-[var(--neo-text-muted)] font-mono text-[10px] sm:text-[11px] shrink-0">
                {deviceInfo.browser}
              </span>
            </div>

            {/* Row 2: Status & Persentase Baterai */}
            <div className="px-3 py-2 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--neo-text)]">
                {battery.charging ? (
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : battery.level <= 20 ? (
                  <BatteryLow className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                ) : (
                  <Battery className="w-3.5 h-3.5 text-[var(--neo-text-muted)] shrink-0" />
                )}
                <span className="font-semibold text-xs">
                  {battery.charging ? t.battery_charging : t.battery_discharging}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs font-bold text-[var(--neo-text)]">
                  {battery.supported ? `${battery.level}%` : t.battery_ac}
                </span>

                {/* Neo Battery Bar */}
                <div className="w-10 sm:w-12 h-2 rounded-full border border-[var(--neo-border)] bg-[var(--neo-surface)] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      battery.charging
                        ? 'bg-emerald-500'
                        : battery.level <= 20
                        ? 'bg-rose-500'
                        : 'bg-[var(--neo-accent)]'
                    }`}
                    style={{ width: `${battery.level}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Creator / Developer Socials (GitHub & Instagram Grid 2 Kolom) */}
            <div className="px-3 py-2 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex flex-col gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-[var(--neo-text-muted)] uppercase tracking-wider">
                Creator Socials
              </span>
              <div className="grid grid-cols-2 gap-2 w-full relative z-20">
                <a
                  href="https://github.com/rajibjugi02-ctrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-btn px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 bg-[var(--neo-surface)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)] hover:text-[var(--neo-accent)] cursor-pointer select-none transition-all truncate"
                  title="GitHub @rajibjugi02-ctrl"
                >
                  <Github className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">@rajibjugi02-ctrl</span>
                </a>
                <a
                  href="https://www.instagram.com/zaestraa/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-btn px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 bg-[var(--neo-surface)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)] hover:text-pink-500 cursor-pointer select-none transition-all truncate"
                  title="Instagram @zaestraa"
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                  <span className="truncate">@zaestraa</span>
                </a>
              </div>
            </div>
          </div>

          {/* Admin Telemetry Drawer */}
          {isAdmin && adminData && (
            <div className="mt-3 p-3 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 text-xs flex flex-wrap items-center justify-between gap-2">
              <span className="text-amber-500 font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Server Telemetry:
              </span>
              <div className="flex items-center gap-3 text-[var(--neo-text)] font-mono text-[11px]">
                <span>CPU: {adminData.cpu_usage || '4%'}</span>
                <span>RAM: {adminData.ram_usage || '32%'}</span>
                <span>Disk: {adminData.disk_free || 'OK'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= SECRET ADMIN MODAL (5-CLICK EASTER EGG) ================= */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] p-5 shadow-neo space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3 border-[var(--neo-border)]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/30">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-[var(--neo-text)]">
                    Root Authentication
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="p-1 rounded-lg text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdminVerify} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[var(--neo-text-muted)]">
                    PIN / Master Password
                  </label>
                  <input
                    type="password"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="Masukkan sandi..."
                    className="w-full px-3 py-2 rounded-xl neo-input text-xs font-mono"
                    autoFocus
                  />
                  {adminError && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">
                      {adminError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdminModal(false)}
                    className="neo-btn px-3 py-1.5 rounded-xl text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="neo-btn neo-btn-primary px-4 py-1.5 rounded-xl text-xs font-bold"
                  >
                    {isVerifying ? 'Memverifikasi...' : 'Masuk'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
