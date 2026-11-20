import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let imageBuffer: Buffer | null = null;
    let mimeType = 'image/png';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'File gambar tidak ditemukan dalam permintaan.' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      mimeType = file.type || 'image/png';
    } else {
      const body = await req.json();
      if (!body.image) {
        return NextResponse.json({ success: false, error: 'Data gambar (base64) wajib disertakan.' }, { status: 400 });
      }
      const base64Data = body.image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json({ success: false, error: 'Gagal memproses berkas gambar.' }, { status: 400 });
    }

    // 1. Attempt external AI remove background API
    try {
      const externalFormData = new FormData();
      const blob = new Blob([new Uint8Array(imageBuffer)], { type: mimeType });
      externalFormData.append('image', blob, 'input.png');

      const externalRes = await fetch('https://api.siputzx.my.id/api/iloveimg/removebg', {
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
          });
        }
      }
    } catch (err: any) {
      console.warn('External RemoveBG API unavailable, relying on client-side AI engine:', err.message);
    }

    // Inform client to execute on-device WASM model
    return NextResponse.json({
      success: true,
      source: 'client_wasm_ready',
      message: 'Server siap; gunakan model AI On-Device @imgly/background-removal.',
    });
  } catch (err: any) {
    console.error('RemoveBG API error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memproses penghapusan latar belakang.' },
      { status: 500 }
    );
  }
}
