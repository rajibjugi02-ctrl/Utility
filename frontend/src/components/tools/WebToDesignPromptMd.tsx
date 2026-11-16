'use client';

import React, { useState } from 'react';
import { Globe, FileCode, Download, Copy, Check, Sparkles, ExternalLink, Layers, Palette, Type, FileText, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

type PromptFormat = 'universal' | 'cursor' | 'v0';

export const WebToDesignPromptMd: React.FC = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<PromptFormat>('universal');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [resultData, setResultData] = useState<any | null>(null);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const { setActiveToolSlug, setPdfStudioContent, addHistoryItem } = useAppStore();

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResultData(null);
    setProgress(15);
    setStage('Mengirim permintaan ke backend design analyzer...');

    try {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(timer);
            return 85;
          }
          return prev + 15;
        });
      }, 400);

      const res = await fetch('/api/extract-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), format }),
      });

      clearInterval(timer);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengekstrak sistem desain website.');
      }

      setProgress(100);
      setStage('Analisis desain selesai!');
      setResultData(data);

      addHistoryItem({
        toolId: 'web-to-design-prompt-md',
        toolName: 'Web to Design Prompt .MD',
        title: `Design Tokens ${data.metadata?.domain || 'Website'} (.MD)`,
        type: 'web',
        downloadUrl: '#',
      });
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat memproses URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!resultData?.markdownContent) return;
    navigator.clipboard.writeText(resultData.markdownContent);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadMd = () => {
    if (!resultData?.markdownContent) return;
    const domain = resultData.metadata?.domain || 'design-prompt';
    const blob = new Blob([resultData.markdownContent], { type: 'text/markdown;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `design-prompt-${domain}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  const handleOpenInPdfStudio = () => {
    if (!resultData?.markdownContent) return;
    // Format markdown as HTML paragraphs for PDF Studio
    const formattedHtml = `
      <h1><strong>DOKUMEN SPESIFIKASI DESAIN: ${resultData.metadata?.domain}</strong></h1>
      <p><strong>Sumber URL:</strong> ${resultData.metadata?.url}</p>
      <hr />
      <h3><strong>Estetika Visual:</strong> ${resultData.designTokens?.aesthetic}</h3>
      <p><strong>Palet Warna Dominan:</strong> ${resultData.designTokens?.colors?.palette?.join(', ')}</p>
      <p><strong>Tipografi Utama:</strong> ${resultData.designTokens?.typography?.primaryFont}</p>
      <hr />
      <pre>${resultData.markdownContent}</pre>
    `;
    setPdfStudioContent(formattedHtml);
    setActiveToolSlug('pdf-studio');
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <form onSubmit={handleExtract} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--neo-text)] uppercase tracking-wider block">
            Masukkan Link Website Target:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://linear.app, https://stripe.com, dll..."
                className="neo-input w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-mono"
                required
              />
              <Globe className="w-4 h-4 text-[var(--neo-text-muted)] absolute left-3 top-3 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="neo-btn neo-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'Menganalisis...' : 'Bedah Desain (.MD)'}</span>
            </button>
          </div>
        </div>

        {/* AI Output Format Selector */}
        <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
          <span className="text-xs font-bold text-[var(--neo-text)]">Pilih Format Output Prompt:</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFormat('universal')}
              className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                format === 'universal'
                  ? 'border-[var(--neo-border-active)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)] font-bold'
                  : 'border-[var(--neo-border)] bg-[var(--neo-surface)] text-[var(--neo-text)]'
              }`}
            >
              <span className="text-xs font-bold block">Universal System .MD</span>
              <span className="text-[10px] opacity-75">Tabel token & CSS lengkap</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('cursor')}
              className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                format === 'cursor'
                  ? 'border-[var(--neo-border-active)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)] font-bold'
                  : 'border-[var(--neo-border)] bg-[var(--neo-surface)] text-[var(--neo-text)]'
              }`}
            >
              <span className="text-xs font-bold block">Cursor / Windsurf Rules</span>
              <span className="text-[10px] opacity-75">Aturan coding agent .cursorrules</span>
            </button>

            <button
              type="button"
              onClick={() => setFormat('v0')}
              className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                format === 'v0'
                  ? 'border-[var(--neo-border-active)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)] font-bold'
                  : 'border-[var(--neo-border)] bg-[var(--neo-surface)] text-[var(--neo-text)]'
              }`}
            >
              <span className="text-xs font-bold block">v0 / Lovable Prompt</span>
              <span className="text-[10px] opacity-75">Prompt prompt generation cepat</span>
            </button>
          </div>
        </div>
      </form>

      {/* Progress & Error */}
      {loading && (
        <ProcessCard
          progress={progress}
          stage={stage}
          speed="DOM Parser Engine"
          eta="1-2 detik"
        />
      )}

      {error && (
        <div className="p-4 rounded-xl border-2 border-rose-500/40 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Result Preview */}
      {resultData && (
        <div className="space-y-6">
          {/* Top Visual Design Token Summary Card */}
          <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b-2 border-[var(--neo-border)]">
              <div>
                <h2 className="text-base font-bold text-[var(--neo-text)]">
                  {resultData.metadata?.title}
                </h2>
                <a
                  href={resultData.metadata?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[var(--neo-text-muted)] font-mono hover:underline flex items-center gap-1 mt-0.5"
                >
                  <span>{resultData.metadata?.domain}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <span className="neo-badge bg-[var(--neo-accent)] text-[var(--neo-accent-text)] text-xs font-bold">
                {resultData.designTokens?.aesthetic}
              </span>
            </div>

            {/* Colors Swatches Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[var(--neo-text)] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                <span>Palet Warna yang Diekstrak (Klik HEX untuk Salin):</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {resultData.designTokens?.colors?.palette?.map((hex: string, i: number) => (
                  <button
                    key={`${hex}-${i}`}
                    type="button"
                    onClick={() => handleCopyHex(hex)}
                    className="p-2.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex items-center gap-2.5 hover:border-[var(--neo-border-active)] transition-all cursor-pointer"
                  >
                    <div
                      className="w-7 h-7 rounded-lg border-2 border-[var(--neo-border)] shrink-0 shadow-sm"
                      style={{ backgroundColor: hex }}
                    />
                    <div className="text-left font-mono text-[11px]">
                      <span className="font-bold text-[var(--neo-text)] block">{hex}</span>
                      <span className="text-[10px] text-[var(--neo-text-muted)]">
                        {copiedColor === hex ? 'Tersalin!' : 'Klik Salin'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Typography & Layout Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1">
                <span className="text-[11px] font-bold text-[var(--neo-text-muted)] uppercase tracking-wider flex items-center gap-1">
                  <Type className="w-3.5 h-3.5" /> Tipografi Utama
                </span>
                <p className="text-xs font-bold text-[var(--neo-text)]">
                  {resultData.designTokens?.typography?.primaryFont}
                </p>
                <p className="text-[10px] text-[var(--neo-text-muted)] font-mono">
                  Mono: {resultData.designTokens?.typography?.monoFont}
                </p>
              </div>

              <div className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1">
                <span className="text-[11px] font-bold text-[var(--neo-text-muted)] uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Arsitektur Komponen
                </span>
                <p className="text-xs font-bold text-[var(--neo-text)]">
                  Radius: {resultData.designTokens?.components?.borderRadius}
                </p>
                <p className="text-[10px] text-[var(--neo-text-muted)]">
                  Layout: {resultData.designTokens?.components?.layoutType}
                </p>
              </div>
            </div>
          </div>

          {/* Markdown Code & Rendered Preview Panel */}
          <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-[var(--neo-border)]">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-bold text-[var(--neo-text)]">
                  File Prompt Markdown ({format.toUpperCase()})
                </h3>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="neo-btn neo-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                >
                  {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMd ? 'Tersalin!' : 'Salin Markdown'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMd}
                  className="neo-btn neo-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .MD</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenInPdfStudio}
                  className="neo-btn neo-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
                  title="Ekspor ke PDF Studio"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>PDF Studio</span>
                </button>
              </div>
            </div>

            {/* Markdown Raw Code Box */}
            <div className="rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs font-mono text-[var(--neo-text)] whitespace-pre-wrap leading-relaxed">
                {resultData.markdownContent}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
