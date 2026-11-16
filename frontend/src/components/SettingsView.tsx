'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Film,
  Palette,
  Languages,
  Database,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  Check,
  LayoutGrid,
  Type,
  Info,
  HelpCircle,
  Github,
  Instagram,
} from 'lucide-react';
import {
  useAppStore,
  SettingsSubPage,
  TextSize,
  BgStyle,
  ThemeMode,
  FontFamily,
} from '@/store/useAppStore';
import { i18n, AppLang } from '@/utils/i18n';

export const SettingsView: React.FC = () => {
  const {
    settingsSubPage,
    setSettingsSubPage,
    username,
    setUsername,
    avatarSeed,
    regenerateAvatarSeed,
    incrementBannerVersion,
    themeMode,
    setThemeMode,
    textSize,
    setTextSize,
    bgStyle,
    setBgStyle,
    fontFamily,
    setFontFamily,
    language,
    setLanguage,
    clearHistory,
  } = useAppStore();

  const t = i18n[language] || i18n['id'];

  // Local state for profile sub-page
  const [tempUsername, setTempUsername] = useState(username);
  const [nameSuccess, setNameSuccess] = useState(false);

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUsername.trim()) {
      setUsername(tempUsername.trim());
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 2500);
    }
  };

  // ================= 1. SUB-PAGE: PROFIL & STATUS BANNER =================
  if (settingsSubPage === 'profile') {
    return (
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-4 md:pt-24 pb-28 md:pb-16 space-y-3.5 relative z-10">
        <button
          type="button"
          onClick={() => setSettingsSubPage(null)}
          className="neo-btn neo-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.back_to_settings}</span>
        </button>

        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[var(--neo-text)] tracking-tight">
              Profil & Video Banner Hero
            </h1>
            <p className="text-xs text-[var(--neo-text-muted)] mt-0.5">
              Video banner Hero Card berstatus permanen dan aktif secara serentak di semua perangkat.
            </p>
          </div>

          {/* Video Banner Status (Locked Permanent) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--neo-text)]">
                Video Banner Utama (Permanen)
              </label>
              <span className="neo-badge bg-[var(--neo-accent)] text-[var(--neo-accent-text)] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-black shadow-sm">
                Terkunci & Statis
              </span>
            </div>

            {/* Banner Preview */}
            <div className="relative w-full h-44 rounded-xl overflow-hidden bg-black border-2 border-[var(--neo-border)] shadow-sm">
              <video
                src="/banner-permanent.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover pointer-events-none select-none"
              />
            </div>
            <p className="text-[11px] text-[var(--neo-text-muted)]">
              File video: <code className="font-mono bg-[var(--neo-bg)] px-1.5 py-0.5 rounded border border-[var(--neo-border)]">/banner-permanent.mp4</code>. Video ini aktif permanen untuk seluruh pengguna.
            </p>
          </div>

          <div className="h-0.5 bg-[var(--neo-border)] my-3" />

          {/* Edit Username */}
          <form onSubmit={handleSaveUsername} className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--neo-text)]">
              Nama Pengguna
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                placeholder="Masukkan nama pengguna..."
                className="flex-1 px-4 py-2 rounded-xl neo-input text-xs font-bold border-2 border-[var(--neo-border)]"
                required
              />
              <button
                type="submit"
                className="neo-btn neo-btn-primary px-4 py-2 rounded-xl text-xs font-bold shrink-0"
              >
                Simpan
              </button>
            </div>
            {nameSuccess && (
              <p className="text-xs text-emerald-500 font-bold flex items-center gap-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Nama pengguna berhasil diperbarui!</span>
              </p>
            )}
          </form>

          {/* Anime Avatar Picker */}
          <div className="pt-2 flex items-center justify-between p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)]">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${avatarSeed}&backgroundColor=161616`}
                alt="Anime Avatar"
                className="w-10 h-10 rounded-full border-2 border-[var(--neo-border)]"
              />
              <div>
                <span className="text-xs font-bold text-[var(--neo-text)] block">Avatar Anime</span>
                <span className="text-[11px] text-[var(--neo-text-muted)] font-mono">Seed: {avatarSeed}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={regenerateAvatarSeed}
              className="neo-btn neo-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ganti Karakter</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. SUB-PAGE: TEMA STRICT 2 MODE NEO-BRUTALISM =================
  // ================= 2. SUB-PAGE: 6 PILIHAN TEMA SOFT NEO-BRUTALISM =================
  if (settingsSubPage === 'theme') {
    const handleThemeChange = (mode: ThemeMode) => {
      setThemeMode(mode);
      document.documentElement.setAttribute('data-theme', mode);
      const isDark = mode === 'dark' || mode === 'charcoal-matte' || mode === 'nordic-midnight';
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    };

      const themes: Array<{
        id: ThemeMode;
        name: string;
        bgPreview: string;
        cardPreview: string;
        borderPreview: string;
        accentPreview: string;
        desc: string;
      }> = [
          {
            id: 'paper-white',
            name: 'Paper White (Classic Light)',
            bgPreview: '#F4F4F0',
            cardPreview: '#FFFFFF',
            borderPreview: '#121212',
            accentPreview: '#FFE66D',
            desc: 'Background #F4F4F0 hangat, kartu putih bersih, border tegas #121212.',
          },
          {
            id: 'charcoal-matte',
            name: 'Charcoal Matte (Classic Dark)',
            bgPreview: '#0D0D0D',
            cardPreview: '#161616',
            borderPreview: '#3F3F46',
            accentPreview: '#D9F99D',
            desc: 'Background #0D0D0D soft matte, kartu charcoal, aksen soft lime #D9F99D.',
          },
          {
            id: 'matcha-sage',
            name: 'Matcha Sage (Eye-Care Green)',
            bgPreview: '#EBF3E8',
            cardPreview: '#F9FBF8',
            borderPreview: '#1B2A1E',
            accentPreview: '#A3D9A5',
            desc: 'Nuansa hijau sage lembut #EBF3E8 yang sangat menenangkan mata saat membaca lama.',
          },
          {
            id: 'warm-sand',
            name: 'Warm Sand Latte (Earthy Reading)',
            bgPreview: '#F3ECE3',
            cardPreview: '#FFFDF9',
            borderPreview: '#2C221E',
            accentPreview: '#E6B89C',
            desc: 'Warna pasir krem hangat #F3ECE3 layaknya lembaran buku novel fisik.',
          },
          {
            id: 'soft-lavender',
            name: 'Soft Lavender Mist (Pastel)',
            bgPreview: '#EEF0FF',
            cardPreview: '#FFFFFF',
            borderPreview: '#1E1B4B',
            accentPreview: '#C4B5FD',
            desc: 'Sentuhan pastel lavender #EEF0FF modern untuk ruang kerja kreatif.',
          },
          {
            id: 'nordic-midnight',
            name: 'Nordic Midnight (Slate Dark)',
            bgPreview: '#0F172A',
            cardPreview: '#1E293B',
            borderPreview: '#475569',
            accentPreview: '#93C5FD',
            desc: 'Kegelapan biru navy dingin #0F172A dengan kontras aksen langit #93C5FD.',
          },
        ];

      const sizes: Array<{ id: TextSize; label: string; desc: string }> = [
        { id: 'compact', label: 'Compact', desc: 'Ukuran font 13px yang padat' },
        { id: 'normal', label: 'Normal', desc: 'Ukuran font 14px standar' },
        { id: 'large', label: 'Large', desc: 'Ukuran font 15px yang lega' },
      ];

      const handleSizeChange = (sz: TextSize) => {
        setTextSize(sz);
        document.documentElement.setAttribute('data-size', sz);
      };

      return (
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-4 md:pt-24 pb-28 md:pb-16 space-y-3.5 relative z-10">
          <button
            type="button"
            onClick={() => setSettingsSubPage(null)}
            className="neo-btn neo-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.back_to_settings}</span>
          </button>

          <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[var(--neo-text)] tracking-tight">
                2 Mode Warna Neo-Brutalism
                6 Pilihan Tema Warna Soft Neo-Brutalism
              </h1>
              <p className="text-xs text-[var(--neo-text-muted)] mt-0.5">
                Pilihan palet bersih dan nyaman di mata tanpa warna neon berlebihan.
                Palet ramah penglihatan (eye-friendly) dengan kontras tinggi dan estetika modern.
              </p>
            </div>

            {/* 2 Strict Neo-Brutalism Color Modes */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--neo-text)]">
                Pilihan Mode Warna:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Mode 1: White Modern Minimalist */}
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`p-4 rounded-xl border-2 text-left flex items-start justify-between transition-all cursor-pointer ${themeMode === 'light'
                    ? 'border-[#121212] bg-[#FFFFFF] text-[#121212] shadow-neo font-bold'
                    : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:shadow-neo-sm'
                    }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold">White Modern Minimalist</span>
                    </div>
                    <p className="text-[11px] text-[#52525B] leading-relaxed">
                      Background #F4F4F0 hangat, kartu #FFFFFF bersih, border tegas 2px solid #121212.
                    </p>
                  </div>
                  {themeMode === 'light' && <Check className="w-4 h-4 text-[#121212] shrink-0 ml-2" />}
                </button>
                {themes.map((th) => {
                  const isActive = themeMode === th.id || (th.id === 'paper-white' && themeMode === 'light') || (th.id === 'charcoal-matte' && themeMode === 'dark');
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => handleThemeChange(th.id)}
                      className={`p-3.5 rounded-xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${isActive
                        ? 'border-[var(--neo-border-active)] shadow-neo font-bold'
                        : 'border-[var(--neo-border)] hover:border-[var(--neo-border-active)]'
                        }`}
                      style={{ backgroundColor: th.cardPreview, color: th.borderPreview }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold">{th.name}</span>
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-3.5 h-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: th.bgPreview }}
                              title="Background"
                            />
                            <div
                              className="w-3.5 h-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: th.accentPreview }}
                              title="Aksen"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] opacity-80 leading-relaxed">{th.desc}</p>
                      </div>

                      {/* Mode 2: Black Modern Minimalist */}
                      <button
                        type="button"
                        onClick={() => handleThemeChange('dark')}
                        className={`p-4 rounded-xl border-2 text-left flex items-start justify-between transition-all cursor-pointer ${themeMode === 'dark'
                          ? 'border-[#3F3F46] bg-[#161616] text-[#F4F4F0] shadow-neo font-bold'
                          : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:shadow-neo-sm'
                          }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Moon className="w-4 h-4 text-neutral-300" />
                            <span className="text-xs font-bold">Black Modern Minimalist</span>
                          </div>
                          <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                            Background #0D0D0D soft matte, kartu #161616 charcoal, border 2px solid #3F3F46.
                          </p>
                        </div>
                        {themeMode === 'dark' && <Check className="w-4 h-4 text-[#F4F4F0] shrink-0 ml-2" />}
                      </button>
                      <div className="mt-2 pt-2 border-t border-black/10 flex items-center justify-between text-[10px] font-mono">
                        <span>Preview: {th.bgPreview}</span>
                        {isActive && <Check className="w-3.5 h-3.5 font-bold" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-0.5 bg-[var(--neo-border)] my-2" />

            {/* Font Density Chooser */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--neo-text)]">
                Kepadatan & Ukuran Teks
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {sizes.map((sz) => {
                  const isActive = textSize === sz.id;
                  return (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => handleSizeChange(sz.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${isActive
                        ? 'border-[var(--neo-border-active)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)] shadow-neo font-bold'
                        : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)]'
                        }`}
                    >
                      <span className="text-xs font-bold block">{sz.label}</span>
                      <span className="text-[10px] opacity-75 mt-0.5 block">{sz.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ================= 3. SUB-PAGE: BACKGROUND WEBSITE =================
    if (settingsSubPage === 'background') {
      const bgOptions: Array<{ id: BgStyle; label: string; desc: string }> = [
        {
          id: 'red-sakura',
          label: '🍁 Red Sakura / Daun Merah (Default)',
          desc: 'Kelopak merah gugur 60FPS selaras dengan video mata anime',
        },
        {
          id: 'pink-sakura',
          label: '🌸 Pink Sakura Blossom',
          desc: 'Kelopak sakura merah muda lembut melayang di layar',
        },
        {
          id: 'grid',
          label: '📐 Moving Blueprint Grid',
          desc: 'Animasi grid bergerak teknikal 32px minimalis',
        },
        {
          id: 'dots',
          label: '⠿ Interactive Dot Matrix',
          desc: 'Titik-titik mikro minimalis 28px',
        },
        {
          id: 'solid',
          label: '📄 Clean Solid Paper (Tanpa Animasi)',
          desc: 'Latar polos bersih tanpa animasi partikel',
        },
      ];

      const handleBgChange = (bg: BgStyle) => {
        setBgStyle(bg);
        document.body.setAttribute('data-bg', bg);
      };

      return (
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-4 md:pt-24 pb-28 md:pb-16 space-y-3.5 relative z-10">
          <button
            type="button"
            onClick={() => setSettingsSubPage(null)}
            className="neo-btn neo-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.back_to_settings}</span>
          </button>

          <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[var(--neo-text)] tracking-tight">
                5 Pilihan Efek Background Animasi
              </h1>
              <p className="text-xs text-[var(--neo-text-muted)] mt-0.5">
                Pilih pola tekstur dan animasi latar belakang yang nyaman untuk bekerja.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {bgOptions.map((bg) => {
                const isActive = bgStyle === bg.id;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => handleBgChange(bg.id)}
                    className={`p-3.5 rounded-xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer min-h-[85px] ${isActive
                      ? 'border-[var(--neo-border-active)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)] shadow-neo font-bold'
                      : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)]'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold">{bg.label}</span>
                      {isActive && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-[10px] opacity-75 mt-1">{bg.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

          // ================= 4. SUB-PAGE: BAHASA =================
          if (settingsSubPage === 'language') {
    const langs: Array<{ id: AppLang; label: string; native: string }> = [
          {id: 'id', label: 'Bahasa Indonesia', native: 'Bahasa Indonesia' },
          {id: 'en', label: 'English (US)', native: 'English' },
          {id: 'ja', label: 'Japanese', native: '日本語' },
          ];

          return (
          <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-4 md:pt-24 pb-28 md:pb-16 space-y-3.5 relative z-10">
            <button
              type="button"
              onClick={() => setSettingsSubPage(null)}
              className="neo-btn neo-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.back_to_settings}</span>
            </button>

            <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
              <div>
                <h1 className="text-base sm:text-lg font-bold text-[var(--neo-text)] tracking-tight">
                  Bahasa Antarmuka
                </h1>
                <p className="text-xs text-[var(--neo-text-muted)] mt-0.5">
                  Pilihan bahasa langsung aktif pada seluruh navigasi dan menu.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                {langs.map((l) => {
                  const isActive = language === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLanguage(l.id)}
                      className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${isActive
                        ? 'border-[var(--neo-border-active)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)] shadow-neo font-bold'
                        : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)]'
                        }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">{l.label}</span>
                        <span className="text-[10px] font-mono opacity-75">{l.native}</span>
                      </div>
                      {isActive && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          );
  }

          // ================= 5. SUB-PAGE: STORAGE & CACHE =================
          if (settingsSubPage === 'storage') {
    return (
          <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-4 md:pt-24 pb-28 md:pb-16 space-y-3.5 relative z-10">
            <button
              type="button"
              onClick={() => setSettingsSubPage(null)}
              className="neo-btn neo-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.back_to_settings}</span>
            </button>

            <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
              <div>
                <h1 className="text-base sm:text-lg font-bold text-[var(--neo-text)] tracking-tight">
                  Manajemen Penyimpanan & Cache
                </h1>
                <p className="text-xs text-[var(--neo-text-muted)] mt-0.5">
                  Semua data disimpan di storage browser Anda secara privat.
                </p>
              </div>

              <div className="p-4 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[var(--neo-text)] block">Riwayat Unduhan Lokal</span>
                    <span className="text-[11px] text-[var(--neo-text-muted)]">Bersihkan daftar berkas yang pernah diproses.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Bersihkan seluruh riwayat unduhan lokal?')) {
                        clearHistory();
                      }
                    }}
                    className="neo-btn px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 bg-[var(--neo-surface)] hover:bg-rose-500/10"
                  >
                    Hapus Riwayat
                  </button>
                </div>


              </div>
            </div>
          </div>
          );
  }

  // ================= 6. SUB-PAGE: GAYA FONT WEBSITE =================
  if (settingsSubPage === 'font') {
    const fonts: Array<{ id: FontFamily; name: string; desc: string; sample: string }> = [
      {
        id: 'plus-jakarta',
        name: 'Plus Jakarta Sans',
        desc: 'Default Modern Clean, geometris dan tajam untuk tampilan profesional',
        sample: 'UtilityHub · 1234567890 · The quick brown fox jumps',
      },
      {
        id: 'space-grotesk',
        name: 'Space Grotesk',
        desc: 'Neo-Brutalist Tech aesthetic khas brutalism yang tegas dan modern',
        sample: 'UtilityHub · 1234567890 · The quick brown fox jumps',
      },
      {
        id: 'outfit',
        name: 'Outfit',
        desc: 'Modern Geometric Rounded yang lembut dan ramah di mata',
        sample: 'UtilityHub · 1234567890 · The quick brown fox jumps',
      },
      {
        id: 'jetbrains-mono',
        name: 'JetBrains Mono',
        desc: 'Developer Monospace presisi tinggi untuk pembaca kode dan teknikal',
        sample: 'UtilityHub · 1234567890 · The quick brown fox jumps',
      },
      {
        id: 'inter',
        name: 'Inter',
        desc: 'Standar UI minimalis Silicon Valley dengan keterbacaan sempurna',
        sample: 'UtilityHub · 1234567890 · The quick brown fox jumps',
      },
      {
        id: 'playfair',
        name: 'Playfair Display',
        desc: 'Editorial Classic Serif elegan bernuansa majalah dan seni sastra',
        sample: 'UtilityHub · 1234567890 · The quick brown fox jumps',
      },
    ];

    const handleFontChange = (f: FontFamily) => {
      setFontFamily(f);
      document.body.setAttribute('data-font', f);
    };

    return (
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-4 md:pt-24 pb-28 md:pb-16 space-y-3.5 relative z-10">
        <button
          type="button"
          onClick={() => setSettingsSubPage(null)}
          className="neo-btn neo-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.back_to_settings}</span>
        </button>

        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5 border-2 border-[var(--neo-border)] shadow-neo">
          <div>
            <h1 className="text-base sm:text-lg font-black text-[var(--neo-text)] tracking-tight">
              Kustomisasi Gaya Font Website
            </h1>
            <p className="text-xs text-[var(--neo-text-muted)] mt-0.5">
              Pilih jenis font teks utama website. Perubahan font diterapkan langsung di seluruh halaman.
            </p>
          </div>

          <div className="space-y-2.5">
            {fonts.map((f) => {
              const isActive = (fontFamily || 'plus-jakarta') === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFontChange(f.id)}
                  className={`w-full p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'border-[#121212] bg-[var(--neo-accent)] text-[var(--neo-accent-text)] shadow-neo font-bold'
                      : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:shadow-neo-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black tracking-tight">{f.name}</span>
                    {isActive && (
                      <span className="neo-badge bg-[#121212] text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                        AKTIF
                      </span>
                    )}
                  </div>
                  <span className="text-xs opacity-75">{f.desc}</span>
                  <div className="mt-2 pt-2 border-t border-current/20 text-xs font-mono opacity-90 truncate">
                    Pratinjau: &quot;{f.sample}&quot;
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ================= 7. SUB-PAGE: TENTANG WEBSITE (ABOUT) =================
  if (settingsSubPage === 'about') {
    return (
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-4 md:pt-24 pb-28 md:pb-16 space-y-3.5 relative z-10">
        <button
          type="button"
          onClick={() => setSettingsSubPage(null)}
          className="neo-btn neo-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.back_to_settings}</span>
        </button>

        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5 border-2 border-[var(--neo-border)] shadow-neo">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="neo-badge bg-[var(--neo-accent)] text-[var(--neo-accent-text)] text-xs font-black">
                RELEASE v2.5.0
              </span>
              <span className="neo-badge bg-emerald-500 text-white text-xs font-bold">
                PRODUKSI
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-[var(--neo-text)] tracking-tight">
              Tentang UtilityHub Studio
            </h1>
            <p className="text-xs text-[var(--neo-text-muted)] mt-1 leading-relaxed">
              UtilityHub adalah platform studio utilitas modern serbaguna bergaya Soft Neo-Brutalism. Dirancang khusus untuk kreator konten, desainer, dan pengguna harian tanpa iklan pop-up dan tanpa pelacakan data pribadi.
            </p>
          </div>

          {/* Arsitektur Teknologi */}
          <div className="p-4 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--neo-text)]">
              Teknologi & Arsitektur Sistem:
            </h3>
            <ul className="text-xs text-[var(--neo-text-muted)] space-y-1.5 list-disc list-inside">
              <li><strong>Framework:</strong> Next.js 14 App Router, TypeScript 5, React 18</li>
              <li><strong>Styling & Motion:</strong> Tailwind CSS, Framer Motion, Soft Neo-Brutalism Design</li>
              <li><strong>Media Engine:</strong> Web Audio API DSP, HTML5 Canvas, IndexedDB Media Cache</li>
              <li><strong>Backend Real-Time:</strong> Multi-Engine Waterfall Scraper, TikTok DOM Hydration Scraper</li>
            </ul>
          </div>

          {/* Komitmen Privasi */}
          <div className="p-4 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-500">
              🔒 Komitmen Privasi & Keamanan:
            </h3>
            <p className="text-xs text-[var(--neo-text-muted)] leading-relaxed">
              Seluruh proses pemotongan audio, kompresi gambar, watermarking KTP, pembuatan pas foto, dan rendering dokumen PDF dieksekusi 100% secara lokal di dalam browser Anda menggunakan teknologi WebAssembly dan HTML5 Canvas. File sensitif Anda tidak pernah disimpan di server kami.
            </p>
          </div>

          {/* Profil Kreator */}
          <div className="pt-2 border-t border-[var(--neo-border)] space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-[var(--neo-text-muted)] block">
              Kreator & Pengembang:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="https://github.com/rajibjugi02-ctrl"
                target="_blank"
                rel="noopener noreferrer"
                className="neo-btn p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] text-xs font-bold flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  <span>@rajibjugi02-ctrl</span>
                </div>
                <span>GitHub ↗</span>
              </a>

              <a
                href="https://www.instagram.com/zaestraa/"
                target="_blank"
                rel="noopener noreferrer"
                className="neo-btn p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] text-xs font-bold flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  <span>@zaestraa</span>
                </div>
                <span>Instagram ↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= 8. SUB-PAGE: PUSAT BANTUAN & FAQ =================
  if (settingsSubPage === 'help') {
    const faqList = [
      {
        q: 'Bagaimana cara mengunduh video dari TikTok, X (Twitter), atau Facebook?',
        a: 'Buka menu Media Downloader di Beranda. Klik platform yang Anda inginkan (misal: X atau Facebook). Salin tautan postingan / reels dari aplikasi, tempel di kolom input, lalu klik "Unduh Media". Tunggu proses ekstraksi selesai dan klik tombol "Download MP4 HD".',
      },
      {
        q: 'Apakah aman mengunggah foto KTP atau Pas Foto di website ini?',
        a: 'Sangat aman. Seluruh proses pembuatan Pas Foto, penghapusan background, dan pemberian Watermark KTP dijalankan murni di sisi browser (Client-Side HTML5 Canvas). Foto Anda tidak pernah diunggah atau disimpan ke server eksternal mana pun.',
      },
      {
        q: 'Mengapa hasil pencarian TikTok Stalker tidak menampilkan profil?',
        a: 'Pastikan username yang Anda masukkan sudah benar dan akun tidak dihapus. Sistem kami menggunakan arsitektur 3-Engine Waterfall yang membaca data langsung dari server TikTok. Jika akun baru saja dibuat atau berstatus privat ketat, coba gunakan tautan profil penuh (contoh: https://www.tiktok.com/@username).',
      },
      {
        q: 'Bagaimana cara mengubah banner profil atau foto di Beranda?',
        a: 'Arahkan kursor atau sentuh area banner potret di Beranda, lalu klik tombol "Ganti" di pojok kanan bawah. Anda dapat mengunggah video MP4 atau foto estetika apa pun yang akan tersimpan permanen di perangkat Anda menggunakan IndexedDB.',
      },
      {
        q: 'Bagaimana cara melaporkan kendala atau meminta fitur baru?',
        a: 'Anda dapat langsung membuat Issue di GitHub Repository resmi (@rajibjugi02-ctrl) atau mengirim pesan DM melalui Instagram kreator (@zaestraa).',
      },
    ];

    return (
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-4 md:pt-24 pb-28 md:pb-16 space-y-3.5 relative z-10">
        <button
          type="button"
          onClick={() => setSettingsSubPage(null)}
          className="neo-btn neo-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.back_to_settings}</span>
        </button>

        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5 border-2 border-[var(--neo-border)] shadow-neo">
          <div>
            <h1 className="text-base sm:text-lg font-black text-[var(--neo-text)] tracking-tight">
              Pusat Bantuan & Pertanyaan Umum (FAQ)
            </h1>
            <p className="text-xs text-[var(--neo-text-muted)] mt-0.5">
              Panduan lengkap cara menggunakan utilitas dan solusi kendala teknis.
            </p>
          </div>

          <div className="space-y-3">
            {faqList.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1.5"
              >
                <h3 className="text-xs font-black text-[var(--neo-text)] flex items-start gap-2">
                  <span className="text-amber-500 font-mono">Q{idx + 1}.</span>
                  <span>{item.q}</span>
                </h3>
                <p className="text-xs text-[var(--neo-text-muted)] leading-relaxed pl-6">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ================= MAIN SETTINGS MENU =================
  const menuItems = [
    {
      id: 'profile' as SettingsSubPage,
      title: t.menu_profile,
      desc: t.menu_profile_desc,
      icon: Film,
      badge: 'PERMANEN',
    },
    {
      id: 'theme' as SettingsSubPage,
      title: t.menu_theme,
      desc: t.menu_theme_desc,
      icon: Palette,
      badge: themeMode === 'light' ? 'PUTIH' : 'HITAM',
    },
    {
      id: 'font' as SettingsSubPage,
      title: 'Gaya Font Website',
      desc: 'Pilih jenis font teks utama website real-time',
      icon: Type,
      badge: (fontFamily || 'plus-jakarta').toUpperCase(),
    },
    {
      id: 'background' as SettingsSubPage,
      title: t.menu_bg,
      desc: t.menu_bg_desc,
      icon: LayoutGrid,
      badge: bgStyle.toUpperCase(),
    },
    {
      id: 'language' as SettingsSubPage,
      title: t.menu_lang,
      desc: t.menu_lang_desc,
      icon: Languages,
      badge: language.toUpperCase(),
    },
    {
      id: 'about' as SettingsSubPage,
      title: 'Tentang UtilityHub',
      desc: 'Informasi sistem, arsitektur, dan kreator',
      icon: Info,
      badge: 'v2.5.0',
    },
    {
      id: 'help' as SettingsSubPage,
      title: 'Pusat Bantuan & FAQ',
      desc: 'Panduan lengkap cara pakai semua alat',
      icon: HelpCircle,
      badge: 'FAQ',
    },
    {
      id: 'storage' as SettingsSubPage,
      title: t.menu_storage,
      desc: t.menu_storage_desc,
      icon: Database,
      badge: 'Storage',
    },
  ];

          return (
          <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pt-4 md:pt-24 pb-28 md:pb-16 space-y-3.5 relative z-10">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--neo-text)]">
                {t.settings_title}
              </h1>
              <p className="text-xs text-[var(--neo-text-muted)] mt-0.5">
                {t.settings_desc}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSettingsSubPage(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSettingsSubPage(item.id);
                    }}
                    className="neo-card-interactive p-4 sm:p-5 rounded-2xl flex items-center justify-between select-none"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex items-center justify-center text-[var(--neo-text)]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-[var(--neo-text)]">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5 line-clamp-1">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="neo-badge bg-[var(--neo-bg)] text-[var(--neo-text-muted)]">
                        {item.badge}
                      </span>
                      <span className="text-xs font-bold text-[var(--neo-text)]">
                        Buka →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          );
};
