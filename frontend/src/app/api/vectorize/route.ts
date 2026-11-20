import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let imageBuffer: Buffer | null = null;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'File gambar tidak ditemukan' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      const body = await req.json();
      if (!body.image) {
        return NextResponse.json({ success: false, error: 'Data gambar tidak ditemukan' }, { status: 400 });
      }
      const base64Data = body.image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json({ success: false, error: 'Buffer gambar kosong' }, { status: 400 });
    }

    // Dynamic import to allow safe graceful fallback on platforms where native binary may be missing
    const { vectorize, ColorMode, Hierarchical, PathSimplifyMode } = await import('@neplex/vectorizer');

    // Ultra-Sharp Logo Mode (VTracer Stacked Spline configuration)
    const svgOutput = await vectorize(imageBuffer, {
      colorMode: ColorMode.Color,
      hierarchical: Hierarchical.Stacked,
      mode: PathSimplifyMode.Spline,
      filterSpeckle: 2,
      colorPrecision: 7,
      layerDifference: 12,
      cornerThreshold: 45,
      lengthThreshold: 3.5,
      maxIterations: 10,
      spliceThreshold: 45,
      pathPrecision: 3,
    });

    if (!svgOutput || !svgOutput.includes('<svg')) {
      return NextResponse.json({ success: false, error: 'Gagal menghasilkan SVG dari VTracer' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      svg: svgOutput,
      engine: 'vtracer-rust',
    });
  } catch (err: any) {
    console.error('VTracer /api/vectorize error:', err?.message || err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Gagal melakukan tracing vektor VTracer',
      },
      { status: 500 }
    );
  }
}
