'use client';

import React, { useState, useEffect } from 'react';
import { Video, Download, Music, ExternalLink, Copy, Check, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

export const TikTokExtractor: React.FC = () => {
  const { prefilledUrl, setPrefilledUrl, addHistoryItem } = useAppStore();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [metadata, setMetadata] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (prefilledUrl) {
      setUrl(prefilledUrl);
      setPrefilledUrl('');
    }
  }, [prefilledUrl, setPrefilledUrl]);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setMetadata(null);
    setProgress(15);
    setStage('Menganalisis tautan TikTok...');

    try {
      const timer1 = setTimeout(() => {
        setProgress(45);
        setStage('Menghubungkan ke API TikWM HD...');
      }, 400);

      const timer2 = setTimeout(() => {
        setProgress(75);
        setStage('Mengekstrak stream video tanpa watermark...');
      }, 900);

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), type: 'tiktok' }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengekstrak video TikTok. Pastikan akun tidak di-private.');
      }

      setProgress(100);
      setStage('Ekstraksi selesai!');
      setMetadata(data.data);

      addHistoryItem({
        type: 'tiktok',
        title: data.data.title || 'TikTok Video',
        subtitle: `@${data.data.author || 'creator'} · HD Video`,
        downloadUrl: data.data.videoUrl,
      });
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengekstrak video.');
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
      {/* Input Form */}
      <form onSubmit={handleExtract} className="space-y-3">
        <label className="block text-xs font-bold text-[var(--neo-text)] uppercase tracking-wider">
          Tautan Video TikTok (Video / VT / Photo Slide)
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
            <span>{loading ? 'Memproses...' : 'Proses & Ekstrak'}</span>
          </button>
        </div>
      </form>

      {/* Animated Process Card */}
      {(loading || (progress > 0 && progress < 100)) && (
        <ProcessCard
          stage={stage}
          progress={progress}
          speed="14.8 MB/s"
          eta="00:02"
          isCompleted={progress === 100}
          error={error}
        />
      )}

      {/* Live Result Preview Card */}
      {metadata && progress === 100 && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--neo-border)]">
            <span className="neo-badge bg-emerald-500/10 text-emerald-500 border-emerald-500/40">
              <Check className="w-3 h-3" /> Live Preview Siap
            </span>
            <span className="text-[11px] font-mono text-[var(--neo-text-muted)]">
              Kreator: @{metadata.author}
            </span>
          </div>

          {/* Interactive Playable Video Player */}
          {metadata.videoUrl && (
            <div className="rounded-xl overflow-hidden border-2 border-[var(--neo-border)] bg-black shadow-neo">
              <video
                src={metadata.videoUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-[420px] object-contain mx-auto"
              />
            </div>
          )}

          {/* Metadata details */}
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-[var(--neo-text)] line-clamp-2">
              {metadata.title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--neo-text-muted)] font-mono pt-1">
              {metadata.duration > 0 && <span>Durasi: {metadata.duration}s</span>}
              {metadata.views > 0 && <span>Tayangan: {metadata.views.toLocaleString()}</span>}
              {metadata.likes > 0 && <span>Suka: {metadata.likes.toLocaleString()}</span>}
            </div>
          </div>

          {/* Detected Presets if available */}
          {metadata.presets_found && metadata.presets?.length > 0 && (
            <div className="p-3.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 space-y-2">
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wide">
                Link Preset Alight Motion Terdeteksi:
              </span>
              <div className="space-y-1.5">
                {metadata.presets.map((preset: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--neo-surface)] border border-[var(--neo-border)] text-xs"
                  >
                    <span className="font-medium truncate text-[var(--neo-text)]">
                      {preset.service}: {preset.url}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(preset.url, idx)}
                        className="neo-btn px-2 py-1 rounded text-[10px] neo-btn-secondary"
                      >
                        {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIndex === idx ? 'Disalin' : 'Salin'}</span>
                      </button>
                      <a
                        href={preset.url}
                        target="_blank"
                        rel="noreferrer"
                        className="neo-btn px-2 py-1 rounded text-[10px] neo-btn-primary"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Buka</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Download Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {metadata.videoUrl && (
              <a
                href={`/api/proxy-download?url=${encodeURIComponent(metadata.videoUrl)}&filename=${encodeURIComponent(metadata.title || 'tiktok_video')}.mp4`}
                download
                className="neo-btn neo-btn-primary w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                <Download className="w-4 h-4" />
                <span>Download Video (.MP4)</span>
              </a>
            )}

            {metadata.audioUrl && (
              <a
                href={`/api/proxy-download?url=${encodeURIComponent(metadata.audioUrl)}&filename=${encodeURIComponent(metadata.title || 'tiktok_audio')}.mp3`}
                download
                className="neo-btn neo-btn-secondary w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                <Music className="w-4 h-4" />
                <span>Download Audio (.MP3)</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
