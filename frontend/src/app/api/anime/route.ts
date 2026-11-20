import { NextRequest, NextResponse } from 'next/server';

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

const SEARCH_QUERY = `
query ($search: String, $genre_in: [String], $sort: [MediaSort], $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      hasNextPage
    }
    media(search: $search, genre_in: $genre_in, type: ANIME, sort: $sort, isAdult: false) {
      id
      idMal
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
        large
        color
      }
      bannerImage
      averageScore
      episodes
      duration
      status
      season
      seasonYear
      genres
      description(asHtml: false)
      studios(isMain: true) {
        nodes {
          name
        }
      }
      trailer {
        id
        site
      }
    }
  }
}
`;

function cleanDescription(raw?: string): string {
  if (!raw) return 'Tidak ada deskripsi sinopsis resmi tersedia.';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function formatScore(score?: number): string {
  if (!score || score <= 0) return 'N/A';
  return (score / 10).toFixed(1);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const genresParam = searchParams.get('genres')?.trim() || '';
  const sortParam = searchParams.get('sort')?.trim() || 'POPULARITY_DESC';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(30, Math.max(1, parseInt(searchParams.get('perPage') || '20', 10)));

  const validSorts = ['POPULARITY_DESC', 'SCORE_DESC', 'TRENDING_DESC', 'FAVOURITES_DESC'];
  const finalSort = validSorts.includes(sortParam) ? sortParam : 'POPULARITY_DESC';

  const genreArray = genresParam
    ? genresParam
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean)
    : undefined;

  const variables: Record<string, any> = {
    sort: [finalSort],
    page,
    perPage,
  };

  if (q) {
    variables.search = q;
  }
  if (genreArray && genreArray.length > 0) {
    variables.genre_in = genreArray;
  }

  try {
    const aniListRes = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables,
      }),
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 1800 },
    });

    if (aniListRes.ok) {
      const json = await aniListRes.json();
      const mediaList = json?.data?.Page?.media || [];
      const pageInfo = json?.data?.Page?.pageInfo || {};

      const items = mediaList.map((m: any) => ({
        id: m.id,
        idMal: m.idMal,
        title: {
          romaji: m.title?.romaji || 'Judul Anime',
          english: m.title?.english || m.title?.romaji || '',
          native: m.title?.native || '',
        },
        coverImage: {
          extraLarge: m.coverImage?.extraLarge || m.coverImage?.large || '',
          large: m.coverImage?.large || '',
          color: m.coverImage?.color || '#3b82f6',
        },
        bannerImage: m.bannerImage || '',
        averageScore: m.averageScore || 0,
        scoreFormatted: formatScore(m.averageScore),
        episodes: m.episodes || 0,
        duration: m.duration || 0,
        status: m.status || 'UNKNOWN',
        season: m.season || '',
        seasonYear: m.seasonYear || null,
        genres: m.genres || [],
        description: cleanDescription(m.description),
        studio: m.studios?.nodes?.[0]?.name || 'Studio Animasi',
        trailer: m.trailer
          ? {
              id: m.trailer.id,
              site: m.trailer.site,
              url: m.trailer.site === 'youtube' ? `https://www.youtube.com/watch?v=${m.trailer.id}` : undefined,
              embedUrl: m.trailer.site === 'youtube' ? `https://www.youtube.com/embed/${m.trailer.id}` : undefined,
            }
          : null,
      }));

      return NextResponse.json({
        success: true,
        source: 'anilist',
        pageInfo,
        data: items,
      });
    }
  } catch (err: any) {
    console.warn('AniList search failed, triggering Jikan v4 fallback:', err.message);
  }

  // JIKAN V4 REAL-TIME FALLBACK
  try {
    let jikanUrl = `https://api.jikan.moe/v4/anime?limit=${perPage}&sfw=true`;
    if (q) {
      jikanUrl += `&q=${encodeURIComponent(q)}`;
    } else {
      if (finalSort === 'SCORE_DESC') {
        jikanUrl += `&order_by=score&sort=desc`;
      } else {
        jikanUrl += `&order_by=popularity&sort=asc`;
      }
    }

    const jikanRes = await fetch(jikanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 1800 },
    });

    if (jikanRes.ok) {
      const jikanJson = await jikanRes.json();
      const items = (jikanJson?.data || []).map((m: any) => ({
        id: m.mal_id,
        idMal: m.mal_id,
        title: {
          romaji: m.title || 'Judul Anime',
          english: m.title_english || m.title || '',
          native: m.title_japanese || '',
        },
        coverImage: {
          extraLarge: m.images?.jpg?.large_image_url || m.images?.jpg?.image_url || '',
          large: m.images?.jpg?.image_url || '',
          color: '#3b82f6',
        },
        bannerImage: '',
        averageScore: m.score ? Math.round(m.score * 10) : 0,
        scoreFormatted: m.score ? m.score.toFixed(1) : 'N/A',
        episodes: m.episodes || 0,
        duration: 0,
        status: m.status || 'UNKNOWN',
        season: m.season || '',
        seasonYear: m.year || null,
        genres: (m.genres || []).map((g: any) => g.name),
        description: cleanDescription(m.synopsis),
        studio: m.studios?.[0]?.name || 'Studio Animasi',
        trailer: m.trailer?.youtube_id
          ? {
              id: m.trailer.youtube_id,
              site: 'youtube',
              url: m.trailer.url,
              embedUrl: m.trailer.embed_url,
            }
          : null,
      }));

      return NextResponse.json({
        success: true,
        source: 'jikan_fallback',
        pageInfo: {
          currentPage: page,
          hasNextPage: jikanJson?.pagination?.has_next_page || false,
        },
        data: items,
      });
    }
  } catch (err: any) {
    console.error('Jikan fallback failed:', err.message);
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Gagal mengambil katalog anime real-time. Periksa koneksi internet Anda.',
      data: [],
    },
    { status: 502 }
  );
}
