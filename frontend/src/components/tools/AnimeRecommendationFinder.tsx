'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Film,
  Star,
  Play,
  Sparkles,
  Tv,
  Calendar,
  Building,
  RefreshCw,
  Flame,
  Check,
} from 'lucide-react';
import { AnimeDetailView } from './AnimeDetailView';

export interface AnimeListItem {
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
  episodes?: number;
  duration?: number;
  status?: string;
  season?: string;
  seasonYear?: number;
  genres: string[];
  description?: string;
  studio?: string;
  trailer?: {
    id?: string;
    site?: string;
    url?: string;
    embedUrl?: string;
  } | null;
}

const GENRE_CHIPS = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
];

const POPULAR_COMBINATIONS = [
  { label: '✨ Action + Fantasy', genres: 'Action,Fantasy' },
  { label: '✨ Romance + Comedy', genres: 'Romance,Comedy' },
  { label: '✨ Psychological + Mystery', genres: 'Psychological,Mystery' },
  { label: '✨ Adventure + Sci-Fi', genres: 'Adventure,Sci-Fi' },
  { label: '✨ Drama + Slice of Life', genres: 'Drama,Slice of Life' },
];

const SORT_OPTIONS = [
  { id: 'POPULARITY_DESC', label: 'Paling Populer' },
  { id: 'SCORE_DESC', label: 'Skor Tertinggi' },
  { id: 'TRENDING_DESC', label: 'Sedang Tren' },
];

