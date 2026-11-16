import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TMDB_API_KEYS = [
  '4e44d9029b1270a757cddc766a1bcb63',
  'b446a89cfb4f3b0ba1eb3e00508a8e3d',
  '3e4d94b4cf47c55c0649733cc8cfa70e',
];

export interface CastMember {
  name: string;
  character: string;
  photo: string | null;
}

export interface MovieDetailResponse {
  id: string;
  title: string;
  original_title: string;
  tagline: string;
  year: number;
  rating: number;
  status: string;
  duration: string;
  content_rating: string;
  genres: string[];
  director: string;
  writer: string;
  studio: string;
  country: string;
  language: string;
  quality: string;
  synopsis: string;
  poster: string;
  backdrop?: string;
  imdb_id?: string;
  imdb_url?: string;
  trailer: {
    yt_trailer_code: string;
    youtube_url: string;
    embed_url: string;
  };
  cast: CastMember[];
  stills: string[];
  similar: Array<{
    id: string;
    title: string;
    year: number;
    poster: string;
    rating: number;
    genres: string[];
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const movieId = params.id;
    if (!movieId) {
      return NextResponse.json(
        { success: false, message: 'ID Film wajib disertakan.' },
        { status: 400 }
      );
    }

    let rawData: any = null;

    // Fetch movie details with credits, videos, images, and similar in a single call
    for (const key of TMDB_API_KEYS) {
      try {
        const url = `https://api.themoviedb.org/3/movie/${encodeURIComponent(
          movieId
        )}?api_key=${key}&language=id-ID&append_to_response=credits,videos,images,similar&include_image_language=en,null`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (res.ok) {
          rawData = await res.json();
          break;
        }
      } catch {}
    }

    // Fallback in en-US if id-ID returns empty or fails
    if (!rawData) {
      for (const key of TMDB_API_KEYS) {
        try {
          const url = `https://api.themoviedb.org/3/movie/${encodeURIComponent(
            movieId
          )}?api_key=${key}&language=en-US&append_to_response=credits,videos,images,similar&include_image_language=en,null`;
          const res = await fetch(url, { next: { revalidate: 3600 } });
          if (res.ok) {
            rawData = await res.json();
            break;
          }
        } catch {}
      }
    }

    if (!rawData) {
      return NextResponse.json(
        { success: false, message: 'Film tidak ditemukan.' },
        { status: 404 }
      );
    }

    // 1. Basic Metadata
    const year = rawData.release_date
      ? new Date(rawData.release_date).getFullYear()
      : 2024;
    const rating = rawData.vote_average
      ? Math.round(rawData.vote_average * 10) / 10
      : 8.5;

    // Format runtime
    const runtimeMinutes = rawData.runtime || 120;
    const hours = Math.floor(runtimeMinutes / 60);
    const mins = runtimeMinutes % 60;
    const duration = hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;

    // 2. Credits (Director, Writer, Cast)
    const crew = rawData.credits?.crew || [];
    const directorObj = crew.find((c: any) => c.job === 'Director');
    const director = directorObj ? directorObj.name : 'Sutradara Sinema';

    const writerObj = crew.find(
      (c: any) => c.job === 'Screenplay' || c.job === 'Writer' || c.department === 'Writing'
    );
    const writer = writerObj ? writerObj.name : director;

    const rawCast = rawData.credits?.cast || [];
    const cast: CastMember[] = rawCast.slice(0, 12).map((actor: any) => ({
      name: actor.name,
      character: actor.character ? `as ${actor.character}` : 'Pemeran Utama',
      photo: actor.profile_path
        ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
        : null,
    }));

    // 3. Official Trailer Video (with fallback to global videos if empty)
    let videos = rawData.videos?.results || [];
    let trailerKey = '';
    let officialTrailer = videos.find(
      (v: any) => v.site === 'YouTube' && v.type === 'Trailer'
    );
    let anyYouTube = videos.find((v: any) => v.site === 'YouTube');

    if (!officialTrailer && !anyYouTube) {
      // Query videos globally without language restriction
      for (const key of TMDB_API_KEYS) {
        try {
          const vRes = await fetch(
            `https://api.themoviedb.org/3/movie/${encodeURIComponent(movieId)}/videos?api_key=${key}`
          );
          if (vRes.ok) {
            const vData = await vRes.json();
            videos = vData.results || [];
            officialTrailer = videos.find(
              (v: any) => v.site === 'YouTube' && v.type === 'Trailer'
            );
            anyYouTube = videos.find((v: any) => v.site === 'YouTube');
            if (officialTrailer || anyYouTube) break;
          }
        } catch {}
      }
    }

    if (officialTrailer) {
      trailerKey = officialTrailer.key;
    } else if (anyYouTube) {
      trailerKey = anyYouTube.key;
    }

    const title = rawData.title || rawData.original_title || 'Film';

    // 4. Stills & Backdrops Gallery
    const rawBackdrops = rawData.images?.backdrops || [];
    const stills: string[] = rawBackdrops
      .slice(0, 6)
      .map((b: any) => `https://image.tmdb.org/t/p/w780${b.file_path}`);

    // If no backdrops in images, fallback to main backdrop
    if (stills.length === 0 && rawData.backdrop_path) {
      stills.push(`https://image.tmdb.org/t/p/w780${rawData.backdrop_path}`);
    }

    // 5. Similar Movies
    const rawSimilar = rawData.similar?.results || [];
    const similar = rawSimilar
      .filter((s: any) => s.poster_path)
      .slice(0, 4)
      .map((s: any) => ({
        id: String(s.id),
        title: s.title || s.original_title,
        year: s.release_date ? new Date(s.release_date).getFullYear() : 2024,
        poster: `https://image.tmdb.org/t/p/w500${s.poster_path}`,
        rating: s.vote_average ? Math.round(s.vote_average * 10) / 10 : 8.0,
        genres: (s.genre_ids || []).slice(0, 2),
      }));

    // 6. Production & Studio
    const studio =
      rawData.production_companies?.[0]?.name || 'Official Film Studio';
    const country =
      rawData.production_countries?.[0]?.name ||
      (rawData.original_language === 'ko'
        ? 'Korea Selatan'
        : rawData.original_language === 'id'
        ? 'Indonesia'
        : rawData.original_language === 'ja'
        ? 'Jepang'
        : 'USA');

    const language =
      rawData.spoken_languages?.[0]?.english_name ||
      rawData.original_language?.toUpperCase() ||
      'English';

    const genres = (rawData.genres || []).map((g: any) => g.name);

    const poster = rawData.poster_path
      ? `https://image.tmdb.org/t/p/w780${rawData.poster_path}`
      : rawData.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${rawData.backdrop_path}`
      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';

    const backdrop = rawData.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${rawData.backdrop_path}`
      : undefined;

    const synopsis =
      rawData.overview ||
      `Sinopsis lengkap untuk "${title}" (${year}). Mengisahkan perjalanan epik para tokoh utama yang diiringi visual sinematik tinggi dan arahan sutradara ${director}.`;

    const detail: MovieDetailResponse = {
      id: String(rawData.id),
      title,
      original_title: rawData.original_title || title,
      tagline: rawData.tagline || 'Koleksi Sinema Populer Pilihan',
      year,
      rating,
      status: `Rilis Resmi (${year})`,
      duration,
      content_rating: 'PG-13',
      genres: genres.length > 0 ? genres : ['Action', 'Drama'],
      director,
      writer,
      studio,
      country,
      language,
      quality: '1080p / 4K Ultra HD',
      synopsis,
      poster,
      backdrop,
      imdb_id: rawData.imdb_id,
      imdb_url: rawData.imdb_id
        ? `https://www.imdb.com/title/${rawData.imdb_id}`
        : `https://www.imdb.com/find?q=${encodeURIComponent(title)}`,
      trailer: {
        yt_trailer_code: trailerKey,
        youtube_url: trailerKey
          ? `https://www.youtube.com/watch?v=${trailerKey}`
          : `https://www.youtube.com/results?search_query=${encodeURIComponent(
              title + ' ' + year + ' official trailer'
            )}`,
        embed_url: trailerKey
          ? `https://www.youtube.com/embed/${trailerKey}?autoplay=0&rel=0`
          : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
              title + ' ' + year + ' official trailer'
            )}`,
      },
      cast,
      stills,
      similar,
    };

    return NextResponse.json({
      success: true,
      data: detail,
    });
  } catch (error: any) {
    console.error('Movie detail error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat detail film.' },
      { status: 500 }
    );
  }
}