import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  let filename = searchParams.get('filename') || 'audio_track.mp3';

  // Sanitize filename
  filename = filename.replace(/[/\\?%*:|"<>]/g, '_');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Parameter url wajib disertakan.' }, { status: 400 });
  }

  try {
    const upstreamHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: '*/*',
    };

    if (targetUrl.includes('tiktok.com') || targetUrl.includes('tikwm.com')) {
      upstreamHeaders['Referer'] = 'https://www.tiktok.com/';
    } else if (targetUrl.includes('capcut.com')) {
      upstreamHeaders['Referer'] = 'https://www.capcut.com/';
    } else if (targetUrl.includes('googlevideo.com') || targetUrl.includes('youtube.com')) {
      upstreamHeaders['Referer'] = 'https://www.youtube.com/';
    } else if (targetUrl.includes('saavn') || targetUrl.includes('jiosaavn')) {
      upstreamHeaders['Referer'] = 'https://www.jiosaavn.com/';
    }

    const upstreamRes = await fetch(targetUrl, {
      headers: upstreamHeaders,
    });

    if (!upstreamRes.ok) {
      throw new Error(`Upstream returned ${upstreamRes.status}`);
    }

    const contentType =
      upstreamRes.headers.get('content-type') ||
      (filename.endsWith('.mp3') ? 'audio/mpeg' : filename.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream');

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    headers.set('Content-Type', contentType);

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new NextResponse(upstreamRes.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Proxy download error:', error.message);
    return NextResponse.redirect(targetUrl);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, filename = 'download_media.mp3' } = body;

    if (!url) {
      return NextResponse.json({ error: 'Parameter url wajib disertakan.' }, { status: 400 });
    }

    const downloadUrl = `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    return NextResponse.json({ success: true, downloadUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
