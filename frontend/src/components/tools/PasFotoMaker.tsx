'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Crop, CheckCircle2, User, Grid } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

type PasFotoSize = '2x3' | '3x4' | '4x6';
type BgChoice = 'red' | 'blue' | 'white' | 'original';

interface SizeDimension {
  width: number;
  height: number;
  label: string;
}

const SIZE_CONFIGS: Record<PasFotoSize, SizeDimension> = {
  '2x3': { width: 236, height: 354, label: '2 x 3 cm (Standar Buku Nikah / Ijazah)' },
  '3x4': { width: 354, height: 472, label: '3 x 4 cm (Standar KTP / SIM / BUMN)' },
  '4x6': { width: 472, height: 708, label: '4 x 6 cm (Standar Paspor / CPNS / Kedinasan)' },
};

const BG_CONFIGS: Record<BgChoice, { color: string; label: string; code: string }> = {
  red: { color: '#DB1514', label: 'Merah Resmi (Tahun Kelahiran Ganjil)', code: 'rgb(219, 21, 20)' },
  blue: { color: '#0054A6', label: 'Biru Resmi (Tahun Kelahiran Genap)', code: 'rgb(0, 84, 166)' },
  white: { color: '#FFFFFF', label: 'Putih Netral (Visa / Kedutaan)', code: 'rgb(255, 255, 255)' },
  original: { color: 'transparent', label: 'Original (Pertahankan Latar Asli)', code: 'transparent' },
};

// Smart Edge Flood-Fill with central face & body protection
function applySmartBackground(
  offCtx: CanvasRenderingContext2D,
  targetW: number,
  targetH: number,
  bgColor: 'red' | 'blue' | 'white'
) {
  const imgData = offCtx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;

  // 1. Sample background color at top corners and center
  const samplePixels = [
    0,
    (targetW - 1) * 4,
    Math.floor(targetW / 2) * 4,
  ];
  let sumR = 0, sumG = 0, sumB = 0;
  samplePixels.forEach((idx) => {
    sumR += data[idx];
    sumG += data[idx + 1];
    sumB += data[idx + 2];
  });
  const bgR = sumR / samplePixels.length;
  const bgG = sumG / samplePixels.length;
  const bgB = sumB / samplePixels.length;

  const targetR = bgColor === 'red' ? 219 : bgColor === 'blue' ? 0 : 255;
  const targetG = bgColor === 'red' ? 21 : bgColor === 'blue' ? 84 : 255;
  const targetB = bgColor === 'red' ? 20 : bgColor === 'blue' ? 166 : 255;

  // 2. Visited mask & Queue for BFS flood fill starting strictly from outer edges
  const visited = new Uint8Array(targetW * targetH);
  const queue: number[] = [];

  // Seed boundary pixels (top row, left border, right border)
  for (let x = 0; x < targetW; x++) {
    visited[x] = 1;
    queue.push(x);
  }
  for (let y = 1; y < Math.floor(targetH * 0.75); y++) {
    const idxL = y * targetW;
    const idxR = y * targetW + (targetW - 1);
    if (!visited[idxL]) { visited[idxL] = 1; queue.push(idxL); }
    if (!visited[idxR]) { visited[idxR] = 1; queue.push(idxR); }
  }

  // 3. Central Protection Zone: Face & Body core
  const centerX = targetW / 2;
  const centerY = targetH * 0.42;
  const radX = targetW * 0.24;
  const radY = targetH * 0.26;

  const tolerance = 54;
  let head = 0;

  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % targetW;
    const cy = Math.floor(curr / targetW);

    const pIdx = curr * 4;
    const pr = data[pIdx];
    const pg = data[pIdx + 1];
    const pb = data[pIdx + 2];

    const diff = Math.sqrt((pr - bgR) ** 2 + (pg - bgG) ** 2 + (pb - bgB) ** 2);
    if (diff < tolerance) {
      data[pIdx] = targetR;
      data[pIdx + 1] = targetG;
      data[pIdx + 2] = targetB;

      const neighbors = [
        cx > 0 ? curr - 1 : -1,
        cx < targetW - 1 ? curr + 1 : -1,
        cy > 0 ? curr - targetW : -1,
        cy < targetH - 1 ? curr + targetW : -1,
      ];

      for (const n of neighbors) {
        if (n >= 0 && !visited[n]) {
          const nx = n % targetW;
          const ny = Math.floor(n / targetW);

          // Strictly protect inner face/head core zone
          const normX = (nx - centerX) / radX;
          const normY = (ny - centerY) / radY;
          const isInsideFaceCore = normX * normX + normY * normY < 0.7;

          // And protect chest/torso core
          const isInsideTorsoCore = ny > targetH * 0.65 && Math.abs(nx - centerX) < targetW * 0.3;

          visited[n] = 1;
          if (!isInsideFaceCore && !isInsideTorsoCore) {
            queue.push(n);
          }
        }
      }
    }
  }

  offCtx.putImageData(imgData, 0, 0);
}

