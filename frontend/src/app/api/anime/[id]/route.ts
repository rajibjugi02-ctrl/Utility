import { NextRequest, NextResponse } from 'next/server';

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

const DETAIL_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME, isAdult: false) {
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
    meanScore
    popularity
    favourites
    episodes
    duration
    status
    season
    seasonYear
    startDate { year month day }
    endDate { year month day }
    genres
    synonyms
    source
    hashtag
    description(asHtml: false)
    studios(isMain: true) {
      nodes {
        id
        name
      }
    }
    trailer {
      id
      site
      thumbnail
    }
    characters(sort: [ROLE, RELEVANCE], perPage: 12) {
      edges {
        role
        node {
          id
          name {
            full
            native
          }
          image {
            large
            medium
          }
        }
        voiceActors(language: JAPANESE, sort: RELEVANCE) {
          id
          name {
            full
            native
          }
          image {
            large
            medium
          }
          languageV2
        }
      }
    }
    recommendations(perPage: 6, sort: RATING_DESC) {
      nodes {
        mediaRecommendation {
          id
          idMal
          title {
            romaji
            english
          }
          coverImage {
            large
            extraLarge
            color
          }
          averageScore
          episodes
          status
        }
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

// Fetch official PVs & Music Videos from Jikan v4
async function fetchJikanVideos(malId: number) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}/videos`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { promos: [], musicVideos: [] };
    const json = await res.json();
    const data = json?.data || {};

    const promos = (data.promo || []).map((p: any) => ({
      title: p.title || 'Trailer / PV Resmi',
      youtubeId: p.trailer?.youtube_id || '',
      url: p.trailer?.url || '',
      embedUrl: p.trailer?.embed_url || (p.trailer?.youtube_id ? `https://www.youtube.com/embed/${p.trailer.youtube_id}` : ''),
      thumbnail: p.trailer?.images?.maximum_image_url || p.trailer?.images?.large_image_url || p.trailer?.images?.image_url || '',
    })).filter((p: any) => Boolean(p.youtubeId));

    const musicVideos = (data.music_videos || []).map((mv: any) => ({
      title: mv.title || 'Theme Song OP/ED',
      youtubeId: mv.video?.youtube_id || '',
      url: mv.video?.url || '',
      embedUrl: mv.video?.embed_url || (mv.video?.youtube_id ? `https://www.youtube.com/embed/${mv.video.youtube_id}` : ''),
      meta: mv.meta || null,
    })).filter((mv: any) => Boolean(mv.youtubeId));

    return { promos, musicVideos };
  } catch {
    return { promos: [], musicVideos: [] };
  }
}

