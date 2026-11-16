'use client';

import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import {
  Upload,
  Download,
  Grid,
  CheckCircle2,
  FileArchive,
  ArrowDown,
  Info,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

type GridType = '3x1' | '3x2' | '3x3';

interface TileSlice {
  index: number;
  uploadOrder: number;
  dataUrl: string;
  row: number;
  col: number;
}

export const IgGridSplitter: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [gridType, setGridType] = useState<GridType>('3x3');
  const [tiles, setTiles] = useState<TileSlice[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addHistoryItem } = useAppStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    sliceImage(file, gridType);
  };

  const handleGridChange = (type: GridType) => {
    setGridType(type);
    if (imageFile) {
      sliceImage(imageFile, type);
    }
  };

  // Slice image into exact grid tiles
  const sliceImage = (file: File, type: GridType) => {
    setIsProcessing(true);
    setTiles([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const cols = 3;
        const rows = type === '3x1' ? 1 : type === '3x2' ? 2 : 3;
        const totalTiles = cols * rows;

        // Calculate tile dimensions based on center crop
        const targetTileSize = Math.floor(Math.min(img.width / cols, img.height / rows));
        const totalW = targetTileSize * cols;
        const totalH = targetTileSize * rows;
        const startX = Math.floor((img.width - totalW) / 2);
        const startY = Math.floor((img.height - totalH) / 2);

        const generatedTiles: TileSlice[] = [];

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const tileCanvas = document.createElement('canvas');
            tileCanvas.width = targetTileSize;
            tileCanvas.height = targetTileSize;
            const ctx = tileCanvas.getContext('2d');

            if (ctx) {
              const srcX = startX + c * targetTileSize;
              const srcY = startY + r * targetTileSize;

              ctx.drawImage(
                img,
                srcX,
                srcY,
                targetTileSize,
                targetTileSize,
                0,
                0,
                targetTileSize,
                targetTileSize
              );

              const tileIndex = r * cols + c + 1; // 1 to totalTiles
              // In Instagram, the earliest uploaded post ends up at bottom-right,
              // so upload in reverse order (Tile N -> Tile 1)
              const uploadOrder = totalTiles - tileIndex + 1;

              generatedTiles.push({
                index: tileIndex,
                uploadOrder,
                dataUrl: tileCanvas.toDataURL('image/png', 1.0),
                row: r,
                col: c,
              });
            }
          }
        }

        setTiles(generatedTiles);
        setIsProcessing(false);

        addHistoryItem({
          toolId: 'ig-grid-splitter',
          toolName: 'Instagram Grid Splitter',
          title: `Split ${type} (${file.name})`,
          type: 'image',
          downloadUrl: '#',
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Download all slices zipped into a single .zip archive
  const handleDownloadZip = async () => {
    if (tiles.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder(`Instagram_Grid_${gridType}`);

      tiles.forEach((t) => {
        // Strip data:image/png;base64,
        const base64Data = t.dataUrl.split(',')[1];
        folder?.file(`Tile_${t.index}_Upload_Ke_${t.uploadOrder}.png`, base64Data, { base64: true });
      });

      // Include instructions text file in zip
      folder?.file(
        'PANDUAN_UPLOAD_INSTAGRAM.txt',
        `PANDUAN UPLOAD GRID INSTAGRAM:
1. Mulai upload dari foto dengan nomor "Upload_Ke_1" (Tile #${tiles.length}) terlebih dahulu.
2. Lanjutkan dengan "Upload_Ke_2", "Upload_Ke_3", dan seterusnya hingga "Upload_Ke_${tiles.length}" (Tile #1) sebagai post terakhir.
3. Buka profil Instagram Anda, dan foto akan tersusun sempurna membentuk satu gambar besar utuh!`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Instagram_Grid_${gridType}_${imageFile?.name ? imageFile.name.replace(/\.[^/.]+$/, '') : 'Photo'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation failed:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSingleTile = (tile: TileSlice) => {
    const a = document.createElement('a');
    a.href = tile.dataUrl;
    a.download = `Tile_${tile.index}_Upload_Ke_${tile.uploadOrder}.png`;
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
        <div className="w-12 h-12 mx-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-pink-500 shadow-neo">
          <Grid className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--neo-text)]">
            {imageFile ? imageFile.name : 'Pilih atau Tarik Foto Banner / Panorama'}
          </p>
          <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
            Potong foto menjadi grid 3x1, 3x2, atau 3x3 rapi untuk feed profil Instagram
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
          {/* Format Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-[var(--neo-border)]">
            <span className="text-xs font-bold text-[var(--neo-text)]">Pilih Format Potongan Grid:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleGridChange('3x1')}
                className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  gridType === '3x1'
                    ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)]'
                    : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)]'
                }`}
              >
                3 x 1 (Panorama 3 Kotak)
              </button>
              <button
                type="button"
                onClick={() => handleGridChange('3x2')}
                className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  gridType === '3x2'
                    ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)]'
                    : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)]'
                }`}
              >
                3 x 2 (6 Kotak)
              </button>
              <button
                type="button"
                onClick={() => handleGridChange('3x3')}
                className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${
                  gridType === '3x3'
                    ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)]'
                    : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)]'
                }`}
              >
                3 x 3 (Giant Grid 9 Kotak)
              </button>
            </div>
          </div>

          {/* Guide Alert: Upload Order Explanation */}
          <div className="p-3.5 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 text-xs text-[var(--neo-text)] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-amber-500">Urutan Upload ke Instagram:</p>
              <p className="text-[11px] leading-relaxed text-[var(--neo-text-muted)]">
                Feed Instagram menampilkan postingan terbaru di kiri atas. Agar puzzle gambar tersusun utuh, mulailah mengunggah dari potongan bertanda <strong>Upload ke-1 (pojok kanan bawah)</strong> hingga berakhir di <strong>Upload terakhir (pojok kiri atas)</strong>.
              </p>
            </div>
          </div>

          {/* Sliced Grid Interactive Preview */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono text-[var(--neo-text-muted)]">
              <span>Preview Lembaran Potongan Grid ({tiles.length} Kotak):</span>
              <span>Klik pada kotak untuk unduh satuan</span>
            </div>

            <div
              className={`grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] max-w-md mx-auto`}
            >
              {tiles.map((tile) => (
                <div
                  key={tile.index}
                  onClick={() => handleDownloadSingleTile(tile)}
                  className="relative aspect-square rounded-xl overflow-hidden border-2 border-[var(--neo-border)] shadow-neo group cursor-pointer hover:border-pink-500 transition-all"
                  title={`Klik untuk Download Potongan #${tile.index}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tile.dataUrl}
                    alt={`Tile ${tile.index}`}
                    className="w-full h-full object-cover block"
                  />

                  {/* Tile Number Badge & Upload Sequence */}
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white font-mono text-[10px] font-bold">
                    #{tile.index}
                  </div>

                  <div className="absolute bottom-1.5 inset-x-1.5 px-1 py-0.5 rounded bg-pink-600/90 text-white text-[9px] font-bold text-center truncate">
                    Upload ke-{tile.uploadOrder}
                  </div>

                  <div className="absolute inset-0 bg-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Download className="w-5 h-5 text-white drop-shadow" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action: Download All in ZIP */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isZipping || tiles.length === 0}
              className="neo-btn neo-btn-primary w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <FileArchive className="w-4 h-4" />
              <span>{isZipping ? 'Mengemas File ZIP...' : `Download Seluruh Potongan (${tiles.length} Foto) dalam 1 File .ZIP`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
