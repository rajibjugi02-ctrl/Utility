'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShieldCheck, Upload, Download, Eye, Lock, Sparkles, Info, RefreshCw, Check } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const PRESET_TEMPLATES = [
  {
    label: 'Verifikasi Bank / Rekening',
    text: 'HANYA UNTUK VERIFIKASI PEMBUKAAN REKENING BANK',
  },
  {
    label: 'Anti-Pinjol (Tolak Kredit)',
    text: 'TIDAK UNTUK PINJAMAN ONLINE / KREDIT APAPUN',
  },
  {
    label: 'Lamaran Pekerjaan',
    text: 'HANYA UNTUK VERIFIKASI LAMARAN KERJA PT XYZ',
  },
  {
    label: 'Verifikasi E-Commerce',
    text: 'VERIFIKASI AKUN BELANJA ONLINE RESMI',
  },
  {
    label: 'Sewa / Rental Kendaraan',
    text: 'HANYA UNTUK DOKUMEN SEWA KENDARAAN RENTAL',
  },
];

export default function KtpWatermarkProtector() {
  const { addHistory } = useAppStore();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Watermark Settings
  const [watermarkText, setWatermarkText] = useState('VERIFIKASI PINJAMAN ONLINE: DITOLAK');
  const [dateNote, setDateNote] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [fontSize, setFontSize] = useState(24);
  const [opacity, setOpacity] = useState(45);
  const [angle, setAngle] = useState(-25);
  const [gapX, setGapX] = useState(220);
  const [gapY, setGapY] = useState(130);
  const [textColor, setTextColor] = useState('#DC2626'); // Red default for high deterrence
  const [watermarkMode, setWatermarkMode] = useState<'tiled' | 'center-bar'>('tiled');
  const [includeDate, setIncludeDate] = useState(true);

  // Preview state
  const [showOriginal, setShowOriginal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageSrc(url);

    const img = new Image();
    img.onload = () => {
      setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      imgRef.current = img;
      renderCanvas(img);
    };
    img.src = url;
  };

  // Drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImageSrc(url);

      const img = new Image();
      img.onload = () => {
        setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        imgRef.current = img;
        renderCanvas(img);
      };
      img.src = url;
    }
  };

  // Render canvas with watermark
  const renderCanvas = useCallback(
    (activeImg?: HTMLImageElement | null) => {
      const img = activeImg || imgRef.current;
      const canvas = canvasRef.current;
      if (!img || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = img.naturalWidth || 1200;
      const h = img.naturalHeight || 800;
      canvas.width = w;
      canvas.height = h;

      // Draw original image
      ctx.drawImage(img, 0, 0, w, h);

      if (showOriginal) return;

      // Prepare text content
      const primaryText = watermarkText.trim();
      const secondaryText = includeDate && dateNote ? `TGL: ${dateNote}` : '';

      ctx.save();

      // Configure font & color
      const scaledFontSize = Math.max(14, Math.round((fontSize * w) / 1000));
      ctx.font = `bold ${scaledFontSize}px sans-serif`;
      ctx.fillStyle = textColor;
      ctx.globalAlpha = opacity / 100;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (watermarkMode === 'center-bar') {
        // Draw dramatic diagonal banner across center
        const diagonalLength = Math.sqrt(w * w + h * h);
        ctx.translate(w / 2, h / 2);
        ctx.rotate((angle * Math.PI) / 180);

        // Banner background bar
        const barHeight = scaledFontSize * 3.5;
        ctx.fillStyle = textColor;
        ctx.globalAlpha = (opacity / 100) * 0.25;
        ctx.fillRect(-diagonalLength / 2, -barHeight / 2, diagonalLength, barHeight);

        // Border lines
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 3;
        ctx.globalAlpha = opacity / 100;
        ctx.strokeRect(-diagonalLength / 2, -barHeight / 2, diagonalLength, barHeight);

        // Text
        ctx.fillStyle = textColor;
        ctx.fillText(primaryText, 0, -scaledFontSize * 0.4);
        if (secondaryText) {
          ctx.font = `${Math.round(scaledFontSize * 0.75)}px sans-serif`;
          ctx.fillText(secondaryText, 0, scaledFontSize * 0.7);
        }
      } else {
        // Tiled Grid across whole canvas
        const diag = Math.sqrt(w * w + h * h);
        const stepX = Math.max(120, (gapX * w) / 1000);
        const stepY = Math.max(60, (gapY * h) / 800);

        ctx.translate(w / 2, h / 2);
        ctx.rotate((angle * Math.PI) / 180);

        for (let y = -diag; y < diag; y += stepY) {
          for (let x = -diag; x < diag; x += stepX) {
            ctx.fillText(primaryText, x, y);
            if (secondaryText) {
              ctx.fillText(secondaryText, x, y + scaledFontSize * 1.1);
            }
          }
        }
      }

      ctx.restore();
    },
    [watermarkText, dateNote, fontSize, opacity, angle, gapX, gapY, textColor, watermarkMode, includeDate, showOriginal]
  );

  useEffect(() => {
    if (imgRef.current) {
      renderCanvas();
    }
  }, [renderCanvas]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);
    canvas.toBlob((blob) => {
      if (!blob) {
        setIsProcessing(false);
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `protected-id-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);

      addHistory({
        title: 'KTP Protected',
        toolName: 'KTP Watermark Protector',
        category: 'images',
        details: `${watermarkText.slice(0, 30)} (${imgNaturalSize.width}x${imgNaturalSize.height}px)`,
      });

      setIsProcessing(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 'image/png');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="card-brutal p-6 bg-surface">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-text">KTP Watermark Protector</h1>
                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-600 rounded-full border border-emerald-500/30">
                  Anti-Pinjol
                </span>
              </div>
              <p className="text-sm text-text-muted mt-1">
                Bubuhi stempel menyilang anti-bocor data pada KTP, SIM, NPWP, atau KK langsung di browser tanpa upload ke server.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-600 font-bold">
            <Lock className="w-4 h-4 shrink-0" />
            <span>100% Client-Side Safe</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Controls & Presets */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick Preset Buttons */}
          <div className="card-brutal p-5 bg-surface space-y-3">
            <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Template Rekomendasi
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_TEMPLATES.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setWatermarkText(p.text)}
                  className={`text-left px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                    watermarkText === p.text
                      ? 'bg-emerald-500/15 border-emerald-500 text-text'
                      : 'bg-surface-elevated/40 border-border hover:border-emerald-500/50 text-text-muted'
                  }`}
                >
                  <div className="text-text">{p.label}</div>
                  <div className="text-[10px] text-text-muted truncate mt-0.5 font-normal">{p.text}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Watermark Configuration */}
          <div className="card-brutal p-5 bg-surface space-y-4">
            <div>
              <label className="text-xs font-bold text-text block mb-1.5">Teks Watermark</label>
              <textarea
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface text-text text-xs font-bold focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="Contoh: HANYA UNTUK KEPERLUAN VERIFIKASI..."
              />
            </div>

            {/* Date / Note addition */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="text-xs font-bold text-text block mb-1.5">Catatan Tanggal</label>
                <input
                  type="date"
                  value={dateNote}
                  onChange={(e) => setDateNote(e.target.value)}
                  disabled={!includeDate}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface text-text text-xs font-bold focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-xs font-bold text-text cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeDate}
                  onChange={(e) => setIncludeDate(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-border"
                />
                Cantumkan Tgl
              </label>
            </div>

            {/* Watermark Layout Mode */}
            <div>
              <label className="text-xs font-bold text-text block mb-1.5">Pola Watermark</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWatermarkMode('tiled')}
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-black transition-all ${
                    watermarkMode === 'tiled'
                      ? 'bg-emerald-500 text-white border-black'
                      : 'bg-surface-elevated border-border text-text'
                  }`}
                >
                  Menyilang Penuh (Grid)
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkMode('center-bar')}
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-black transition-all ${
                    watermarkMode === 'center-bar'
                      ? 'bg-emerald-500 text-white border-black'
                      : 'bg-surface-elevated border-border text-text'
                  }`}
                >
                  Pita Melintang Tengah
                </button>
              </div>
            </div>

            {/* Sliders: Opacity, Angle, Size */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-text-muted">Transparansi (Opacity)</span>
                  <span className="text-text font-black">{opacity}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="85"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-text-muted">Kemiringan Sudut (Angle)</span>
                  <span className="text-text font-black">{angle} deg</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-text-muted">Ukuran Teks</span>
                  <span className="text-text font-black">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="48"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {watermarkMode === 'tiled' && (
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-text-muted">Kerapatan Grid Teks</span>
                    <span className="text-text font-black">{gapX}px</span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="350"
                    value={gapX}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setGapX(v);
                      setGapY(Math.round(v * 0.6));
                    }}
                    className="w-full accent-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Color selection */}
            <div>
              <label className="text-xs font-bold text-text block mb-1.5">Warna Teks</label>
              <div className="flex gap-2">
                {[
                  { name: 'Merah Aman', hex: '#DC2626' },
                  { name: 'Putih', hex: '#FFFFFF' },
                  { name: 'Hitam', hex: '#111827' },
                  { name: 'Biru Tua', hex: '#1D4ED8' },
                  { name: 'Kuning Peringatan', hex: '#CA8A04' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setTextColor(c.hex)}
                    title={c.name}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      textColor === c.hex ? 'scale-110 border-black ring-2 ring-emerald-500' : 'border-border'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Canvas Preview & Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-brutal p-5 bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-text uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-500" />
                Live Preview Dokumen
              </span>
              {imageSrc && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onMouseDown={() => setShowOriginal(true)}
                    onMouseUp={() => setShowOriginal(false)}
                    onTouchStart={() => setShowOriginal(true)}
                    onTouchEnd={() => setShowOriginal(false)}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-surface-elevated border border-border text-text hover:bg-surface-hover"
                  >
                    Tahan Cek Asli
                  </button>
                  <span className="text-[11px] text-text-muted font-mono">
                    {imgNaturalSize.width} x {imgNaturalSize.height}px
                  </span>
                </div>
              )}
            </div>

            {/* Upload Zone or Canvas */}
            {!imageSrc ? (
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-emerald-500 transition-colors bg-surface-elevated/40 text-center group"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform mb-3">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="text-base font-black text-text">Pilih atau Seret Foto Dokumen</div>
                <div className="text-xs text-text-muted mt-1 max-w-sm">
                  Format didukung: JPG, PNG, WEBP. Aman untuk KTP, SIM, NPWP, Paspor, atau Kartu Keluarga.
                </div>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border-2 border-black bg-surface-elevated/80 flex items-center justify-center min-h-[340px] max-h-[520px]">
                  <canvas ref={canvasRef} className="max-w-full max-h-[500px] object-contain shadow-md" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <label className="px-4 py-2.5 rounded-xl border-2 border-border bg-surface hover:bg-surface-hover text-xs font-bold text-text cursor-pointer flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Ganti Foto
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>

                  <button
                    onClick={handleDownload}
                    disabled={isProcessing}
                    className="btn-primary py-2.5 px-6 text-sm font-black flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 border-2 border-black"
                  >
                    {downloadSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        Tersimpan di Download!
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Unduh Dokumen Ber-Watermark (PNG)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Anti-Misuse Notice */}
          <div className="p-4 rounded-xl border border-border bg-surface-elevated/50 flex items-start gap-3 text-xs text-text-muted">
            <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-text block mb-0.5">Panduan Keamanan Data Pribadi</strong>
              Pastikan stempel menyilang tepat di atas kolom NIK dan Tanda Tangan Anda agar data tidak bisa diedit oleh
              oknum tanpa merusak stempel verifikasi.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