// Fetch real-time short epic clips
async function fetchEpicClips(animeTitle: string) {
  // 1. Try TikWM API
  try {
    const searchUrl = `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(animeTitle + ' epic scene edit')}&count=6`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      const videos = json?.data?.videos || [];
      const parsed = videos
        .map((v: any) => ({
          id: v.video_id || v.id,
          title: v.title || `${animeTitle} Scene Clip`,
          cover: v.cover || v.origin_cover || '',
          videoUrl: v.play || v.wmplay || '',
          embedUrl: '',
          duration: v.duration || 0,
          author: v.author?.nickname || v.author?.unique_id || 'TikTok Editor',
          isYouTube: false,
        }))
        .filter((v: any) => Boolean(v.videoUrl));

      if (parsed.length > 0) return parsed;
    }
  } catch {}

  // 2. Real-time YouTube Clips Scraper Fallback
  try {
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(animeTitle + ' epic scene edit')}`;
    const ytRes = await fetch(ytUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 3600 },
    });

    if (ytRes.ok) {
      const html = await ytRes.text();
      const videoIds = Array.from(html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)).map((m) => m[1]);
      const uniqueIds = Array.from(new Set(videoIds)).slice(0, 6);
      if (uniqueIds.length > 0) {
        return uniqueIds.map((vid, idx) => ({
          id: vid,
          title: `${animeTitle} - Epic Scene #${idx + 1}`,
          cover: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
          videoUrl: `https://www.youtube.com/watch?v=${vid}`,
          embedUrl: `https://www.youtube.com/embed/${vid}`,
          duration: 0,
          author: 'YouTube Community',
          isYouTube: true,
        }));
      }
    }
  } catch {}

  return [];
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.id;
  const animeId = parseInt(rawId, 10);

  if (isNaN(animeId) || animeId <= 0) {
    return NextResponse.json({ success: false, error: 'ID Anime tidak valid.' }, { status: 400 });
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
        query: DETAIL_QUERY,
        variables: { id: animeId },
      }),
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 3600 },
    });

    if (!aniListRes.ok) {
      throw new Error(`AniList server status: ${aniListRes.status}`);
    }

    const json = await aniListRes.json();
    const media = json?.data?.Media;

    if (!media) {
      return NextResponse.json({ success: false, error: 'Detail anime tidak ditemukan di AniList.' }, { status: 404 });
    }

    const animeTitle = media.title?.romaji || media.title?.english || 'Anime';

    // Concurrently fetch official Jikan videos and short epic clips
    const [jikanData, epicClips] = await Promise.all([
      media.idMal ? fetchJikanVideos(media.idMal) : Promise.resolve({ promos: [], musicVideos: [] }),
      fetchEpicClips(animeTitle),
    ]);

    // Parse characters and Japanese voice actors
    const characters = (media.characters?.edges || [])
      .map((edge: any) => {
        const charNode = edge?.node;
        const vaNode = edge?.voiceActors?.[0]; // Primary Japanese Seiyuu
        if (!charNode) return null;
        return {
          id: charNode.id,
          role: edge.role || 'SUPPORTING',
          name: {
            full: charNode.name?.full || 'Unknown',
            native: charNode.name?.native || '',
          },
          image: charNode.image?.large || charNode.image?.medium || '',
          voiceActor: vaNode
            ? {
                id: vaNode.id,
                name: vaNode.name?.full || '',
                native: vaNode.name?.native || '',
                image: vaNode.image?.large || vaNode.image?.medium || '',
                language: vaNode.languageV2 || 'Japanese',
              }
            : null,
        };
      })
      .filter(Boolean);

    // Parse recommendations
    const recommendations = (media.recommendations?.nodes || [])
      .map((rec: any) => {
        const item = rec?.mediaRecommendation;
        if (!item) return null;
        return {
          id: item.id,
          idMal: item.idMal,
          title: {
            romaji: item.title?.romaji || 'Judul Anime',
            english: item.title?.english || item.title?.romaji || '',
          },
          coverImage: {
            extraLarge: item.coverImage?.extraLarge || item.coverImage?.large || '',
            large: item.coverImage?.large || '',
            color: item.coverImage?.color || '#3b82f6',
          },
          averageScore: item.averageScore || 0,
          scoreFormatted: formatScore(item.averageScore),
          episodes: item.episodes || 0,
          status: item.status || 'UNKNOWN',
        };
      })
      .filter(Boolean);

    // Build consolidated detail response
    const detailData = {
      id: media.id,
      idMal: media.idMal,
      title: {
        romaji: media.title?.romaji || 'Judul Anime',
        english: media.title?.english || media.title?.romaji || '',
        native: media.title?.native || '',
      },
      coverImage: {
        extraLarge: media.coverImage?.extraLarge || media.coverImage?.large || '',
        large: media.coverImage?.large || '',
        color: media.coverImage?.color || '#3b82f6',
      },
      bannerImage: media.bannerImage || '',
      averageScore: media.averageScore || 0,
      scoreFormatted: formatScore(media.averageScore),
      popularity: media.popularity || 0,
      favourites: media.favourites || 0,
      episodes: media.episodes || 0,
      duration: media.duration || 0,
      status: media.status || 'UNKNOWN',
      season: media.season || '',
      seasonYear: media.seasonYear || null,
      startDate: media.startDate || null,
      endDate: media.endDate || null,
      genres: media.genres || [],
      synonyms: media.synonyms || [],
      source: media.source || '',
      studio: media.studios?.nodes?.[0]?.name || 'Studio Animasi',
      description: cleanDescription(media.description),
      mainTrailer: media.trailer?.id
        ? {
            id: media.trailer.id,
            site: media.trailer.site,
            url: media.trailer.site === 'youtube' ? `https://www.youtube.com/watch?v=${media.trailer.id}` : '',
            embedUrl: media.trailer.site === 'youtube' ? `https://www.youtube.com/embed/${media.trailer.id}` : '',
          }
        : jikanData.promos[0]
          ? {
              id: jikanData.promos[0].youtubeId,
              site: 'youtube',
              url: jikanData.promos[0].url,
              embedUrl: jikanData.promos[0].embedUrl,
            }
          : null,
      promos: jikanData.promos,
      musicVideos: jikanData.musicVideos,
      characters,
      recommendations,
      epicClips,
      youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(animeTitle + ' epic scenes clips')}`,
    };

    return NextResponse.json({
      success: true,
      source: 'anilist',
      data: detailData,
    });
  } catch (err: any) {
    console.error('Error fetching anime detail:', err.message);
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memuat detail anime dari server. Pastikan ID anime valid.',
      },
      { status: 502 }
    );
  }
}
