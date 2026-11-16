'use client';

import React, { useState } from 'react';
import {
  Stamp,
  Upload,
  Download,
  FileText,
  Sliders,
  Check,
  RefreshCw,
  Sparkles,
  Layers,
  Info,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

type NumberPosition = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-center';

export default function PdfPageNumberProtector() {
  const { addHistory } = useAppStore();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState('');
  const [pageCount, setPageCount] = useState(0);

  // Stamping Options
  const [numberFormat, setNumberFormat] = useState<'id-formal' | 'slash' | 'hyphen' | 'en-formal'>('id-formal');
  const [position, setPosition] = useState<NumberPosition>('bottom-center');
  const [skipFirstPage, setSkipFirstPage] = useState(true);
  const [fontSize, setFontSize] = useState(10);
  const [offsetY, setOffsetY] = useState(24);
  const [textColor, setTextColor] = useState<'black' | 'gray' | 'blue'>('black');

  // Custom Header & Footer Text
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle PDF file select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setErrorMsg('Harap pilih file dokumen berformat PDF.');
      return;
    }

    setErrorMsg('');
    setPdfFile(file);
    setPdfName(file.name);

    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setPageCount(pdfDoc.getPageCount());
    } catch (err: any) {
      console.error('Failed to parse PDF:', err);
      setErrorMsg('Gagal memuat dokumen PDF. Pastikan file tidak terkunci password.');
    }
  };

  // Stamp PDF and trigger download
  const handleStampPdf = async () => {
    if (!pdfFile) return;

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const pages = pdfDoc.getPages();
      const total = pages.length;

      // Color mapping
      const colorVal =
        textColor === 'gray'
          ? rgb(0.4, 0.4, 0.4)
          : textColor === 'blue'
          ? rgb(0.1, 0.2, 0.6)
          : rgb(0.1, 0.1, 0.1);

      pages.forEach((page, index) => {
        const pageNum = index + 1;

        // Skip cover page if enabled
        if (skipFirstPage && pageNum === 1) return;

        const { width, height } = page.getSize();

        // Format page string
        let pageStr = '';
        if (numberFormat === 'id-formal') {
          pageStr = `Halaman ${pageNum} dari ${total}`;
        } else if (numberFormat === 'slash') {
          pageStr = `${pageNum} / ${total}`;
        } else if (numberFormat === 'hyphen') {
          pageStr = `- ${pageNum} -`;
        } else {
          pageStr = `Page ${pageNum} of ${total}`;
        }

        const textWidth = font.widthOfTextAtSize(pageStr, fontSize);

        // Compute X & Y coordinate for page number
        let x = (width - textWidth) / 2;
        let y = offsetY;

        if (position === 'bottom-right') {
          x = width - textWidth - 36;
          y = offsetY;
        } else if (position === 'bottom-left') {
          x = 36;
          y = offsetY;
        } else if (position === 'top-center') {
          x = (width - textWidth) / 2;
          y = height - offsetY;
        } else if (position === 'top-right') {
          x = width - textWidth - 36;
          y = height - offsetY;
        }

        page.drawText(pageStr, {
          x,
          y,
          size: fontSize,
          font,
          color: colorVal,
        });

        // Optional custom header
        if (headerText.trim()) {
          const headerWidth = font.widthOfTextAtSize(headerText.trim(), fontSize - 1);
          page.drawText(headerText.trim(), {
            x: width - headerWidth - 36,
            y: height - offsetY,
            size: fontSize - 1,
            font,
            color: rgb(0.5, 0.5, 0.5),
          });
        }

        // Optional custom footer
        if (footerText.trim()) {
          page.drawText(footerText.trim(), {
            x: 36,
            y: offsetY,
            size: fontSize - 1,
            font,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
      });

      const modifiedBytes = await pdfDoc.save();
      const blob = new Blob([modifiedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `numbered-${pdfName}`;
      a.click();
      URL.revokeObjectURL(url);

      addHistory({
        title: `PDF Numbered: ${pdfName}`,
        toolName: 'PDF Number Stamper & Header/Footer',
        category: 'docs',
        details: `${total} Halaman (${numberFormat})`,
      });

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error stamping PDF:', err);
      setErrorMsg('Gagal membubuhi nomor halaman pada PDF.');
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
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border-2 border-sky-500 flex items-center justify-center text-sky-500">
              <Stamp className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-text">PDF Number Stamper & Header/Footer</h1>
                <span className="px-2 py-0.5 text-xs font-bold bg-sky-500/20 text-sky-600 rounded-full border border-sky-500/30">
                  Stamper Otomatis
                </span>
              </div>
              <p className="text-sm text-text-muted mt-1">
                Bubuhi nomor halaman resmi (Halaman X dari Y) & stempel teks header/footer pada seluruh dokumen PDF tanpa merusak susunan teks.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-bold text-text">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span>Presisi Font Asli PDF</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Config */}
        <div className="lg:col-span-5 space-y-5">
          {/* Format Penomoran */}
          <div className="card-brutal p-5 bg-surface space-y-3">
            <label className="text-xs font-bold text-text uppercase tracking-wider block">Format Nomor</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'id-formal', label: 'Halaman 1 dari 10', desc: 'Standar Dokumen Resmi' },
                { id: 'slash', label: '1 / 10', desc: 'Minimalis Ringkas' },
                { id: 'hyphen', label: '- 1 -', desc: 'Buku Klasik' },
                { id: 'en-formal', label: 'Page 1 of 10', desc: 'Internasional' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setNumberFormat(f.id as any)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    numberFormat === f.id
                      ? 'bg-sky-500/15 border-sky-500 text-text'
                      : 'bg-surface-elevated border-border text-text-muted'
                  }`}
                >
                  <div className="text-xs font-black text-text">{f.label}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Posisi Nomor */}
          <div className="card-brutal p-5 bg-surface space-y-3">
            <label className="text-xs font-bold text-text uppercase tracking-wider block">Posisi Nomor Halaman</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bottom-center', label: 'Bawah Tengah' },
                { id: 'bottom-right', label: 'Bawah Kanan' },
                { id: 'bottom-left', label: 'Bawah Kiri' },
                { id: 'top-center', label: 'Atas Tengah' },
                { id: 'top-right', label: 'Atas Kanan' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPosition(p.id as any)}
                  className={`py-2 px-2 text-center rounded-xl border-2 text-xs font-bold transition-all ${
                    position === p.id
                      ? 'bg-sky-500 text-white border-black font-black'
                      : 'bg-surface-elevated border-border text-text'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 pt-2 text-xs font-bold text-text cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipFirstPage}
                onChange={(e) => setSkipFirstPage(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 border-border"
              />
              Lewati Halaman 1 (Cover / Sampul)
            </label>
          </div>

          {/* Header & Footer Text */}
          <div className="card-brutal p-5 bg-surface space-y-3">
            <label className="text-xs font-bold text-text uppercase tracking-wider block">
              Teks Header & Footer (Opsional)
            </label>
            <div>
              <span className="text-[11px] font-bold text-text-muted block mb-1">Header Atas (Kanan)</span>
              <input
                type="text"
                placeholder="Contoh: DOKUMEN RAHASIA..."
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface text-text text-xs font-bold focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-text-muted block mb-1">Footer Bawah (Kiri)</span>
              <input
                type="text"
                placeholder="Contoh: Hak Cipta Dilindungi..."
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface text-text text-xs font-bold focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Size & Offset Sliders */}
          <div className="card-brutal p-5 bg-surface space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-text-muted">Ukuran Huruf (Font Size)</span>
                <span className="text-text font-black">{fontSize}pt</span>
              </div>
              <input
                type="range"
                min="8"
                max="16"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-text-muted">Jarak Margin dari Tepi</span>
                <span className="text-text font-black">{offsetY}pt</span>
              </div>
              <input
                type="range"
                min="12"
                max="60"
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: File Upload & Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-brutal p-5 bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-text uppercase tracking-wider">
                Dokumen PDF yang Diproses
              </span>
              {pageCount > 0 && (
                <span className="text-xs font-mono font-bold text-sky-600 bg-sky-500/10 px-2.5 py-1 rounded-lg">
                  {pageCount} Halaman Ditemukan
                </span>
              )}
            </div>

            {!pdfFile ? (
              <label className="flex flex-col items-center justify-center p-14 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-sky-500 transition-colors bg-surface-elevated/40 text-center group">
                <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border-2 border-sky-500 flex items-center justify-center text-sky-500 group-hover:scale-105 transition-transform mb-3">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="text-base font-black text-text">Pilih atau Seret File PDF</div>
                <div className="text-xs text-text-muted mt-1 max-w-sm">
                  Format didukung: Dokumen PDF resmi, skripsi, laporan, e-book, atau proposal.
                </div>
                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
              </label>
            ) : (
              <div className="space-y-4">
                {/* File info card */}
                <div className="p-4 rounded-xl border-2 border-border bg-surface-elevated/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-text truncate max-w-xs">{pdfName}</div>
                      <div className="text-[11px] text-text-muted">
                        Total {pageCount} Halaman | {skipFirstPage ? `${pageCount - 1} halaman bernomor` : 'Semua halaman bernomor'}
                      </div>
                    </div>
                  </div>

                  <label className="text-xs font-bold text-sky-600 cursor-pointer hover:underline flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Ganti PDF
                    <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>

                {/* Simulated Sheet Preview */}
                <div className="relative border-2 border-black bg-white rounded-xl p-8 min-h-[300px] flex flex-col justify-between shadow-sm">
                  {/* Header stamp preview */}
                  <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono border-b border-stone-200 pb-2">
                    <span>{pdfName}</span>
                    <span className="font-bold text-stone-600">{headerText || 'Header Kanan'}</span>
                  </div>

                  {/* Body mock lines */}
                  <div className="space-y-3 py-6 px-4 opacity-25">
                    <div className="h-3 bg-stone-300 rounded w-3/4" />
                    <div className="h-3 bg-stone-300 rounded w-full" />
                    <div className="h-3 bg-stone-300 rounded w-5/6" />
                    <div className="h-3 bg-stone-300 rounded w-2/3" />
                  </div>

                  {/* Footer & Page stamp preview */}
                  <div className="flex justify-between items-center text-[10px] text-stone-500 font-mono border-t border-stone-200 pt-2">
                    <span>{footerText || 'Footer Kiri'}</span>
                    <span className="font-bold text-stone-900 bg-sky-100 px-2 py-0.5 rounded border border-sky-300">
                      {numberFormat === 'id-formal'
                        ? 'Halaman 2 dari ' + (pageCount || 10)
                        : numberFormat === 'slash'
                        ? '2 / ' + (pageCount || 10)
                        : numberFormat === 'hyphen'
                        ? '- 2 -'
                        : 'Page 2 of ' + (pageCount || 10)}
                    </span>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-bold rounded-xl">
                    {errorMsg}
                  </div>
                )}

                {/* Stamping Button */}
                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={handleStampPdf}
                    disabled={isProcessing}
                    className="btn-primary py-3 px-6 text-sm font-black flex items-center gap-2 bg-sky-500 hover:bg-sky-600 border-2 border-black"
                  >
                    {downloadSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        Tersimpan di Download!
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Bubuhi Nomor & Unduh PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface-elevated/50 flex items-start gap-3 text-xs text-text-muted">
            <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-text block mb-0.5">Struktur Asli PDF Terjaga</strong>
              Penomoran dibubuhkan secara langsung ke layer vektor PDF tanpa melakukan rasterisasi gambar, sehingga
              kualitas teks dokumen tetap tajam dan ukuran file tetap ramping.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
