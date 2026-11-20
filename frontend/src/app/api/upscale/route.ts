import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let imageBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';
    let scaleFactor = 4;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') as File | null;
      const factorParam = formData.get('factor');
      if (factorParam) scaleFactor = parseInt(factorParam.toString(), 10) || 4;

      if (!file) {
        return NextResponse.json({ success: false, error: 'File gambar tidak ditemukan dalam permintaan.' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      mimeType = file.type || 'image/jpeg';
    } else {
      const body = await req.json();
      if (!body.image) {
        return NextResponse.json({ success: false, error: 'Data gambar wajib disertakan.' }, { status: 400 });
      }
      if (body.factor) scaleFactor = parseInt(body.factor, 10) || 4;
      const base64Data = body.image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json({ success: false, error: 'Gagal membaca berkas gambar.' }, { status: 400 });
    }

    // 1. Attempt External AI Super-Resolution Cloud API
    try {
      const externalFormData = new FormData();
      const blob = new Blob([new Uint8Array(imageBuffer)], { type: mimeType });
      externalFormData.append('image', blob, 'input.jpg');
      externalFormData.append('scale', scaleFactor.toString());

      const externalRes = await fetch('https://api.siputzx.my.id/api/iloveimg/upscale', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: externalFormData,
        signal: AbortSignal.timeout(5000),
      });

      if (externalRes.ok) {
        const resultBuffer = await externalRes.arrayBuffer();
        if (resultBuffer.byteLength > 1000) {
          const base64Out = Buffer.from(resultBuffer).toString('base64');
          return NextResponse.json({
            success: true,
            source: 'ai_cloud',
            imageUrl: `data:image/png;base64,${base64Out}`,
            scale: scaleFactor,
          });
        }
      }
    } catch (err: any) {
      console.warn('External AI Upscaler API unavailable, proceeding to client engine:', err.message);
    }

    // 2. Return fallback flag for high-precision client-side multi-pass 4K reconstruction
    return NextResponse.json({
      success: true,
      source: 'client_engine_ready',
      scale: scaleFactor,
      message: 'Server siap; gunakan engine rekonstruksi piksel 4K client-side.',
    });
  } catch (err: any) {
    console.error('Upscale API error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memproses peningkatan resolusi.' },
      { status: 500 }
    );
  }
}
