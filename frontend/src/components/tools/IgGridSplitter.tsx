'use client';

import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { Upload, Download, Grid, FileArchive, Info, Sparkles, Sliders } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

type SplitMode = 'carousel' | 'grid';

interface SliceItem {
  index: number;
  total: number;
  dataUrl: string;
  width: number;
  height: number;
  orderLabel: string;
}

export const IgGridSplitter: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>('carousel');
  const [carouselSlices, setCarouselSlices] = useState<number>(3); // 2 to 12
  const [gridRows, setGridRows] = useState<number>(3); // 1 to 4 (rows for 3xN grid, up to 12)
  const [showNumberStamp, setShowNumberStamp] = useState<boolean>(false);
  const [slices, setSlices] = useState<SliceItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addHistoryItem } = useAppStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setImageSrc(src);
      renderSlices(src, splitMode, carouselSlices, gridRows, showNumberStamp, file.name);
    };
    reader.readAsDataURL(file);
  };

  const renderSlices = (
    src: string,
    mode: SplitMode,
    numSlices: number,
    rows: number,
    addStamp: boolean,
    fileName: string = 'image.png'
  ) => {
    setIsProcessing(true);
    setSlices([]);

    const img = new Image();
    img.onload = () => {
      const generated: SliceItem[] = [];
      const PANEL_WIDTH = 1080;
      const PANEL_HEIGHT = 1350; // 4:5 portrait ratio

      if (mode === 'carousel') {
        // Panorama Carousel: N slices side by side, each 4:5 portrait (1080x1350)
        // Total aspect ratio required for N slices of 4:5 is (4 * N) / 5 = 0.8 * N
        const targetPanoramaAspect = (4 * numSlices) / 5;
        const sourceAspect = img.width / img.height;

        let sWidth = 0;
        let sHeight = 0;
        let startX = 0;
        let startY = 0;

        if (sourceAspect > targetPanoramaAspect) {
          // Image is wider than needed: crop left/right edges
          sHeight = img.height;
          sWidth = img.height * targetPanoramaAspect;
          startX = (img.width - sWidth) / 2;
          startY = 0;
        } else {
          // Image is taller than needed: crop top/bottom edges
          sWidth = img.width;
          sHeight = img.width / targetPanoramaAspect;
          startX = 0;
          startY = (img.height - sHeight) / 2;
        }

        const sliceSourceWidth = sWidth / numSlices;

        for (let i = 0; i < numSlices; i++) {
          const canvas = document.createElement('canvas');
          canvas.width = PANEL_WIDTH;
          canvas.height = PANEL_HEIGHT;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            const sx = startX + i * sliceSourceWidth;
            const sy = startY;

            ctx.drawImage(
              img,
              sx,
              sy,
              sliceSourceWidth,
              sHeight,
              0,
              0,
              PANEL_WIDTH,
              PANEL_HEIGHT
            );

            // Optional aesthetic numbering stamp
            if (addStamp) {
              const stampText = `${i + 1} / ${numSlices}`;
              ctx.save();
              ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              ctx.textAlign = 'right';
              ctx.textBaseline = 'bottom';

              const paddingX = 20;
              const paddingY = 10;
              const textMetrics = ctx.measureText(stampText);
              const pillW = textMetrics.width + paddingX * 2;
              const pillH = 46;
              const pillX = PANEL_WIDTH - 40 - pillW;
              const pillY = PANEL_HEIGHT - 40 - pillH;

              // Pill background
              ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
              ctx.beginPath();
              ctx.roundRect(pillX, pillY, pillW, pillH, 23);
              ctx.fill();

              // Text
              ctx.fillStyle = '#ffffff';
              ctx.fillText(stampText, PANEL_WIDTH - 40 - paddingX, PANEL_HEIGHT - 40 - paddingY);
              ctx.restore();
            }

            generated.push({
              index: i + 1,
              total: numSlices,
              dataUrl: canvas.toDataURL('image/png', 0.95),
              width: PANEL_WIDTH,
              height: PANEL_HEIGHT,
              orderLabel: `Slide ${i + 1} / ${numSlices}`,
            });
          }
        }
      } else {
        // Grid Feed: 3 columns x rows (up to 12 total tiles)
        const cols = 3;
        const totalTiles = cols * rows;

        // Calculate tile dimensions centered
        const targetTileW = PANEL_WIDTH;
        const targetTileH = PANEL_HEIGHT;
        const targetGridAspect = (cols * 4) / (rows * 5);
        const sourceAspect = img.width / img.height;

        let sWidth = 0;
        let sHeight = 0;
        let startX = 0;
        let startY = 0;

        if (sourceAspect > targetGridAspect) {
          sHeight = img.height;
          sWidth = img.height * targetGridAspect;
          startX = (img.width - sWidth) / 2;
          startY = 0;
        } else {
          sWidth = img.width;
          sHeight = img.width / targetGridAspect;
          startX = 0;
          startY = (img.height - sHeight) / 2;
        }

        const sliceSW = sWidth / cols;
        const sliceSH = sHeight / rows;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const canvas = document.createElement('canvas');
            canvas.width = targetTileW;
            canvas.height = targetTileH;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';

              const sx = startX + c * sliceSW;
              const sy = startY + r * sliceSH;

              ctx.drawImage(
                img,
                sx,
                sy,
                sliceSW,
                sliceSH,
                0,
                0,
                targetTileW,
                targetTileH
              );

              const tileIndex = r * cols + c + 1;
              const uploadOrder = totalTiles - tileIndex + 1;

              generated.push({
                index: tileIndex,
                total: totalTiles,
                dataUrl: canvas.toDataURL('image/png', 0.95),
                width: targetTileW,
                height: targetTileH,
                orderLabel: `Upload ke-${uploadOrder}`,
              });
            }
          }
        }
      }

      setSlices(generated);
      setIsProcessing(false);

      addHistoryItem({
        type: 'image',
        title: `Instagram Splitter: ${mode === 'carousel' ? `${numSlices} Slides Panorama` : `Grid 3x${rows}`} (${fileName})`,
        subtitle: `4:5 Portrait HD (${generated.length} bagian)`,
        downloadUrl: '#',
      });
    };
    img.src = src;
  };

  const handleModeChange = (newMode: SplitMode) => {
    setSplitMode(newMode);
    if (imageSrc) {
      renderSlices(imageSrc, newMode, carouselSlices, gridRows, showNumberStamp, imageFile?.name);
    }
  };

  const handleCarouselSlicesChange = (num: number) => {
    setCarouselSlices(num);
    if (imageSrc) {
      renderSlices(imageSrc, 'carousel', num, gridRows, showNumberStamp, imageFile?.name);
    }
  };

  const handleGridRowsChange = (rows: number) => {
    setGridRows(rows);
    if (imageSrc) {
      renderSlices(imageSrc, 'grid', carouselSlices, rows, showNumberStamp, imageFile?.name);
    }
  };

  const handleToggleStamp = () => {
    const next = !showNumberStamp;
    setShowNumberStamp(next);
    if (imageSrc) {
      renderSlices(imageSrc, splitMode, carouselSlices, gridRows, next, imageFile?.name);
    }
  };

  const handleDownloadZip = async () => {
    if (slices.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const folderName = splitMode === 'carousel'
        ? `IG_Panorama_${slices.length}Slices_4x5`
        : `IG_Grid_3x${gridRows}_4x5`;
      const folder = zip.folder(folderName);

      slices.forEach((slice, idx) => {
        const base64Data = slice.dataUrl.split(',')[1];
        const numStr = (idx + 1).toString().padStart(2, '0');
        folder?.file(`slide_${numStr}.png`, base64Data, { base64: true });
      });

      folder?.file(
        'PANDUAN_CAROUSEL_INSTAGRAM.txt',
        `PANDUAN UNGGAH CAROUSEL INSTAGRAM (RASIO 4:5 PORTRAIT):
1. Buka aplikasi Instagram di HP Anda, tekan tanda (+) untuk membuat postingan baru.
2. Pilih mode Carousel (Pilih Banyak Foto / Multi-Select).
3. Pilih file secara berurutan: slide_01.png, slide_02.png, hingga slide_${slices.length.toString().padStart(2, '0')}.png.
4. Pastikan rasio postingan di Instagram diatur ke potret (4:5) dengan menekan ikon sudut kiri bawah.
5. Unggah postingan! Hasil potongan akan menyambung presisi (seamless panorama) tanpa garis putus saat di-swipe oleh pengikut Anda.`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ig-panorama-${slices.length}slices.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation error:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSingle = (slice: SliceItem) => {
    const a = document.createElement('a');
    a.href = slice.dataUrl;
    const numStr = slice.index.toString().padStart(2, '0');
    a.download = `slide_${numStr}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 text-center hover:border-[var(--neo-border-active)] transition-colors cursor-pointer bg-[var(--neo-bg)] space-y-2"
      >
        <div className="w-12 h-12 mx-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-pink-500 shadow-neo">
          <Grid className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--neo-text)]">
            {imageFile ? imageFile.name : 'Pilih atau Tarik Foto Banner / Panorama'}
          </p>
          <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
            Mendukung hingga 12 potongan berasio potret terbaru Instagram (4:5, 1080×1350 piksel)
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

      {imageFile && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          {/* Controls: Mode & Slice Selection */}
          <div className="space-y-4 pb-4 border-b-2 border-[var(--neo-border)]">
            {/* Mode Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[var(--neo-text)] block">
                  Format Pemotongan Media:
                </span>
                <span className="text-[10px] text-[var(--neo-text-muted)]">
                  Standar Rasio Potret Instagram Terbaru (4:5 HD)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleModeChange('carousel')}
                  className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${splitMode === 'carousel'
                      ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)]'
                      : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)]'
                    }`}
                >
                  🎠 Panorama Carousel (1×N)
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('grid')}
                  className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${splitMode === 'grid'
                      ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)]'
                      : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)]'
                    }`}
                >
                  🔲 Grid Feed Profil (3×N)
                </button>
              </div>
            </div>

            {/* Carousel Slices Selector: 2 to 12 */}
            {splitMode === 'carousel' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--neo-text)] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-pink-500" />
                    Jumlah Potongan Carousel:
                  </span>
                  <span className="neo-badge bg-pink-500/10 text-pink-500 border-pink-500/40 text-xs font-bold font-mono px-2 py-0.5 rounded-full">
                    {carouselSlices} Bagian (1 × {carouselSlices})
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleCarouselSlicesChange(num)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold font-mono transition-all ${carouselSlices === num
                          ? 'bg-pink-600 text-white border-pink-700 shadow-sm'
                          : 'bg-[var(--neo-bg)] text-[var(--neo-text)] border-[var(--neo-border)] hover:bg-[var(--neo-surface)]'
                        }`}
                    >
                      {num} Slide
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Grid Rows Selector: 3x1 to 3x4 (up to 12) */
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--neo-text)] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-pink-500" />
                    Pilihan Grid Feed:
                  </span>
                  <span className="neo-badge bg-pink-500/10 text-pink-500 border-pink-500/40 text-xs font-bold font-mono px-2 py-0.5 rounded-full">
                    3 × {gridRows} ({3 * gridRows} Kotak Potret)
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { rows: 1, label: '3 × 1 (3 Foto)' },
                    { rows: 2, label: '3 × 2 (6 Foto)' },
                    { rows: 3, label: '3 × 3 (9 Foto Giant)' },
                    { rows: 4, label: '3 × 4 (12 Foto Kolosal)' },
                  ].map((opt) => (
                    <button
                      key={opt.rows}
                      type="button"
                      onClick={() => handleGridRowsChange(opt.rows)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${gridRows === opt.rows
                          ? 'bg-pink-600 text-white border-pink-700 shadow-sm'
                          : 'bg-[var(--neo-bg)] text-[var(--neo-text)] border-[var(--neo-border)] hover:bg-[var(--neo-surface)]'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Toggle Stamp Option */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-[var(--neo-text-muted)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Nomor Urut Slide Estetik di Sudut Foto (1/N, 2/N...):
              </span>
              <button
                type="button"
                onClick={handleToggleStamp}
                className={`px-3 py-1 rounded-full border text-[11px] font-bold transition-all ${showNumberStamp
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : 'bg-[var(--neo-bg)] text-[var(--neo-text-muted)] border-[var(--neo-border)]'
                  }`}
              >
                {showNumberStamp ? '✓ Aktif' : 'Nonaktif'}
              </button>
            </div>
          </div>

          {/* Guide Alert */}
          <div className="p-3.5 rounded-xl border-2 border-pink-500/40 bg-pink-500/10 text-xs text-[var(--neo-text)] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-pink-500">
                {splitMode === 'carousel'
                  ? 'Panduan Swipe Carousel Seamless (4:5 Potret):'
                  : 'Panduan Grid Feed Instagram:'}
              </p>
              <p className="text-[11px] leading-relaxed text-[var(--neo-text-muted)]">
                {splitMode === 'carousel'
                  ? 'Setiap panel dipotong dengan rasio potret 4:5 (1080×1350 piksel) yang menyambung presisi dari kiri ke kanan. Saat diunggah berurutan sebagai Carousel di Instagram, swipe antar foto terlihat menyatu tanpa jeda pemisah.'
                  : 'Unggah foto secara terbalik mulai dari nomor urut "Upload ke-1" (pojok kanan bawah) hingga "Upload terakhir" (pojok kiri atas) agar feed profil Instagram tersusun utuh.'}
              </p>
            </div>
          </div>

          {/* Slices Preview */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-mono text-[var(--neo-text-muted)]">
              <span>
                Pratinjau Hasil Potongan ({slices.length} Panel Potret 4:5):
              </span>
              <span className="neo-badge bg-[var(--neo-bg)] text-[var(--neo-text)] border border-[var(--neo-border)] text-[10px] px-2 py-0.5 rounded-md">
                Resolusi Render: 1080 × 1350 px
              </span>
            </div>

            {splitMode === 'carousel' ? (
              /* Carousel Horizontal Scrollable Gallery */
              <div className="flex gap-3 overflow-x-auto pb-3 pt-1 snap-x">
                {slices.map((slice) => (
                  <div
                    key={slice.index}
                    className="shrink-0 w-44 sm:w-52 rounded-xl overflow-hidden border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] shadow-neo flex flex-col justify-between group snap-start"
                  >
                    <div className="relative aspect-[4/5] bg-neutral-900 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slice.dataUrl}
                        alt={slice.orderLabel}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 neo-badge bg-black/85 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-white/20">
                        {slice.orderLabel}
                      </span>
                      <span className="absolute top-2 right-2 neo-badge bg-pink-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        4:5
                      </span>
                    </div>

                    <div className="p-2.5 bg-[var(--neo-surface)] border-t border-[var(--neo-border)]">
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(slice)}
                        className="w-full neo-btn neo-btn-secondary py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Slide Ini</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Grid Layout Preview */
              <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] max-w-lg mx-auto">
                {slices.map((slice) => (
                  <div
                    key={slice.index}
                    onClick={() => handleDownloadSingle(slice)}
                    className="relative aspect-[4/5] rounded-xl overflow-hidden border-2 border-[var(--neo-border)] shadow-neo group cursor-pointer hover:border-pink-500 transition-all"
                    title={`Klik untuk Download Potongan #${slice.index}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slice.dataUrl}
                      alt={`Tile ${slice.index}`}
                      className="w-full h-full object-cover block"
                    />

                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white font-mono text-[9px] font-bold">
                      #{slice.index}
                    </div>

                    <div className="absolute bottom-1.5 inset-x-1.5 px-1 py-0.5 rounded bg-pink-600/90 text-white text-[9px] font-bold text-center truncate">
                      {slice.orderLabel}
                    </div>

                    <div className="absolute inset-0 bg-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Download className="w-5 h-5 text-white drop-shadow" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action: Download All Slices in ZIP */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isZipping || slices.length === 0}
              className="neo-btn neo-btn-primary w-full py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-neo"
            >
              <FileArchive className="w-4 h-4" />
              <span>
                {isZipping
                  ? 'Mengemas File ZIP...'
                  : `Download Seluruh Potongan (${slices.length} Foto 4:5 HD) dalam 1 File .ZIP`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
