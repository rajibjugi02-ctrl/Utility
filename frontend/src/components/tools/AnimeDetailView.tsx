'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Star,
  Film,
  Play,
  Copy,
  Check,
  Tv,
  Calendar,
  Building,
  Sparkles,
  ExternalLink,
  Users,
  Video,
  Flame,
  X,
} from 'lucide-react';

export interface AnimeDetailData {
  id: number;
  idMal?: number;
  title: {
    romaji: string;
    english?: string;
    native?: string;
  };
  coverImage: {
    extraLarge: string;
    large: string;
    color?: string;
  };
  bannerImage?: string;
  averageScore?: number;
  scoreFormatted?: string;
  popularity?: number;
  favourites?: number;
  episodes?: number;
  duration?: number;
  status?: string;
  season?: string;
  seasonYear?: number;
  startDate?: { year?: number; month?: number; day?: number };
  genres: string[];
  studio?: string;
  description?: string;
  mainTrailer?: {
    id: string;
    site: string;
    url: string;
    embedUrl: string;
  } | null;
  promos?: Array<{
    title: string;
    youtubeId: string;
    url: string;
    embedUrl: string;
    thumbnail: string;
  }>;
  musicVideos?: Array<{
    title: string;
    youtubeId: string;
    url: string;
    embedUrl: string;
  }>;
  characters?: Array<{
    id: number;
    role: string;
    name: {
      full: string;
      native?: string;
    };
    image: string;
    voiceActor?: {
      id: number;
      name: string;
      native?: string;
      image: string;
      language: string;
    } | null;
  }>;
  recommendations?: Array<{
    id: number;
    idMal?: number;
    title: {
      romaji: string;
      english?: string;
    };
    coverImage: {
      extraLarge: string;
      large: string;
      color?: string;
    };
    averageScore?: number;
    scoreFormatted?: string;
    episodes?: number;
    status?: string;
  }>;
  epicClips?: Array<{
    id: string;
    title: string;
    cover: string;
    videoUrl: string;
    embedUrl?: string;
    duration: number;
    author: string;
    isYouTube?: boolean;
  }>;
  youtubeSearchUrl?: string;
}

interface AnimeDetailViewProps {
  animeId: number;
  onBack: () => void;
  onSelectAnime: (id: number) => void;
}

