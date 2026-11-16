'use client';

import React, { useState, useRef } from 'react';
import { Globe, Code, Sparkles, Download, Eye, FileCheck, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

export const WebToPdf: React.FC = () => {
  const [mode, setMode] = useState<'url' | 'html'>('url');
  const [url, setUrl] = useState('');
  const [rawHtml, setRawHtml] = useState(
    '<h1>Laporan Hasil Analisis Web</h1><p>Halaman ini dikonversi dari dokumen HTML menjadi format PDF siap cetak dengan resolusi jernih.</p><ul><li>Desain responsif</li><li>Rendering client-side presisi tinggi</li></ul>'
  );

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [extractedTitle, setExtractedTitle] = useState('Web_Document.pdf');
  const [contentHtml, setContentHtml] = useState<string | null>(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const paperRef = useRef<HTMLDivElement>(null);
  const { addHistoryItem } = useAppStore();

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPdfBlobUrl(null);

    if (mode === 'url') {
      if (!url.trim()) return;
      setLoading(true);
      setProgress(15);
      setStage('Menghubungkan ke server web target...');

      try {
        const timer1 = setTimeout(() => {
          setProgress(50);
          setStage('Mengurai DOM, artikel, dan styling dokumen...');
        }, 500);

        const timer2 = setTimeout(() => {
          setProgress(80);
          setStage('Membersihkan skrip eksternal & iklan...');
        }, 1000);

        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim(), type: 'web' }),
        });

        clearTimeout(timer1);
        clearTimeout(timer2);

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal mengambil konten dari URL tersebut.');
        }

        setProgress(100);
        setStage('Konten web berhasil diekstrak!');
        setExtractedTitle(`${data.data.title || 'Web_Page'}.pdf`);
        setContentHtml(data.data.htmlSnippet || '<p>Konten web berhasil diekstrak.</p>');

        addHistoryItem({
          type: 'web',
          title: data.data.title || 'Web to PDF',
          subtitle: url.trim(),
        });
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat memproses URL.');
        setProgress(0);
      } finally {
        setLoading(false);
      }
    } else {
      // Direct HTML mode
      if (!rawHtml.trim()) return;
      setProgress(100);
      setStage('HTML siap dikonversi!');
      setExtractedTitle('HTML_Document.pdf');
      setContentHtml(rawHtml);
    }
  };

  const handleGeneratePdf = async () => {
    if (!paperRef.current) return;

    setIsGeneratingPdf(true);
    setPdfProgress(20);
    setStage('Merender kertas dokumen ke Canvas...');

    try {
      const timer1 = setTimeout(() => {
        setPdfProgress(60);
        setStage('Mengonversi piksel ke halaman A4 PDF...');
      }, 400);

      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
      });

      clearTimeout(timer1);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);

      setPdfBlobUrl(blobUrl);
      setPdfProgress(100);
      setStage('PDF siap diunduh!');
    } catch (err: any) {
      console.error('Web to PDF Error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfBlobUrl) return;
    const cleanName = extractedTitle.trim().endsWith('.pdf') ? extractedTitle.trim() : `${extractedTitle.trim()}.pdf`;
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`neo-btn px-4 py-2 rounded-xl text-xs font-bold ${
            mode === 'url' ? 'neo-btn-primary' : 'neo-btn-secondary'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Mode URL Website</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('html')}
          className={`neo-btn px-4 py-2 rounded-xl text-xs font-bold ${
            mode === 'html' ? 'neo-btn-primary' : 'neo-btn-secondary'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Mode Kode HTML</span>
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleExtract} className="space-y-3">
        {mode === 'url' ? (
          <div>
            <label className="block text-xs font-bold text-[var(--neo-text)] uppercase tracking-wider mb-1.5">
              Tautan Halaman Web / Artikel / Berita
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder="https://example.com/artikel-berita..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl neo-input text-xs font-medium"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="neo-btn neo-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Mengambil Konten...' : 'Ambil Konten Web'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-[var(--neo-text)] uppercase tracking-wider mb-1.5">
              Kode HTML yang Ingin Dikonversi ke PDF
            </label>
            <textarea
              rows={5}
              value={rawHtml}
              onChange={(e) => setRawHtml(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl neo-input text-xs font-mono"
              placeholder="<h1>Judul</h1><p>Paragraf...</p>"
              required
            />
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="neo-btn neo-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                <Sparkles className="w-4 h-4" />
                <span>Muat Preview HTML</span>
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Animated Process Card */}
      {(loading || (progress > 0 && progress < 100)) && (
        <ProcessCard
          stage={stage}
          progress={progress}
          speed="15.2 MB/s"
          eta="00:02"
          isCompleted={progress === 100}
          error={error}
        />
      )}

      {/* Live Paper Preview */}
      {contentHtml && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--neo-border)]">
            <span className="neo-badge bg-emerald-500/10 text-emerald-500 border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" /> Preview Kertas Siap
            </span>
            <span className="text-xs font-mono font-bold text-[var(--neo-text)]">
              {extractedTitle}
            </span>
          </div>

          {/* Paper View */}
          <div className="w-full bg-neutral-900/10 p-4 sm:p-6 rounded-xl border-2 border-[var(--neo-border)] flex justify-center overflow-x-auto">
            <div
              ref={paperRef}
              className="bg-white text-black p-8 sm:p-12 w-full max-w-2xl min-h-[480px] shadow-neo-lg border-2 border-[#121212] rounded-sm prose prose-neutral max-w-none text-xs sm:text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>

          {/* Trigger Generate PDF */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              className="neo-btn neo-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold"
            >
              <Eye className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Merender PDF...' : 'Buat & Preview PDF'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Live PDF Preview & Download */}
      {pdfBlobUrl && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--neo-border)]">
            <span className="neo-badge bg-emerald-500/10 text-emerald-500 border-emerald-500/40">
              <FileCheck className="w-4 h-4" /> Live PDF Siap Diunduh
            </span>
            <span className="text-xs font-mono font-bold text-[var(--neo-text)]">
              {extractedTitle}
            </span>
          </div>

          <div className="w-full h-[500px] rounded-xl overflow-hidden border-2 border-[var(--neo-border)] bg-neutral-900 shadow-neo">
            <iframe
              src={pdfBlobUrl}
              title="Web to PDF Preview"
              className="w-full h-full border-0"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="neo-btn neo-btn-primary px-6 py-3 rounded-xl text-xs font-bold"
            >
              <Download className="w-4 h-4" />
              <span>Download File .PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
