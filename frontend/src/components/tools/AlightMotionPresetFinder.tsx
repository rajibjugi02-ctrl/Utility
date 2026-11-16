'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ExternalLink, Copy, Check, FileCode, CheckCircle2, Link2, MessageSquare } from 'lucide-react';
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--neo-text)]">
                Daftar Preset Alight Motion ({data.presets?.length || 0} Ditemukan)
              </span>
            </div>

            {data.presets && data.presets.length > 0 ? (
              <div className="space-y-2.5">
                {data.presets.map((preset: any, idx: number) => {
                  const targetUrl = preset.resolvedUrl || preset.url;
                  const is5Mb = preset.badgeType === 'direct_5mb' || preset.type === 'alight.link' || targetUrl.includes('alight.link') || targetUrl.includes('am.link');
                  const isXml = preset.badgeType === 'xml_drive' || preset.type === 'gdrive' || preset.type === 'xml';

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-sm ${is5Mb
                        ? 'border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500'
                        : isXml
                          ? 'border-indigo-500/50 bg-indigo-500/5 hover:border-indigo-500'
                          : 'border-amber-500/50 bg-amber-500/5 hover:border-amber-500'
                        }`}
                    >
                      <div className="flex items-start gap-3 overflow-hidden">
                        <div
                          className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${is5Mb
                            ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/60'
                            : isXml
                              ? 'bg-indigo-500/20 text-indigo-500 border-indigo-500/60'
                              : 'bg-amber-500/20 text-amber-500 border-amber-500/60'
                            }`}
                        >
                          {is5Mb ? <Link2 className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                        </div>

                        <div className="truncate space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`neo-badge text-[10px] font-bold px-2 py-0.5 rounded-full ${is5Mb
                                ? 'bg-emerald-500 text-white border-emerald-600'
                                : isXml
                                  ? 'bg-indigo-500 text-white border-indigo-600'
                                  : 'bg-amber-500 text-white border-amber-600'
                                }`}
                            >
                              {preset.service || (is5Mb ? 'Preset Direct <5MB (Alight Motion)' : 'Preset XML')}
                            </span>
                            {preset.source && (
                              <span className="text-[10px] text-[var(--neo-text-muted)] font-mono">
                                • {preset.source}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono font-bold text-[var(--neo-text)] truncate block">
                            {targetUrl}
                          </span>
                          {preset.resolvedUrl && preset.resolvedUrl !== preset.url && (
                            <span className="text-[10px] text-[var(--neo-text-muted)] font-mono truncate block">
                              Asal: {preset.url}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleCopy(targetUrl, idx)}
                          className="neo-btn px-3 py-2 rounded-xl text-xs neo-btn-secondary flex items-center gap-1.5 shadow-sm"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500 font-bold">Disalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Link</span>
                            </>
                          )}
                        </button>

                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`neo-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm text-white transition-transform active:scale-95 ${is5Mb
                            ? 'bg-emerald-600 hover:bg-emerald-700 border-2 border-black'
                            : isXml
                              ? 'bg-indigo-600 hover:bg-indigo-700 border-2 border-black'
                              : 'bg-amber-600 hover:bg-amber-700 border-2 border-black'
                            }`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{is5Mb ? '📥 Import Package / Buka Preset Alight Motion ↗' : isXml ? '📥 Buka & Unduh File XML ↗' : 'Buka Tautan Preset ↗'}</span>
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
