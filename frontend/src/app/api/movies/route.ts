import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TMDB_API_KEYS = [
  '4e44d9029b1270a757cddc766a1bcb63',
  'b446a89cfb4f3b0ba1eb3e00508a8e3d',
  '3e4d94b4cf47c55c0649733cc8cfa70e',
];

const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

const GENRE_NAME_TO_ID: Record<string, string> = {
  Action: '28',
  Adventure: '12',
  Animation: '16',
  Comedy: '35',
  Crime: '80',
  Drama: '18',
  Fantasy: '14',
  Horror: '27',
  Mystery: '9648',
  Romance: '10749',
  'Sci-Fi': '878',
  Thriller: '53',
};

const COMBO_MAP: Record<string, string> = {
  'Action + Sci-Fi': '28,878',
  'Thriller + Mystery': '53,9648',
  'Horror + Supernatural': '27,14',
  'Romance + Drama': '10749,18',
  'Action + Crime': '28,80',
  'Animation + Adventure': '16,12',
  'Psychological + Mystery': '53,9648',
  'Romance + Comedy': '10749,35',
  'Adventure + Sci-Fi': '12,878',
  'Drama + Slice of Life': '18,35',
};

export interface MovieItem {
  id: string;
  title: string;
  original_title?: string;
  year: number;
  rating: number; // 0-10
  genres: string[];
  director: string;
  poster: string;
  backdrop?: string;
  synopsis: string;
  duration?: string;
  country: string;
  trailerQuery: string;
}

const fetchWithTmdbFallback = async (endpoint: string) => {
  for (const key of TMDB_API_KEYS) {
    try {
      const url = `https://api.themoviedb.org/3${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${key}&language=id-ID`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
  }

  // Fallback with English
  for (const key of TMDB_API_KEYS) {
    try {
      const url = `https://api.themoviedb.org/3${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${key}&language=en-US`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
  }

  return null;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const genre = searchParams.get('genre')?.trim() || '';
    const combo = searchParams.get('combo')?.trim() || '';
    const sort = searchParams.get('sort')?.trim() || 'popular'; // popular, top_rated, trending

    let endpoint = '';

    if (query) {
      // 1. Text Search across 100% Real Movies
      endpoint = `/search/movie?query=${encodeURIComponent(query)}&include_adult=false&page=1`;
    } else if (combo && COMBO_MAP[combo]) {
      // 2. Popular Genre Combo Filter
      const genreIds = COMBO_MAP[combo];
      endpoint = `/discover/movie?with_genres=${genreIds}&sort_by=popularity.desc&vote_count.gte=100&include_adult=false&page=1`;
    } else if (genre && genre !== 'Semua' && GENRE_NAME_TO_ID[genre]) {
      // 3. Single Genre Filter
      const genreId = GENRE_NAME_TO_ID[genre];
      endpoint = `/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=100&include_adult=false&page=1`;
    } else if (genre === 'Korean Movie') {
      endpoint = `/discover/movie?with_original_language=ko&sort_by=popularity.desc&vote_count.gte=50&include_adult=false&page=1`;
    } else if (genre === 'Indonesian Movie') {
      endpoint = `/discover/movie?with_original_language=id&sort_by=popularity.desc&include_adult=false&page=1`;
    } else {
      // 4. Default / Sort Options (Paling Populer, Skor Tertinggi, Sedang Tren)
      if (sort === 'top_rated') {
        endpoint = `/movie/top_rated?page=1`;
      } else if (sort === 'trending') {
        endpoint = `/trending/movie/week?page=1`;
      } else {
        endpoint = `/movie/popular?page=1`;
      }
    }

    const data = await fetchWithTmdbFallback(endpoint);

    if (!data || !data.results || data.results.length === 0) {
      // If Indonesian language search returned empty, retry query in en-US
      if (query) {
        const enData = await fetchWithTmdbFallback(`/search/movie?query=${encodeURIComponent(query)}&include_adult=false&page=1`);
        if (enData && enData.results && enData.results.length > 0) {
          const formatted = enData.results.slice(0, 24).map((m: any) => formatMovieItem(m));
          return NextResponse.json({
            success: true,
            total: formatted.length,
            data: formatted,
          });
        }
      }

      return NextResponse.json({
        success: true,
        total: 0,
        data: [],
      });
    }

    const formatted: MovieItem[] = data.results
      .filter((m: any) => m.poster_path || m.backdrop_path)
      .slice(0, 24)
      .map((m: any) => formatMovieItem(m));

    return NextResponse.json({
      success: true,
      total: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Movies API error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat katalog film.' },
      { status: 500 }
    );
  }
}

const formatMovieItem = (m: any): MovieItem => {
  const genres = (m.genre_ids || [])
    .map((gid: number) => GENRE_MAP[gid])
    .filter(Boolean);

  const year = m.release_date ? new Date(m.release_date).getFullYear() : 2024;
  const rating = m.vote_average ? Math.round(m.vote_average * 10) / 10 : 8.0;

  // High quality poster
  const poster = m.poster_path
    ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
    : m.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}`
    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';

  const backdrop = m.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}`
    : undefined;

  const originalLang = m.original_language?.toUpperCase() || 'USA';
  const countryName =
    originalLang === 'KO'
      ? 'Korea Selatan'
      : originalLang === 'ID'
      ? 'Indonesia'
      : originalLang === 'JA'
      ? 'Jepang'
      : originalLang === 'EN'
      ? 'USA / Global'
      : originalLang;

  return {
    id: String(m.id),
    title: m.title || m.original_title || 'Film Rekomendasi',
    original_title: m.original_title,
    year: isNaN(year) ? 2024 : year,
    rating,
    genres: genres.length > 0 ? genres : ['Film & Bioskop'],
    director: 'Katalog Resmi Sinema',
    poster,
    backdrop,
    synopsis:
      m.overview ||
      `Sinopsis resmi film "${m.title}". Jelajahi alur cerita lengkap, jajaran cast pemeran, dan trailer resmi pada halaman detail film.`,
    duration: '2j 15m',
    country: countryName,
    trailerQuery: `${m.title} ${year} Official Trailer`,
  };
};