export const PasFotoMaker: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  const [size, setSize] = useState<PasFotoSize>('3x4');
  const [bgColor, setBgColor] = useState<BgChoice>('red');
  const [zoom, setZoom] = useState<number>(1.1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  const [renderedSingleUrl, setRenderedSingleUrl] = useState<string | null>(null);
  const [renderedSheetUrl, setRenderedSheetUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addHistoryItem } = useAppStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setRenderedSingleUrl(null);
    setRenderedSheetUrl(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImageElement(img);
        setPanX(0);
        setPanY(0);
        setZoom(1.1);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Re-draw preview canvas whenever controls change
  useEffect(() => {
    if (!imageElement) return;
    renderPreview();
  }, [imageElement, size, bgColor, zoom, panX, panY]);

  const renderPreview = () => {
    if (!imageElement || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: targetW, height: targetH } = SIZE_CONFIGS[size];
    canvas.width = targetW;
    canvas.height = targetH;

    // 1. Fill background if chosen
    if (bgColor !== 'original') {
      ctx.fillStyle = BG_CONFIGS[bgColor].color;
      ctx.fillRect(0, 0, targetW, targetH);
    } else {
      ctx.clearRect(0, 0, targetW, targetH);
    }

    // 2. Draw user image with zoom and pan
    const imgRatio = imageElement.width / imageElement.height;
    const canvasRatio = targetW / targetH;
    let drawW: number;
    let drawH: number;

    if (imgRatio > canvasRatio) {
      drawH = targetH * zoom;
      drawW = drawH * imgRatio;
    } else {
      drawW = targetW * zoom;
      drawH = drawW / imgRatio;
    }

    const drawX = (targetW - drawW) / 2 + panX;
    const drawY = (targetH - drawH) / 2 + panY;

    // Draw offscreen first if doing chroma/flood-fill background replacement
    if (bgColor !== 'original') {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = targetW;
      offCanvas.height = targetH;
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        offCtx.drawImage(imageElement, drawX, drawY, drawW, drawH);
        applySmartBackground(offCtx, targetW, targetH, bgColor);
        ctx.drawImage(offCanvas, 0, 0);
      }
    } else {
      ctx.drawImage(imageElement, drawX, drawY, drawW, drawH);
    }

    // 3. Draw subtle biometric passport oval guideline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    // Head oval
    ctx.beginPath();
    ctx.ellipse(targetW / 2, targetH * 0.42, targetW * 0.28, targetH * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Eye line
    ctx.beginPath();
    ctx.moveTo(targetW * 0.2, targetH * 0.4);
    ctx.lineTo(targetW * 0.8, targetH * 0.4);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  // Generate finalized single pas foto without guideline markings
  const handleGenerateSingle = () => {
    if (!imageElement) return;
    const { width: targetW, height: targetH } = SIZE_CONFIGS[size];

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (bgColor !== 'original') {
      ctx.fillStyle = BG_CONFIGS[bgColor].color;
      ctx.fillRect(0, 0, targetW, targetH);
    }

    const imgRatio = imageElement.width / imageElement.height;
    const canvasRatio = targetW / targetH;
    let drawW: number;
    let drawH: number;

    if (imgRatio > canvasRatio) {
      drawH = targetH * zoom;
      drawW = drawH * imgRatio;
    } else {
      drawW = targetW * zoom;
      drawH = drawW / imgRatio;
    }

    const drawX = (targetW - drawW) / 2 + panX;
    const drawY = (targetH - drawH) / 2 + panY;

    if (bgColor !== 'original') {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = targetW;
      offCanvas.height = targetH;
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        offCtx.drawImage(imageElement, drawX, drawY, drawW, drawH);
        applySmartBackground(offCtx, targetW, targetH, bgColor);
        ctx.drawImage(offCanvas, 0, 0);
      }
    } else {
      ctx.drawImage(imageElement, drawX, drawY, drawW, drawH);
    }

    const url = canvas.toDataURL('image/jpeg', 0.95);
    setRenderedSingleUrl(url);

    addHistoryItem({
      toolId: 'pas-foto-maker',
      toolName: 'Pas Foto Maker',
      title: `Pas Foto ${size} (${bgColor.toUpperCase()})`,
      type: 'image',
      downloadUrl: url,
    });
  };

  // Generate 4R Printable Sheet with 6x or 8x copies and grid lines
  const handleGenerateSheet4R = () => {
    if (!imageElement) return;
    const { width: targetW, height: targetH } = SIZE_CONFIGS[size];

    // Standard 4R Photo Paper at 300 DPI: 1200 x 1800 px
    const sheetCanvas = document.createElement('canvas');
    sheetCanvas.width = 1200;
    sheetCanvas.height = 1800;
    const ctx = sheetCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1200, 1800);

    // Get single render first
    const singleCanvas = document.createElement('canvas');
    singleCanvas.width = targetW;
    singleCanvas.height = targetH;
    const sCtx = singleCanvas.getContext('2d');
    if (!sCtx) return;

    if (bgColor !== 'original') {
      sCtx.fillStyle = BG_CONFIGS[bgColor].color;
      sCtx.fillRect(0, 0, targetW, targetH);
    }

    const imgRatio = imageElement.width / imageElement.height;
    const canvasRatio = targetW / targetH;
    let drawW: number;
    let drawH: number;

    if (imgRatio > canvasRatio) {
      drawH = targetH * zoom;
      drawW = drawH * imgRatio;
    } else {
      drawW = targetW * zoom;
      drawH = drawW / imgRatio;
    }

    sCtx.drawImage(imageElement, (targetW - drawW) / 2 + panX, (targetH - drawH) / 2 + panY, drawW, drawH);
    if (bgColor !== 'original') {
      applySmartBackground(sCtx, targetW, targetH, bgColor);
    }

    // Lay out photos on 4R paper
    const cols = size === '2x3' ? 4 : size === '3x4' ? 3 : 2;
    const rows = size === '2x3' ? 4 : size === '3x4' ? 3 : 2;
    const gapX = (1200 - cols * targetW) / (cols + 1);
    const gapY = (1800 - rows * targetH) / (rows + 1);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = gapX + c * (targetW + gapX);
        const y = gapY + r * (targetH + gapY);

        ctx.drawImage(singleCanvas, x, y, targetW, targetH);

        // Subtle cutting border
        ctx.strokeStyle = '#D4D4D8';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, targetW, targetH);
      }
    }

    const sheetUrl = sheetCanvas.toDataURL('image/jpeg', 0.95);
    setRenderedSheetUrl(sheetUrl);
  };

  const downloadFile = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
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
          <User className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--neo-text)]">
            {imageFile ? imageFile.name : 'Pilih atau Tarik Foto Potret Anda'}
          </p>
          <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
            Dukung pas foto 2x3, 3x4, 4x6, ganti latar Merah/Biru resmi, dan cetak lembaran 4R
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

      {imageElement && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          {/* Controls: Size Selector & Background Choice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Size Choice */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[var(--neo-text)]">Ukuran Standar Pas Foto:</span>
              <div className="grid grid-cols-3 gap-2">
                {(['2x3', '3x4', '4x6'] as PasFotoSize[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`py-2 px-2.5 rounded-xl border-2 text-xs font-bold transition-all ${size === s
                        ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)]'
                        : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)]'
                      }`}
                  >
                    {s} cm
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[var(--neo-text-muted)]">{SIZE_CONFIGS[size].label}</p>
            </div>

            {/* 2. Official Background Color */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[var(--neo-text)]">Warna Latar Belakang Resmi:</span>
              <div className="grid grid-cols-4 gap-2">
                {(['red', 'blue', 'white', 'original'] as BgChoice[]).map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBgColor(bg)}
                    className={`py-2 px-2 rounded-xl border-2 text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${bgColor === bg
                        ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)]'
                        : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)]'
                      }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-[var(--neo-border)]"
                      style={{ backgroundColor: bg === 'original' ? '#888' : BG_CONFIGS[bg].color }}
                    />
                    <span className="capitalize">{bg === 'red' ? 'Merah' : bg === 'blue' ? 'Biru' : bg === 'white' ? 'Putih' : 'Asli'}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[var(--neo-text-muted)]">{BG_CONFIGS[bgColor].label}</p>
            </div>
          </div>

          {/* Interactive Crop & Position Sliders */}
          <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>Zoom Wajah:</span>
                <span className="font-bold">{zoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[var(--neo-text)] cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>Geser Horisontal (Pan X):</span>
                <span className="font-bold">{panX}px</span>
              </div>
              <input
                type="range"
                min="-150"
                max="150"
                step="1"
                value={panX}
                onChange={(e) => setPanX(parseInt(e.target.value))}
                className="w-full accent-[var(--neo-text)] cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>Geser Vertikal (Pan Y):</span>
                <span className="font-bold">{panY}px</span>
              </div>
              <input
                type="range"
                min="-150"
                max="150"
                step="1"
                value={panY}
                onChange={(e) => setPanY(parseInt(e.target.value))}
                className="w-full accent-[var(--neo-text)] cursor-pointer"
              />
            </div>
          </div>

          {/* Canvas Live Preview with Biometric Passport Guides */}
          <div className="flex flex-col items-center space-y-2">
            <span className="text-[11px] font-mono text-[var(--neo-text-muted)]">
              Garis oval putih adalah panduan standar posisi kepala & mata paspor
            </span>
            <div className="p-2 rounded-2xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] shadow-neo inline-block">
              <canvas
                ref={canvasRef}
                className="max-h-72 w-auto object-contain rounded-xl border border-[var(--neo-border)] block"
              />
            </div>
          </div>

          {/* Action Buttons: Render Single & Render 4R Sheet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleGenerateSingle}
              className="neo-btn neo-btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Buat Pas Foto Satuan (.JPG)</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateSheet4R}
              className="neo-btn neo-btn-secondary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Grid className="w-4 h-4 text-indigo-500" />
              <span>Buat Lembaran Cetak 4R (Siap Print)</span>
            </button>
          </div>

          {/* Single Download Preview Card */}
          {renderedSingleUrl && (
            <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pas Foto {size} Siap Diunduh!</span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadFile(renderedSingleUrl, `PasFoto_${size}_${bgColor}.jpg`)}
                  className="neo-btn neo-btn-primary px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File .JPG</span>
                </button>
              </div>

              <div className="max-w-[140px] mx-auto rounded-xl overflow-hidden border-2 border-[var(--neo-border)] shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={renderedSingleUrl}
                  alt="Pas Foto Siap Unduh"
                  className="w-full h-auto block"
                />
              </div>
            </div>
          )}

          {/* 4R Printable Sheet Preview Card */}
          {renderedSheetUrl && (
            <div className="p-4 rounded-xl border-2 border-indigo-500/40 bg-indigo-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lembaran Cetak 4R Berisi Pas Foto Siap Dicetak!</span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadFile(renderedSheetUrl, `Lembar_Cetak_4R_${size}_${bgColor}.jpg`)}
                  className="neo-btn neo-btn-primary px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Lembar 4R .JPG</span>
                </button>
              </div>

              <div className="max-w-[200px] mx-auto rounded-xl overflow-hidden border-2 border-[var(--neo-border)] shadow-md bg-white p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={renderedSheetUrl}
                  alt="Lembaran 4R Siap Cetak"
                  className="w-full h-auto block"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
