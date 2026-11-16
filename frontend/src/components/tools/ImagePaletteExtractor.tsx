'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, Palette, Check } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface ColorToken {
  hex: string;
  rgb: string;
  hsl: string;
  percent: number;
}

export const ImagePaletteExtractor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [colors, setColors] = useState<ColorToken[]>([]);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addHistoryItem } = useAppStore();

  const rgbToHex = (r: number, g: number, b: number) => {
    return (
      '#' +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
        .toUpperCase()
    );
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setFile(uploaded);
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setImageSrc(src);
      extractPalette(src);
    };
    reader.readAsDataURL(uploaded);
  };

  // Pixel bucket sampling for dominant color extraction
  const extractPalette = (src: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Sample at 150x150 for fast quantization
      canvas.width = 150;
      canvas.height = 150;
      ctx.drawImage(img, 0, 0, 150, 150);

      const imgData = ctx.getImageData(0, 0, 150, 150);
      const data = imgData.data;

      // Color quantization map with step quantization (step of 24)
      const colorMap: Record<string, { r: number; g: number; b: number; count: number }> = {};
      const totalPixels = data.length / 4;

      for (let i = 0; i < data.length; i += 8) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 128) continue; // Skip transparency

        const qR = Math.round(r / 28) * 28;
        const qG = Math.round(g / 28) * 28;
        const qB = Math.round(b / 28) * 28;
        const key = `${qR},${qG},${qB}`;

        if (!colorMap[key]) {
          colorMap[key] = { r: qR, g: qG, b: qB, count: 0 };
        }
        colorMap[key].count++;
      }

      const sorted = Object.values(colorMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const tokens: ColorToken[] = sorted.map((c) => ({
        hex: rgbToHex(c.r, c.g, c.b),
        rgb: `rgb(${c.r}, ${c.g}, ${c.b})`,
        hsl: rgbToHsl(c.r, c.g, c.b),
        percent: Math.round((c.count / (totalPixels / 2)) * 100),
      }));

      setColors(tokens);

      addHistoryItem({
        toolId: 'image-palette-extractor',
        toolName: 'Image Palette Extractor',
        title: `Palet Warna ${file?.name || 'Foto'} (8 Warna)`,
        type: 'image',
        downloadUrl: '#',
      });
    };
    img.src = src;
  };

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  // Export aesthetic HD palette card as .png
  const handleExportPaletteCard = () => {
    if (colors.length === 0) return;

    const card = document.createElement('canvas');
    card.width = 1000;
    card.height = 650;
    const ctx = card.getContext('2d');
    if (!ctx) return;

    // Card background
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, 1000, 650);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('COLOR PALETTE SPECIFICATION', 50, 70);

    ctx.fillStyle = '#A1A1AA';
    ctx.font = '16px monospace';
    ctx.fillText(`Source: ${file?.name || 'Image'} | Extracted by UtilityHub`, 50, 105);

    // Draw swatch blocks
    const startY = 140;
    const swatchW = 100;
    const swatchH = 340;
    const gap = 12;

    colors.forEach((c, idx) => {
      const x = 50 + idx * (swatchW + gap);

      // Swatch bar
      ctx.fillStyle = c.hex;
      ctx.beginPath();
      ctx.roundRect(x, startY, swatchW, swatchH, 12);
      ctx.fill();

      // Label below
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(c.hex, x + 8, startY + swatchH + 35);

      ctx.fillStyle = '#71717A';
      ctx.font = '11px sans-serif';
      ctx.fillText(`Color #${idx + 1}`, x + 8, startY + swatchH + 55);
    });

    const url = card.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Palette_Card_${file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'Colors'}.png`;
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
        <div className="w-12 h-12 mx-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-rose-500 shadow-neo">
          <Palette className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--neo-text)]">
            {file ? file.name : 'Pilih atau Tarik Gambar / Foto Referensi Desain'}
          </p>
          <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
            Ekstrak 8 warna dominan (#HEX, RGB, HSL) dan ekspor kartu palet aesthetic
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

      {colors.length > 0 && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-[var(--neo-border)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--neo-text)]">
                8 Warna Dominan yang Terdeteksi
              </h3>
              <p className="text-[11px] text-[var(--neo-text-muted)] font-mono">
                Klik kartu kode warna untuk langsung menyalin HEX
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportPaletteCard}
              className="neo-btn neo-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Kartu Palet (.PNG)</span>
            </button>
          </div>

          {/* Color Tokens Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {colors.map((c, idx) => (
              <div
                key={`${c.hex}-${idx}`}
                onClick={() => handleCopy(c.hex)}
                className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] hover:border-[var(--neo-border-active)] transition-all cursor-pointer group space-y-2"
              >
                <div
                  className="w-full h-16 rounded-lg border-2 border-[var(--neo-border)] shadow-sm relative overflow-hidden"
                  style={{ backgroundColor: c.hex }}
                >
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    {copiedHex === c.hex ? 'Tersalin!' : 'Salin HEX'}
                  </div>
                </div>

                <div className="space-y-0.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--neo-text)]">{c.hex}</span>
                    {copiedHex === c.hex && <Check className="w-3 h-3 text-emerald-500 font-bold" />}
                  </div>
                  <span className="text-[10px] text-[var(--neo-text-muted)] block truncate">{c.rgb}</span>
                  <span className="text-[10px] text-[var(--neo-text-muted)] block truncate">{c.hsl}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
