import { NextRequest, NextResponse } from 'next/server';
import { searchSpotifyTracks, fetchTrackById } from '@/lib/spotifyClient';
import { parseSpotifyInput, rankSpotifyCandidates } from '@/lib/spotifyMatcher';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || url.searchParams.get('query') || '';
  return handleSearch(q);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const q = body.q || body.query || body.url || '';
    return handleSearch(q);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function handleSearch(rawQuery: string) {
  const clean = (rawQuery || '').trim();
  if (!clean) {
    return NextResponse.json(
      { success: false, error: 'Silakan masukkan kata kunci lagu atau link Spotify.' },
      { status: 400 }
    );
  }

  const parsed = parseSpotifyInput(clean);

  // Direct ID / Link route: fetch directly without text search
  if (parsed.isDirectId && parsed.trackId) {
    const track = await fetchTrackById(parsed.trackId);
    if (!track) {
      return NextResponse.json(
        { success: false, error: 'Lagu tidak ditemukan dari tautan Spotify tersebut.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      track,
      candidates: [track],
      confident: true,
      isDirectId: true,
    });
  }

  // Text search: fetch candidates via Spotify Web API
  const candidates = await searchSpotifyTracks(parsed.title, parsed.artist, 15);

  if (!candidates || candidates.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Lagu tidak ditemukan untuk pencarian "${clean}".`,
        candidates: [],
      },
      { status: 404 }
    );
  }

  const ranked = rankSpotifyCandidates(candidates, parsed.title, parsed.artist);

  if (!ranked.bestMatch) {
    return NextResponse.json(
      {
        success: false,
        error: `Tidak ada kandidat lagu yang cocok dengan kriteria "${clean}".`,
        candidates: candidates.slice(0, 5),
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    track: ranked.bestMatch,
    candidates: ranked.sortedCandidates.slice(0, 5),
    confident: ranked.confident,
    queryInfo: {
      raw: clean,
      parsedTitle: parsed.title,
      parsedArtist: parsed.artist,
    },
  });
}
