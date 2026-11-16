'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Smartphone, Download, Apple, Cpu, Code2, Terminal, Sparkles, Share, PlusSquare, ShieldCheck, Copy, Check } from 'lucide-react';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'android' | 'ios' | 'google-studio';

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Capture native PWA install prompt
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
      alert('Untuk memasang di HP: Buka menu titik tiga browser Chrome / Safari > pilih "Tambahkan ke Layar Utama" (Add to Home Screen).');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="neo-card w-full max-w-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo rounded-3xl overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[var(--neo-border)] flex items-center justify-between bg-[var(--neo-bg)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[var(--neo-text)] uppercase tracking-tight">
                  UNDUH APLIKASI UTILITYHUB
                </h3>
                <span className="neo-badge bg-emerald-500 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-black">
                  v3.0.0
                </span>
              </div>
              <p className="text-[11px] text-[var(--neo-text-muted)]">
                Pasang di HP Android, iPhone / iOS, atau buat APK sendiri via Android Studio (Google Studio).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center text-[var(--neo-text)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-[var(--neo-bg)] border-b border-[var(--neo-border)] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all border-2 cursor-pointer ${
              activeTab === 'android'
                ? 'bg-emerald-500 text-white border-black shadow-neo-sm font-black'
                : 'border-transparent text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Android (APK)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all border-2 cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-emerald-500 text-white border-black shadow-neo-sm font-black'
                : 'border-transparent text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iOS / iPhone</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('google-studio')}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all border-2 cursor-pointer ${
              activeTab === 'google-studio'
                ? 'bg-emerald-500 text-white border-black shadow-neo-sm font-black'
                : 'border-transparent text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Tutorial Google Studio</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* ================= TAB 1: ANDROID ================= */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <div>
                      <h4 className="text-sm font-black text-[var(--neo-text)]">
                        UtilityHub Android Package
                      </h4>
                      <p className="text-[11px] text-[var(--neo-text-muted)] font-mono">
                        Ukuran: ~2.3 MB · Kompatibel: Android 7.0 s/d Android 15
                      </p>
                    </div>
                  </div>
                  <span className="neo-badge bg-black text-white text-[9px] font-mono px-2 py-0.5 rounded">
                    APK RESMI
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Download APK Link */}
                  <a
                    href="/app-release-signed.apk"
                    download="UtilityHub-v3.0.0.apk"
                    className="neo-btn neo-btn-primary py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm text-center cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh APK Langsung (.apk)</span>
                  </a>

                  {/* PWA 1-Click Install */}
                  <button
                    type="button"
                    onClick={handleInstallPwa}
                    className="neo-btn neo-btn-secondary py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>{isPwaInstalled ? '✓ Sudah Terpasang' : 'Pasang Instan di HP (PWA)'}</span>
                  </button>
                </div>
              </div>

              {/* Step by step install guide for Android */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-black uppercase tracking-wider text-[var(--neo-text)]">
                  Cara Pasang di HP Android:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-[var(--neo-text)]">
                  <div className="p-3 rounded-xl border border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1">
                    <span className="font-black text-emerald-500">1. Unduh File</span>
                    <p className="text-[11px] text-[var(--neo-text-muted)]">
                      Klik tombol &quot;Unduh APK&quot; di atas untuk mengunduh paket instalasi.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1">
                    <span className="font-black text-emerald-500">2. Izinkan Sumber</span>
                    <p className="text-[11px] text-[var(--neo-text-muted)]">
                      Jika muncul &quot;Izinkan instalasi dari sumber tak dikenal&quot;, pilih **Izinkan/Tetap Install**.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1">
                    <span className="font-black text-emerald-500">3. Siap Digunakan</span>
                    <p className="text-[11px] text-[var(--neo-text-muted)]">
                      Buka aplikasi langsung dari layar utama HP Anda dengan performa cepat.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: IOS / IPHONE ================= */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border-2 border-sky-500/40 bg-sky-500/5 space-y-2">
                <div className="flex items-center gap-2">
                  <Apple className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
                  <h4 className="text-sm font-black text-[var(--neo-text)]">
                    Panduan Pasang di iPhone / iPad (iOS)
                  </h4>
                </div>
                <p className="text-xs text-[var(--neo-text-muted)] leading-relaxed">
                  Apple iOS tidak menggunakan file format <code className="bg-[var(--neo-bg)] px-1 rounded">.apk</code>. Sebagai gantinya, Apple menyediakan teknologi resmi **PWA (Progressive Web App)** yang terpasang di Homescreen tanpa lewat App Store dan berjalan layar penuh (*full screen*).
                </p>
              </div>

              <div className="space-y-2.5">
                <h5 className="text-xs font-black uppercase tracking-wider text-[var(--neo-text)]">
                  Langkah-Langkah Pasang di iPhone (Hanya 10 Detik):
                </h5>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-[var(--neo-border)] bg-[var(--neo-bg)]">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </span>
                    <div>
                      <span className="font-bold text-[var(--neo-text)] block">Buka di Browser Safari</span>
                      <span className="text-[11px] text-[var(--neo-text-muted)]">
                        Pastikan Anda membuka website ini melalui browser resmi **Safari** di iPhone Anda.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl border border-[var(--neo-border)] bg-[var(--neo-bg)]">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </span>
                    <div>
                      <span className="font-bold text-[var(--neo-text)] flex items-center gap-1.5">
                        Tekan Tombol Bagikan / Share <Share className="w-3.5 h-3.5 text-sky-500 inline" />
                      </span>
                      <span className="text-[11px] text-[var(--neo-text-muted)]">
                        Ketuk ikon kotak dengan panah ke atas di bagian bawah layar Safari.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl border border-[var(--neo-border)] bg-[var(--neo-bg)]">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </span>
                    <div>
                      <span className="font-bold text-[var(--neo-text)] flex items-center gap-1.5">
                        Pilih &quot;Tambahkan ke Layar Utama&quot; <PlusSquare className="w-3.5 h-3.5 text-emerald-500 inline" />
                      </span>
                      <span className="text-[11px] text-[var(--neo-text-muted)]">
                        Gulir menu ke bawah lalu ketuk opsi **Tambahkan ke Layar Utama** (Add to Home Screen).
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl border border-[var(--neo-border)] bg-[var(--neo-bg)]">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      4
                    </span>
                    <div>
                      <span className="font-bold text-[var(--neo-text)] block">Tekan &quot;Tambah&quot; (Selesai!)</span>
                      <span className="text-[11px] text-[var(--neo-text-muted)]">
                        Ikon aplikasi UtilityHub akan muncul di layar iPhone Anda dan terbuka seperti aplikasi asli tanpa bilah browser.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: TUTORIAL GOOGLE STUDIO ================= */}
          {activeTab === 'google-studio' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border-2 border-purple-500/40 bg-purple-500/5 space-y-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-purple-500" />
                  <h4 className="text-sm font-black text-[var(--neo-text)]">
                    TUTORIAL BUILD APK MENGGUNAKAN ANDROID STUDIO (GOOGLE STUDIO)
                  </h4>
                </div>
                <p className="text-xs text-[var(--neo-text-muted)] leading-relaxed">
                  Berikut adalah panduan lengkap membuat file APK mandiri dari website UtilityHub menggunakan alat resmi dari Google.
                </p>
              </div>

              {/* METODE 1: BUBBLEWRAP TWA (RESMI GOOGLE) */}
              <div className="p-4 rounded-2xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                      A
                    </span>
                    <h5 className="text-xs sm:text-sm font-black text-[var(--neo-text)]">
                      Metode 1: TWA / Bubblewrap CLI (Resmi Google - Paling Cepat)
                    </h5>
                  </div>
                  <span className="neo-badge bg-[var(--neo-accent)] text-[var(--neo-accent-text)] text-[9px] font-mono px-2 py-0.5 rounded">
                    REKOMENDASI GOOGLE
                  </span>
                </div>

                <p className="text-xs text-[var(--neo-text-muted)]">
                  Google menyediakan tool resmi bernama <strong>Bubblewrap</strong> untuk mengubah Progressive Web App (PWA) langsung menjadi APK dan AAB siap upload ke Google Play Store.
                </p>

                {/* Steps */}
                <div className="space-y-2.5 text-xs text-[var(--neo-text)]">
                  <div>
                    <span className="font-bold block">Langkah 1: Install Node.js & Bubblewrap CLI</span>
                    <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
                      Buka Terminal / PowerShell di komputer Anda, lalu ketik perintah berikut:
                    </p>
                    <div className="relative mt-1">
                      <pre className="p-2.5 rounded-xl bg-neutral-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                        npm install -g @bubblewrap/cli
                      </pre>
                      <button
                        type="button"
                        onClick={() => handleCopy('npm install -g @bubblewrap/cli', 'code1')}
                        className="absolute right-2 top-2 p-1 rounded bg-neutral-800 text-neutral-300 hover:text-white"
                      >
                        {copiedCode === 'code1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold block">Langkah 2: Hubungkan Manifest Website Anda</span>
                    <div className="relative mt-1">
                      <pre className="p-2.5 rounded-xl bg-neutral-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                        bubblewrap init --manifest https://alltoolskuro.vercel.app/manifest.json
                      </pre>
                      <button
                        type="button"
                        onClick={() => handleCopy('bubblewrap init --manifest https://alltoolskuro.vercel.app/manifest.json', 'code2')}
                        className="absolute right-2 top-2 p-1 rounded bg-neutral-800 text-neutral-300 hover:text-white"
                      >
                        {copiedCode === 'code2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-[var(--neo-text-muted)] mt-1">
                      *Tekan Enter pada setiap pertanyaan untuk menyetujui konfigurasi default dan pembuatan keystore otomatis.
                    </p>
                  </div>

                  <div>
                    <span className="font-bold block">Langkah 3: Build APK</span>
                    <div className="relative mt-1">
                      <pre className="p-2.5 rounded-xl bg-neutral-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                        bubblewrap build
                      </pre>
                      <button
                        type="button"
                        onClick={() => handleCopy('bubblewrap build', 'code3')}
                        className="absolute right-2 top-2 p-1 rounded bg-neutral-800 text-neutral-300 hover:text-white"
                      >
                        {copiedCode === 'code3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                      ✓ File <strong>app-release-signed.apk</strong> akan langsung selesai dibuat di folder Anda!
                    </p>
                  </div>
                </div>
              </div>

              {/* METODE 2: ANDROID STUDIO WEBVIEW */}
              <div className="p-4 rounded-2xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-purple-500 text-white flex items-center justify-center font-black text-xs">
                    B
                  </span>
                  <h5 className="text-xs sm:text-sm font-black text-[var(--neo-text)]">
                    Metode 2: Android Studio GUI (Project WebView Tradisional)
                  </h5>
                </div>

                <ol className="list-decimal list-inside space-y-2 text-xs text-[var(--neo-text-muted)] leading-relaxed">
                  <li>
                    <strong className="text-[var(--neo-text)]">Buka Android Studio</strong>: Klik <em>File &gt; New &gt; New Project</em>, pilih template <strong>Empty Views Activity</strong>.
                  </li>
                  <li>
                    <strong className="text-[var(--neo-text)]">Tambahkan Izin Internet</strong>: Buka <code className="bg-black/10 dark:bg-white/10 px-1 rounded">AndroidManifest.xml</code>, tambahkan baris berikut di atas tag <code className="bg-black/10 dark:bg-white/10 px-1 rounded">&lt;application&gt;</code>:
                    <div className="relative mt-1">
                      <pre className="p-2 rounded bg-neutral-900 text-emerald-400 font-mono text-[10px]">
                        &lt;uses-permission android:name=&quot;android.permission.INTERNET&quot; /&gt;
                      </pre>
                    </div>
                  </li>
                  <li>
                    <strong className="text-[var(--neo-text)]">Pasang WebView di MainActivity</strong>:
                    <div className="relative mt-1">
                      <pre className="p-2 rounded bg-neutral-900 text-emerald-400 font-mono text-[10px] overflow-x-auto">
{`val webView = findViewById<WebView>(R.id.webView)
webView.settings.javaScriptEnabled = true
webView.settings.domStorageEnabled = true
webView.loadUrl("https://alltoolskuro.vercel.app")`}
                      </pre>
                    </div>
                  </li>
                  <li>
                    <strong className="text-[var(--neo-text)]">Export APK</strong>: Klik menu atas Android Studio: <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>. File APK siap digunakan di HP Android!
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[var(--neo-text-muted)] font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Aman, Bebas Virus, dan Open Source</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neo-btn neo-btn-secondary px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AppDownloadModal;
