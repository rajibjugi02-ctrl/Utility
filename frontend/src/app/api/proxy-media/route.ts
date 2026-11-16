import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Parameter url wajib disertakan.' }, { status: 400 });
  }

  try {
    const rangeHeader = req.headers.get('range');
    const upstreamHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: '*/*',
    };

    // Smart Referer determination
    if (targetUrl.includes('tiktok.com') || targetUrl.includes('tikwm.com')) {
      upstreamHeaders['Referer'] = 'https://www.tiktok.com/';
    } else if (targetUrl.includes('capcut.com')) {
      upstreamHeaders['Referer'] = 'https://www.capcut.com/';
    } else if (targetUrl.includes('googlevideo.com') || targetUrl.includes('youtube.com')) {
      upstreamHeaders['Referer'] = 'https://www.youtube.com/';
    } else if (targetUrl.includes('saavn') || targetUrl.includes('jiosaavn')) {
      upstreamHeaders['Referer'] = 'https://www.jiosaavn.com/';
    }

    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader;
    }

    const upstreamRes = await fetch(targetUrl, {
      headers: upstreamHeaders,
      cache: 'no-store',
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return NextResponse.redirect(targetUrl);
    }

    const upstreamContentType = upstreamRes.headers.get('content-type');
    let contentType = upstreamContentType;
    if (!contentType || contentType === 'application/octet-stream') {
      if (targetUrl.includes('.mp3')) contentType = 'audio/mpeg';
      else if (targetUrl.includes('.mp4') || targetUrl.includes('saavncdn')) contentType = 'audio/mp4';
      else if (targetUrl.includes('googlevideo.com')) contentType = 'audio/webm';
      else contentType = 'audio/mpeg';
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'public, max-age=3600');

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    const contentRange = upstreamRes.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Proxy media streaming error:', error.message);
    return NextResponse.redirect(targetUrl);
  }
}

export async function HEAD(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const upstreamHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
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
      method: 'HEAD',
      headers: upstreamHeaders,
    });

    const headers = new Headers();
    headers.set('Content-Type', upstreamRes.headers.get('content-type') || 'audio/mpeg');
    headers.set('Accept-Ranges', 'bytes');
    const len = upstreamRes.headers.get('content-length');
    if (len) headers.set('Content-Length', len);

    return new NextResponse(null, { status: 200, headers });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
