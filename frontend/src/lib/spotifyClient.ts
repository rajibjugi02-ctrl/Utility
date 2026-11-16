export interface SpotifyTrackDetails {
  id: string;
  name: string;
  artists: string[];
  album: {
    name: string;
    releaseDate: string;
    albumType: string;
    coverUrl: string;
  };
  durationMs: number;
  durationFormatted: string;
  popularity: number;
  isrc: string | 'tidak tersedia';
  previewUrl: string | null;
  spotifyUrl: string;
  uri: string;
}

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

// Client Credentials flow for official Spotify Web API
export async function getSpotifyAccessToken(): Promise<string | null> {
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After')) || 2;
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return getSpotifyAccessToken();
    }

    if (!res.ok) {
      console.warn('Spotify auth failed:', res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    cachedAccessToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    return cachedAccessToken;
  } catch (err: any) {
    console.error('Spotify token error:', err.message);
    return null;
  }
}

function formatDurationMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Maps Spotify Web API track object to clean typed structure
export function mapSpotifyTrack(t: any): SpotifyTrackDetails {
  const coverUrl =
    t.album?.images?.[0]?.url ||
    t.album?.images?.[1]?.url ||
    '';

  return {
    id: t.id,
    name: t.name,
    artists: (t.artists || []).map((a: any) => a.name),
    album: {
      name: t.album?.name || 'tidak tersedia',
      releaseDate: t.album?.release_date || 'tidak tersedia',
      albumType: t.album?.album_type || 'album',
      coverUrl,
    },
    durationMs: t.duration_ms || 0,
    durationFormatted: formatDurationMs(t.duration_ms || 0),
    popularity: typeof t.popularity === 'number' ? t.popularity : 50,
    isrc: t.external_ids?.isrc || 'tidak tersedia',
    previewUrl: t.preview_url || null,
    spotifyUrl: t.external_urls?.spotify || `https://open.spotify.com/track/${t.id}`,
    uri: t.uri || `spotify:track:${t.id}`,
  };
}

// Fetch track directly by ID
export async function fetchTrackById(trackId: string): Promise<SpotifyTrackDetails | null> {
  const token = await getSpotifyAccessToken();

  if (token) {
    try {
      const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('Retry-After')) || 2;
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        return fetchTrackById(trackId);
      }

      if (res.ok) {
        const data = await res.json();
        return mapSpotifyTrack(data);
      }
    } catch (e: any) {
      console.warn('Spotify API track fetch error:', e.message);
    }
  }

  // Fallback to official Spotify Embed JSON parser when credentials not yet in .env
  try {
    const embedRes = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (embedRes.ok) {
      const html = await embedRes.text();
      const start = html.indexOf('<script id="__NEXT_DATA__"');
      if (start !== -1) {
        const jsonStart = html.indexOf('>', start) + 1;
        const jsonEnd = html.indexOf('</script>', jsonStart);
        const json = JSON.parse(html.slice(jsonStart, jsonEnd));
        const entity = json.props?.pageProps?.state?.data?.entity;

        if (entity) {
          const images = entity.visualIdentity?.image || [];
          const cover = images[images.length - 1]?.url || images[0]?.url || '';
          const artistNames = (entity.artists || []).map((a: any) => a.name);

          return {
            id: trackId,
            name: entity.name || entity.title || '',
            artists: artistNames.length > 0 ? artistNames : ['Artis Spotify'],
            album: {
              name: entity.album?.name || entity.name || 'tidak tersedia',
              releaseDate: entity.album?.releaseDate?.isoString?.split('T')[0] || 'tidak tersedia',
              albumType: 'album',
              coverUrl: cover,
            },
            durationMs: entity.duration || 0,
            durationFormatted: formatDurationMs(entity.duration || 0),
            popularity: 80,
            isrc: entity.externalIds?.isrc || 'tidak tersedia',
            previewUrl: entity.audioPreview?.url || null,
            spotifyUrl: `https://open.spotify.com/track/${trackId}`,
            uri: `spotify:track:${trackId}`,
          };
        }
      }
    }
  } catch (err: any) {
    console.warn('Embed metadata fallback error:', err.message);
  }

  return null;
}

// Search tracks via Spotify Web API
export async function searchSpotifyTracks(
  query: string,
  artist?: string,
  limit: number = 15
): Promise<SpotifyTrackDetails[]> {
  const token = await getSpotifyAccessToken();
  if (!token) {
    return [];
  }

  try {
    let q = query.trim();
    if (artist && !q.includes('artist:')) {
      q = `track:"${query}" artist:"${artist}"`;
    }

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After')) || 2;
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return searchSpotifyTracks(query, artist, limit);
    }

    if (res.ok) {
      const data = await res.json();
      const items = data.tracks?.items || [];
      return items.map(mapSpotifyTrack);
    }
  } catch (err: any) {
    console.error('Spotify search error:', err.message);
  }

  return [];
}
