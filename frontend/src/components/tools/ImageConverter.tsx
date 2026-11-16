'use client';

import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Download, Upload, ArrowRight, CheckCircle2, Sliders, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

type ImageFormat = 'image/webp' | 'image/jpeg' | 'image/png';

export const ImageConverter: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);

  const [format, setFormat] = useState<ImageFormat>('image/webp');
  const [quality, setQuality] = useState<number>(80);
  const [scale, setScale] = useState<number>(100);

  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number>(0);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addHistoryItem } = useAppStore();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalFile(file);
    setOriginalSize(file.size);
    setConvertedUrl(null);
    setConvertedBlob(null);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessImage = () => {
    if (!originalPreview || !originalFile) return;

    setLoading(true);
    setProgress(20);
    setStage('Memuat gambar ke memori Canvas...');

    const img = new Image();
    img.src = originalPreview;

    img.onload = () => {
      setProgress(50);
      setStage('Menghitung rasio kompresi & perataan piksel...');

      setTimeout(() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const scaleFactor = scale / 100;
        canvas.width = Math.round(img.width * scaleFactor);
        canvas.height = Math.round(img.height * scaleFactor);

        if (ctx) {
          if (format === 'image/jpeg') {
            // Fill background white for jpeg transparency
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        setProgress(85);
        setStage('Mengonversi format bit & kompresi bytes...');

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setConvertedUrl(url);
              setConvertedBlob(blob);
              setConvertedSize(blob.size);
              setProgress(100);
              setStage('Kompresi & Konversi berhasil!');
              setLoading(false);

              // Add to history
              const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';
              addHistoryItem({
                type: 'image',
                title: originalFile.name.replace(/\.[^/.]+$/, `.${ext}`),
                subtitle: `${formatFileSize(originalFile.size)} ➔ ${formatFileSize(blob.size)} (${ext.toUpperCase()})`,
                downloadUrl: url,
              });
            }
          },
          format,
          quality / 100
        );
      }, 400);
    };
  };

  const savedPercent =
    originalSize > 0 && convertedSize > 0
      ? Math.round(((originalSize - convertedSize) / originalSize) * 100)
      : 0;

  return (
    <div className="space-y-5">
      {/* Upload Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 sm:p-8 text-center cursor-pointer hover:border-[var(--neo-border-active)] bg-[var(--neo-bg)] transition-colors select-none"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--neo-accent)] text-[var(--neo-accent-text)] flex items-center justify-center mb-3">
          <Upload className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-sm text-[var(--neo-text)]">
          {originalFile ? originalFile.name : 'Pilih atau Tarik File Gambar ke Sini'}
        </h4>
        <p className="text-xs text-[var(--neo-text-muted)] mt-1 font-mono">
          {originalFile
            ? `Ukuran Asli: ${formatFileSize(originalSize)} · Klik untuk mengganti`
            : 'Mendukung PNG, JPG, JPEG, WEBP, GIF, SVG'}
        </p>
      </div>

      {/* Conversion Options */}
      {originalFile && (
        <div className="neo-card p-5 rounded-2xl bg-[var(--neo-surface)] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-[var(--neo-border)]">
            <Sliders className="w-4 h-4 text-[var(--neo-text)]" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--neo-text)]">
              Pengaturan Format & Kualitas Kompresi
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Format choice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--neo-text)]">Format Target:</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'image/webp', label: 'WEBP' },
                  { id: 'image/jpeg', label: 'JPG' },
                  { id: 'image/png', label: 'PNG' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormat(item.id as ImageFormat)}
                    className={`neo-btn py-1.5 rounded-lg text-xs font-bold ${
                      format === item.id ? 'neo-btn-primary' : 'neo-btn-secondary'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-[var(--neo-text)]">
                <span>Kualitas:</span>
                <span className="font-mono">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-[var(--neo-accent)] cursor-pointer"
              />
            </div>

            {/* Scale Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-[var(--neo-text)]">
                <span>Dimensi Skala:</span>
                <span className="font-mono">{scale}%</span>
              </div>
              <input
                type="range"
                min="25"
                max="100"
                step="5"
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full accent-[var(--neo-accent)] cursor-pointer"
              />
            </div>
          </div>

          {/* Trigger button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleProcessImage}
              disabled={loading}
              className="neo-btn neo-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Mengompres...' : 'Mulai Kompres & Konversi'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Animated Process Card */}
      {(loading || (progress > 0 && progress < 100)) && (
        <ProcessCard
          stage={stage}
          progress={progress}
          speed="24.6 MB/s"
          eta="00:01"
          isCompleted={progress === 100}
        />
      )}

      {/* Live Result Preview Card (Before vs After) */}
      {convertedUrl && progress === 100 && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--neo-border)]">
            <span className="neo-badge bg-emerald-500/10 text-emerald-500 border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" /> Hasil Kompresi Siap
            </span>
            <span className="text-xs font-bold font-mono text-emerald-500">
              {savedPercent > 0 ? `Hemat ${savedPercent}% (${formatFileSize(originalSize - convertedSize)})` : 'Selesai'}
            </span>
          </div>

          {/* Before vs After Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Before */}
            <div className="space-y-1.5 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--neo-text-muted)]">
                Sebelum (Asli: {formatFileSize(originalSize)})
              </span>
              <div className="h-48 sm:h-56 rounded-xl border-2 border-[var(--neo-border)] overflow-hidden bg-black/10 flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalPreview!}
                  alt="Original"
                  className="max-h-full max-w-full object-contain mx-auto"
                />
              </div>
            </div>

            {/* After */}
            <div className="space-y-1.5 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
                Sesudah ({formatFileSize(convertedSize)})
              </span>
              <div className="h-48 sm:h-56 rounded-xl border-2 border-emerald-500/60 overflow-hidden bg-black/10 flex items-center justify-center p-2 shadow-neo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={convertedUrl}
                  alt="Converted"
                  className="max-h-full max-w-full object-contain mx-auto"
                />
              </div>
            </div>
          </div>

          {/* Download Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t-2 border-[var(--neo-border)]">
            <div className="text-xs font-mono text-[var(--neo-text-muted)]">
              Format: {format.replace('image/', '').toUpperCase()} · Ukuran baru: <strong className="text-[var(--neo-text)]">{formatFileSize(convertedSize)}</strong>
            </div>

            <a
              href={convertedUrl}
              download={originalFile?.name.replace(/\.[^/.]+$/, `.${format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png'}`)}
              className="neo-btn neo-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              <span>Download Gambar Hasil Konversi</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
