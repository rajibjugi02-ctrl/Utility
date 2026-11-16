'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileCheck2,
  Upload,
  Download,
  RotateCw,
  Sliders,
  Sparkles,
  FileText,
  Eye,
  Check,
  RefreshCw,
  Sun,
  Contrast,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

type ScannerPreset = 'magic-bw' | 'clean-color' | 'grayscale' | 'sharp-original';

export default function CamScannerEnhancer() {
  const { addHistory } = useAppStore();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  // Processing settings
  const [preset, setPreset] = useState<ScannerPreset>('magic-bw');
  const [whiteness, setWhiteness] = useState(65); // Paper background whitening
  const [contrastVal, setContrastVal] = useState(40); // Text contrast
  const [brightnessVal, setBrightnessVal] = useState(15);
  const [thresholdVal, setThresholdVal] = useState(140);
  const [rotation, setRotation] = useState(0);

  // View state
  const [viewMode, setViewMode] = useState<'enhanced' | 'split' | 'original'>('enhanced');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rawImgRef = useRef<HTMLImageElement | null>(null);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageSrc(url);

    const img = new Image();
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      rawImgRef.current = img;
      setRotation(0);
      applyFilter(img, preset, whiteness, contrastVal, brightnessVal, thresholdVal, 0);
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
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        rawImgRef.current = img;
        setRotation(0);
        applyFilter(img, preset, whiteness, contrastVal, brightnessVal, thresholdVal, 0);
      };
      img.src = url;
    }
  };

  // Preset setter with default optimal values
  const selectPreset = (newPreset: ScannerPreset) => {
    setPreset(newPreset);
    if (newPreset === 'magic-bw') {
      setWhiteness(75);
      setContrastVal(60);
      setBrightnessVal(20);
      setThresholdVal(135);
    } else if (newPreset === 'clean-color') {
      setWhiteness(60);
      setContrastVal(35);
      setBrightnessVal(15);
      setThresholdVal(150);
    } else if (newPreset === 'grayscale') {
      setWhiteness(55);
      setContrastVal(30);
      setBrightnessVal(10);
      setThresholdVal(130);
    } else if (newPreset === 'sharp-original') {
      setWhiteness(20);
      setContrastVal(20);
      setBrightnessVal(5);
      setThresholdVal(120);
    }
  };

  // Core image processing pipeline
  const applyFilter = useCallback(
    (
      imgObj: HTMLImageElement | null,
      mode: ScannerPreset,
      whiteLevel: number,
      contrast: number,
      brightness: number,
      threshold: number,
      rot: number
    ) => {
      const img = imgObj || rawImgRef.current;
      const canvas = canvasRef.current;
      if (!img || !canvas) return;

      const isRotated90or270 = rot % 180 !== 0;
      const w = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
      const h = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle orientation rotation
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();

      // Read image pixel data
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const totalPixels = data.length;

      // Contrast factor calculation
      const cFactor = (259 * (contrast * 2.55 + 255)) / (255 * (259 - contrast * 2.55));
      const bFactor = brightness * 1.5;
      const whiteBoost = whiteLevel * 1.8;

      for (let i = 0; i < totalPixels; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Standard perceived luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (mode === 'magic-bw') {
          // Adaptive-like high contrast document scanning
          // If luminance is above threshold, whiten paper background cleanly
          if (lum > threshold - whiteLevel * 0.4) {
            // Paper whitening with slight smoothing
            const lift = Math.min(255, lum + whiteBoost);
            data[i] = lift > 220 ? 255 : lift;
            data[i + 1] = lift > 220 ? 255 : lift;
            data[i + 2] = lift > 220 ? 255 : lift;
          } else {
            // Darken ink / text
            const dark = Math.max(0, lum - contrast * 1.2);
            data[i] = dark;
            data[i + 1] = dark;
            data[i + 2] = dark;
          }
        } else if (mode === 'clean-color') {
          // Color mode: Whiten near-white paper while preserving ink saturation (blue pens, red stamps)
          if (lum > 140) {
            // Paper background: push towards pure white
            r = Math.min(255, r + whiteBoost);
            g = Math.min(255, g + whiteBoost);
            b = Math.min(255, b + whiteBoost);
          } else {
            // Ink: apply contrast and color boost
            r = Math.min(255, Math.max(0, cFactor * (r - 128) + 128 + bFactor));
            g = Math.min(255, Math.max(0, cFactor * (g - 128) + 128 + bFactor));
            b = Math.min(255, Math.max(0, cFactor * (b - 128) + 128 + bFactor));
          }
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        } else if (mode === 'grayscale') {
          // Grayscale photocopy
          let gray = lum;
          if (gray > 130) {
            gray = Math.min(255, gray + whiteBoost * 0.8);
          }
          gray = Math.min(255, Math.max(0, cFactor * (gray - 128) + 128 + bFactor));
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        } else if (mode === 'sharp-original') {
          // Sharp original
          r = Math.min(255, Math.max(0, cFactor * (r - 128) + 128 + bFactor));
          g = Math.min(255, Math.max(0, cFactor * (g - 128) + 128 + bFactor));
          b = Math.min(255, Math.max(0, cFactor * (b - 128) + 128 + bFactor));
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }
      }

      ctx.putImageData(imgData, 0, 0);
    },
    []
  );

  // Trigger re-render whenever sliders or rotation change
  useEffect(() => {
    if (rawImgRef.current) {
      applyFilter(rawImgRef.current, preset, whiteness, contrastVal, brightnessVal, thresholdVal, rotation);
    }
  }, [preset, whiteness, contrastVal, brightnessVal, thresholdVal, rotation, applyFilter]);

  // Rotate 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Download image as high-res PNG
  const handleDownloadImage = () => {
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
      a.download = `scanned-doc-${preset}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);

      addHistory({
        title: 'Document Enhanced',
        toolName: 'CamScanner Document Enhancer',
        category: 'images',
        details: `Filter: ${preset} (${canvas.width}x${canvas.height}px)`,
      });

      setIsProcessing(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 'image/png');
  };

  // Export to clean PDF document
  const handleExportPdf = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);
    try {
      // Dynamic import pdf-lib to prevent SSR issues
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();

      const pngDataUrl = canvas.toDataURL('image/png');
      const pngImageBytes = await fetch(pngDataUrl).then((res) => res.arrayBuffer());
      const pngImage = await pdfDoc.embedPng(pngImageBytes);

      // Create page matching document aspect ratio or standard A4 proportions
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Fit to A4 (595.28 x 841.89 points)
      const a4Width = 595.28;
      const a4Height = 841.89;

      const scale = Math.min((a4Width - 40) / imgWidth, (a4Height - 40) / imgHeight);
      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;

      const page = pdfDoc.addPage([a4Width, a4Height]);
      page.drawImage(pngImage, {
        x: (a4Width - drawWidth) / 2,
        y: (a4Height - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scanned-document-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      addHistory({
        title: 'Exported Scanned PDF',
        toolName: 'CamScanner Document Enhancer',
        category: 'docs',
        details: `A4 Clean Document Scan`,
      });

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PDF Export error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="card-brutal p-6 bg-surface">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border-2 border-teal-500 flex items-center justify-center text-teal-500">
              <FileCheck2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-text">CamScanner Document Enhancer</h1>
                <span className="px-2 py-0.5 text-xs font-bold bg-teal-500/20 text-teal-600 rounded-full border border-teal-500/30">
                  Clean Scan
                </span>
              </div>
              <p className="text-sm text-text-muted mt-1">
                Bersihkan bayangan abu-abu dan ratakan latar kertas menjadi putih bersih layaknya mesin fotokopi / scanner profesional.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-bold text-text">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <span>Tanpa Watermark CamScanner</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset & Tuning Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* Preset Buttons */}
          <div className="card-brutal p-5 bg-surface space-y-3">
            <label className="text-xs font-bold text-text uppercase tracking-wider block">
              Pilihan Mode Scanner
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'magic-bw', label: 'B&W Magic Scan', desc: 'Teks hitam tajam, kertas putih total' },
                { id: 'clean-color', label: 'Color Document', desc: 'Warna tinta & stempel tetap hidup' },
                { id: 'grayscale', label: 'Fotokopi Halus', desc: 'Grayscale natural tanpa bintik' },
                { id: 'sharp-original', label: 'Sharp Original', desc: 'Kontras & saturasi orisinil' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPreset(p.id as ScannerPreset)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    preset === p.id
                      ? 'bg-teal-500/15 border-teal-500 text-text'
                      : 'bg-surface-elevated/40 border-border hover:border-teal-500/40 text-text-muted'
                  }`}
                >
                  <div className="text-xs font-black text-text">{p.label}</div>
                  <div className="text-[10px] text-text-muted mt-1 leading-snug">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Sliders */}
          <div className="card-brutal p-5 bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-500" />
                Penyesuaian Manual
              </label>
              <button
                type="button"
                onClick={handleRotate}
                className="px-2.5 py-1 text-xs font-bold bg-surface-elevated hover:bg-surface-hover border border-border rounded-lg text-text flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Putar 90 deg
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-text-muted">Pemutih Latar Kertas (Shadow Eraser)</span>
                  <span className="text-text font-black">{whiteness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={whiteness}
                  onChange={(e) => setWhiteness(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-text-muted">Kontras Tinta / Tulisan</span>
                  <span className="text-text font-black">{contrastVal}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={contrastVal}
                  onChange={(e) => setContrastVal(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-text-muted">Kecerahan Dokumen</span>
                  <span className="text-text font-black">{brightnessVal}%</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="50"
                  value={brightnessVal}
                  onChange={(e) => setBrightnessVal(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              {preset === 'magic-bw' && (
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-text-muted">Batas Ambang Gelap/Terang (Threshold)</span>
                    <span className="text-text font-black">{thresholdVal}</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="210"
                    value={thresholdVal}
                    onChange={(e) => setThresholdVal(Number(e.target.value))}
                    className="w-full accent-teal-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Action Buttons */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-brutal p-5 bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-text uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-500" />
                Hasil Pindai Dokumen
              </span>

              {imageSrc && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-muted font-mono">
                    {canvasRef.current ? `${canvasRef.current.width}x${canvasRef.current.height}px` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Upload or Canvas */}
            {!imageSrc ? (
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-teal-500 transition-colors bg-surface-elevated/40 text-center group"
              >
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border-2 border-teal-500 flex items-center justify-center text-teal-500 group-hover:scale-105 transition-transform mb-3">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="text-base font-black text-text">Pilih atau Seret Foto Catatan / Dokumen</div>
                <div className="text-xs text-text-muted mt-1 max-w-sm">
                  Format didukung: JPG, PNG, WEBP. Cocok untuk struk belanja, surat tugas, lembar jawaban, atau halaman buku.
                </div>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border-2 border-black bg-stone-900/10 flex items-center justify-center min-h-[360px] max-h-[540px] p-2">
                  <canvas ref={canvasRef} className="max-w-full max-h-[500px] object-contain shadow-lg rounded" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <label className="px-4 py-2.5 rounded-xl border-2 border-border bg-surface hover:bg-surface-hover text-xs font-bold text-text cursor-pointer flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Ganti Foto
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportPdf}
                      disabled={isProcessing}
                      className="px-4 py-2.5 rounded-xl border-2 border-black bg-surface-elevated hover:bg-surface-hover text-xs font-black text-text flex items-center gap-2 shadow-sm"
                    >
                      <FileText className="w-4 h-4 text-rose-500" />
                      Ekspor ke Dokumen PDF
                    </button>

                    <button
                      onClick={handleDownloadImage}
                      disabled={isProcessing}
                      className="btn-primary py-2.5 px-5 text-xs font-black flex items-center gap-2 bg-teal-500 hover:bg-teal-600 border-2 border-black"
                    >
                      {downloadSuccess ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          Tersimpan!
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Unduh Gambar PNG
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
