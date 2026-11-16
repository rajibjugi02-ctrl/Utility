import { NextRequest, NextResponse } from 'next/server';
import { fetchTrackById } from '@/lib/spotifyClient';
import { parseSpotifyInput } from '@/lib/spotifyMatcher';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const idOrUrl = url.searchParams.get('id') || url.searchParams.get('url') || '';
  return resolveTrack(idOrUrl);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const idOrUrl = body.id || body.url || body.trackId || '';
    return resolveTrack(idOrUrl);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function resolveTrack(rawInput: string) {
  const clean = (rawInput || '').trim();
  if (!clean) {
    return NextResponse.json(
      { success: false, error: 'Parameter track ID atau link Spotify diperlukan.' },
      { status: 400 }
    );
  }

  const parsed = parseSpotifyInput(clean);
  const trackId = parsed.trackId || clean;

  const track = await fetchTrackById(trackId);
  if (!track) {
    return NextResponse.json(
      {
        success: false,
        error: 'Lagu tidak ditemukan pada Spotify API. Periksa kembali link atau ID lagu.',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    track,
  });
}
