'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, Sparkles, RefreshCw, Eye, Image as ImageIcon, ShieldCheck, Check } from 'lucide-react';

type BgViewMode = 'checker' | 'white' | 'dark' | 'green';

export const RemoveBackgroundTool: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<BgViewMode>('checker');
  const [showOriginal, setShowOriginal] = useState(false);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 100% Automatic AI Subject-Preserving Segmentation Engine
  const runAutoRemoveBg = useCallback(async (sourceFile: File | Blob | string) => {
    setIsProcessing(true);
    setProgress(15);
    setStatusText('Memulai engine segmentasi AI...');

    try {
      // 1. Try On-Device AI Segmentation via @imgly/background-removal (0% holes, preserves anime & humans)
      setStatusText('Memuat model AI segmentasi subjek (WASM/ONNX)...');
      setProgress(30);

      let resultBlob: Blob | null = null;

      try {
        // Load dynamically from CDN with webpackIgnore without using eval/new Function (fully CSP compliant)
        const imgly = typeof window !== 'undefined'
          ? await import(/* webpackIgnore: true */ 'https://esm.sh/@imgly/background-removal@1.7.0')
          : null;
        if (!imgly) throw new Error('Client-only module');
        const removeBgFn = imgly.removeBackground || (imgly as any).default;

        setStatusText('Menganalisis subjek & mengisolasi latar belakang...');
        setProgress(50);

        resultBlob = await removeBgFn(sourceFile, {
          progress: (key: string, current: number, total: number) => {
            if (total > 0) {
              const pct = Math.min(95, Math.max(30, Math.round((current / total) * 100)));
              setProgress(pct);
              if (key.includes('fetch')) {
                setStatusText('Mengunduh model neural AI...');
              } else if (key.includes('inference') || key.includes('compute')) {
                setStatusText('Memproses segmentasi objek tanpa bolong...');
              }
            }
          },
        });
      } catch (clientErr: any) {
        console.warn('On-device AI segmentation failed, trying backend fallback:', clientErr?.message);
      }

      // 2. If client WASM couldn't run, fallback to Backend AI Endpoint
      if (!resultBlob) {
        setStatusText('Menghubungkan ke API AI Cloud Fallback...');
        setProgress(70);

        const formData = new FormData();
        if (typeof sourceFile === 'string') {
          const fetchRes = await fetch(sourceFile);
          const blob = await fetchRes.blob();
          formData.append('image', blob, 'image.png');
        } else {
          formData.append('image', sourceFile, 'image.png');
        }

        const apiRes = await fetch('/api/remove-bg', {
          method: 'POST',
          body: formData,
        });

        if (apiRes.ok) {
          const apiJson = await apiRes.json();
          if (apiJson.success && apiJson.imageUrl) {
            const base64Res = await fetch(apiJson.imageUrl);
            resultBlob = await base64Res.blob();
          }
        }
      }

      if (!resultBlob) {
        throw new Error('Gagal memproses segmentasi latar belakang dengan AI.');
      }

      setProgress(100);
      setStatusText('Selesai! Latar belakang berhasil dihapus transparan.');

      const url = URL.createObjectURL(resultBlob);
      setProcessedUrl(url);

      // Measure dimensions
      const testImg = new Image();
      testImg.onload = () => {
        setImgDimensions({ width: testImg.naturalWidth, height: testImg.naturalHeight });
      };
      testImg.src = url;
    } catch (err: any) {
      console.error('Remove background error:', err);
      setStatusText(err.message || 'Gagal menghapus latar belakang.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setImageSrc(src);
      setProcessedUrl(null);

      // Auto trigger AI segmentation
      runAutoRemoveBg(file);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const a = document.createElement('a');
    a.href = processedUrl;
    a.download = `Removed_Background_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Background visual mode style classes
  const getBgStyle = () => {
    switch (viewMode) {
      case 'white':
        return 'bg-white';
      case 'dark':
        return 'bg-neutral-900';
      case 'green':
        return 'bg-[#00FF00]';
      case 'checker':
      default:
        return 'bg-[repeating-conic-gradient(#cbd5e1_0%_25%,#f8fafc_0%_50%)] bg-[length:24px_24px] dark:bg-[repeating-conic-gradient(#334155_0%_25%,#1e293b_0%_50%)]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Description */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border-2 border-rose-500 text-rose-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-[var(--neo-text)] tracking-tight">
            Remove Background AI (100% Otomatis & Anti-Bolong)
          </h2>
        </div>
        <p className="text-xs text-[var(--neo-text-muted)] font-medium">
          Hapus latar belakang foto otomatis menggunakan AI segmentasi objek sungguhan tanpa merusak/melubangi subjek dan karakter.
        </p>
      </div>

      {!imageSrc ? (
        /* Dropzone Upload */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const fakeEvent = { target: { files: [file] } } as any;
              handleFileChange(fakeEvent);
            }
          }}
          className="border-3 border-dashed border-[var(--neo-border)] hover:border-black rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all bg-[var(--neo-bg)] hover:bg-[var(--neo-surface)] group shadow-sm"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border-2 border-rose-500 text-rose-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-[var(--neo-text)] mb-1">
            Klik atau Tarik Foto ke Sini untuk Hapus Latar
          </h3>
          <p className="text-xs text-[var(--neo-text-muted)] max-w-md mx-auto">
            Mendukung manusia, karakter anime, produk, dan hewan. Model AI segmentasi langsung bekerja otomatis mengisolasi latar belakang menjadi transparan.
          </p>
        </div>
      ) : (
        /* Workspace Editor */
        <div className="space-y-4">
          {/* Status & Preview Bar */}
          <div className="neo-card p-3 sm:p-4 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="neo-badge bg-rose-500 text-white border-2 border-black font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                  AI SEGMENTATION
                </span>
                <span className="text-xs font-bold text-[var(--neo-text)]">
                  {isProcessing ? statusText : 'Selesai: Objek Bersih & Utuh'}
                </span>
              </div>
              {isProcessing && (
                <div className="w-full sm:w-64 bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden mt-1.5 border border-black/10">
                  <div
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Background Preview Selection Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase text-[var(--neo-text-muted)] mr-1">
                Latar Preview:
              </span>
              <button
                type="button"
                onClick={() => setViewMode('checker')}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border-2 transition-all ${
                  viewMode === 'checker'
                    ? 'bg-black text-white border-black'
                    : 'bg-[var(--neo-surface)] text-[var(--neo-text)] border-[var(--neo-border)]'
                }`}
              >
                Transparan
              </button>
              <button
                type="button"
                onClick={() => setViewMode('white')}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border-2 transition-all ${
                  viewMode === 'white'
                    ? 'bg-black text-white border-black'
                    : 'bg-[var(--neo-surface)] text-[var(--neo-text)] border-[var(--neo-border)]'
                }`}
              >
                Putih
              </button>
              <button
                type="button"
                onClick={() => setViewMode('dark')}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border-2 transition-all ${
                  viewMode === 'dark'
                    ? 'bg-black text-white border-black'
                    : 'bg-[var(--neo-surface)] text-[var(--neo-text)] border-[var(--neo-border)]'
                }`}
              >
                Gelap
              </button>
              <button
                type="button"
                onClick={() => setViewMode('green')}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border-2 transition-all ${
                  viewMode === 'green'
                    ? 'bg-black text-white border-black'
                    : 'bg-[var(--neo-surface)] text-[var(--neo-text)] border-[var(--neo-border)]'
                }`}
              >
                Green Screen
              </button>
            </div>
          </div>

          {/* Main Visual Display Area */}
          <div
            className={`relative w-full h-[380px] sm:h-[480px] rounded-3xl overflow-hidden border-2 border-black flex items-center justify-center p-3 select-none shadow-neo transition-colors duration-200 ${getBgStyle()}`}
          >
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-30 text-white gap-2 font-bold text-xs">
                <RefreshCw className="w-7 h-7 animate-spin text-rose-500" />
                <span>{statusText} ({progress}%)</span>
              </div>
            )}

            {/* Display Processed PNG (or original if toggled) */}
            <img
              src={showOriginal ? imageSrc : processedUrl || imageSrc}
              alt="Hasil background removal"
              className="max-w-full max-h-full object-contain filter drop-shadow-md"
            />

            {/* Floating Top Controls */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <button
                type="button"
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="neo-btn bg-black/80 hover:bg-black text-white border border-white/20 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Tahan untuk Lihat Asli</span>
              </button>
            </div>

            {imgDimensions && (
              <span className="absolute bottom-3 right-3 z-10 neo-badge bg-black/80 text-white border border-white/20 text-[10px] font-mono px-2 py-0.5 rounded-full">
                {imgDimensions.width}×{imgDimensions.height} px (PNG)
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!processedUrl || isProcessing}
              className="flex-1 neo-btn bg-rose-600 hover:bg-rose-700 text-white border-2 border-black py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-neo cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PNG Transparan Asli</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setImageSrc(null);
                setProcessedUrl(null);
                setImgDimensions(null);
              }}
              className="neo-btn neo-btn-secondary px-5 py-3 rounded-2xl text-xs font-bold shadow-sm"
            >
              Ganti Foto
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
