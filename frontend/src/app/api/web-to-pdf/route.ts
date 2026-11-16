import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url = '' } = body;

    const cleanUrl = url.trim();
    if (!cleanUrl || !cleanUrl.startsWith('http')) {
      return NextResponse.json({ error: 'URL website tidak valid (harus diawali http:// atau https://).' }, { status: 400 });
    }

    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Server website merespons status ${res.status}.` }, { status: 400 });
    }

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Web_Document';

    // Extract clean body
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyContent = bodyMatch ? bodyMatch[1] : html;

    // Strip scripts, iframes, and intrusive trackers
    bodyContent = bodyContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

    return NextResponse.json({
      success: true,
      title,
      url: cleanUrl,
      htmlSnippet: bodyContent.slice(0, 50000),
    });
  } catch (err: any) {
    console.error('Web to PDF API error:', err);
    return NextResponse.json({ error: err.message || 'Gagal mengekstrak halaman web.' }, { status: 500 });
  }
}
