'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { Upload, Copy, Download, FileText, Check, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

export const OcrScanner: React.FC = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setActiveToolSlug, setPdfStudioContent, addHistoryItem } = useAppStore();

  const handleFile = (file: File) => {
    setImageFile(file);
    setExtractedText('');
    setError(null);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Support paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            const blob = items[i].getAsFile();
            if (blob) handleFile(blob);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const runOcr = async () => {
    if (!imagePreview) return;

    setLoading(true);
    setProgress(15);
    setStage('Memuat engine OCR Tesseract...');
    setError(null);

    try {
      const worker = await createWorker('eng+ind', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const p = Math.round(m.progress * 100);
            setProgress(Math.max(25, p));
            setStage(`Mengenali karakter teks: ${p}%...`);
          }
        },
      });

      const ret = await worker.recognize(imagePreview);
      await worker.terminate();

      const resultText = ret.data.text.trim();
      setExtractedText(resultText || 'Tidak ada teks yang dapat dikenali pada gambar.');
      setProgress(100);
      setStage('Ekstraksi teks selesai!');

      addHistoryItem({
        type: 'ocr',
        title: imageFile?.name ? `OCR: ${imageFile.name}` : 'OCR Catatan Teks',
        subtitle: `${resultText.split(/\s+/).length} kata terdeteksi`,
      });
    } catch (err: any) {
      console.error('OCR Error:', err);
      // Fallback clean extraction message
      setExtractedText('Gagal memproses gambar dengan engine OCR. Pastikan resolusi gambar jelas.');
      setError('Terjadi kendala saat membaca teks.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${imageFile?.name.replace(/\.[^/.]+$/, '') || 'ocr_result'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInPdfStudio = () => {
    setPdfStudioContent(`<p>${extractedText.replace(/\n/g, '<br />')}</p>`);
    setActiveToolSlug('pdf-studio');
  };

  return (
    <div className="space-y-5">
      {/* Upload & Paste Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 sm:p-8 text-center cursor-pointer hover:border-[var(--neo-border-active)] bg-[var(--neo-bg)] transition-colors select-none"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--neo-accent)] text-[var(--neo-accent-text)] flex items-center justify-center mb-3">
          <Upload className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-sm text-[var(--neo-text)]">
          {imageFile ? imageFile.name : 'Pilih Foto, Tarik Berkas, atau Tekan Ctrl+V (Paste Gambar)'}
        </h4>
        <p className="text-xs text-[var(--neo-text-muted)] mt-1 font-mono">
          Mendukung scan catatan, struk belanja, dokumen fisik, dan screenshot
        </p>
      </div>

      {/* Start OCR Trigger */}
      {imagePreview && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={runOcr}
            disabled={loading}
            className="neo-btn neo-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Sedang Membaca Gambar...' : 'Ekstrak Teks Sekarang'}</span>
          </button>
        </div>
      )}

      {/* Animated Process Card */}
      {(loading || (progress > 0 && progress < 100)) && (
        <ProcessCard
          stage={stage}
          progress={progress}
          speed="21.5 KB/s"
          eta="00:03"
          isCompleted={progress === 100}
          error={error}
        />
      )}

      {/* Result Display: Side by Side */}
      {extractedText && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--neo-border)]">
            <span className="neo-badge bg-emerald-500/10 text-emerald-500 border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" /> Teks Berhasil Diekstrak
            </span>
            <span className="text-xs font-mono font-bold text-[var(--neo-text)]">
              {extractedText.length} Karakter
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Image */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--neo-text-muted)]">
                Foto Dokumen Asli:
              </span>
              <div className="h-64 sm:h-80 rounded-xl border-2 border-[var(--neo-border)] overflow-hidden bg-black/10 p-2 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview!}
                  alt="Original Capture"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            {/* Extracted Editable Text */}
            <div className="space-y-1.5 flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--neo-text-muted)]">
                Hasil Ekstraksi Teks (Bisa Diedit):
              </span>
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                className="flex-1 min-h-[250px] p-3.5 rounded-xl neo-input text-xs font-mono leading-relaxed"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t-2 border-[var(--neo-border)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="neo-btn neo-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Teks Disalin!' : 'Salin Teks'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="neo-btn neo-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .TXT</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenInPdfStudio}
              className="neo-btn neo-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Buka & Edit di PDF Studio →</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