export const AnimeRecommendationFinder: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedCombo, setSelectedCombo] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('POPULARITY_DESC');

  const [animeList, setAnimeList] = useState<AnimeListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active selected anime for full detail view
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);

  const fetchAnimeList = async (queryStr = '', genreStr = 'all', sortStr = 'POPULARITY_DESC') => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (queryStr.trim()) {
        params.set('q', queryStr.trim());
      }
      if (genreStr && genreStr !== 'all') {
        params.set('genres', genreStr);
      }
      params.set('sort', sortStr);
      params.set('perPage', '24');

      const res = await fetch(`/api/anime?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Gagal mengambil katalog anime real-time dari server.');
      }
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) {
        throw new Error(json.error || 'Data anime tidak ditemukan.');
      }
      setAnimeList(json.data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data anime.');
      setAnimeList([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on filter / sort change
  useEffect(() => {
    const effectiveGenre = selectedCombo ? selectedCombo : selectedGenre;
    fetchAnimeList(activeQuery, effectiveGenre, sortOption);
  }, [activeQuery, selectedGenre, selectedCombo, sortOption]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedCombo('');
    setActiveQuery(searchInput.trim());
  };

  const handleComboClick = (genres: string) => {
    setSearchInput('');
    setActiveQuery('');
    setSelectedGenre('all');
    if (selectedCombo === genres) {
      setSelectedCombo('');
    } else {
      setSelectedCombo(genres);
    }
  };

  const handleGenreChipClick = (genre: string) => {
    setSelectedCombo('');
    if (selectedGenre === genre) {
      setSelectedGenre('all');
    } else {
      setSelectedGenre(genre);
    }
  };

  // If user selected an anime, render the Full Detail View
  if (selectedAnimeId !== null) {
    return (
      <AnimeDetailView
        animeId={selectedAnimeId}
        onBack={() => setSelectedAnimeId(null)}
        onSelectAnime={(newId) => setSelectedAnimeId(newId)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border-2 border-indigo-500 text-indigo-500 flex items-center justify-center shadow-sm">
            <Film className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-[var(--neo-text)] tracking-tight">
            Pencari Rekomendasi Anime Real-Time (AniList & Jikan)
          </h2>
        </div>
        <p className="text-xs text-[var(--neo-text-muted)] font-medium">
          Cari ribuan judul anime resmi tanpa data dummy, lengkap dengan poster HD, skor rating, trailer, karakter, seiyuu, dan klip video scene epic.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari judul anime (contoh: Jujutsu Kaisen, Demon Slayer, Frieren, Attack on Titan...)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl neo-input text-xs font-semibold placeholder:text-[var(--neo-text-muted)]/70 pl-10"
            />
            <Search className="w-4 h-4 text-[var(--neo-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="submit"
            className="neo-btn bg-black hover:bg-neutral-800 text-white border-2 border-black px-6 py-3 rounded-2xl text-xs font-black shadow-neo flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>🔍 Cari Anime</span>
          </button>
        </div>

        {/* Popular Genre Combinations */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--neo-text-muted)]">
            Kombinasi Genre Populer (Pencarian Tanpa Judul):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_COMBINATIONS.map((combo) => {
              const isActive = selectedCombo === combo.genres;
              return (
                <button
                  key={combo.genres}
                  type="button"
                  onClick={() => handleComboClick(combo.genres)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all shadow-sm ${isActive
                      ? 'bg-amber-400 text-black border-black shadow-neo scale-[1.02]'
                      : 'bg-[var(--neo-surface)] text-[var(--neo-text)] border-[var(--neo-border)] hover:bg-[var(--neo-bg)]'
                    }`}
                >
                  {combo.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Genre Chips Bar & Sorting */}
        <div className="pt-2 border-t-2 border-[var(--neo-border)] space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Genre Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-[10px] font-black uppercase text-[var(--neo-text-muted)] shrink-0 mr-1">
                Saring Genre:
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCombo('');
                  setSelectedGenre('all');
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border-2 shrink-0 ${selectedGenre === 'all' && !selectedCombo
                    ? 'bg-indigo-600 text-white border-black shadow-sm'
                    : 'bg-[var(--neo-surface)] text-[var(--neo-text)] border-[var(--neo-border)] hover:bg-[var(--neo-bg)]'
                  }`}
              >
                Semua
              </button>
              {GENRE_CHIPS.map((genre) => {
                const isActive = selectedGenre === genre && !selectedCombo;
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => handleGenreChipClick(genre)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border-2 shrink-0 transition-all ${isActive
                        ? 'bg-indigo-600 text-white border-black shadow-sm'
                        : 'bg-[var(--neo-surface)] text-[var(--neo-text)] border-[var(--neo-border)] hover:bg-[var(--neo-bg)]'
                      }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>

            {/* Sorting Options */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-black uppercase text-[var(--neo-text-muted)] mr-1">
                Urutkan:
              </span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortOption(opt.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border-2 shadow-sm ${sortOption === opt.id
                      ? 'bg-black text-white border-black'
                      : 'bg-[var(--neo-surface)] text-[var(--neo-text)] border-[var(--neo-border)] hover:bg-[var(--neo-bg)]'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>

      {/* Active Filter Indicators */}
      {(activeQuery || selectedGenre !== 'all' || selectedCombo) && (
        <div className="flex items-center justify-between text-xs font-bold text-[var(--neo-text)] px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Hasil pencarian untuk:</span>
            {activeQuery && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500 font-mono">
                &ldquo;{activeQuery}&rdquo;
              </span>
            )}
            {selectedCombo && (
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-black border border-black">
                {selectedCombo}
              </span>
            )}
            {!selectedCombo && selectedGenre !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500">
                Genre: {selectedGenre}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setActiveQuery('');
              setSelectedGenre('all');
              setSelectedCombo('');
            }}
            className="text-xs text-[var(--neo-text-muted)] hover:text-rose-500 underline"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* Anime Card Grid View */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="neo-card p-3 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] space-y-2.5 animate-pulse"
            >
              <div className="aspect-[2/3] w-full bg-[var(--neo-bg)] rounded-xl border border-[var(--neo-border)]" />
              <div className="h-4 bg-[var(--neo-bg)] rounded-md w-3/4" />
              <div className="h-3 bg-[var(--neo-bg)] rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center space-y-3 neo-card rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)]">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border-2 border-rose-500">
            <Film className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-[var(--neo-text)]">{error}</p>
          <button
            type="button"
            onClick={() => fetchAnimeList(activeQuery, selectedCombo || selectedGenre, sortOption)}
            className="neo-btn neo-btn-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Muat Ulang</span>
          </button>
        </div>
      ) : animeList.length === 0 ? (
        <div className="p-10 text-center space-y-2 neo-card rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)]">
          <Film className="w-8 h-8 text-[var(--neo-text-muted)] mx-auto" />
          <h4 className="text-sm font-bold text-[var(--neo-text)]">Tidak Ada Anime Ditemukan</h4>
          <p className="text-xs text-[var(--neo-text-muted)]">
            Coba gunakan kata kunci judul lain atau pilih filter genre kombinasi di atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {animeList.map((anime) => (
            <div
              key={anime.id}
              onClick={() => setSelectedAnimeId(anime.id)}
              className="neo-card p-3 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo hover:translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2">
                {/* Vertical Poster Aspect 2/3 */}
                <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden border-2 border-[var(--neo-border)] bg-black shadow-sm">
                  <img
                    src={anime.coverImage.extraLarge || anime.coverImage.large}
                    alt={anime.title.romaji}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Rating Badge */}
                  <div className="absolute top-2 right-2 bg-amber-400 text-black border-2 border-black font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-black" />
                    <span>★ {anime.scoreFormatted}</span>
                  </div>

                  {/* Status Overlay Badge */}
                  {anime.status && (
                    <div className="absolute bottom-2 left-2 bg-black/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                      {anime.status === 'RELEASING' ? 'Tayang' : anime.status}
                    </div>
                  )}
                </div>

                {/* Title & Metadata */}
                <div>
                  <h3 className="text-xs font-bold text-[var(--neo-text)] line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {anime.title.romaji}
                  </h3>
                  {anime.title.english && anime.title.english !== anime.title.romaji && (
                    <p className="text-[10px] text-[var(--neo-text-muted)] truncate font-mono">
                      {anime.title.english}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer: Episodes & Studio */}
              <div className="pt-2 border-t border-[var(--neo-border)]/60 flex items-center justify-between text-[10px] font-medium text-[var(--neo-text-muted)] mt-2">
                <span className="truncate">
                  {anime.episodes ? `${anime.episodes} Episode` : 'TBA'}
                </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-0.5">
                  <span>Detail</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
