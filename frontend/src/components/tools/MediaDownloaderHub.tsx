'use client';

import React, { useState, useEffect } from 'react';
import {
  Video,
  Download,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  ClipboardPaste,
  X,
  Play,
  Volume2,
  Film,
  Image as ImageIcon,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

export interface PlatformDef {
  id: string;
  name: string;
  badge: string;
  desc: string;
  placeholder: string;
  sampleUrl: string;
  iconBg: string;
  iconColor: string;
  type: string;
}

export const PLATFORMS: PlatformDef[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    badge: 'VIDEO & FOTO SLIDE',
    desc: 'Unduh video MP4 tanpa watermark, foto slide/carousel, & musik MP3.',
    placeholder: 'https://www.tiktok.com/@creator/video/1234567890...',
    sampleUrl: 'https://www.tiktok.com/@mrbeast/video/7342898991234567890',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-500',
    type: 'tiktok',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    badge: 'REELS & CAROUSEL',
    desc: 'Unduh video Reels, postingan foto/video, & multi-slide carousel HD.',
    placeholder: 'https://www.instagram.com/reel/C3abc123... atau /p/...',
    sampleUrl: 'https://www.instagram.com/reel/C3abc123456/',
    iconBg: 'bg-pink-500/10',
    iconColor: 'text-pink-500',
    type: 'instagram',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    badge: 'VIDEO & SHORTS',
    desc: 'Unduh video MP4 resolusi tinggi, YouTube Shorts, & ekstrak MP3.',
    placeholder: 'https://www.youtube.com/watch?v=... atau youtu.be/...',
    sampleUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    type: 'youtube',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    badge: 'TWEET VIDEO & GIF',
    desc: 'Unduh video dari cuitan X/Twitter kualitas tertinggi.',
    placeholder: 'https://x.com/username/status/1234567890...',
    sampleUrl: 'https://x.com/Twitter/status/1780000000000000000',
    iconBg: 'bg-neutral-800',
    iconColor: 'text-white',
    type: 'twitter',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    badge: 'REELS & VIDEO HD',
    desc: 'Unduh video publik & Facebook Reels tanpa watermark.',
    placeholder: 'https://www.facebook.com/reel/1234567890... atau fb.watch/...',
    sampleUrl: 'https://www.facebook.com/reel/123456789012345',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    type: 'facebook',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    badge: 'VIDEO & FOTO PIN',
    desc: 'Unduh video pin & gambar resolusi asli.',
    placeholder: 'https://pin.it/... atau https://www.pinterest.com/pin/...',
    sampleUrl: 'https://pin.it/7xK9w0Z',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    type: 'pinterest',
  },
];

