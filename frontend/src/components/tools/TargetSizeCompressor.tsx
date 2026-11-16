'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, FileImage, CheckCircle2, Sliders } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const TargetSizeCompressor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);

  const [targetKb, setTargetKb] = useState<number>(200);
  const [isCompressing, setIsCompressing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);
  const [resultDims, setResultDims] = useState<{ w: number; h: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addHistoryItem } = useAppStore();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setFile(uploaded);
    setOriginalSize(uploaded.size);
    setResultUrl(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(uploaded);
  };

  // Iterative compression towards target byte size
  const handleCompressToTarget = async () => {
    if (!file || !imagePreview) return;

    setIsCompressing(true);
    setResultUrl(null);

    const targetBytes = targetKb * 1024;
    const img = new Image();

    img.onload = async () => {
      const canvas = document.createElement('canvas');
      let curW = img.width;
      let curH = img.height;
      canvas.width = curW;
      canvas.height = curH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsCompressing(false);
        return;
      }
      ctx.drawImage(img, 0, 0, curW, curH);

      // Binary search for optimal quality between 0.05 and 0.95
      let minQ = 0.05;
      let maxQ = 0.95;
      let bestBlob: Blob | null = null;
      let iterations = 0;

      while (iterations < 7) {
        const midQ = (minQ + maxQ) / 2;
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', midQ);
        });

        if (!blob) break;

        bestBlob = blob;
        if (blob.size > targetBytes) {
          maxQ = midQ;
        } else {
          minQ = midQ;
        }
        iterations++;
      }

      // If still larger than target, scale dimensions down
      if (bestBlob && bestBlob.size > targetBytes) {
        const scaleFactor = Math.sqrt(targetBytes / bestBlob.size) * 0.95;
        curW = Math.max(200, Math.floor(curW * scaleFactor));
        curH = Math.max(200, Math.floor(curH * scaleFactor));
        canvas.width = curW;
        canvas.height = curH;
        ctx.drawImage(img, 0, 0, curW, curH);

        bestBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.82);
        });
      }

      if (bestBlob) {
        const url = URL.createObjectURL(bestBlob);
        setResultUrl(url);
        setResultSize(bestBlob.size);
        setResultDims({ w: curW, h: curH });

        addHistoryItem({
          toolId: 'target-size-compressor',
          toolName: 'Target-Size Image Compressor',
          title: `Kompres ${file.name} ke ${formatBytes(bestBlob.size)}`,
          type: 'image',
          downloadUrl: url,
        });
      }

      setIsCompressing(false);
    };

    img.src = imagePreview;
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const base = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'compressed';
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${base}_target_${targetKb}KB.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 text-center hover:border-[var(--neo-border-active)] transition-colors cursor-pointer bg-[var(--neo-bg)] space-y-2"
      >
        <div className="w-12 h-12 mx-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-amber-500 shadow-neo">
          <FileImage className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--neo-text)]">
            {file ? file.name : 'Pilih atau Tarik Foto / Dokumen Gambar'}
          </p>
          <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
            Kompres tepat di bawah batas ukuran yang ditentukan (contoh: syarat upload BUMN &lt;200KB)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {file && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          {/* Preset Buttons for Quick Target Size */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[var(--neo-text)]">
              Pilih Target Batas Ukuran Maksimal:
            </span>
            <div className="flex flex-wrap gap-2">
              {[100, 200, 300, 500, 1024, 2048].map((kb) => (
                <button
                  key={kb}
                  type="button"
                  onClick={() => setTargetKb(kb)}
                  className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                    targetKb === kb
                      ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)]'
                      : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)]'
                  }`}
                >
                  &lt; {kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`}
                </button>
              ))}
            </div>

            {/* Custom KB Input */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-[var(--neo-text-muted)]">Atau tentukan manual:</span>
              <input
                type="number"
                min="20"
                max="10000"
                value={targetKb}
                onChange={(e) => setTargetKb(Math.max(10, parseInt(e.target.value) || 200))}
                className="neo-input w-24 px-2 py-1 text-xs font-mono rounded"
              />
              <span className="text-xs font-bold text-[var(--neo-text)]">KB</span>
            </div>
          </div>

          {/* Compress Trigger Button */}
          <button
            type="button"
            onClick={handleCompressToTarget}
            disabled={isCompressing}
            className="neo-btn neo-btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <Sliders className="w-4 h-4" />
            <span>{isCompressing ? 'Mengompresi ke Target Ukuran...' : `Kompres Menjadi < ${targetKb} KB`}</span>
          </button>

          {/* Before vs After Comparison Card */}
          {resultUrl && (
            <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Berhasil Dikecilkan! (Di bawah {targetKb} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="neo-btn neo-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .JPG</span>
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[var(--neo-text-muted)] block">Sebelum</span>
                  <span className="font-bold text-[var(--neo-text)]">{formatBytes(originalSize)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--neo-text-muted)] block">Sesudah</span>
                  <span className="font-bold text-emerald-500">{formatBytes(resultSize)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--neo-text-muted)] block">Hemat Ukuran</span>
                  <span className="font-bold text-amber-500">
                    -{Math.round(((originalSize - resultSize) / originalSize) * 100)}%
                  </span>
                </div>
              </div>

              {/* Side-by-side preview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[var(--neo-text-muted)] block text-center">
                    Foto Asli ({formatBytes(originalSize)})
                  </span>
                  <div className="rounded-xl overflow-hidden border-2 border-[var(--neo-border)] bg-black/10 aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview!} alt="Original" className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-emerald-500 font-bold block text-center">
                    Hasil Kompres ({formatBytes(resultSize)})
                  </span>
                  <div className="rounded-xl overflow-hidden border-2 border-emerald-500/50 bg-black/10 aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resultUrl} alt="Compressed" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