export const AnimeDetailView: React.FC<AnimeDetailViewProps> = ({ animeId, onBack, onSelectAnime }) => {
  const [data, setData] = useState<AnimeDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeClipModal, setActiveClipModal] = useState<{ url: string; title: string; isEmbed?: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when clip modal is open
  useEffect(() => {
    if (activeClipModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeClipModal]);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/anime/${animeId}`);
        if (!res.ok) {
          throw new Error('Gagal memuat detail anime dari server.');
        }
        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Detail anime tidak ditemukan.');
        }
        if (isMounted) {
          setData(json.data);
          if (json.data.mainTrailer?.embedUrl) {
            setActiveVideoUrl(json.data.mainTrailer.embedUrl);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Terjadi kesalahan saat memuat detail.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [animeId]);

  const handleCopyTitle = () => {
    if (!data) return;
    const title = data.title.romaji || data.title.english || '';
    navigator.clipboard.writeText(title);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="flex items-center gap-3">
          <div className="w-24 h-9 bg-[var(--neo-bg)] border-2 border-[var(--neo-border)] rounded-xl" />
        </div>
        <div className="h-44 sm:h-64 w-full bg-[var(--neo-bg)] border-2 border-[var(--neo-border)] rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-80 bg-[var(--neo-bg)] border-2 border-[var(--neo-border)] rounded-2xl" />
          <div className="md:col-span-2 space-y-4">
            <div className="h-8 bg-[var(--neo-bg)] border-2 border-[var(--neo-border)] rounded-xl w-3/4" />
            <div className="h-24 bg-[var(--neo-bg)] border-2 border-[var(--neo-border)] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4 neo-card rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)]">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border-2 border-rose-500">
          <Film className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[var(--neo-text)]">{error || 'Gagal Memuat Detail Anime'}</h3>
        <button
          type="button"
          onClick={onBack}
          className="neo-btn neo-btn-secondary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pencarian</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-[var(--neo-border)]">
        <button
          type="button"
          onClick={onBack}
          className="neo-btn neo-btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Anime</span>
        </button>

        <button
          type="button"
          onClick={handleCopyTitle}
          className="neo-btn neo-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-bold">Judul Disalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Judul</span>
            </>
          )}
        </button>
      </div>

      {/* Hero Header Section */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] shadow-neo">
        {/* HD Banner Background if available */}
        {data.bannerImage ? (
          <div className="relative h-44 sm:h-64 w-full overflow-hidden border-b-2 border-[var(--neo-border)]">
            <img
              src={data.bannerImage}
              alt={data.title.romaji}
              className="w-full h-full object-cover object-center filter brightness-[0.85]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        ) : (
          <div className="h-16 bg-[var(--neo-border)]/10" />
        )}

        {/* Content Box Overlapping Hero */}
        <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-5 items-start">
          {/* Vertical Poster Aspect 2/3 */}
          <div className="w-36 sm:w-48 shrink-0 rounded-2xl overflow-hidden border-2 border-[var(--neo-border)] shadow-neo bg-black -mt-16 sm:-mt-24 relative z-10">
            <img
              src={data.coverImage.extraLarge || data.coverImage.large}
              alt={data.title.romaji}
              className="w-full aspect-[2/3] object-cover"
            />
          </div>

          {/* Title & Metadata */}
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-[var(--neo-text)] tracking-tight leading-snug">
                {data.title.romaji}
              </h1>
              {data.title.english && data.title.english !== data.title.romaji && (
                <p className="text-xs font-semibold text-[var(--neo-text-muted)] font-mono">
                  {data.title.english}
                </p>
              )}
              {data.title.native && (
                <p className="text-[11px] text-[var(--neo-text-muted)] opacity-80">
                  {data.title.native}
                </p>
              )}
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="neo-badge bg-amber-400 text-black border-2 border-black font-black text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-black" />
                <span>★ {data.scoreFormatted}</span>
              </span>

              <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] border-2 border-[var(--neo-border)] font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Tv className="w-3 h-3 text-indigo-500" />
                <span>{data.episodes ? `${data.episodes} Episode` : 'TBA'}</span>
              </span>

              <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] border-2 border-[var(--neo-border)] font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Calendar className="w-3 h-3 text-emerald-500" />
                <span>{data.seasonYear || (data.startDate?.year ? String(data.startDate.year) : 'Tahun N/A')}</span>
              </span>

              <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] border-2 border-[var(--neo-border)] font-bold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Building className="w-3 h-3 text-rose-500" />
                <span>{data.studio || 'Studio'}</span>
              </span>

              <span className="neo-badge bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/40 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                {data.status}
              </span>
            </div>

            {/* Genre Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {data.genres.map((g) => (
                <span
                  key={g}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-lg border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] text-[var(--neo-text)] shadow-sm"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Synopsis Cerita Lengkap */}
      <div className="neo-card p-4 sm:p-5 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-sm space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--neo-text)]">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>✨ SINOPSIS CERITA LENGKAP</span>
        </div>
        <p className="text-xs leading-relaxed text-[var(--neo-text-muted)] whitespace-pre-line font-medium">
          {data.description || 'Tidak ada ringkasan sinopsis untuk anime ini.'}
        </p>
      </div>

      {/* Official Trailer & PV Videos Section */}
      {(data.mainTrailer || (data.promos && data.promos.length > 0)) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-[var(--neo-text)] uppercase tracking-wider flex items-center gap-2">
              <Film className="w-4 h-4 text-indigo-500" />
              <span>Trailer Resmi & Kumpulan PV Video</span>
            </h3>
            {data.mainTrailer?.url && (
              <a
                href={data.mainTrailer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
              >
                <span>Buka di YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Active Trailer Player */}
          {activeVideoUrl && (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-[var(--neo-border)] shadow-neo bg-black">
              <iframe
                src={activeVideoUrl}
                title="Trailer Pemutar Video Anime"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}

          {/* Video Selector Tabs / Carousels */}
          {data.promos && data.promos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {data.promos.map((promo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveVideoUrl(promo.embedUrl)}
                  className={`neo-card p-2 rounded-xl border-2 text-left shrink-0 w-44 transition-all shadow-sm ${activeVideoUrl === promo.embedUrl
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-[var(--neo-border)] bg-[var(--neo-surface)] hover:bg-[var(--neo-bg)]'
                    }`}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-black/20 bg-neutral-900 mb-1.5">
                    {promo.thumbnail ? (
                      <img src={promo.thumbnail} alt={promo.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <Play className="w-5 h-5" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 rounded">
                      PV {idx + 1}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-[var(--neo-text)] truncate">{promo.title}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Characters and Seiyuu (Voice Actors) */}
      {data.characters && data.characters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-black text-[var(--neo-text)] uppercase tracking-wider">
              Tokoh Karakter & Seiyuu (Pengisi Suara)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {data.characters.map((char) => (
              <div
                key={char.id}
                className="neo-card p-2.5 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-sm flex gap-2.5 items-center"
              >
                {/* Character Thumbnail */}
                <div className="w-12 h-16 rounded-xl overflow-hidden border-2 border-[var(--neo-border)] shrink-0 bg-neutral-800">
                  <img src={char.image} alt={char.name.full} className="w-full h-full object-cover" />
                </div>

                <div className="overflow-hidden space-y-0.5">
                  <span
                    className={`inline-block text-[9px] font-black px-1.5 py-0.2 rounded ${char.role === 'MAIN'
                      ? 'bg-amber-400 text-black border border-black'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-[var(--neo-text-muted)]'
                      }`}
                  >
                    {char.role}
                  </span>
                  <div className="text-xs font-bold text-[var(--neo-text)] truncate">{char.name.full}</div>

                  {char.voiceActor && (
                    <div className="pt-0.5 flex items-center gap-1 truncate text-[10px] text-[var(--neo-text-muted)]">
                      <span className="text-[9px] font-mono font-bold text-indigo-500">VA:</span>
                      <span className="truncate">{char.voiceActor.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔥 Klip & Scene Epic Anime (TikWM & Community Edit Clips) */}
      {data.epicClips && data.epicClips.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-[var(--neo-text)] uppercase tracking-wider flex items-center gap-2 text-rose-500">
              <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
              <span>🔥 Klip & Scene Epic Anime</span>
            </h3>
            {data.youtubeSearchUrl && (
              <a
                href={data.youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 hover:underline"
              >
                <span>Cari Lebih Banyak di YouTube ↗</span>
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.epicClips.map((clip) => (
              <div
                key={clip.id}
                onClick={() =>
                  setActiveClipModal({
                    url: clip.embedUrl || clip.videoUrl,
                    title: clip.title,
                    isEmbed: Boolean(clip.isYouTube || clip.embedUrl),
                  })
                }
                className="neo-card p-2 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-sm cursor-pointer hover:border-rose-500 transition-all group"
              >
                <div className="relative aspect-[9/14] sm:aspect-video rounded-xl overflow-hidden border border-black/20 bg-black">
                  <img
                    src={clip.cover}
                    alt={clip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg border-2 border-white">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>
                  {clip.duration > 0 && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 rounded">
                      {Math.floor(clip.duration)}s
                    </span>
                  )}
                </div>
                <div className="pt-1.5 space-y-0.5">
                  <div className="text-xs font-bold text-[var(--neo-text)] truncate">{clip.title}</div>
                  <div className="text-[10px] text-[var(--neo-text-muted)] truncate">@{clip.author}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations / Rekomendasi Anime Serupa */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black text-[var(--neo-text)] uppercase tracking-wider">
              Rekomendasi Anime Serupa
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {data.recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => onSelectAnime(rec.id)}
                className="neo-card p-2 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-sm cursor-pointer hover:border-indigo-500 transition-all group"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-black/20 bg-neutral-900 mb-1.5">
                  <img
                    src={rec.coverImage.extraLarge || rec.coverImage.large}
                    alt={rec.title.romaji}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-1 right-1 bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.2 rounded border border-black shadow-sm">
                    ★ {rec.scoreFormatted}
                  </div>
                </div>
                <div className="text-xs font-bold text-[var(--neo-text)] truncate">{rec.title.romaji}</div>
                <div className="text-[10px] text-[var(--neo-text-muted)]">
                  {rec.episodes ? `${rec.episodes} Ep` : 'TBA'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pop-up Video Player Modal for Epic Clips rendered directly to document.body */}
      {mounted && activeClipModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
          }}
        >
          {/* Full-bleed solid dark backdrop extending -100px past every edge to eliminate any blur seams or gaps */}
          <div
            onClick={() => setActiveClipModal(null)}
            className="absolute bg-black/92 backdrop-blur-xl cursor-pointer"
            style={{
              position: 'absolute',
              top: '-100px',
              left: '-100px',
              right: '-100px',
              bottom: '-100px',
              width: 'calc(100vw + 200px)',
              height: 'calc(100vh + 200px)',
            }}
          />

          {/* Modal Content Dialog */}
          <div className="relative z-10 w-full max-w-3xl lg:max-w-4xl bg-[var(--neo-surface)] border-2 border-black rounded-3xl p-4 sm:p-6 shadow-neo space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--neo-border)] gap-3">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border-2 border-rose-500 text-rose-500 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 fill-rose-500" />
                </div>
                <div className="truncate">
                  <h4 className="text-xs sm:text-sm font-black text-[var(--neo-text)] truncate">
                    {activeClipModal.title}
                  </h4>
                  <span className="text-[10px] text-[var(--neo-text-muted)] font-mono">
                    Pemutar Klip Video Anime HD
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeClipModal.url.includes('youtube.com') && (
                  <a
                    href={activeClipModal.url.replace('/embed/', '/watch?v=')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-btn neo-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold hidden sm:flex items-center gap-1 shadow-sm text-rose-500"
                  >
                    <span>YouTube</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setActiveClipModal(null)}
                  className="neo-btn p-2 rounded-xl bg-[var(--neo-bg)] hover:bg-rose-500 hover:text-white border-2 border-black transition-colors cursor-pointer shadow-sm"
                  title="Tutup Pemutar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video Player Display Container (Cinematic 16:9 Aspect Ratio) */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border-2 border-black shadow-inner">
              {activeClipModal.isEmbed ? (
                <iframe
                  src={activeClipModal.url}
                  title={activeClipModal.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <video
                  src={activeClipModal.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
              <span className="text-[11px] text-[var(--neo-text-muted)] font-mono">
                Tekan area luar atau tombol Tutup untuk kembali.
              </span>
              <button
                type="button"
                onClick={() => setActiveClipModal(null)}
                className="neo-btn bg-black hover:bg-neutral-800 text-white border-2 border-black px-6 py-2.5 rounded-xl text-xs font-black shadow-neo-sm transition-transform active:scale-95 cursor-pointer ml-auto"
              >
                Tutup Klip Video
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
