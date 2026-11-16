'use client';

import React, { useState } from 'react';
import { Instagram, Download, Sparkles, AlertCircle, Music, Film, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

export const InstagramDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [metadata, setMetadata] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { addHistoryItem } = useAppStore();

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setMetadata(null);
    setProgress(15);
    setStage('Menganalisis link Instagram Reel / Post...');

    try {
      const timer1 = setTimeout(() => {
        setProgress(50);
        setStage('Mengambil data CDN resolusi original...');
      }, 500);

      const timer2 = setTimeout(() => {
        setProgress(80);
        setStage('Menyiapkan stream video MP4 HD...');
      }, 1000);

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), type: 'instagram' }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengekstrak Instagram. Pastikan akun bersifat publik.');
      }

      setProgress(100);
      setStage('Media berhasil diurai!');
      setMetadata(data.data);

      addHistoryItem({
        type: 'instagram',
        title: data.data.title || 'Instagram Media',
        subtitle: `@${data.data.author || 'instagram'} · Reel / Post`,
        downloadUrl: data.data.videoUrl,
      });
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengekstrak media.');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Input Form */}
      <form onSubmit={handleExtract} className="space-y-3">
        <label className="block text-xs font-bold text-[var(--neo-text)] uppercase tracking-wider">
          Tautan Instagram (Reels / Post / Video)
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            placeholder="https://www.instagram.com/reel/... atau https://www.instagram.com/p/..."
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
            <span>{loading ? 'Memproses...' : 'Ekstrak Media'}</span>
          </button>
        </div>
      </form>

      {/* Animated Process Card */}
      {(loading || progress > 0) && (
        <ProcessCard
          stage={stage}
          progress={progress}
          speed="16.5 MB/s"
          eta={progress === 100 ? '00:00' : '00:02'}
          isCompleted={progress === 100}
          error={error}
        />
      )}

      {/* Live Result Preview Card */}
      {metadata && progress === 100 && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--neo-border)]">
            <span className="neo-badge bg-emerald-500/10 text-emerald-500 border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" /> Media Instagram Siap
            </span>
            <span className="text-[11px] font-mono text-[var(--neo-text-muted)]">
              Kreator: @{metadata.author}
            </span>
          </div>

          {/* Playable Video Player */}
          {metadata.videoUrl && (
            <div className="rounded-xl overflow-hidden border-2 border-[var(--neo-border)] bg-black shadow-neo">
              <video
                src={metadata.videoUrl}
                controls
                playsInline
                className="w-full max-h-[420px] object-contain mx-auto"
              />
            </div>
          )}

          <div className="space-y-1">
            <h3 className="font-bold text-sm text-[var(--neo-text)]">
              {metadata.title}
            </h3>
            <p className="text-xs text-[var(--neo-text-muted)]">
              Post oleh @{metadata.author}
            </p>
          </div>

          {/* Download Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {metadata.videoUrl && (
              <a
                href={`/api/proxy-download?url=${encodeURIComponent(metadata.videoUrl)}&filename=${encodeURIComponent(metadata.title || 'instagram_video')}.mp4`}
                download
                className="neo-btn neo-btn-primary w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold"
              >
                <Download className="w-4 h-4" />
                <span>Download Video (.MP4)</span>
              </a>
            )}

            {metadata.audioUrl && (
              <a
                href={`/api/proxy-download?url=${encodeURIComponent(metadata.audioUrl)}&filename=${encodeURIComponent(metadata.title || 'instagram_audio')}.mp3`}
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
