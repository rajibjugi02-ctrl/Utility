'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Download,
  ExternalLink,
  ArrowLeft,
  ClipboardPaste,
  X,
  Play,
  Volume2,
  Film,
  Layers,
  Sparkles,
  Maximize2,
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

interface PlatformState {
  url: string;
  loading: boolean;
  progress: number;
  stage: string;
  result: any | null;
  error: string | null;
  selectedResId: string;
  activeSlideIndex: number;
}

const defaultPlatformState: PlatformState = {
  url: '',
  loading: false,
  progress: 0,
  stage: '',
  result: null,
  error: null,
  selectedResId: 'high',
  activeSlideIndex: 0,
};

export const MediaDownloaderHub: React.FC = () => {
  const { prefilledUrl, setPrefilledUrl, addHistoryItem, setActiveToolSlug } = useAppStore();

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformDef | null>(null);
  const [platformStates, setPlatformStates] = useState<Record<string, PlatformState>>({
    tiktok: { ...defaultPlatformState },
    instagram: { ...defaultPlatformState },
    youtube: { ...defaultPlatformState },
    twitter: { ...defaultPlatformState },
    facebook: { ...defaultPlatformState },
    pinterest: { ...defaultPlatformState },
  });

  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [videoAspect, setVideoAspect] = useState<'portrait' | 'landscape'>('portrait');
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activePlatId = selectedPlatform?.id || 'tiktok';
  const currentState = platformStates[activePlatId] || defaultPlatformState;

  const updateCurrentState = (updates: Partial<PlatformState>) => {
    setPlatformStates((prev) => ({
      ...prev,
      [activePlatId]: {
        ...(prev[activePlatId] || defaultPlatformState),
        ...updates,
      },
    }));
  };

  const detectAndSetPlatform = (url: string) => {
    const lower = url.toLowerCase();
    let plat: PlatformDef | null = null;
    if (lower.includes('tiktok.com')) plat = PLATFORMS.find((p) => p.id === 'tiktok') || null;
    else if (lower.includes('instagram.com')) plat = PLATFORMS.find((p) => p.id === 'instagram') || null;
    else if (lower.includes('youtube.com') || lower.includes('youtu.be')) plat = PLATFORMS.find((p) => p.id === 'youtube') || null;
    else if (lower.includes('twitter.com') || lower.includes('x.com')) plat = PLATFORMS.find((p) => p.id === 'twitter') || null;
    else if (lower.includes('facebook.com') || lower.includes('fb.watch')) plat = PLATFORMS.find((p) => p.id === 'facebook') || null;
    else if (lower.includes('pinterest.com') || lower.includes('pin.it')) plat = PLATFORMS.find((p) => p.id === 'pinterest') || null;

    if (plat) {
      setSelectedPlatform(plat);
      setPlatformStates((prev) => ({
        ...prev,
        [plat!.id]: {
          ...(prev[plat!.id] || defaultPlatformState),
          url,
        },
      }));
    }
  };

  useEffect(() => {
    if (prefilledUrl) {
      detectAndSetPlatform(prefilledUrl);
      setPrefilledUrl('');
    }
  }, [prefilledUrl, setPrefilledUrl]);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const clean = text.trim();
        updateCurrentState({ url: clean, error: null });
        if (!selectedPlatform) {
          detectAndSetPlatform(clean);
        }
      }
    } catch {
      updateCurrentState({ error: 'Gagal membaca clipboard. Tempel secara manual.' });
      setTimeout(() => updateCurrentState({ error: null }), 3000);
    }
  };

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = currentState.url.trim();
    if (!clean) return;

    if (!selectedPlatform) {
      detectAndSetPlatform(clean);
    }

    updateCurrentState({
      loading: true,
      error: null,
      result: null,
      progress: 25,
      stage: `Menghubungkan ke server ${selectedPlatform?.name || 'media'}...`,
    });

    try {
      const targetPlatformType = selectedPlatform?.id || 'auto';
      updateCurrentState({ progress: 50, stage: 'Menganalisis konten & mengekstrak stream HD...' });

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clean, type: targetPlatformType }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        updateCurrentState({
          loading: false,
          progress: 100,
          stage: 'Media berhasil diekstrak!',
          result: data.data,
          activeSlideIndex: 0,
        });

        addHistoryItem({
          type: (selectedPlatform?.id as any) || 'downloader',
          title: `${selectedPlatform?.name || 'Media'}: ${data.data.title || 'Media Download'}`,
          subtitle: data.data.author ? `@${data.data.author}` : 'Siap diunduh HD',
          downloadUrl: data.data.videoUrl || data.data.audioUrl || data.data.images?.[0] || clean,
        });
      } else {
        updateCurrentState({
          loading: false,
          progress: 0,
          error: data.error || data.message || 'Gagal mengekstrak media dari URL tersebut. Pastikan tautan publik dan aktif.',
        });
      }
    } catch (err: any) {
      updateCurrentState({
        loading: false,
        progress: 0,
        error: err.message || 'Terjadi kesalahan jaringan saat mengekstrak media.',
      });
    }
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    if (!fileUrl) {
      setDownloadStatus('❌ URL tidak tersedia');
      setTimeout(() => setDownloadStatus(null), 2500);
      return;
    }

    setDownloadStatus('Mengunduh...');

    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadStatus('✓ Unduhan Dimulai!');
    setTimeout(() => setDownloadStatus(null), 2500);
  };

  const downloadAllSlides = (images: string[]) => {
    images.forEach((img, idx) => {
      setTimeout(() => {
        downloadFile(img, `slide_${idx + 1}_${Date.now()}.jpg`);
      }, idx * 400);
    });
  };

  const handleToggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen().catch(() => {
          setIsFullscreenModalOpen(true);
        });
        return;
      } else if ((videoRef.current as any).webkitEnterFullscreen) {
        (videoRef.current as any).webkitEnterFullscreen();
        return;
      }
    }
    setIsFullscreenModalOpen(true);
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

  const {
    url: urlInput,
    loading,
    progress,
    stage,
    result,
    error: errorMsg,
    selectedResId,
  } = currentState;

  const setUrlInput = (url: string) => updateCurrentState({ url });
  const setSelectedResId = (selectedResId: string) => updateCurrentState({ selectedResId });

  // 2. TAMPILAN PANEL KERJA KHUSUS PLATFORM YANG DIPILIH
  const isSlideshow =
    result?.mediaType === 'slideshow' ||
    result?.mediaType === 'image' ||
    (Array.isArray(result?.images) && result.images.length > 0) ||
    (Array.isArray(result?.slides) && result.slides.length > 0);

  const slideImages: string[] = isSlideshow
    ? (Array.isArray(result.images) && result.images.length > 0)
      ? result.images
      : (Array.isArray(result.slides) && result.slides.length > 0)
      ? result.slides.map((s: any) => (typeof s === 'string' ? s : s.url))
      : result.thumbnail
      ? [result.thumbnail]
      : []
    : [];

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header: Ganti Platform & Platform Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[var(--neo-border)]">
        <button
          type="button"
          onClick={() => {
            setSelectedPlatform(null);
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
            (() => {
              const activeRes = Array.isArray(result.resolutions)
                ? result.resolutions.find((r: any) => r.id === selectedResId) || result.resolutions[0]
                : null;
              const activeVideoRaw = activeRes?.directUrl || activeRes?.videoUrl || result.videoUrl;
              // For TikTok/external CDN: proxy the video through our server to bypass CORS/hotlink blocks
              const needsProxy = Boolean(activeVideoRaw && (
                activeVideoRaw.includes('tikcdn.io') ||
                activeVideoRaw.includes('ssstik') ||
                activeVideoRaw.includes('tiktok.com') ||
                activeVideoRaw.includes('tikwm.com') ||
                activeVideoRaw.includes('muscdn.com') ||
                activeVideoRaw.includes('tiktokcdn.com') ||
                activeVideoRaw.includes('twimg.com') ||
                activeVideoRaw.includes('twitter.com') ||
                activeVideoRaw.includes('x.com') ||
                activeVideoRaw.includes('cdninstagram.com') ||
                activeVideoRaw.includes('fbcdn.net')
              ));
              const activeVideoUrl = needsProxy && activeVideoRaw
                ? `/api/proxy-media?url=${encodeURIComponent(activeVideoRaw)}`
                : activeVideoRaw;
              const hasEmbedPlayer = Boolean(result.embedPlayerUrl);
              const isImageFile = Boolean(activeVideoRaw && (
                activeVideoRaw.includes('.jpg') ||
                activeVideoRaw.includes('.jpeg') ||
                activeVideoRaw.includes('.png') ||
                activeVideoRaw.includes('.webp') ||
                activeVideoRaw.includes('pbs.twimg.com/media')
              ));
              const isDirectMp4 = !isImageFile && Boolean(activeVideoRaw && (
                activeVideoRaw.includes('.mp4') ||
                activeVideoRaw.includes('googlevideo') ||
                activeVideoRaw.includes('video.twimg.com') ||
                activeVideoRaw.includes('tikcdn') ||
                activeVideoRaw.includes('ssstik') ||
                activeVideoRaw.includes('tikwm') ||
                activeVideoRaw.includes('tiktok') ||
                activeVideoRaw.includes('cdninstagram') ||
                activeVideoRaw.includes('fbcdn')
              ));
              // YouTube embed support (nocookie iframe)
              const isYouTubeEmbed = Boolean(result.videoUrl && (result.videoUrl.includes('youtube-nocookie.com') || result.videoUrl.includes('youtube.com/embed')));
              const isPortrait = result.aspectRatio === '9:16' || selectedPlatform.id === 'tiktok' || (selectedPlatform.id === 'instagram' && !isSlideshow) || videoAspect === 'portrait';

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {/* Live Video Player or Thumbnail with Dynamic Natural Aspect Ratio */}
                    <div
                      className={`relative rounded-2xl overflow-hidden border-2 border-[var(--neo-border)] shadow-neo bg-black flex items-center justify-center shrink-0 transition-all ${
                        isPortrait
                          ? 'w-full max-w-[260px] sm:max-w-[280px] aspect-[9/16] mx-auto sm:mx-0'
                          : 'w-full max-w-sm sm:max-w-md aspect-video mx-auto sm:mx-0'
                      }`}
                    >
                      {isDirectMp4 ? (
                        <video
                          ref={videoRef}
                          key={activeVideoUrl}
                          src={activeVideoUrl}
                          poster={result.thumbnail}
                          controls
                          playsInline
                          onLoadedMetadata={(e) => {
                            const v = e.currentTarget;
                            if (v.videoWidth && v.videoHeight) {
                              setVideoAspect(v.videoHeight > v.videoWidth ? 'portrait' : 'landscape');
                            }
                          }}
                          onError={() => {
                            // If proxy fails, don't crash - just show fallback thumbnail
                          }}
                          className="w-full h-full object-contain bg-black"
                        />
                      ) : isYouTubeEmbed ? (
                        <iframe
                          src={result.videoUrl}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                          title={result.title || 'YouTube Video'}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-neutral-900 to-black flex flex-col items-center justify-between text-center relative overflow-hidden">
                          {/* Cover / Thumbnail full bleed */}
                          {result.thumbnail && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={result.thumbnail}
                              alt={result.title || 'Media Preview'}
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover opacity-70"
                            />
                          )}
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

                          {/* Top badge */}
                          <div className="relative z-10 w-full flex items-center justify-between p-3">
                            <span className="neo-badge bg-[var(--neo-accent)] text-black text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-black shadow-xs">
                              {selectedPlatform.name} HD
                            </span>
                            <span className="neo-badge bg-emerald-500 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-black shadow-xs">
                              SIAP DIUNDUH ✓
                            </span>
                          </div>

                          {/* Center play icon (decorative) */}
                          <div className="relative z-10 my-auto flex flex-col items-center gap-2">
                            <div className="w-14 h-14 rounded-full bg-black/70 border-2 border-white/60 text-white flex items-center justify-center shadow-lg backdrop-blur-sm">
                              <Play className="w-7 h-7 ml-0.5" />
                            </div>
                          </div>

                          {/* Bottom: open link */}
                          <div className="relative z-10 w-full px-3 pb-3">
                            <a
                              href={urlInput}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-1.5 px-2 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold rounded-lg border border-white/30 backdrop-blur-sm flex items-center justify-center gap-1 transition-all"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Tonton di {selectedPlatform.name} ↗</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Floating Fullscreen Trigger Button on Player */}
                      <button
                        type="button"
                        onClick={handleToggleFullscreen}
                        className="absolute top-2.5 right-2.5 z-20 neo-btn bg-black/80 hover:bg-black text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-white/20 shadow-sm backdrop-blur-sm transition-all cursor-pointer"
                        title="Buka Layar Penuh (Fullscreen)"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Fullscreen</span>
                      </button>
                    </div>

                    {/* Title & Metadata */}
                    <div className="flex-1 space-y-2.5 w-full text-left">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--neo-accent)] text-[var(--neo-accent-text)] border border-black shadow-xs">
                            {isPortrait ? 'Format: Vertikal 9:16' : 'Format: Horisontal 16:9'}
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                            {isDirectMp4 ? 'Preview Aktif ▶' : 'Siap Diunduh ✓'}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-[var(--neo-text)] line-clamp-2">
                          {result.title || `${selectedPlatform.name} Media Clip`}
                        </h3>
                        {result.author && (
                          <p className="text-xs text-[var(--neo-accent-text)] font-mono font-bold mt-0.5">
                            Kreator: @{result.author}
                          </p>
                        )}
                      </div>

                      {/* Tombol Khusus Layar Penuh (Fullscreen) */}
                      <div>
                        <button
                          type="button"
                          onClick={handleToggleFullscreen}
                          className="neo-btn neo-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border-2 hover:bg-[var(--neo-accent)] text-[var(--neo-text)] shadow-neo-sm transition-all cursor-pointer"
                        >
                          <Maximize2 className="w-4 h-4 text-amber-500" />
                          <span>Lihat Layar Penuh (Fullscreen)</span>
                        </button>
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
                    </div>
                  </div>

                  {/* RESOLUTION SELECTOR (4K, HD, SD, MP3) */}
                  {Array.isArray(result.resolutions) && result.resolutions.length > 0 && (
                    <div className="space-y-2.5 pt-3 border-t border-[var(--neo-border)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-[var(--neo-text)]">
                          PILIH RESOLUSI & KUALITAS UNDUHAN:
                        </span>
                        <span className="text-[10px] font-mono text-[var(--neo-text-muted)]">
                          Tersedia {result.resolutions.length} Pilihan
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {result.resolutions.map((res: any) => {
                          const isSelected = selectedResId === res.id || (!selectedResId && res.isDefault);
                          return (
                            <button
                              key={res.id}
                              type="button"
                              onClick={() => setSelectedResId(res.id)}
                              className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-[var(--neo-accent)] text-[var(--neo-accent-text)] border-black shadow-neo-sm -translate-y-0.5'
                                  : 'bg-[var(--neo-bg)] text-[var(--neo-text)] border-[var(--neo-border)] hover:bg-[var(--neo-surface)]'
                              }`}
                            >
                              <div>
                                <span className="text-[9px] font-mono font-bold uppercase block opacity-80">
                                  {res.badge || res.resolution}
                                </span>
                                <div className="text-xs font-black mt-0.5 line-clamp-1">
                                  {res.label}
                                </div>
                              </div>
                              {res.size && (
                                <div className="text-[10px] font-mono font-bold mt-1.5 opacity-90">
                                  Ukuran: {res.size}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Primary Download Button for selected resolution */}
                      <div className="pt-1 flex flex-col gap-2.5">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const targetRes = result.resolutions.find((r: any) => r.id === selectedResId) || result.resolutions[0];
                              downloadFile(
                                targetRes.url || targetRes.videoUrl || result.videoUrl,
                                `${selectedPlatform.id}_${targetRes.id}_${Date.now()}.${targetRes.format || 'mp4'}`
                              );
                            }}
                            className="flex-1 neo-btn neo-btn-primary py-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-neo-sm text-center cursor-pointer transition-all active:translate-y-0.5"
                          >
                            <Download className="w-4 h-4" />
                            <span>
                              {downloadStatus
                                ? downloadStatus
                                : `Unduh Resolusi Terpilih (${result.resolutions.find((r: any) => r.id === selectedResId)?.label || 'HD'})`}
                            </span>
                          </button>

                          {(result.audioUrl || result.downloadAudioUrl) && (
                            <button
                              type="button"
                              onClick={() =>
                                downloadFile(
                                  result.audioUrl || result.downloadAudioUrl,
                                  `${selectedPlatform.id}_audio_${Date.now()}.mp3`
                                )
                              }
                              className="neo-btn neo-btn-secondary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm text-center cursor-pointer"
                            >
                              <Volume2 className="w-4 h-4 text-emerald-500" />
                              <span>Unduh MP3 Saja</span>
                            </button>
                          )}
                        </div>

                        {/* Opsi Server Cadangan (hanya jika download utama gagal) */}
                        {selectedPlatform.id === 'tiktok' && (
                          <details className="rounded-xl border border-[var(--neo-border)] overflow-hidden">
                            <summary className="text-[10px] font-mono font-bold uppercase text-[var(--neo-text-muted)] px-2.5 py-2 bg-[var(--neo-bg)] cursor-pointer select-none list-none flex items-center justify-between">
                              <span>⚡ Jika Gagal — Coba Server Cadangan</span>
                              <ExternalLink className="w-3 h-3 opacity-50" />
                            </summary>
                            <div className="grid grid-cols-2 gap-2 p-2.5 bg-[var(--neo-bg)]">
                              <a
                                href="https://snaptik.app/id"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="neo-btn neo-btn-secondary py-2 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs text-center cursor-pointer hover:bg-[var(--neo-accent)]"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                                <span>SnapTik HD ↗</span>
                              </a>
                              <a
                                href="https://ssstik.io/id"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="neo-btn neo-btn-secondary py-2 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs text-center cursor-pointer hover:bg-[var(--neo-accent)]"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                                <span>SSSTik HD ↗</span>
                              </a>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fallback download buttons if resolutions array was not provided */}
                  {(!result.resolutions || result.resolutions.length === 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[var(--neo-border)]">
                      {result.videoUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            downloadFile(
                              result.downloadVideoUrl || result.videoUrl,
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
                  )}

                  {/* Direct Bridge to WhatsApp Status HD Anti-Burem */}
                  <div className="pt-2 border-t border-[var(--neo-border)]">
                    <button
                      type="button"
                      onClick={() => {
                        const chosenRes = result.resolutions?.find((r: any) => r.id === selectedResId) || result.resolutions?.[0];
                        const targetMediaUrl = chosenRes?.directUrl || chosenRes?.url || result.videoUrl || '';
                        setPrefilledUrl(targetMediaUrl);
                        setActiveToolSlug('wa-status-hd');
                      }}
                      className="w-full p-3 rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-between text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-left">
                          Mau upload ke <strong>Status WhatsApp</strong>? Optimalkan agar <strong>Tidak Burem & Terpotong 30 Detik</strong>!
                        </span>
                      </div>
                      <span className="neo-badge bg-emerald-500 text-white text-[10px] font-mono px-2.5 py-1 rounded-full shrink-0 shadow-sm">
                        Buka Status HD →
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isFullscreenModalOpen && result && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl flex items-center justify-between pb-3 text-white border-b border-white/10 mb-2">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm sm:text-base line-clamp-1">
                {result.title || 'Layar Penuh'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreenModalOpen(false)}
              className="neo-btn bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Tutup Fullscreen</span>
            </button>
          </div>

          <div
            className={`relative flex items-center justify-center my-auto w-full ${
              result.aspectRatio === '9:16' || selectedPlatform?.id === 'tiktok' || videoAspect === 'portrait'
                ? 'max-w-[340px] sm:max-w-[380px] aspect-[9/16] max-h-[82vh]'
                : 'max-w-4xl aspect-video max-h-[82vh]'
            }`}
          >
            {(() => {
              // Find the best direct video URL for fullscreen
              const fsRes = Array.isArray(result.resolutions)
                ? result.resolutions.find((r: any) => r.id === selectedResId) || result.resolutions[0]
                : null;
              const fsRaw = fsRes?.directUrl || result.videoUrl || '';
              const fsNeedsProxy = fsRaw && (
                fsRaw.includes('tikcdn.io') ||
                fsRaw.includes('ssstik') ||
                fsRaw.includes('tiktok') ||
                fsRaw.includes('tikwm') ||
                fsRaw.includes('muscdn')
              );
              const fsSrc = fsNeedsProxy ? `/api/proxy-media?url=${encodeURIComponent(fsRaw)}` : fsRaw;
              const fsIsImage = Boolean(fsRaw && (
                fsRaw.includes('.jpg') ||
                fsRaw.includes('.jpeg') ||
                fsRaw.includes('.png') ||
                fsRaw.includes('.webp') ||
                fsRaw.includes('pbs.twimg.com/media')
              ));
              const fsCanPlay = !fsIsImage && Boolean(fsRaw && (
                fsRaw.includes('.mp4') ||
                fsRaw.includes('tikcdn') ||
                fsRaw.includes('ssstik') ||
                fsRaw.includes('tikwm') ||
                fsRaw.includes('tiktok') ||
                fsRaw.includes('googlevideo') ||
                fsRaw.includes('video.twimg.com')
              ));
              const fsIsYt = Boolean(result.videoUrl && (result.videoUrl.includes('youtube-nocookie.com') || result.videoUrl.includes('youtube.com/embed')));

              if (fsIsYt) return (
                <iframe
                  src={result.videoUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-2xl"
                  title={result.title || 'YouTube Video'}
                />
              );

              if (fsIsImage || result.mediaType === 'image') return (
                <img
                  src={fsSrc || result.thumbnail}
                  alt={result.title || 'Preview'}
                  className="w-full h-full object-contain rounded-2xl shadow-2xl bg-black"
                />
              );

              if (fsCanPlay) return (
                <video
                  src={fsSrc}
                  poster={result.thumbnail}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain rounded-2xl shadow-2xl bg-black"
                />
              );

              return (
                <div className="w-full h-full rounded-2xl bg-gradient-to-b from-neutral-900 to-black p-6 flex flex-col items-center justify-between text-center border border-white/20 shadow-2xl relative overflow-hidden">
                  {result.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.thumbnail}
                      alt="Fullscreen Preview"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover opacity-60 rounded-2xl"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70 rounded-2xl" />
                  <div className="relative z-10 w-full flex justify-between">
                    <span className="neo-badge bg-[var(--neo-accent)] text-black text-xs font-mono font-bold px-3 py-1 rounded-full border border-black">
                      {selectedPlatform?.name || 'Media'} Fullscreen HD
                    </span>
                  </div>
                  <div className="relative z-10 my-auto flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-black/70 border-2 border-white/60 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm">
                      <Play className="w-10 h-10 ml-1" />
                    </div>
                    <h3 className="text-white text-base font-bold line-clamp-2 max-w-xs drop-shadow-lg">
                      {result.title || 'Video Siap Diunduh'}
                    </h3>
                  </div>
                  <div className="relative z-10 w-full">
                    <a
                      href={urlInput}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl border border-white/30 backdrop-blur-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Tonton Langsung di {selectedPlatform?.name || 'Platform'} ↗</span>
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="w-full max-w-md pt-2 text-center text-[11px] text-white/60">
            Tekan tombol <strong>Tutup Fullscreen</strong> untuk kembali ke tampilan alat.
          </div>
        </div>
      )}
    </div>
  );
};
