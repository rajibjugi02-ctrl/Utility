'use client';

import React, { useState, useEffect } from 'react';
import { Film, Search, Sparkles, Filter, Star, X, TrendingUp, Award, Flame, ArrowRight } from 'lucide-react';
import { MovieItem } from '@/app/api/movies/route';
import { MovieDetailView } from './MovieDetailView';

const GENRE_COMBOS = [
  { label: '✨ Action + Sci-Fi', value: 'Action + Sci-Fi' },
  { label: '✨ Thriller + Mystery (Plot Twist)', value: 'Thriller + Mystery' },
  { label: '✨ Horror + Supernatural', value: 'Horror + Supernatural' },
  { label: '✨ Romance + Drama', value: 'Romance + Drama' },
  { label: '✨ Action + Crime', value: 'Action + Crime' },
  { label: '✨ Animation + Adventure', value: 'Animation + Adventure' },
  { label: '✨ Psychological + Mystery', value: 'Psychological + Mystery' },
  { label: '✨ Romance + Comedy', value: 'Romance + Comedy' },
  { label: '✨ Adventure + Sci-Fi', value: 'Adventure + Sci-Fi' },
  { label: '✨ Drama + Slice of Life', value: 'Drama + Slice of Life' },
];

const GENRES = [
  'Semua',
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Korean Movie',
  'Indonesian Movie',
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'Paling Populer', icon: Flame },
  { id: 'top_rated', label: 'Skor Tertinggi', icon: Award },
  { id: 'trending', label: 'Sedang Tren', icon: TrendingUp },
];

