'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Sparkles, ExternalLink, Copy, Check, FileCode, CheckCircle2, Link2, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

export const AlightMotionPresetFinder: React.FC = () => {
  const { prefilledUrl, setPrefilledUrl, addHistoryItem } = useAppStore();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (prefilledUrl) {
      setUrl(prefilledUrl);
      setPrefilledUrl('');
    }
  }, [prefilledUrl, setPrefilledUrl]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);
    setProgress(15);
    setStage('Layer 1: Memindai teks caption & deskripsi...');

    try {
      const timer1 = setTimeout(() => {
        setProgress(45);
        setStage('Layer 2: Deep scraping kolom komentar & komentar disematkan...');
      }, 500);

      const timer2 = setTimeout(() => {
        setProgress(80);
        setStage('Layer 3: Mengurai bio pembuat & unshorten shortlink...');
      }, 1000);

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), type: 'alight' }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Gagal memindai preset. Pastikan URL TikTok valid.');
      }

      setProgress(100);
      setStage('Pemindaian selesai!');
      setData(result.data);

      addHistoryItem({
        type: 'preset',
        title: result.data.title || 'Alight Motion Preset',
        subtitle: `Ditemukan ${result.data.presets?.length || 0} link preset`,
        presetUrls: result.data.presets || [],
      });
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memindai preset.');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Search Input Form */}
      <form onSubmit={handleScan} className="space-y-3">
        <label className="block text-xs font-bold text-[var(--neo-text)] uppercase tracking-wider">
          Tautan TikTok / Video Edit yang Memuat Preset Alight Motion
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            placeholder="https://www.tiktok.com/@creator/video/... atau https://vt.tiktok.com/..."
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
            <span>{loading ? 'Deep Scraping...' : 'Cari Link Preset'}</span>
          </button>
        </div>
      </form>

      {/* Animated Process Card */}
      {(loading || (progress > 0 && progress < 100)) && (
        <ProcessCard
          stage={stage}
          progress={progress}
          speed="18.2 MB/s"
          eta="00:02"
          isCompleted={progress === 100}
          error={error}
        />
      )}

      {/* Live Result Preview Card */}
      {data && progress === 100 && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--neo-border)]">
            <span className="neo-badge bg-emerald-500/10 text-emerald-500 border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" /> Hasil Deep Scraping Preset
            </span>
            <span className="text-[11px] font-mono text-[var(--neo-text-muted)]">
              Kreator: @{data.author}
            </span>
          </div>

          {/* Video Preview if available */}
          {data.videoUrl && (
            <div className="rounded-xl overflow-hidden border-2 border-[var(--neo-border)] bg-black shadow-neo">
              <video
                src={data.videoUrl}
                controls
                playsInline
                className="w-full max-h-[360px] object-contain mx-auto"
              />
            </div>
          )}

          {/* Scraped Caption Text */}
          <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neo-text-muted)] flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> Teks Caption / Deskripsi Video:
            </span>
            <p className="text-xs font-mono text-[var(--neo-text)] whitespace-pre-wrap leading-relaxed">
              {data.scrapedCaption || data.title || 'Tidak ada deskripsi teks.'}
            </p>
          </div>

          {/* Preset Links List Classified */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--neo-text)]">
                Daftar Preset Alight Motion ({data.presets?.length || 0} Ditemukan)
              </span>
            </div>

            {data.presets && data.presets.length > 0 ? (
              <div className="space-y-2">
                {data.presets.map((preset: any, idx: number) => {
                  const is5Mb = preset.badgeType === 'direct_5mb' || preset.service?.includes('5MB');
                  const isXml = preset.badgeType === 'xml_drive' || preset.service?.includes('XML');

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 overflow-hidden">
                        <div
                          className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            is5Mb
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40'
                              : isXml
                              ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/40'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/40'
                          }`}
                        >
                          {is5Mb ? <Link2 className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                        </div>

                        <div className="truncate space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`neo-badge text-[10px] font-bold ${
                                is5Mb
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40'
                                  : isXml
                                  ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/40'
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/40'
                              }`}
                            >
                              {preset.service}
                            </span>
                            {preset.source && (
                              <span className="text-[10px] text-[var(--neo-text-muted)] font-mono">
                                • {preset.source}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-[var(--neo-text)] truncate block">
                            {preset.url}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(preset.url, idx)}
                          className="neo-btn px-3 py-1.5 rounded-lg text-xs neo-btn-secondary"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedIndex === idx ? 'Disalin' : 'Salin Link'}</span>
                        </button>

                        <a
                          href={preset.url}
                          target="_blank"
                          rel="noreferrer"
                          className="neo-btn px-3 py-1.5 rounded-lg text-xs neo-btn-primary"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Preset</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] text-center text-xs text-[var(--neo-text-muted)]">
                Tidak ada link preset yang dapat diurai otomatis dari video ini.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
