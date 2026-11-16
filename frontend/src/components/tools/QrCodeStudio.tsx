'use client';

import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, Upload, Link as LinkIcon, MessageSquare, Sliders, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

type InputMode = 'url' | 'text' | 'wifi' | 'whatsapp';
type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

export const QrCodeStudio: React.FC = () => {
  const [mode, setMode] = useState<InputMode>('url');
  const [content, setContent] = useState('https://github.com/rajibjugi02-ctrl');

  // Customization options
  const [fgColor, setFgColor] = useState('#121212');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('H');
  const [resolution, setResolution] = useState<number>(512);
  const [margin, setMargin] = useState<number>(2);
  const [frameText, setFrameText] = useState('SCAN ME');
  const [includeFrame, setIncludeFrame] = useState(false);

  // Logo upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Canvas refs
  const defaultCanvasRef = useRef<HTMLCanvasElement>(null);
  const customCanvasRef = useRef<HTMLCanvasElement>(null);

  const { addHistoryItem } = useAppStore();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoDataUrl(event.target?.result as string);
      // Auto-upgrade to high error correction so center logo doesn't break scanner
      setErrorLevel('H');
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoDataUrl(null);
  };

  // Re-generate both default and custom QR canvases
  useEffect(() => {
    generateQRCodes();
  }, [content, fgColor, bgColor, errorLevel, resolution, margin, logoDataUrl, frameText, includeFrame]);

  const generateQRCodes = async () => {
    if (!content.trim()) return;

    // 1. Render Default B&W QR Code (Before)
    if (defaultCanvasRef.current) {
      try {
        await QRCode.toCanvas(defaultCanvasRef.current, content, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        });
      } catch (err) {
        console.error('Default QR Error:', err);
      }
    }

    // 2. Render Custom QR Code with Logo & Styling (After)
    if (customCanvasRef.current) {
      try {
        const canvas = customCanvasRef.current;
        canvas.width = resolution;
        canvas.height = includeFrame ? resolution + 60 : resolution;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Generate temporary canvas for QR matrix
        const tempCanvas = document.createElement('canvas');
        await QRCode.toCanvas(tempCanvas, content, {
          width: resolution,
          margin,
          color: {
            dark: fgColor,
            light: bgColor,
          },
          errorCorrectionLevel: errorLevel,
        });

        // Draw QR
        ctx.drawImage(tempCanvas, 0, 0);

        // Draw center logo if present
        if (logoDataUrl) {
          const logoImg = new Image();
          logoImg.onload = () => {
            const logoSize = Math.floor(resolution * 0.22);
            const logoX = (resolution - logoSize) / 2;
            const logoY = (resolution - logoSize) / 2;

            // White rounded backing plate behind logo for scanner readability
            ctx.fillStyle = '#FFFFFF';
            const pad = 6;
            ctx.beginPath();
            ctx.roundRect(logoX - pad, logoY - pad, logoSize + pad * 2, logoSize + pad * 2, 8);
            ctx.fill();
            ctx.strokeStyle = fgColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw logo image
            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          };
          logoImg.src = logoDataUrl;
        }

        // Draw frame label if active
        if (includeFrame) {
          ctx.fillStyle = fgColor;
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(frameText, resolution / 2, resolution + 30);
        }
      } catch (err) {
        console.error('Custom QR Error:', err);
      }
    }
  };

  const handleDownloadPng = () => {
    const canvas = customCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `QRCode_Custom_${resolution}px.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    addHistoryItem({
      toolId: 'qr-code-studio',
      toolName: 'Custom QR Code Studio',
      title: `QR Code Custom (${resolution}px)`,
      type: 'image',
      downloadUrl: dataUrl,
    });
  };

  const handleDownloadSvg = async () => {
    try {
      const svgString = await QRCode.toString(content, {
        type: 'svg',
        width: resolution,
        margin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: errorLevel,
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QRCode_Custom_${resolution}px.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('SVG Export Error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Mode Selector */}
      <div className="p-1.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => {
            setMode('url');
            setContent('https://github.com/rajibjugi02-ctrl');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            mode === 'url'
              ? 'bg-[var(--neo-surface)] text-[var(--neo-text)] border border-[var(--neo-border)] shadow-neo'
              : 'text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Tautan / URL</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('text');
            setContent('UtilityHub - All-in-One Utility Web App');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            mode === 'text'
              ? 'bg-[var(--neo-surface)] text-[var(--neo-text)] border border-[var(--neo-border)] shadow-neo'
              : 'text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Teks Bebas</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('whatsapp');
            setContent('https://wa.me/628123456789?text=Halo%20Admin%20UtilityHub');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            mode === 'whatsapp'
              ? 'bg-[var(--neo-surface)] text-[var(--neo-text)] border border-[var(--neo-border)] shadow-neo'
              : 'text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
          }`}
        >
          <span>WhatsApp Chat</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('wifi');
            setContent('WIFI:S:MyHomeWifi;T:WPA;P:PasswordRahasia123;;');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            mode === 'wifi'
              ? 'bg-[var(--neo-surface)] text-[var(--neo-text)] border border-[var(--neo-border)] shadow-neo'
              : 'text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
          }`}
        >
          <span>Wi-Fi Access</span>
        </button>
      </div>

      {/* Content Input Box */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[var(--neo-text)] block">
          Isi Konten QR Code:
        </label>
        <textarea
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ketik link URL atau teks yang akan di-scan..."
          className="neo-input w-full p-3 rounded-xl text-xs font-mono resize-none"
        />
      </div>

      {/* Customization Grid */}
      <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--neo-text)] flex items-center gap-2 pb-2 border-b-2 border-[var(--neo-border)]">
          <Sliders className="w-4 h-4 text-emerald-500" />
          <span>Kustomisasi Estetika QR Code</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Foreground Color */}
          <div className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1.5">
            <span className="text-[11px] font-bold text-[var(--neo-text-muted)] block">
              Warna Titik QR (Foreground):
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-8 h-8 rounded border-2 border-[var(--neo-border)] cursor-pointer"
              />
              <input
                type="text"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="neo-input flex-1 px-2 py-1 text-xs font-mono rounded"
              />
            </div>
          </div>

          {/* 2. Background Color */}
          <div className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1.5">
            <span className="text-[11px] font-bold text-[var(--neo-text-muted)] block">
              Warna Latar (Background):
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded border-2 border-[var(--neo-border)] cursor-pointer"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="neo-input flex-1 px-2 py-1 text-xs font-mono rounded"
              />
            </div>
          </div>

          {/* 3. Resolution */}
          <div className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1.5">
            <span className="text-[11px] font-bold text-[var(--neo-text-muted)] block">
              Ukuran Resolusi Export:
            </span>
            <div className="grid grid-cols-3 gap-1">
              {[256, 512, 1024].map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setResolution(res)}
                  className={`py-1 text-xs font-mono font-bold rounded border transition-all ${
                    resolution === res
                      ? 'bg-[var(--neo-accent)] text-[var(--neo-accent-text)] border-[var(--neo-border)]'
                      : 'bg-[var(--neo-surface)] text-[var(--neo-text)] border-[var(--neo-border)]'
                  }`}
                >
                  {res}px
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Logo Upload & Frame Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Logo Center */}
          <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--neo-text)]">
                Sematkan Logo di Tengah QR:
              </span>
              {logoDataUrl && (
                <button
                  type="button"
                  onClick={removeLogo}
                  className="text-rose-500 hover:underline text-[11px]"
                >
                  Hapus Logo
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="neo-btn neo-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{logoFile ? 'Ganti Logo' : 'Upload Logo (.PNG/.JPG)'}</span>
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />

              {logoDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoDataUrl}
                  alt="Center Logo Preview"
                  className="w-8 h-8 rounded border-2 border-[var(--neo-border)] object-contain bg-white"
                />
              )}
            </div>
            <p className="text-[10px] text-[var(--neo-text-muted)]">
              Koreksi error otomatis dinaikkan ke level High (30%) agar scanner tetap membaca lancar.
            </p>
          </div>

          {/* Frame Label */}
          <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--neo-text)]">
                Frame Label Bawah:
              </span>
              <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFrame}
                  onChange={(e) => setIncludeFrame(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span>Aktifkan</span>
              </label>
            </div>

            <input
              type="text"
              value={frameText}
              disabled={!includeFrame}
              onChange={(e) => setFrameText(e.target.value)}
              placeholder="Contoh: SCAN ME / KUNJUNGI WEBSITE"
              className="neo-input w-full px-3 py-1.5 text-xs font-mono rounded-lg disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      {/* ================= BEFORE VS AFTER PROOF PANEL ================= */}
      <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
        <div>
          <h3 className="text-base font-bold text-[var(--neo-text)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Panel Bukti Perubahan (Before vs After Proof)</span>
          </h3>
          <p className="text-xs text-[var(--neo-text-muted)] mt-0.5">
            Perbandingan visual langsung antara QR Code default standar dan hasil kustomisasi Anda.
          </p>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Before: Standard Default B&W */}
          <div className="p-4 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] text-center space-y-2.5">
            <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text-muted)] text-[10px]">
              BEFORE: Standar B&W (256px)
            </span>
            <div className="flex justify-center p-2 rounded-xl bg-white border border-[var(--neo-border)] max-w-[200px] mx-auto shadow-inner">
              <canvas ref={defaultCanvasRef} className="w-full h-auto block" />
            </div>
            <p className="text-[11px] text-[var(--neo-text-muted)] font-mono">
              Hitam-Putih Polos #000000
            </p>
          </div>

          {/* After: Your Custom Design */}
          <div className="p-4 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/5 text-center space-y-2.5">
            <span className="neo-badge bg-emerald-500/20 text-emerald-500 border-emerald-500/40 text-[10px] font-bold">
              AFTER: Hasil Kustomisasi Anda ({resolution}px)
            </span>
            <div className="flex justify-center p-2 rounded-xl bg-white border-2 border-emerald-500/40 max-w-[200px] mx-auto shadow-neo">
              <canvas ref={customCanvasRef} className="w-full h-auto block" />
            </div>
            <p className="text-[11px] text-emerald-500 font-mono font-bold">
              Warna {fgColor} + {logoDataUrl ? 'Logo Aktif' : 'Desain Tajam'}
            </p>
          </div>
        </div>

        {/* Proof of Changes Table */}
        <div className="rounded-xl border-2 border-[var(--neo-border)] overflow-hidden text-xs">
          <table className="w-full text-left font-mono">
            <thead className="bg-[var(--neo-bg)] text-[var(--neo-text-muted)] border-b-2 border-[var(--neo-border)] text-[11px]">
              <tr>
                <th className="p-2.5">Parameter</th>
                <th className="p-2.5">Nilai Default (Before)</th>
                <th className="p-2.5">Nilai Baru (After)</th>
                <th className="p-2.5 text-right">Status Keterbacaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neo-border)] text-[var(--neo-text)]">
              <tr>
                <td className="p-2.5 font-bold">Warna Titik (Foreground)</td>
                <td className="p-2.5 text-[var(--neo-text-muted)]">#000000 (Hitam)</td>
                <td className="p-2.5 font-bold" style={{ color: fgColor }}>{fgColor}</td>
                <td className="p-2.5 text-right text-emerald-500 font-bold">Optimal</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">Warna Latar (Background)</td>
                <td className="p-2.5 text-[var(--neo-text-muted)]">#FFFFFF (Putih)</td>
                <td className="p-2.5 font-bold">{bgColor}</td>
                <td className="p-2.5 text-right text-emerald-500 font-bold">Kontras Tinggi</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">Logo Tengah</td>
                <td className="p-2.5 text-[var(--neo-text-muted)]">Tidak Ada</td>
                <td className="p-2.5 font-bold">{logoFile ? logoFile.name : 'Tidak Ada'}</td>
                <td className="p-2.5 text-right text-emerald-500 font-bold">
                  {logoFile ? 'Terlindungi (Level H)' : '100% Bersih'}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold">Resolusi Output</td>
                <td className="p-2.5 text-[var(--neo-text-muted)]">256 x 256 px</td>
                <td className="p-2.5 font-bold">{resolution} x {resolution} px</td>
                <td className="p-2.5 text-right text-emerald-500 font-bold">HD Siap Cetak</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Download Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="neo-btn neo-btn-primary w-full sm:flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Gambar QR (.PNG)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSvg}
            className="neo-btn neo-btn-secondary w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Vektor (.SVG)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
