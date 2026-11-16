'use client';

import React, { useState, useRef } from 'react';
import ExifReader from 'exifreader';
import { Shield, ShieldAlert, ShieldCheck, Upload, Download, Eye, CheckCircle2, FileImage } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface ExifSummary {
  make?: string;
  model?: string;
  software?: string;
  dateTime?: string;
  gps?: string;
  iso?: string;
  exposure?: string;
  fNumber?: string;
  dimensions?: string;
  fileSize: string;
  mimeType: string;
}

export const ExifRemover: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ExifSummary | null>(null);
  const [hasExif, setHasExif] = useState(false);

  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanedUrl, setCleanedUrl] = useState<string | null>(null);
  const [cleanedSize, setCleanedSize] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addHistoryItem } = useAppStore();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setFile(uploaded);
    setCleanedUrl(null);

    const objectUrl = URL.createObjectURL(uploaded);
    setPreviewUrl(objectUrl);

    try {
      const tags = await ExifReader.load(uploaded);
      let foundExif = false;

      const summary: ExifSummary = {
        fileSize: formatBytes(uploaded.size),
        mimeType: uploaded.type || 'image/jpeg',
      };

      if (tags['Make']?.description) {
        summary.make = tags['Make'].description;
        foundExif = true;
      }
      if (tags['Model']?.description) {
        summary.model = tags['Model'].description;
        foundExif = true;
      }
      if (tags['Software']?.description) {
        summary.software = tags['Software'].description;
        foundExif = true;
      }
      if (tags['DateTimeOriginal']?.description || tags['DateTime']?.description) {
        summary.dateTime = tags['DateTimeOriginal']?.description || tags['DateTime']?.description;
        foundExif = true;
      }
      if (tags['GPSLatitude'] && tags['GPSLongitude']) {
        summary.gps = `${tags['GPSLatitude'].description}, ${tags['GPSLongitude'].description}`;
        foundExif = true;
      }
      if (tags['ISOSpeedRatings']?.description) summary.iso = `ISO ${tags['ISOSpeedRatings'].description}`;
      if (tags['ExposureTime']?.description) summary.exposure = tags['ExposureTime'].description;
      if (tags['FNumber']?.description) summary.fNumber = `f/${tags['FNumber'].description}`;
      if (tags['Image Width'] && tags['Image Height']) {
        summary.dimensions = `${tags['Image Width'].description} × ${tags['Image Height'].description} px`;
      }

      setMetadata(summary);
      setHasExif(foundExif);
    } catch {
      setMetadata({
        fileSize: formatBytes(uploaded.size),
        mimeType: uploaded.type,
      });
      setHasExif(false);
    }
  };

  // Strip all EXIF by re-rendering pure pixels onto an HTML5 Canvas
  const handleCleanExif = () => {
    if (!previewUrl || !file) return;

    setIsCleaning(true);
    const img = new Image();
    img.src = previewUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const cleanUrl = URL.createObjectURL(blob);
            setCleanedUrl(cleanUrl);
            setCleanedSize(blob.size);
            setIsCleaning(false);

            addHistoryItem({
              type: 'image',
              title: `EXIF Sanitized: ${file.name}`,
              subtitle: `Metadata dibersihkan (${formatBytes(blob.size)})`,
              downloadUrl: cleanUrl,
            });
          }
        },
        'image/jpeg',
        0.95
      );
    };
  };

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
          {file ? file.name : 'Pilih atau Tarik Foto (JPG, PNG, WEBP) ke Sini'}
        </h4>
        <p className="text-xs text-[var(--neo-text-muted)] mt-1 font-mono">
          Periksa data kamera, lokasi GPS, waktu pemotretan, dan bersihkan privasi foto
        </p>
      </div>

      {/* Detected Metadata Summary */}
      {metadata && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--neo-border)]">
            <div className="flex items-center gap-2">
              {hasExif ? (
                <span className="neo-badge bg-rose-500/10 text-rose-500 border-rose-500/40">
                  <ShieldAlert className="w-3.5 h-3.5" /> Terdeteksi Metadata Sensitif
                </span>
              ) : (
                <span className="neo-badge bg-emerald-500/10 text-emerald-500 border-emerald-500/40">
                  <ShieldCheck className="w-3.5 h-3.5" /> Bersih / Sedikit Metadata
                </span>
              )}
            </div>
            <span className="text-xs font-mono font-bold text-[var(--neo-text-muted)]">
              {metadata.fileSize}
            </span>
          </div>

          {/* Metadata Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex justify-between">
              <span className="font-bold text-[var(--neo-text-muted)]">Perangkat / Kamera:</span>
              <span className="font-bold text-[var(--neo-text)]">{metadata.model || metadata.make || 'Tidak Tercatat'}</span>
            </div>

            <div className="p-2.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex justify-between">
              <span className="font-bold text-[var(--neo-text-muted)]">Waktu Pemotretan:</span>
              <span className="font-bold text-[var(--neo-text)] font-mono">{metadata.dateTime || 'Tidak Tercatat'}</span>
            </div>

            <div className="p-2.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex justify-between">
              <span className="font-bold text-[var(--neo-text-muted)]">Koordinat Lokasi GPS:</span>
              <span className="font-bold text-rose-500 font-mono">{metadata.gps || 'Tidak Ada GPS'}</span>
            </div>

            <div className="p-2.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex justify-between">
              <span className="font-bold text-[var(--neo-text-muted)]">Dimensi Gambar:</span>
              <span className="font-bold text-[var(--neo-text)] font-mono">{metadata.dimensions || 'Resolusi Asli'}</span>
            </div>

            <div className="p-2.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex justify-between">
              <span className="font-bold text-[var(--neo-text-muted)]">Format MIME:</span>
              <span className="font-bold text-[var(--neo-text)] font-mono">{metadata.mimeType}</span>
            </div>

            <div className="p-2.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex justify-between">
              <span className="font-bold text-[var(--neo-text-muted)]">Software / Editor:</span>
              <span className="font-bold text-[var(--neo-text)]">{metadata.software || 'Original Device'}</span>
            </div>
          </div>

          {/* Trigger Clean EXIF */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleCleanExif}
              disabled={isCleaning}
              className="neo-btn neo-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold"
            >
              <Shield className="w-4 h-4" />
              <span>{isCleaning ? 'Membersihkan Piksel...' : 'Hapus Semua Metadata & Bersihkan Foto'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cleaned Result Preview */}
      {cleanedUrl && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--neo-border)]">
            <span className="neo-badge bg-emerald-500/10 text-emerald-500 border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" /> Foto Bebas Metadata Siap Diunduh
            </span>
            <span className="text-xs font-mono font-bold text-[var(--neo-text)]">
              Ukuran Bersih: {formatBytes(cleanedSize)}
            </span>
          </div>

          <div className="h-64 sm:h-72 rounded-xl border-2 border-emerald-500/50 overflow-hidden bg-black/10 p-2 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cleanedUrl}
              alt="Sanitized Result"
              className="max-h-full max-w-full object-contain mx-auto"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t-2 border-[var(--neo-border)]">
            <p className="text-xs text-[var(--neo-text-muted)] font-mono">
              Seluruh tag EXIF, GPS, dan data perangkat telah dihapus 100%.
            </p>

            <a
              href={cleanedUrl}
              download={`${file?.name.replace(/\.[^/.]+$/, '')}_clean.jpg`}
              className="neo-btn neo-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              <span>Download Foto Bersih</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
