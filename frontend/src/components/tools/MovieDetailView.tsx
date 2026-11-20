'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  X,
  Star,
  Copy,
  Check,
  Play,
  Film,
  ExternalLink,
  Users,
  Image as ImageIcon,
  Sparkles,
  Clapperboard,
  Clock,
  Tv,
} from 'lucide-react';
import { MovieDetailResponse } from '@/app/api/movies/[id]/route';

interface MovieDetailViewProps {
  movieId: string;
  onBack: () => void;
  onSelectMovie?: (id: string) => void;
}

export const MovieDetailView: React.FC<MovieDetailViewProps> = ({
  movieId,
  onBack,
  onSelectMovie,
}) => {
  const [movie, setMovie] = useState<MovieDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // Scroll to top when view opens
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    fetch(`/api/movies/${movieId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.data) {
          setMovie(data.data);
        } else {
          setError(data.message || 'Gagal memuat detail film.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Terjadi kesalahan jaringan.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [movieId]);

  const handleCopyTitle = () => {
    if (!movie) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${movie.title} (${movie.year})`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scrollToTrailer = () => {
    const el = document.getElementById('movie-trailer-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-10 bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] rounded-2xl w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="aspect-[2/3] bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] rounded-3xl" />
          <div className="md:col-span-2 space-y-4">
            <div className="h-10 bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] rounded-xl w-3/4" />
            <div className="h-6 bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] rounded-xl w-1/2" />
            <div className="h-24 bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="w-full max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border-2 border-rose-500 text-rose-500 flex items-center justify-center mx-auto">
          <Film className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-[var(--neo-text)]">
          {error || 'Detail film tidak ditemukan'}
        </h3>
        <p className="text-xs text-[var(--neo-text-muted)]">
          Film ini mungkin belum memiliki data lengkap di server katalog.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="neo-btn neo-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
        >
          ← Kembali ke Pencarian
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-6">
      {/* 1. Header Bar Halaman Detail - Persis Gambar Referensi */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-[var(--neo-border)]">
        <div className="flex items-center gap-2">
          <span className="neo-badge bg-[#A5F3FC] text-[#083344] font-black text-xs px-3 py-1 rounded-full border-2 border-[#121212] shadow-sm flex items-center gap-1.5 uppercase">
            <Clapperboard className="w-3.5 h-3.5" />
            <span>DETAIL FILM</span>
          </span>
          <span className="font-mono text-xs font-bold text-[var(--neo-text-muted)]">
            #{movie.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="neo-btn neo-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Daftar Film</span>
          </button>
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] hover:bg-[var(--neo-bg)] text-[var(--neo-text)] shadow-sm transition-all"
            aria-label="Tutup Detail"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Hero Detail Film (Poster Kiri & Info Utama Kanan) - Persis Referensi */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 items-start">
        {/* Poster Kiri */}
        <div className="md:col-span-5 lg:col-span-4">
          <div className="relative aspect-[2/3] max-w-[280px] md:max-w-none mx-auto rounded-3xl overflow-hidden border-3 border-[var(--neo-border)] shadow-neo bg-neutral-900 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            {/* Rating Bintang Kuning di Pojok Kanan Atas */}
            <div className="absolute top-3 right-3 bg-[#FFE66D] text-[#121212] px-2.5 py-1 rounded-full border-2 border-[#121212] font-black text-xs sm:text-sm flex items-center gap-1 shadow-sm">
              <Star className="w-3.5 h-3.5 fill-[#121212]" />
              <span>{movie.rating}</span>
            </div>
          </div>
        </div>

        {/* Info Utama Kanan */}
        <div className="md:col-span-7 lg:col-span-8 space-y-3.5 text-left">
          {/* Judul & Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-[var(--neo-text)]">
              {movie.title}
            </h1>
            <p className="text-xs sm:text-sm italic text-[var(--neo-text-muted)] pt-0.5">
              {movie.original_title !== movie.title ? `${movie.original_title} · ` : ''}
              {movie.tagline}
            </p>
          </div>

          {/* Baris 1: Status & Teknis */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] text-[11px] font-bold px-2.5 py-1 rounded-xl border-2 border-[var(--neo-border)] shadow-sm">
              {movie.status}
            </span>
            <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] text-[11px] font-bold px-2.5 py-1 rounded-xl border-2 border-[var(--neo-border)] shadow-sm flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{movie.duration}</span>
            </span>
            <span className="neo-badge bg-[#FEF08A] text-[#713F12] text-[11px] font-black px-2.5 py-1 rounded-xl border-2 border-[#121212] shadow-sm">
              Populer
            </span>
            <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text-muted)] text-[10px] font-mono px-2 py-0.5 rounded-xl border border-[var(--neo-border)]">
              {movie.quality}
            </span>
          </div>

          {/* Baris 2: Genre Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {movie.genres.map((g) => (
              <span
                key={g}
                className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] text-[11px] font-extrabold px-3 py-1 rounded-xl border-2 border-[var(--neo-border)]"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Kotak Info Kru Singkat */}
          <div className="p-3 sm:p-3.5 rounded-2xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[var(--neo-text)]">🎬 Sutradara:</span>
              <span className="text-[var(--neo-text-muted)] font-medium">{movie.director}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[var(--neo-text)]">🏢 Studio / Negara:</span>
              <span className="text-[var(--neo-text-muted)] font-medium">
                {movie.studio} ({movie.country})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[var(--neo-text)]">🌐 Bahasa:</span>
              <span className="text-[var(--neo-text-muted)] font-medium">{movie.language}</span>
            </div>
          </div>

          {/* Baris Tombol Aksi Cepat */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyTitle}
              className="neo-btn neo-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Judul</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={scrollToTrailer}
              className="neo-btn neo-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Tonton Trailer</span>
            </button>

            {movie.imdb_url && (
              <a
                href={movie.imdb_url}
                target="_blank"
                rel="noopener noreferrer"
                className="neo-btn neo-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>IMDb</span>
                <ExternalLink className="w-3 h-3 text-[var(--neo-text-muted)]" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 3. Kotak SINOPSIS CERITA LENGKAP - Persis Gambar Referensi */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-500">
          <Sparkles className="w-4 h-4 fill-amber-500" />
          <span>SINOPSIS CERITA LENGKAP</span>
        </div>

        <div className="neo-card p-4 sm:p-5 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo space-y-3">
          <p className="text-xs sm:text-sm leading-relaxed text-[var(--neo-text)] font-normal whitespace-pre-line">
            {movie.synopsis}
          </p>
          <div className="text-[11px] font-mono text-[var(--neo-text-muted)] pt-2 border-t border-[var(--neo-border)]">
            (Sumber: The Movie Database / IMDb Official Catalog)
          </div>
        </div>
      </div>

      {/* 4. Bagian Baru Khusus Film 1: OFFICIAL TRAILER (YOUTUBE EMBED) */}
      <div id="movie-trailer-section" className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--neo-text)]">
            <Play className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>OFFICIAL TRAILER & PREVIEW</span>
          </div>
          <a
            href={movie.trailer.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
          >
            <span>Buka di YouTube</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="neo-card p-2 sm:p-3 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden border-2 border-[var(--neo-border)] bg-black">
            <iframe
              src={movie.trailer.embed_url}
              title={`${movie.title} Official Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </div>

      {/* 5. Bagian Baru Khusus Film 2: JAJARAN PEMERAN & AKTOR UTAMA (CAST) */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--neo-text)]">
          <Users className="w-4 h-4 text-blue-500" />
          <span>JAJARAN PEMERAN & AKTOR UTAMA (CAST)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {movie.cast.map((actor, idx) => (
            <div
              key={`${actor.name}-${idx}`}
              className="neo-card p-2.5 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo-sm text-center flex flex-col items-center justify-between space-y-2"
            >
              {/* Actor Headshot / Initials Fallback */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] shrink-0 shadow-sm">
                {actor.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={actor.photo}
                    alt={actor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-base text-[var(--neo-text-muted)] bg-[var(--neo-bg)]">
                    {actor.name.charAt(0)}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-black text-xs text-[var(--neo-text)] line-clamp-1">
                  {actor.name}
                </h4>
                <p className="text-[10px] text-purple-500 font-semibold line-clamp-1">
                  {actor.character}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Bagian Baru Khusus Film 3: GALERI CUPLIKAN ADEGAN FILM (MOVIE STILLS) */}
      {movie.stills.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--neo-text)]">
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            <span>GALERI CUPLIKAN ADEGAN FILM (MOVIE STILLS)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {movie.stills.map((stillUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveLightbox(stillUrl)}
                className="relative aspect-video rounded-2xl overflow-hidden border-2 border-[var(--neo-border)] shadow-neo-sm hover:shadow-neo hover:scale-101 active:scale-100 transition-all cursor-pointer group bg-neutral-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stillUrl}
                  alt={`Movie Still ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                  <span>Klik untuk Perbesar</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 7. Bagian Baru Khusus Film 4: REKOMENDASI FILM SERUPA (SIMILAR MOVIES) */}
      {movie.similar.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--neo-text)]">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>REKOMENDASI FILM SERUPA</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {movie.similar.map((sim) => (
              <button
                key={sim.id}
                type="button"
                onClick={() => onSelectMovie?.(sim.id)}
                className="neo-card p-2 sm:p-2.5 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all text-left flex flex-col justify-between group"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-[var(--neo-border)] bg-neutral-900 mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sim.poster}
                    alt={sim.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 right-1.5 bg-[#FFE66D] text-[#121212] px-1.5 py-0.5 rounded-full border border-black text-[10px] font-black flex items-center gap-0.5 shadow-sm">
                    <Star className="w-2.5 h-2.5 fill-[#121212]" />
                    <span>{sim.rating}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-xs text-[var(--neo-text)] line-clamp-1 group-hover:underline">
                    {sim.title}
                  </h4>
                  <p className="text-[10px] text-[var(--neo-text-muted)] font-mono">{sim.year}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Back Button */}
      <div className="pt-4 pb-8 text-center border-t border-[var(--neo-border)]">
        <button
          type="button"
          onClick={onBack}
          className="neo-btn neo-btn-secondary px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 mx-auto shadow-neo-sm hover:shadow-neo"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pencarian Film</span>
        </button>
      </div>

      {/* Lightbox Modal for Stills rendered via Portal to document.body */}
      {mounted && activeLightbox && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 animate-in fade-in duration-200"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', margin: 0 }}
        >
          {/* Full-bleed solid dark backdrop extending -100px past every edge to eliminate any blur seams */}
          <div
            onClick={() => setActiveLightbox(null)}
            className="absolute bg-black/92 backdrop-blur-xl cursor-zoom-out"
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

          <div className="relative z-10 max-w-4xl w-full neo-card rounded-2xl overflow-hidden border-3 border-black shadow-neo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeLightbox} alt="Movie Still Enlarged" className="w-full h-auto object-cover" />
            <button
              type="button"
              onClick={() => setActiveLightbox(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black border border-white/20 cursor-pointer"
              aria-label="Tutup Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};