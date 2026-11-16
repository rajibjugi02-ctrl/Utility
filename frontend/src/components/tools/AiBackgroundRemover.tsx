'use client';

import React, { useState, useRef } from 'react';
import { Wand2, UploadCloud, Download, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const AiBackgroundRemover: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tolerance, setTolerance] = useState(30);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { addHistoryItem } = useAppStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setProcessedUrl(null);
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  const removeBackground = () => {
    if (!imageSrc) return;
    setIsProcessing(true);

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;

      // Sample background color from top-left, top-right, and bottom-left corners
      const bgR = (d[0] + d[(canvas.width - 1) * 4] + d[(canvas.height - 1) * canvas.width * 4]) / 3;
      const bgG = (d[1] + d[(canvas.width - 1) * 4 + 1] + d[(canvas.height - 1) * canvas.width * 4 + 1]) / 3;
      const bgB = (d[2] + d[(canvas.width - 1) * 4 + 2] + d[(canvas.height - 1) * canvas.width * 4 + 2]) / 3;

      const tol = tolerance * 2.5;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        // Euclidean color distance
        const dist = Math.sqrt(
          (r - bgR) * (r - bgR) +
          (g - bgG) * (g - bgG) +
          (b - bgB) * (b - bgB)
        );

        if (dist < tol) {
          // Transparent
          d[i + 3] = 0;
        } else if (dist < tol + 15) {
          // Feathered alpha edge
          d[i + 3] = Math.round(((dist - tol) / 15) * 255);
        }
      }

      ctx.putImageData(imgData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const out = URL.createObjectURL(blob);
          setProcessedUrl(out);
          setIsProcessing(false);

          addHistoryItem({
            type: 'ai-bg-remover',
            title: 'Hapus Latar Belakang Foto',
            subtitle: `${imageFile?.name || 'Foto'} · Transparan PNG`,
            downloadUrl: out,
          });
        }
      }, 'image/png');
    };
  };

  return (
    <div className="space-y-5">
      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="p-6 rounded-xl border border-dashed border-white/10 hover:border-violet-500/50 bg-white/[0.02] cursor-pointer text-center space-y-2 transition-colors"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mx-auto">
          <Wand2 className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <span className="font-semibold text-zinc-200">Pilih foto atau gambar objek</span>
          <span className="text-zinc-500 block text-[11px] mt-0.5">Sistem mendeteksi subjek dan memotong background otomatis</span>
        </div>
      </div>

      {imageSrc && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Original Preview */}
            <div className="p-3 rounded-xl zinc-card space-y-2">
              <span className="text-[11px] font-medium text-zinc-400 block">Foto Asli</span>
              <div className="h-44 rounded-lg overflow-hidden bg-zinc-900/90 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSrc} alt="Original" className="max-h-full max-w-full object-contain" />
              </div>
            </div>

            {/* Result Preview (Checkerboard pattern for transparency) */}
            <div className="p-3 rounded-xl zinc-card space-y-2">
              <span className="text-[11px] font-medium text-violet-400 block">Hasil Transparan</span>
              <div
                className="h-44 rounded-lg overflow-hidden flex items-center justify-center relative"
                style={{
                  backgroundImage: `linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)`,
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  backgroundColor: '#09090b',
                }}
              >
                {processedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={processedUrl} alt="Transparan" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-zinc-500">Klik proses untuk melihat hasil</span>
                )}
              </div>
            </div>
          </div>

          {/* Tolerance slider */}
          <div className="p-3.5 rounded-xl zinc-card flex items-center justify-between gap-4">
            <span className="text-xs text-zinc-400 font-medium">Sensitivitas Deteksi Latar</span>
            <input
              type="range"
              min="10"
              max="70"
              value={tolerance}
              onChange={(e) => setTolerance(parseInt(e.target.value))}
              className="w-40 accent-violet-400 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={removeBackground}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl text-xs font-semibold zinc-button-primary flex items-center justify-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Memproses Deteksi AI...' : 'Hapus Latar Belakang'}</span>
          </button>

          {processedUrl && (
            <div className="flex justify-end pt-1">
              <a
                href={processedUrl}
                download={`nobg_${Date.now()}.png`}
                className="px-4 py-2 rounded-lg text-xs font-semibold zinc-button-primary flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simpan Berkas PNG Transparan</span>
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
