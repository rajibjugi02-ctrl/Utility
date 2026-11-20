import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Knowledge base fallback for AkaBot when no external API key is provided
function generateAkaBotFallback(userText: string): string {
  const q = userText.toLowerCase().trim();

  if (/^(halo|hai|hi|hey|p|tes|test|pagi|siang|sore|malam)/i.test(q)) {
    return 'Halo! 👋 Aku **AkaBot**, asisten santai kamu di sini. Mau tanya soal fitur web ini atau sekadar ngobrol? Kamu bisa tanya seputar download media, cari preset Alight Motion, hapus background, anime rekomendasi, atau upscaler foto 4K!';
  }

  if (/(preset|alight|am|5mb|xml|proyek)/i.test(q)) {
    return `Untuk mencari dan mengekstrak **Preset Alight Motion**:
1. Buka alat **Alight Motion Preset Finder** di menu Kreator.
2. Tempelkan tautan video TikTok, YouTube, atau tautan **Saluran WhatsApp** kreator.
3. Klik **Cari Link Preset**. Sistem kami otomatis melakukan deep-scraping pada caption, komentar disematkan, balasan komentar, dan saluran WhatsApp untuk menemukan link direct \`<5MB\` atau Google Drive XML!`;
  }

  if (/(hapus background|remove bg|transparan|bg transparan|hilangkan latar)/i.test(q)) {
    return `Fitur **Remove Background** ada di menu *Gambar & Desain*:
1. Unggah foto yang ingin kamu bersihkan latarnya.
2. Sistem AI Segmentasi kami otomatis memisahkan subjek utama tanpa merusak detail rambut atau pakaian.
3. Hasilnya 100% otomatis transparan dengan opsi preview (Transparan, Putih, Gelap, Hijau) dan bisa langsung diunduh sebagai **PNG Transparan asli**!`;
  }

  if (/(upscale|4k|hd|buram|tajam|resolusi)/i.test(q)) {
    return `Foto kamu buram atau pecah? Gunakan **Photo HD / 4K Upscaler**:
- Pilih skala **2x HD** atau **4x Ultra HD (4K)**.
- Teknologi kami menggunakan multi-pass bicubic reconstruction & unsharp mask otomatis untuk melipatgandakan resolusi piksel hingga 3840×2160 (4K).
- Dilengkapi slider Sebelum vs Sesudah (Before/After) tanpa lag!`;
  }

  if (/(anime|jepang|wibu|pv|trailer)/i.test(q)) {
    return `Mau cari tontonan anime seru? Buka **Pencari Rekomendasi Anime**:
- Kamu bisa cari berdasarkan judul atau filter genre (Action, Romance, Fantasy, dsb).
- Lengkap dengan rating skor, sinopsis, episode, studio produksi.
- Terdapat bagian **Klip Video Pendek / PV Trailer** sinematik yang bisa kamu putar langsung di modal layar luas!`;
  }

  if (/(vektor|vector|xml|shape|potong layer)/i.test(q)) {
    return `Fitur **Auto Vector XML**:
- Unggah foto/gambar yang ingin kamu jadikan motion graphic.
- Gambar akan diproses menjadi potongan layer/shape vektor dengan warna & koordinat presisi.
- Kamu bisa menyalin kodenya atau langsung mengunduh file **.XML** yang siap di-import ke Alight Motion!`;
  }

  if (/(instagram|reels|carousel|post|ig|feed)/i.test(q)) {
    return `Untuk **Instagram Downloader**:
- **Reels (\`/reel/...\`)**: Otomatis mendeteksi video MP4 berkualitas tinggi tanpa watermark.
- **Carousel / Multi-Slide (\`/p/...\`)**: Otomatis mendeteksi seluruh slide foto dan video dalam satu postingan!`;
  }

  if (/(tiktok|watermark|snaptik|unduh video)/i.test(q)) {
    return `Fitur **Media Downloader** kami mendukung TikTok tanpa watermark secara instan! Cukup tempel link TikTok biasa atau \`vt.tiktok.com\`, lalu pilih resolusi Ultra HD 1080p, HD 720p, atau audio MP3 saja.`;
  }

  if (/(siapa kamu|namamu|akabot|aka)/i.test(q)) {
    return `Aku **AkaBot** 🌸, asisten AI santai dan sahabat utilitas kamu di **UtilityHub**. Siap membantu kapan saja untuk segala kebutuhan download dan editing kamu!`;
  }

  return `Pertanyaan menarik! Mengenai **"${userText}"**, kamu bisa mengeksplorasi berbagai alat di **UtilityHub**:
- 📥 **Media Downloader**: TikTok, IG Carousel/Reels, YouTube 4K, Twitter, Pinterest, Facebook.
- 🎨 **Kreator & Desain**: Remove Background, 4K Upscaler, Auto Vector XML, Alight Preset Finder.
- 🎬 **Hiburan**: Rekomendasi Film & Rekomendasi Anime dengan video PV sinematik.
- 🎵 **Audio**: Voice Changer, Audio Slowed + Reverb, Audio Cutter.

Ketik kata kunci seperti *"cara cari preset"*, *"upscale 4k"*, atau *"remove bg"* untuk panduan cepat!`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [] } = body;

    const lastUserMessage = [...messages].reverse().find((m: ChatMessage) => m.role === 'user')?.content || '';

    // If external AI keys (like GEMINI_API_KEY) are set, can query Gemini API
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `Kamu adalah AkaBot, asisten santai, ramah, dan cerdas untuk web 'UtilityHub'. 
UtilityHub memiliki fitur:
1. Media Downloader (TikTok tanpa WM, IG Carousel & Reels, YouTube 4K, X/Twitter, FB, Pinterest).
2. Alight Motion Preset Finder (Deep scraping preset <5MB & XML dari TikTok, YouTube, WhatsApp Channel).
3. Auto Vector XML (Ubah gambar jadi shape layer Alight Motion .xml).
4. Remove Background (AI penghapus latar belakang otomatis transparan).
5. Photo HD / 4K Upscaler (Peningkatan resolusi foto 2x HD dan 4x Ultra HD otomatis).
6. Rekomendasi Anime & Film (Lengkap sinopsis, rating, dan klip video PV trailer sinematik).
7. Audio Studio (Slowed+Reverb, Voice Changer, Audio Cutter).
8. PDF & Dokumen (PDF Merge, Sign, Web to PDF, OCR Scanner).

Gunakan gaya bahasa santai, akrab, solutif, dan ramah seperti teman akrab. Jawab dalam Bahasa Indonesia.

Pertanyaan pengguna: ${lastUserMessage}`,
                    },
                  ],
                },
              ],
            }),
            signal: AbortSignal.timeout(8000),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const replyText =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return NextResponse.json({
              success: true,
              message: replyText,
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, using AkaBot fallback:', geminiErr);
      }
    }

    // High quality built-in knowledge response
    const reply = generateAkaBotFallback(lastUserMessage);
    return NextResponse.json({
      success: true,
      message: reply,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Gagal memproses pesan.',
      },
      { status: 500 }
    );
  }
}