export const MediaDownloaderHub: React.FC = () => {
  const { prefilledUrl, setPrefilledUrl, addHistoryItem } = useAppStore();

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformDef | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Auto-detect platform from prefilledUrl or paste
  useEffect(() => {
    if (prefilledUrl) {
      setUrlInput(prefilledUrl);
      detectAndSetPlatform(prefilledUrl);
      setPrefilledUrl('');
    }
  }, [prefilledUrl, setPrefilledUrl]);

  const detectAndSetPlatform = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.includes('tiktok.com')) setSelectedPlatform(PLATFORMS.find((p) => p.id === 'tiktok') || null);
    else if (lower.includes('instagram.com')) setSelectedPlatform(PLATFORMS.find((p) => p.id === 'instagram') || null);
    else if (lower.includes('youtube.com') || lower.includes('youtu.be')) setSelectedPlatform(PLATFORMS.find((p) => p.id === 'youtube') || null);
    else if (lower.includes('twitter.com') || lower.includes('x.com')) setSelectedPlatform(PLATFORMS.find((p) => p.id === 'twitter') || null);
    else if (lower.includes('facebook.com') || lower.includes('fb.watch')) setSelectedPlatform(PLATFORMS.find((p) => p.id === 'facebook') || null);
    else if (lower.includes('pinterest.com') || lower.includes('pin.it')) setSelectedPlatform(PLATFORMS.find((p) => p.id === 'pinterest') || null);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text.trim());
        detectAndSetPlatform(text.trim());
      }
    } catch {
      setErrorMsg('Gagal membaca clipboard. Tempel secara manual.');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = urlInput.trim();
    if (!clean) return;

    if (!selectedPlatform) {
      detectAndSetPlatform(clean);
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setProgress(25);
    setStage(`Menghubungkan ke server ${selectedPlatform?.name || 'media'}...`);

    try {
      const targetPlatformType = selectedPlatform?.id || 'auto';
      setProgress(50);
      setStage('Menganalisis konten & mengekstrak stream HD...');

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clean, type: targetPlatformType }),
      });

      setProgress(85);
      const data = await res.json();
      setProgress(100);

      if (data.success && data.data) {
        setResult(data.data);
        setActiveSlideIndex(0);
        setStage('Media berhasil diekstrak!');

        addHistoryItem({
          type: (selectedPlatform?.id as any) || 'downloader',
          title: `${selectedPlatform?.name || 'Media'}: ${data.data.title || 'Media Download'}`,
          subtitle: data.data.author ? `@${data.data.author}` : 'Siap diunduh HD',
          downloadUrl: data.data.videoUrl || data.data.audioUrl || data.data.images?.[0] || clean,
        });
      } else {
        setErrorMsg(data.error || data.message || 'Gagal mengekstrak media dari tautan yang diberikan.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan jaringan saat mengekstrak media.');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllSlides = (images: string[]) => {
    images.forEach((img, idx) => {
      setTimeout(() => {
        downloadFile(img, `slide_${idx + 1}_${Date.now()}.jpg`);
      }, idx * 400);
    });
  };

  // 1. TAMPILAN PILIH 6 PLATFORM UTAMA
  if (!selectedPlatform) {
    return (
      <div className="space-y-4 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b-2 border-[var(--neo-border)]">
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-[var(--neo-text)] uppercase">
              PILIH PLATFORM MEDIA
            </h2>
            <p className="text-xs text-[var(--neo-text-muted)] mt-0.5">
              Pilih platform di bawah untuk mengunduh video HD, foto slide/carousel, atau musik MP3.
            </p>
          </div>
          <span className="neo-badge bg-[var(--neo-accent)] text-[var(--neo-accent-text)] text-xs font-mono font-black self-start sm:self-auto px-2.5 py-0.5 rounded-full border border-black shadow-sm">
            6 PLATFORM UTAMA
          </span>
        </div>

        {/* 2 Kolom di Mobile & 3 Kolom di Desktop (Sesuai Permintaan) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          {PLATFORMS.map((plat) => (
            <button
              key={plat.id}
              type="button"
              onClick={() => {
                setSelectedPlatform(plat);
                setErrorMsg(null);
                setResult(null);
              }}
              className="neo-card p-3.5 sm:p-4 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 active:translate-y-0 transition-all text-left flex flex-col justify-between min-h-[125px] sm:min-h-[140px] group cursor-pointer"
            >
              {/* Top Row: Icon + Badge */}
              <div className="flex items-start justify-between gap-1 w-full">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border-2 border-[var(--neo-border)] shadow-sm ${plat.iconBg} ${plat.iconColor}`}
                >
                  <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="neo-badge bg-[var(--neo-bg)] text-[var(--neo-text)] text-[9px] sm:text-[10px] font-mono font-black border border-[var(--neo-border)] px-1.5 py-0.5 rounded-full truncate max-w-[110px]">
                  {plat.badge}
                </span>
              </div>

              {/* Bottom: Name & Action hint */}
              <div className="mt-2.5">
                <h3 className="font-black text-xs sm:text-sm text-[var(--neo-text)] tracking-tight group-hover:text-[var(--neo-accent-text)] transition-colors">
                  {plat.name}
                </h3>
                <p className="text-[10px] text-[var(--neo-text-muted)] line-clamp-2 mt-0.5 leading-snug">
                  {plat.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 2. TAMPILAN PANEL KERJA KHUSUS PLATFORM YANG DIPILIH
  const isSlideshow =
    result?.mediaType === 'slideshow' ||
    (Array.isArray(result?.images) && result.images.length > 0) ||
    (Array.isArray(result?.slides) && result.slides.length > 0);

  const slideImages: string[] = isSlideshow
    ? result.images || result.slides?.map((s: any) => (typeof s === 'string' ? s : s.url)) || []
    : [];

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header: Ganti Platform & Platform Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[var(--neo-border)]">
        <button
          type="button"
          onClick={() => {
            setSelectedPlatform(null);
            setResult(null);
            setErrorMsg(null);
          }}
          className="neo-btn neo-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ganti Platform</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono text-[var(--neo-text-muted)]">
            Platform:
          </span>
          <span className="neo-badge bg-[var(--neo-accent)] text-[var(--neo-accent-text)] text-xs font-black px-2.5 py-0.5 rounded-full border border-black shadow-sm">
            {selectedPlatform.name} ({selectedPlatform.badge})
          </span>
        </div>
      </div>

      {/* Input URL Form */}
      <form onSubmit={handleExtract} className="space-y-3">
        <div className="space-y-1">
          <label className="text-[11px] font-black uppercase tracking-wider text-[var(--neo-text)] block">
            Tautan {selectedPlatform.name}:
          </label>
          <div className="relative flex items-center">
            <input
              type="url"
              placeholder={selectedPlatform.placeholder}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full pl-3.5 pr-20 py-2.5 rounded-xl neo-input text-xs sm:text-sm font-medium border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] font-mono"
            />

            <div className="absolute right-2 flex items-center gap-1">
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput('')}
                  className="p-1 rounded-full text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]"
                  title="Hapus"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="neo-btn px-2 py-1 rounded-lg text-[10px] font-bold bg-[var(--neo-surface)] text-[var(--neo-text)] flex items-center gap-1 border border-[var(--neo-border)] shadow-sm"
                title="Tempel dari Clipboard"
              >
                <ClipboardPaste className="w-3 h-3" />
                <span className="hidden sm:inline">Tempel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <button
            type="submit"
            disabled={loading || !urlInput.trim()}
            className="neo-btn neo-btn-primary w-full sm:flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-neo-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{loading ? 'Mengekstrak Media...' : `Unduh Media ${selectedPlatform.name}`}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUrlInput(selectedPlatform.sampleUrl);
              detectAndSetPlatform(selectedPlatform.sampleUrl);
            }}
            className="neo-btn neo-btn-secondary w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold text-[var(--neo-text-muted)] hover:text-[var(--neo-text)] border border-[var(--neo-border)]"
          >
            Contoh Link Uji
          </button>
        </div>
      </form>

      {/* Loading Progress State */}
      {(loading || (progress > 0 && progress < 100)) && (
        <ProcessCard
          stage={stage}
          progress={progress}
          speed="2.4 MB/s"
          eta="00:01"
          isCompleted={progress === 100}
        />
      )}

      {/* Error Message */}
      {errorMsg && !loading && (
        <div className="p-3.5 rounded-xl border-2 border-rose-500/40 bg-rose-500/10 text-rose-500 text-xs font-bold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Media Result Preview Card */}
      {result && !loading && (
        <div className="neo-card p-4 sm:p-5 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--neo-border)]">
            <span className="text-[10px] sm:text-xs font-bold font-mono uppercase text-[var(--neo-text-muted)]">
              {isSlideshow ? `Galeri Foto Slide (${slideImages.length} Foto)` : 'Hasil Ekstraksi Media HD'}
            </span>
            <span className="neo-badge bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-black shadow-sm">
              SIAP DIUNDUH
            </span>
          </div>

          {/* A. JIKA FORMAT SLIDESHOW / CAROUSEL FOTO */}
          {isSlideshow && slideImages.length > 0 ? (
            <div className="space-y-4">
              {/* Header Galeri */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[var(--neo-text)] line-clamp-1">
                    {result.title || `${selectedPlatform.name} Foto Slide`}
                  </h3>
                  {result.author && (
                    <p className="text-xs text-[var(--neo-text-muted)] font-mono">
                      Kreator: @{result.author}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => downloadAllSlides(slideImages)}
                  className="neo-btn neo-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Unduh Semua Foto ({slideImages.length})</span>
                </button>
              </div>

              {/* Grid Preview Foto Slide */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {slideImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    <div className="relative aspect-[3/4] bg-neutral-900 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`Slide ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-1.5 left-1.5 neo-badge bg-black/80 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                        Slide {idx + 1}
                      </span>
                    </div>

                    <div className="p-2 bg-[var(--neo-surface)] border-t border-[var(--neo-border)]">
                      <button
                        type="button"
                        onClick={() => downloadFile(imgUrl, `slide_${idx + 1}_${Date.now()}.jpg`)}
                        className="w-full neo-btn neo-btn-secondary py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 text-[var(--neo-text)] hover:bg-[var(--neo-accent)]"
                      >
                        <Download className="w-3 h-3" />
                        <span>Unduh (.JPG)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Audio MP3 Player Latar */}
              {result.audioUrl && (
                <div className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--neo-text)]">
                      <Volume2 className="w-4 h-4 text-emerald-500" />
                      <span>Musik / Sound Audio Latar (.MP3)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadFile(result.audioUrl, `audio_${Date.now()}.mp3`)}
                      className="neo-btn neo-btn-primary px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Unduh Audio</span>
                    </button>
                  </div>
                  <audio src={result.audioUrl} controls className="w-full h-8" />
                </div>
              )}
            </div>
          ) : (
            /* B. JIKA FORMAT VIDEO TUNGGAL */
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Live Video Player or Thumbnail */}
              <div className="w-full sm:w-56 aspect-video sm:aspect-square bg-neutral-900 rounded-xl overflow-hidden border-2 border-[var(--neo-border)] shrink-0 relative flex items-center justify-center">
                {result.videoUrl ? (
                  <video
                    src={result.videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : result.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.thumbnail}
                    alt={result.title || 'Media Preview'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Film className="w-8 h-8 text-neutral-500" />
                )}
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 space-y-2.5 w-full text-left">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[var(--neo-text)] line-clamp-2">
                    {result.title || `${selectedPlatform.name} Media Clip`}
                  </h3>
                  {result.author && (
                    <p className="text-xs text-[var(--neo-accent-text)] font-mono font-bold mt-0.5">
                      Kreator: @{result.author}
                    </p>
                  )}
                </div>

                {/* Audio Preview if available */}
                {result.audioUrl && (
                  <div className="p-2.5 rounded-xl border border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--neo-text)]">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Pratinjau Audio MP3:</span>
                    </div>
                    <audio src={result.audioUrl} controls className="w-full h-8" />
                  </div>
                )}

                {/* Download Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {result.videoUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        downloadFile(
                          result.videoUrl,
                          `${selectedPlatform.id}_${Date.now()}.mp4`
                        )
                      }
                      className="neo-btn neo-btn-primary px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm text-center"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Video (.MP4)</span>
                    </button>
                  )}

                  {(result.audioUrl || result.downloadAudioUrl) && (
                    <button
                      type="button"
                      onClick={() =>
                        downloadFile(
                          result.audioUrl || result.downloadAudioUrl,
                          `${selectedPlatform.id}_audio_${Date.now()}.mp3`
                        )
                      }
                      className="neo-btn neo-btn-secondary px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm text-center"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Download Audio (.MP3)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
