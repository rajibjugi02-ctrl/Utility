'use client';

import React, { useState } from 'react';
import { Youtube, Download, Sparkles, Music, Film, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

export const YouTubeDownloader: React.FC = () => {
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
    setStage('Menganalisis link YouTube / Shorts...');

    try {
      const timer1 = setTimeout(() => {
        setProgress(50);
        setStage('Mengambil data resolusi video & audio stream...');
      }, 500);

      const timer2 = setTimeout(() => {
        setProgress(80);
        setStage('Menyiapkan format download 1080p & MP3...');
      }, 1000);

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), type: 'youtube' }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengekstrak YouTube.');
      }

      setProgress(100);
      setStage('Video siap diunduh!');
      setMetadata(data.data);

      addHistoryItem({
        type: 'youtube',
        title: data.data.title || 'YouTube Video',
        subtitle: `${data.data.author || 'YouTube'} · MP4 / MP3`,
        downloadUrl: data.data.downloadVideoUrl,
      });
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengekstrak video.');
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
          Tautan YouTube (Video / Shorts / Music)
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
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
            <span>{loading ? 'Memproses...' : 'Proses Video'}</span>
          </button>
        </div>
      </form>

      {/* Animated Process Card */}
      {(loading || progress > 0) && (
        <ProcessCard
          stage={stage}
          progress={progress}
          speed="19.4 MB/s"
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
              <CheckCircle2 className="w-3.5 h-3.5" /> Video Siap Ditonton
            </span>
            <span className="text-[11px] font-mono text-[var(--neo-text-muted)]">
              Kreator: {metadata.author}
            </span>
          </div>

          {/* Interactive Player / Embed */}
          {metadata.videoId ? (
            <div className="rounded-xl overflow-hidden border-2 border-[var(--neo-border)] bg-black shadow-neo aspect-video w-full">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${metadata.videoId}`}
                title={metadata.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : metadata.thumbnail ? (
            <div className="rounded-xl overflow-hidden border-2 border-[var(--neo-border)] bg-black shadow-neo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={metadata.thumbnail}
                alt={metadata.title}
                className="w-full max-h-[380px] object-cover mx-auto"
              />
            </div>
          ) : null}

          <div className="space-y-1">
            <h3 className="font-bold text-sm text-[var(--neo-text)]">
              {metadata.title}
            </h3>
            <p className="text-xs text-[var(--neo-text-muted)]">
              Channel: {metadata.author}
            </p>
          </div>

          {/* Download Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={`/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(metadata.title || 'youtube_video')}.mp4`}
              download
              className="neo-btn neo-btn-primary w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold"
            >
              <Download className="w-4 h-4" />
              <span>Download Video (.MP4 HD)</span>
            </a>

            <a
              href={`/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(metadata.title || 'youtube_audio')}.mp3`}
              download
              className="neo-btn neo-btn-secondary w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold"
            >
              <Music className="w-4 h-4" />
              <span>Download Audio (.MP3 320kbps)</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
