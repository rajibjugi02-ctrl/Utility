'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Apple,
  Cpu,
  Code2,
  Terminal,
  Sparkles,
  Share,
  PlusSquare,
  ShieldCheck,
  Copy,
  Check,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';

type TabType = 'android' | 'ios' | 'google-studio';

export const ApkDownloaderTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'Untuk memasang di HP: Buka menu titik tiga browser Chrome / Safari > pilih "Tambahkan ke Layar Utama" (Add to Home Screen).'
      );
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="neo-card p-6 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 flex items-center justify-center shadow-sm">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-[var(--neo-text)]">
                Unduh Aplikasi UtilityHub
              </h1>
              <span className="neo-badge bg-emerald-500 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-black shadow-xs">
                v3.0.0 RESMI
              </span>
            </div>
            <p className="text-xs text-[var(--neo-text-muted)]">
              Pasang di HP Android, iPhone / iOS, atau buat paket APK sendiri via Android Studio (Google Studio).
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)]">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'android'
                ? 'bg-emerald-500 text-white shadow-sm border border-black'
                : 'text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Android (APK)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ios'
                ? 'bg-sky-500 text-white shadow-sm border border-black'
                : 'text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iOS / iPhone</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('google-studio')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'google-studio'
                ? 'bg-purple-500 text-white shadow-sm border border-black'
                : 'text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Tutorial Google Studio</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ANDROID (APK & PWA) */}
      {activeTab === 'android' && (
        <div className="space-y-4">
          <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] border-2 border-emerald-500/40 shadow-neo space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <h3 className="font-bold text-sm sm:text-base text-[var(--neo-text)]">
                    UtilityHub Android Package
                  </h3>
                  <span className="neo-badge bg-black text-white text-[9px] font-mono px-2 py-0.5 rounded border border-neutral-700">
                    APK RESMI
                  </span>
                </div>
                <p className="text-xs text-[var(--neo-text-muted)] mt-0.5">
                  Ukuran: ~2.3 MB • Kompatibel: Android 8.0 s/d Android 15+
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <a
                  href="/app-release-signed.apk"
                  download="UtilityHub-v3.0.0.apk"
                  className="neo-btn neo-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-neo-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh APK Langsung (.apk)</span>
                </a>

                <button
                  type="button"
                  onClick={handleInstallPwa}
                  className="neo-btn neo-btn-secondary px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-[var(--neo-border)]"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>{isPwaInstalled ? 'Aplikasi Terpasang ✓' : 'Pasang Instan di HP (PWA)'}</span>
                </button>
              </div>
            </div>

            {/* Steps Guide */}
            <div className="pt-3 border-t border-[var(--neo-border)]">
              <h4 className="text-[11px] font-mono font-bold uppercase text-[var(--neo-text-muted)] mb-3">
                Cara Pasang di HP Android:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1">
                  <div className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>1. Unduh File</span>
                  </div>
                  <p className="text-[11px] text-[var(--neo-text-muted)] leading-relaxed">
                    Klik tombol &ldquo;Unduh APK&rdquo; di atas untuk mengunduh paket instalasi ke HP Anda.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1">
                  <div className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>2. Izinkan Sumber</span>
                  </div>
                  <p className="text-[11px] text-[var(--neo-text-muted)] leading-relaxed">
                    Jika muncul &ldquo;Izinkan instalasi dari sumber tak dikenal&rdquo;, pilih <strong>Izinkan / Tetap Install</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1">
                  <div className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>3. Siap Digunakan</span>
                  </div>
                  <p className="text-[11px] text-[var(--neo-text-muted)] leading-relaxed">
                    Buka aplikasi langsung dari layar utama HP Anda dengan performa cepat tanpa watermark.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IOS / IPHONE */}
      {activeTab === 'ios' && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] border-2 border-sky-500/40 shadow-neo space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍏</span>
            <h3 className="font-bold text-sm sm:text-base text-[var(--neo-text)]">
              Instalasi di iPhone & iPad (Safari PWA)
            </h3>
          </div>
          <p className="text-xs text-[var(--neo-text-muted)] leading-relaxed">
            Aplikasi UtilityHub dapat dipasang di iPhone tanpa Jailbreak dan tanpa App Store melalui teknologi Progressive Web App (PWA) resmi Apple.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1.5">
              <div className="text-xs font-bold text-sky-500 flex items-center gap-1.5">
                <Share className="w-3.5 h-3.5" />
                <span>1. Buka Safari & Share</span>
              </div>
              <p className="text-[11px] text-[var(--neo-text-muted)] leading-relaxed">
                Buka tautan ini di browser Safari iPhone, lalu tekan tombol <strong>Bagikan (Share)</strong> di bagian bawah layar.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1.5">
              <div className="text-xs font-bold text-sky-500 flex items-center gap-1.5">
                <PlusSquare className="w-3.5 h-3.5" />
                <span>2. Tambah ke Layar</span>
              </div>
              <p className="text-[11px] text-[var(--neo-text-muted)] leading-relaxed">
                Geser ke bawah dan pilih opsi <strong>&ldquo;Add to Home Screen&rdquo; (Tambahkan ke Layar Utama)</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1.5">
              <div className="text-xs font-bold text-sky-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>3. Selesai</span>
              </div>
              <p className="text-[11px] text-[var(--neo-text-muted)] leading-relaxed">
                Ikon aplikasi UtilityHub akan muncul di layar iPhone Anda dengan tampilan fullscreen selayaknya aplikasi native iOS.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TUTORIAL GOOGLE STUDIO / ANDROID STUDIO */}
      {activeTab === 'google-studio' && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] border-2 border-purple-500/40 shadow-neo space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-sm sm:text-base text-[var(--neo-text)]">
              Build Sendiri via Android Studio (Capacitor / TWA)
            </h3>
          </div>
          <p className="text-xs text-[var(--neo-text-muted)] leading-relaxed">
            Jika ingin mem-build aplikasi APK/AAB sendiri untuk diunggah ke Google Play Store atau testing lokal di Android Studio:
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[var(--neo-text)]">
                  1. Setup Capacitor Android di Proyek
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('npm install @capacitor/core @capacitor/cli @capacitor/android\nnpx cap init UtilityHub com.utilityhub.app\nnpx cap add android', 'cap-init')}
                  className="neo-btn px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1"
                >
                  {copiedCode === 'cap-init' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'cap-init' ? 'Disalin' : 'Salin Perintah'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono bg-black text-emerald-400 p-2.5 rounded-lg overflow-x-auto">
                {`npm install @capacitor/core @capacitor/cli @capacitor/android\nnpx cap init UtilityHub com.utilityhub.app\nnpx cap add android`}
              </pre>
            </div>

            <div className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[var(--neo-text)]">
                  2. Buka Proyek di Android Studio
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy('npm run build\nnpx cap sync\nnpx cap open android', 'cap-open')}
                  className="neo-btn px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1"
                >
                  {copiedCode === 'cap-open' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'cap-open' ? 'Disalin' : 'Salin Perintah'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono bg-black text-emerald-400 p-2.5 rounded-lg overflow-x-auto">
                {`npm run build\nnpx cap sync\nnpx cap open android`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Footer Assurance */}
      <div className="p-4 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-between gap-3 text-xs text-[var(--neo-text-muted)]">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-emerald-500" />
          <span>Bebas Iklan Jahat, Open Source, dan Aman Dipasang</span>
        </div>
        <span className="font-mono text-[10px] font-bold text-[var(--neo-accent-text)]">
          UtilityHub Suite 2026
        </span>
      </div>
    </div>
  );
};
