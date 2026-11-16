'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  FileText,
  Upload,
  Download,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Layers,
  Scissors,
  PenTool,
  CheckCircle2,
  Eye,
  RefreshCw,
  Stamp,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

type PdfSubTool = 'merge' | 'split' | 'sign';

export const PdfMergeSplitSign: React.FC = () => {
  const [activeSub, setActiveSub] = useState<PdfSubTool>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState('Dokumen.pdf');

  // --- MERGE STATE ---
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  // --- SPLIT STATE ---
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitPageCount, setSplitPageCount] = useState<number>(0);
  const [splitRange, setSplitRange] = useState<string>('1');
  const splitInputRef = useRef<HTMLInputElement>(null);

  // --- SIGNATURE STATE ---
  const [signFile, setSignFile] = useState<File | null>(null);
  const [signPageCount, setSignPageCount] = useState<number>(1);
  const [signTargetPage, setSignTargetPage] = useState<number>(1);
  const [inkColor, setInkColor] = useState<string>('#121212');
  const [stampText, setStampText] = useState<string>('');

  const signInputRef = useRef<HTMLInputElement>(null);
  const signCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const { addHistoryItem } = useAppStore();

  // Signature canvas drawing handlers
  useEffect(() => {
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [inkColor]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSignatureCanvas = () => {
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const applyTextStamp = (text: string, color: string) => {
    const canvas = signCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    clearSignatureCanvas();
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;

    // Draw Stamp Border Box
    ctx.strokeRect(40, 30, 220, 60);

    // Draw Stamp Text
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 150, 60);
    ctx.restore();
  };

  // --- 1. HANDLE MERGE PDF ---
  const handleMergeFilesAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setMergeFiles((prev) => [...prev, ...files]);
      setResultPdfUrl(null);
    }
  };

  const handleExecuteMerge = async () => {
    if (mergeFiles.length < 2) return;

    setIsProcessing(true);
    setProgress(20);
    setResultPdfUrl(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < mergeFiles.length; i++) {
        const fileBytes = await mergeFiles[i].arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        setProgress(20 + Math.round(((i + 1) / mergeFiles.length) * 60));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setResultPdfUrl(url);
      setResultFileName(`Merged_Document_${mergeFiles.length}_Files.pdf`);
      setProgress(100);

      addHistoryItem({
        toolId: 'pdf-merge-split-sign',
        toolName: 'PDF Merge Studio',
        title: `Gabung ${mergeFiles.length} Dokumen PDF`,
        type: 'pdf',
        downloadUrl: url,
      });
    } catch (err) {
      console.error('PDF Merge Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 2. HANDLE SPLIT PDF ---
  const handleSplitFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSplitFile(file);
    setResultPdfUrl(null);

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      setSplitPageCount(pdf.getPageCount());
      setSplitRange(`1-${Math.min(3, pdf.getPageCount())}`);
    } catch (err) {
      console.error('PDF Load Error:', err);
    }
  };

  const handleExecuteSplit = async () => {
    if (!splitFile) return;

    setIsProcessing(true);
    setProgress(30);
    setResultPdfUrl(null);

    try {
      const bytes = await splitFile.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const totalPages = pdf.getPageCount();

      // Parse range: e.g. "1-3" or "1, 2, 4"
      const pagesToExtract: number[] = [];
      const parts = splitRange.split(',');

      parts.forEach((p) => {
        const trimmed = p.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim(), 10));
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= totalPages) pagesToExtract.push(i - 1);
            }
          }
        } else {
          const pageNum = parseInt(trimmed, 10);
          if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            pagesToExtract.push(pageNum - 1);
          }
        }
      });

      const uniquePages = Array.from(new Set(pagesToExtract)).sort((a, b) => a - b);
      if (uniquePages.length === 0) {
        alert('Rentang halaman tidak valid.');
        setIsProcessing(false);
        return;
      }

      setProgress(60);
      const splitPdf = await PDFDocument.create();
      const copiedPages = await splitPdf.copyPages(pdf, uniquePages);
      copiedPages.forEach((page) => splitPdf.addPage(page));

      const splitBytes = await splitPdf.save();
      const blob = new Blob([splitBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setResultPdfUrl(url);
      setResultFileName(`Extracted_Pages_${splitRange.replace(/\s+/g, '')}.pdf`);
      setProgress(100);

      addHistoryItem({
        toolId: 'pdf-merge-split-sign',
        toolName: 'PDF Split Studio',
        title: `Ekstrak Halaman ${splitRange} (${splitFile.name})`,
        type: 'pdf',
        downloadUrl: url,
      });
    } catch (err) {
      console.error('PDF Split Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 3. HANDLE SIGNATURE / STAMP PDF ---
  const handleSignFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSignFile(file);
    setResultPdfUrl(null);

    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      setSignPageCount(pdf.getPageCount());
      setSignTargetPage(pdf.getPageCount()); // default to last page for signature
    } catch (err) {
      console.error('PDF Load Error:', err);
    }
  };

  const handleExecuteSign = async () => {
    if (!signFile || !signCanvasRef.current) return;

    setIsProcessing(true);
    setProgress(30);
    setResultPdfUrl(null);

    try {
      const canvas = signCanvasRef.current;
      const signatureDataUrl = canvas.toDataURL('image/png');

      const bytes = await signFile.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pageIndex = Math.max(0, Math.min(signTargetPage - 1, pdf.getPageCount() - 1));
      const targetPage = pdf.getPage(pageIndex);

      setProgress(60);

      // Embed signature image into PDF
      const pngImage = await pdf.embedPng(signatureDataUrl);
      const pngDims = pngImage.scale(0.5);

      // Position signature in bottom-right corner of the target page
      const { width, height } = targetPage.getSize();
      targetPage.drawImage(pngImage, {
        x: width - pngDims.width - 50,
        y: 60,
        width: pngDims.width,
        height: pngDims.height,
      });

      const signedBytes = await pdf.save();
      const blob = new Blob([signedBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setResultPdfUrl(url);
      setResultFileName(`Signed_${signFile.name}`);
      setProgress(100);

      addHistoryItem({
        toolId: 'pdf-merge-split-sign',
        toolName: 'PDF Digital Signature',
        title: `Tanda Tangan Digital pada Hal ${signTargetPage} (${signFile.name})`,
        type: 'pdf',
        downloadUrl: url,
      });
    } catch (err) {
      console.error('PDF Signature Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadResult = () => {
    if (!resultPdfUrl) return;
    const a = document.createElement('a');
    a.href = resultPdfUrl;
    a.download = resultFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tool navigation tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)]">
        <button
          type="button"
          onClick={() => {
            setActiveSub('merge');
            setResultPdfUrl(null);
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeSub === 'merge'
              ? 'bg-[var(--neo-surface)] text-[var(--neo-text)] border border-[var(--neo-border)] shadow-neo'
              : 'text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-500" />
          <span>Merge PDF</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSub('split');
            setResultPdfUrl(null);
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeSub === 'split'
              ? 'bg-[var(--neo-surface)] text-[var(--neo-text)] border border-[var(--neo-border)] shadow-neo'
              : 'text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
          }`}
        >
          <Scissors className="w-4 h-4 text-emerald-500" />
          <span>Split / Pisah PDF</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSub('sign');
            setResultPdfUrl(null);
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeSub === 'sign'
              ? 'bg-[var(--neo-surface)] text-[var(--neo-text)] border border-[var(--neo-border)] shadow-neo'
              : 'text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
          }`}
        >
          <PenTool className="w-4 h-4 text-rose-500" />
          <span>Tanda Tangan & Stempel</span>
        </button>
      </div>

      {/* ================= SUB-TOOL 1: MERGE PDF ================= */}
      {activeSub === 'merge' && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          <div
            onClick={() => mergeInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 text-center hover:border-[var(--neo-border-active)] transition-colors cursor-pointer bg-[var(--neo-bg)] space-y-2"
          >
            <div className="w-12 h-12 mx-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-indigo-500 shadow-neo">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--neo-text)]">
                Tambah File PDF untuk Digabungkan
              </p>
              <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
                Pilih 2 atau lebih file PDF sekaligus
              </p>
            </div>
            <input
              ref={mergeInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={handleMergeFilesAdd}
            />
          </div>

          {mergeFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--neo-text)]">
                <span>Daftar File ({mergeFiles.length})</span>
                <button
                  type="button"
                  onClick={() => setMergeFiles([])}
                  className="text-rose-500 hover:underline text-[11px]"
                >
                  Hapus Semua
                </button>
              </div>

              <div className="space-y-2">
                {mergeFiles.map((f, idx) => (
                  <div
                    key={`${f.name}-${idx}`}
                    className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate max-w-[260px] sm:max-w-md">
                      <span className="w-6 h-6 rounded-lg bg-[var(--neo-surface)] border border-[var(--neo-border)] flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold truncate text-[var(--neo-text)]">{f.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          const updated = [...mergeFiles];
                          const temp = updated[idx];
                          updated[idx] = updated[idx - 1];
                          updated[idx - 1] = temp;
                          setMergeFiles(updated);
                        }}
                        className="p-1 rounded hover:bg-[var(--neo-surface)] disabled:opacity-30"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === mergeFiles.length - 1}
                        onClick={() => {
                          const updated = [...mergeFiles];
                          const temp = updated[idx];
                          updated[idx] = updated[idx + 1];
                          updated[idx + 1] = temp;
                          setMergeFiles(updated);
                        }}
                        className="p-1 rounded hover:bg-[var(--neo-surface)] disabled:opacity-30"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMergeFiles(mergeFiles.filter((_, i) => i !== idx))}
                        className="p-1 rounded text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleExecuteMerge}
                disabled={mergeFiles.length < 2 || isProcessing}
                className="neo-btn neo-btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Gabungkan {mergeFiles.length} File PDF Menjadi Satu</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= SUB-TOOL 2: SPLIT PDF ================= */}
      {activeSub === 'split' && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          <div
            onClick={() => splitInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 text-center hover:border-[var(--neo-border-active)] transition-colors cursor-pointer bg-[var(--neo-bg)] space-y-2"
          >
            <div className="w-12 h-12 mx-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-emerald-500 shadow-neo">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--neo-text)]">
                {splitFile ? splitFile.name : 'Pilih File PDF untuk Dipisah'}
              </p>
              <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
                {splitFile ? `Total ${splitPageCount} Halaman Terdeteksi` : 'Ambil halaman tertentu dari dokumen PDF'}
              </p>
            </div>
            <input
              ref={splitInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleSplitFileChange}
            />
          </div>

          {splitFile && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
                <label className="text-xs font-bold text-[var(--neo-text)] block">
                  Rentang Halaman yang Ingin Diekstrak:
                </label>
                <input
                  type="text"
                  value={splitRange}
                  onChange={(e) => setSplitRange(e.target.value)}
                  placeholder="Contoh: 1-3 atau 2, 4, 6"
                  className="neo-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                />
                <p className="text-[10px] text-[var(--neo-text-muted)]">
                  Gunakan tanda minus (-) untuk rentang bersambung atau koma (,) untuk halaman terpisah.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExecuteSplit}
                disabled={isProcessing}
                className="neo-btn neo-btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Scissors className="w-4 h-4" />
                <span>Ekstrak Halaman Terpilih</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= SUB-TOOL 3: DIGITAL SIGNATURE & STAMP ================= */}
      {activeSub === 'sign' && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          <div
            onClick={() => signInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 text-center hover:border-[var(--neo-border-active)] transition-colors cursor-pointer bg-[var(--neo-bg)] space-y-2"
          >
            <div className="w-12 h-12 mx-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-rose-500 shadow-neo">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--neo-text)]">
                {signFile ? signFile.name : 'Pilih Dokumen PDF untuk Ditandatangani'}
              </p>
              <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
                {signFile ? `Total ${signPageCount} Halaman` : 'Tempel tanda tangan digital atau stempel resmi'}
              </p>
            </div>
            <input
              ref={signInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleSignFileChange}
            />
          </div>

          <div className="space-y-4">
            {/* Signature Drawing Pad */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--neo-text)]">
                <span>Gambar Tanda Tangan Anda di Bawah:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInkColor('#121212')}
                    className={`w-5 h-5 rounded-full border-2 ${
                      inkColor === '#121212' ? 'border-amber-400 scale-110' : 'border-transparent'
                    } bg-[#121212]`}
                    title="Tinta Hitam"
                  />
                  <button
                    type="button"
                    onClick={() => setInkColor('#0054A6')}
                    className={`w-5 h-5 rounded-full border-2 ${
                      inkColor === '#0054A6' ? 'border-amber-400 scale-110' : 'border-transparent'
                    } bg-[#0054A6]`}
                    title="Tinta Biru Resmi"
                  />
                  <button
                    type="button"
                    onClick={() => setInkColor('#DB1514')}
                    className={`w-5 h-5 rounded-full border-2 ${
                      inkColor === '#DB1514' ? 'border-amber-400 scale-110' : 'border-transparent'
                    } bg-[#DB1514]`}
                    title="Tinta Merah"
                  />
                  <button
                    type="button"
                    onClick={clearSignatureCanvas}
                    className="text-rose-500 hover:underline text-[11px] ml-2"
                  >
                    Bersihkan
                  </button>
                </div>
              </div>

              <div className="rounded-xl border-2 border-[var(--neo-border)] bg-white overflow-hidden shadow-inner flex justify-center">
                <canvas
                  ref={signCanvasRef}
                  width={320}
                  height={130}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair touch-none"
                />
              </div>
            </div>

            {/* Quick Stamps */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[var(--neo-text-muted)]">Atau Gunakan Stempel Cepat:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyTextStamp('LUNAS', '#0054A6')}
                  className="neo-btn px-2.5 py-1 rounded-lg text-xs font-bold text-sky-600 bg-sky-500/10 border-sky-500/30"
                >
                  [LUNAS]
                </button>
                <button
                  type="button"
                  onClick={() => applyTextStamp('APPROVED', '#10B981')}
                  className="neo-btn px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-500/10 border-emerald-500/30"
                >
                  [APPROVED]
                </button>
                <button
                  type="button"
                  onClick={() => applyTextStamp('RAHASIA', '#DB1514')}
                  className="neo-btn px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 bg-rose-500/10 border-rose-500/30"
                >
                  [RAHASIA]
                </button>
                <button
                  type="button"
                  onClick={() => applyTextStamp('DITERIMA', '#8B5CF6')}
                  className="neo-btn px-2.5 py-1 rounded-lg text-xs font-bold text-purple-600 bg-purple-500/10 border-purple-500/30"
                >
                  [DITERIMA]
                </button>
              </div>
            </div>

            {/* Target Page Selector */}
            {signFile && (
              <div className="flex items-center justify-between p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] text-xs font-bold">
                <span>Tempelkan pada Halaman:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={signPageCount}
                    value={signTargetPage}
                    onChange={(e) => setSignTargetPage(parseInt(e.target.value) || 1)}
                    className="neo-input w-16 px-2 py-1 text-center rounded-lg font-mono"
                  />
                  <span className="text-[var(--neo-text-muted)]">dari {signPageCount}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleExecuteSign}
              disabled={!signFile || isProcessing}
              className="neo-btn neo-btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <PenTool className="w-4 h-4" />
              <span>Bubuhkan Tanda Tangan & Buat Dokumen Baru</span>
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <ProcessCard
          progress={progress}
          stage="Memproses Halaman PDF via pdf-lib Client Engine..."
          speedText="PDF Binary DSP"
          timeRemaining="1-2 detik"
        />
      )}

      {/* Result Live Preview Card */}
      {resultPdfUrl && (
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Dokumen PDF Siap Diunduh!</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadResult}
              className="neo-btn neo-btn-primary px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .PDF</span>
            </button>
          </div>

          <div className="rounded-xl overflow-hidden border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] h-72 w-full">
            <iframe
              src={resultPdfUrl}
              title="PDF Result Preview"
              className="w-full h-full border-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