export const MovieRecommendationFinder: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Semua');
  const [selectedCombo, setSelectedCombo] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState('popular');
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);

  const fetchMovies = async (q = '', genre = '', combo = '', sort = 'popular') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (genre && genre !== 'Semua') params.set('genre', genre);
      if (combo) params.set('combo', combo);
      if (sort) params.set('sort', sort);

      const res = await fetch(`/api/movies?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setMovies(data.data);
      }
    } catch (err) {
      console.error('Fetch movies error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies('', 'Semua', '', 'popular');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedCombo(null);
    fetchMovies(searchQuery, selectedGenre, '', selectedSort);
  };

  const handleComboClick = (comboVal: string) => {
    if (selectedCombo === comboVal) {
      setSelectedCombo(null);
      fetchMovies(searchQuery, selectedGenre, '', selectedSort);
    } else {
      setSelectedCombo(comboVal);
      fetchMovies('', selectedGenre, comboVal, selectedSort);
    }
  };

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(genre);
    fetchMovies(searchQuery, genre, selectedCombo || '', selectedSort);
  };

  const handleSortClick = (sortId: string) => {
    setSelectedSort(sortId);
    fetchMovies(searchQuery, selectedGenre, selectedCombo || '', sortId);
  };

  // If a movie is selected, open the dedicated Next-Page Detail View
  if (selectedMovieId) {
    return (
      <MovieDetailView
        movieId={selectedMovieId}
        onBack={() => setSelectedMovieId(null)}
        onSelectMovie={(id) => setSelectedMovieId(id)}
      />
    );
  }

  return (
    <div className="space-y-4 pb-12 text-left">
      {/* 1. Header Search Bar - Matching Screenshot 1 */}
      <form onSubmit={handleSearch} className="space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1 flex items-center">
            <div className="absolute left-3.5 text-[var(--neo-text-muted)] pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari film (contoh: Toy Story, Interstellar, Spider-Man, Parasite...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl neo-input text-xs sm:text-sm font-semibold border-2 border-[var(--neo-border)] bg-[var(--neo-bg)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchMovies('', selectedGenre, selectedCombo || '', selectedSort);
                }}
                className="absolute right-3 p-1 rounded-full text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-[#121212] text-white dark:bg-[#F4F4F0] dark:text-[#121212] text-xs sm:text-sm font-black flex items-center justify-center gap-2 border-2 border-[var(--neo-border)] shadow-neo-sm hover:opacity-90 active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Mencari...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Cari Film</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 2. Kombinasi Genre Populer (Pencarian Tanpa Judul) - Matching Screenshot 1 & 3 */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-purple-500">
          <Sparkles className="w-3.5 h-3.5" />
          <span>KOMBINASI GENRE POPULER (PENCARIAN TANPA JUDUL):</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {GENRE_COMBOS.map((combo) => {
            const isActive = selectedCombo === combo.value;
            return (
              <button
                key={combo.value}
                type="button"
                onClick={() => handleComboClick(combo.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#121212] bg-purple-500 text-white shadow-neo-sm scale-102'
                    : 'border-[var(--neo-border)] bg-[var(--neo-surface)] text-[var(--neo-text)] hover:border-purple-400'
                }`}
              >
                {combo.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Saring Genre Satuan - Matching Screenshot 1 & 3 */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[var(--neo-text-muted)]">
          <Filter className="w-3.5 h-3.5" />
          <span>SARING GENRE:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-0.5 px-0.5 whitespace-nowrap">
          {GENRES.map((g) => {
            const isActive = selectedGenre === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => handleGenreClick(g)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border-2 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#121212] bg-[#121212] text-white dark:bg-[#F4F4F0] dark:text-[#121212] shadow-sm'
                    : 'border-[var(--neo-border)] bg-[var(--neo-surface)] text-[var(--neo-text)] hover:shadow-neo-sm'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Urutkan: Paling Populer, Skor Tertinggi, Sedang Tren - Matching Screenshot 1 */}
      <div className="flex items-center gap-2 pt-1 pb-1">
        <span className="text-[11px] font-bold text-[var(--neo-text-muted)] font-mono">
          Urutkan:
        </span>
        <div className="flex items-center gap-1.5">
          {SORT_OPTIONS.map((sortOpt) => {
            const isActive = selectedSort === sortOpt.id && !searchQuery;
            const Icon = sortOpt.icon;
            return (
              <button
                key={sortOpt.id}
                type="button"
                onClick={() => handleSortClick(sortOpt.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'border-[#121212] bg-[#121212] text-white dark:bg-[#F4F4F0] dark:text-[#121212] shadow-sm'
                    : 'border-[var(--neo-border)] bg-[var(--neo-surface)] text-[var(--neo-text)] hover:shadow-neo-sm'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{sortOpt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Header Hasil & Counter */}
      <div className="flex items-center justify-between pb-2 border-b-2 border-[var(--neo-border)] pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-[var(--neo-text)]">
            {searchQuery ? `HASIL: "${searchQuery.toUpperCase()}"` : 'KATALOG REKOMENDASI FILM'}
          </span>
          <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] text-[10px] font-mono px-2 py-0.5 rounded-full border border-[var(--neo-border)]">
            {movies.length} Film
          </span>
        </div>

        {selectedCombo && (
          <span className="neo-badge bg-purple-500 text-white text-[10px] font-mono border border-purple-600">
            {selectedCombo}
          </span>
        )}
      </div>

      {/* 6. Grid Poster Vertikal - Persis Gaya Referensi Screenshot 1 */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="neo-card p-3 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] space-y-2 animate-pulse"
            >
              <div className="aspect-[2/3] bg-[var(--neo-bg)] rounded-xl" />
              <div className="h-4 bg-[var(--neo-bg)] rounded w-3/4" />
              <div className="h-3 bg-[var(--neo-bg)] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="neo-card p-8 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] text-center space-y-2 shadow-neo-sm">
          <Film className="w-8 h-8 text-[var(--neo-text-muted)] mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-[var(--neo-text)]">Tidak ada film ditemukan</h4>
          <p className="text-xs text-[var(--neo-text-muted)]">
            Coba kata kunci lain atau pilih rekomendasi dari kombinasi genre di atas.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('Semua');
              setSelectedCombo(null);
              fetchMovies('', 'Semua', '', 'popular');
            }}
            className="neo-btn neo-btn-primary px-4 py-1.5 rounded-xl text-xs font-bold"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
          {movies.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedMovieId(m.id)}
              className="neo-card p-2 sm:p-2.5 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo-sm hover:shadow-neo hover:-translate-y-1 active:translate-y-0 transition-all flex flex-col justify-between cursor-pointer group text-left"
            >
              <div>
                {/* Vertical Portrait Poster with Bold Yellow Rating Badge */}
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden border-2 border-[var(--neo-border)] bg-neutral-900 mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.poster}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Rating Bintang Kuning di Pojok Kanan Atas */}
                  <div className="absolute top-2 right-2 bg-[#FFE66D] text-[#121212] px-2 py-0.5 rounded-full border border-black text-[11px] font-black flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-[#121212]" />
                    <span>{m.rating}</span>
                  </div>

                  {/* Tahun & Negara di Pojok Kiri Bawah */}
                  <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded-md text-[10px] text-white font-mono border border-white/10">
                    {m.year} · {m.country}
                  </div>
                </div>

                {/* Judul & Detail */}
                <div className="space-y-1">
                  <h3 className="font-black text-xs sm:text-sm text-[var(--neo-text)] line-clamp-1 group-hover:underline">
                    {m.title}
                  </h3>

                  {/* Genre Pills */}
                  <div className="flex flex-wrap gap-1">
                    {m.genres.slice(0, 2).map((g) => (
                      <span
                        key={g}
                        className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-[var(--neo-bg)] border border-[var(--neo-border)] text-[var(--neo-text-muted)]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button: Lihat Detail */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMovieId(m.id);
                }}
                className="mt-2.5 w-full py-1.5 rounded-xl neo-btn neo-btn-primary text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm group-hover:bg-[#FFE66D]"
              >
                <span>Lihat Detail</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};