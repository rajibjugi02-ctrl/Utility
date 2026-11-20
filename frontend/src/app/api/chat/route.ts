import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Comprehensive intelligent knowledge engine for AkaBot
function generateAkaBotFallback(userText: string): string {
  const q = userText.toLowerCase().trim();

  // 1. Salam, Perkenalan & Small Talk
  if (/^(halo|hai|hi|hey|helo|p|tes|test|halo akabot|pagi|siang|sore|malam)/i.test(q)) {
    return 'Halo! 👋 Aku **AkaBot** 🌸, asisten virtual dan sahabat kamu di **UtilityHub**. Ada yang bisa aku bantu seputar download video, cari preset Alight Motion, hapus background, atau rekomendasi anime? Tanyakan saja ya!';
  }

  if (/(siapa kamu|kamu siapa|namamu|akabot|apa itu akabot|tentang kamu)/i.test(q)) {
    return `Aku **AkaBot** 🌸! Asisten cerdas serba bisa yang dirancang khusus untuk memandu kamu menggunakan seluruh fitur di **UtilityHub**. Aku bisa membantu menjawab cara pakai alat, memberi rekomendasi anime/film, hingga solusi editing dan unduh media!`;
  }

  if (/(kabar|gimana kabarmu|apa kabar|sehat)/i.test(q)) {
    return 'Kabarku luar biasa baik dan selalu siap 24/7 membantu kamu! 🚀 Kamu sendiri bagaimana harinya? Ada proyek video atau editing yang mau dikerjakan hari ini?';
  }

  if (/(terima kasih|makasih|thanks|thank you|tengkyu|arigato|mantap|keren|bagus)/i.test(q)) {
    return 'Sama-sama! Senang banget bisa bantu kamu. Jangan ragu buat tanya lagi kalau butuh bantuan lain ya! Semangat selalu! ✨';
  }

  if (/(bisa apa|fitur apa|kemampuanmu|bantuan apa|menu apa)/i.test(q)) {
    return `Berikut kemampuan utama yang ada di **UtilityHub**:
1. 📥 **Media Downloader**: Unduh video/audio dari TikTok (tanpa WM), IG Reels/Carousel, YouTube, Twitter/X, Pinterest, & Facebook.
2. 🎬 **Alight Motion Preset Finder**: Temukan link preset <5MB dan XML dari video TikTok, YouTube, & WhatsApp Channel.
3. 🎨 **Auto Vector XML**: Ubah gambar/foto langsung jadi file XML layer vektor (Shape_1 - Shape_N) siap impor di Alight Motion.
4. 🖼️ **Remove Background AI**: Hapus latar belakang foto jadi transparan rapi dalam hitungan detik.
5. 🔍 **Photo 4K Upscaler**: Tingkatkan ketajaman foto buram hingga resolusi 4K nyata.
6. 🌸 **Rekomendasi Anime & Film**: Temukan tontonan favorit lengkap sinopsis, rating, dan klip video trailer sinematik!`;
  }

  // 2. Alight Motion & Vector XML
  if (/(vektor|vector|svg|potong layer|auto vector)/i.test(q)) {
    return `Fitur **Auto Vector XML** (/tools/auto-vector-xml):
- Mendukung input file **.SVG** maupun foto **.PNG / .JPG**.
- Foto akan otomatis dipotong menjadi puluhan hingga ratusan layer vektor presisi (Shape_1, Shape_2, dst.) dengan warna ARGB dan posisi koordinat akurat.
- Dilengkapi pilihan kualitas: **Ultra Tajam (VTracer Rust)**, **Standar**, atau **Ringan**.
- Hasilnya bisa langsung kamu unduh sebagai file **.XML** asli Alight Motion 6.2.60!`;
  }

  if (/(preset|alight|am|5mb|xml am|proyek alight)/i.test(q)) {
    return `Untuk mencari **Preset Alight Motion**:
1. Buka alat **Alight Motion Preset Finder** di menu Kreator.
2. Tempelkan link postingan TikTok, video YouTube, atau tautan **Saluran WhatsApp** kreator.
3. Klik **Cari Link Preset**. Sistem kami otomatis membaca caption, pinned comment, hingga isi saluran WhatsApp untuk mengekstrak tautan preset direct link <5MB atau Google Drive XML!`;
  }

  // 3. Image Studio (Remove BG, Upscale, Converter, Pas Foto)
  if (/(hapus background|remove bg|transparan|bg transparan|hilangkan latar)/i.test(q)) {
    return `Fitur **Remove Background** ada di menu *Gambar & Desain*:
1. Unggah foto apapun yang ingin dibersihkan latar belakangnya.
2. Sistem AI kami memisahkan subjek tanpa merusak detail helai rambut atau lekukan pakaian.
3. Tersedia pratinjau latar (Transparan, Putih, Gelap, Hijau) dan bisa langsung diunduh sebagai **PNG Transparan berkualitas tinggi**!`;
  }

  if (/(upscale|4k|hd|buram|tajam|resolusi|jernih|pecah)/i.test(q)) {
    return `Punya foto buram atau pecah? Gunakan **Photo HD / 4K Upscaler**:
- Pilih skala **2x HD** atau **4x Ultra HD (4K)**.
- Algoritma bicubic reconstruction & sharpening otomatis mempertegas tepi dan menaikkan kepadatan piksel hingga resolusi ultra tajam.
- Dilengkapi slider Sebelum vs Sesudah (Before/After) untuk membandingkan hasilnya!`;
  }

  if (/(pas foto|3x4|4x6|2x3|foto ktp|ijazah|lamaran kerja)/i.test(q)) {
    return `Gunakan **Pembuat Pas Foto Kilat**:
- Tersedia ukuran standar resmi: **2×3 cm**, **3×4 cm**, dan **4×6 cm**.
- Pilihan ganti warna latar belakang instan: **Merah Formal**, **Biru Formal**, atau **Putih**.
- Otomatis crop rasio pas untuk kebutuhan lamaran kerja, CPNS, ijazah, atau paspor!`;
  }

  // 4. Downloader (TikTok, Instagram, YouTube, Twitter, dll)
  if (/(tiktok|watermark|snaptik|unduh video tiktok|vt)/i.test(q)) {
    return `Untuk mengunduh video **TikTok tanpa watermark**:
1. Salin tautan video TikTok (baik link biasa maupun pendek vt.tiktok.com).
2. Tempel di kolom **Media Downloader**.
3. Pilih resolusi: **Full HD 1080p**, **HD 720p**, atau unduh suaranya saja sebagai **MP3**!`;
  }

  if (/(instagram|reels|carousel|post ig|feed ig|story)/i.test(q)) {
    return `Untuk **Instagram Downloader**:
- **Reels (/reel/...)**: Otomatis mendeteksi video MP4 HD tanpa watermark.
- **Carousel Multi-Slide (/p/...)**: Otomatis mengekstrak seluruh slide foto dan video dalam 1 postingan! Kamu bisa unduh satu per satu atau langsung semua.`;
  }

  if (/(youtube|yt|mp3 youtube|unduh youtube|ytmp3)/i.test(q)) {
    return `Di **Media Downloader**, kamu bisa mengunduh konten YouTube:
- Video kualitas tinggi (1080p, 720p, 480p).
- Ekstraksi audio jernih (MP3) dari video klip musik atau podcast YouTube secara gratis dan cepat!`;
  }

  // 5. Hiburan & Audio
  if (/(anime|jepang|wibu|pv|trailer anime)/i.test(q)) {
    return `Mau cari tontonan seru? Buka **Pencari Rekomendasi Anime**:
- Cari berdasarkan judul atau filter genre (Action, Romance, Isekai, Shounen, dll).
- Lengkap dengan skor MAL, sinopsis Bahasa Indonesia, jumlah episode, dan studio pembuat.
- Kamu juga bisa langsung memutar **Klip Video PV / Trailer** sinematik di layar penuh!`;
  }

  if (/(film|movie|sinopsis film|bioskop)/i.test(q)) {
    return `Buka **Pencari Rekomendasi Film**:
- Temukan informasi film trending, box office, sinopsis lengkap, rating, dan video trailer resmi.`;
  }

  if (/(audio|suara|musik|slowed|reverb|cutter|potong lagu)/i.test(q)) {
    return `Di menu **Audio & Musik**, kami menyediakan:
- **Audio Slowed + Reverb**: Buat lagu bernuansa dreamy / aesthetic secara langsung di browser.
- **Pemotong Audio / Audio Cutter**: Potong durasi lagu untuk nada dering atau backsound video.
- **Voice Changer**: Ubah efek suara jadi unik dan seru!`;
  }

  // 6. Dokumen & PDF
  if (/(pdf|dokumen|gabung pdf|merge|tanda tangan|sign|scan ocr)/i.test(q)) {
    return `Untuk urusan dokumen, buka menu **Dokumen & PDF**:
- **Gabung PDF**: Gabungkan beberapa file PDF jadi 1 dokumen rapi.
- **Tanda Tangan PDF**: Bubuhkan tanda tangan digital langsung pada lembar dokumen.
- **Web to PDF**: Simpan halaman web menjadi file PDF bersih.
- **OCR Text Scanner**: Salin teks otomatis dari foto dokumen atau kwitansi!`;
  }

  // Fallback Ramah & Cerdas
  return `Pertanyaan kamu mengenai **"${userText}"** sangat menarik! 😊
Di **UtilityHub**, kamu bisa memanfaatkan berbagai alat bantu gratis:
- 📥 **Media Downloader**: Unduh TikTok tanpa WM, IG Carousel/Reels, YouTube HD, Twitter, FB, Pinterest.
- 🎨 **Kreator & Desain**: Auto Vector XML Alight Motion, Remove BG, 4K Upscaler, Preset Finder.
- 🎬 **Hiburan**: Rekomendasi Anime & Rekomendasi Film dengan trailer video interaktif.
- 🎵 **Audio & Dokumen**: Slowed+Reverb, Voice Changer, Gabung PDF, OCR Scanner.

Ketik kata kunci seperti *"cara cari preset"*, *"upscale 4k"*, *"vector xml"*, atau *"remove bg"* untuk panduan langkah demi langkah!`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages = [] } = body;

    const lastUserMessage =
      [...messages].reverse().find((m: ChatMessage) => m.role === 'user')?.content ||
      '';

    if (!lastUserMessage.trim()) {
      return NextResponse.json({
        success: true,
        reply: 'Halo! Ada yang bisa AkaBot bantu? Tanyakan apa saja seputar fitur di UtilityHub ya! 🌸',
        message: 'Halo! Ada yang bisa AkaBot bantu? Tanyakan apa saja seputar fitur di UtilityHub ya! 🌸',
      });
    }

    // Optional: If GEMINI_API_KEY is configured in Vercel environment variables, use live Gemini
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
                      text: `Kamu adalah AkaBot, asisten virtual ramah, santai, cerdas, dan suportif untuk web studio 'UtilityHub'.
Fitur UtilityHub:
1. Media Downloader (TikTok tanpa WM, IG Carousel/Reels, YouTube, X/Twitter, FB, Pinterest).
2. Alight Motion Preset Finder (Scraping link preset <5MB & Drive XML dari TikTok, YouTube, WhatsApp Channel).
3. Auto Vector XML (Ubah foto jadi potongan shape layer Alight Motion .xml).
4. Remove Background AI (Hapus latar belakang foto jadi transparan).
5. Photo HD / 4K Upscaler (Penajaman dan peningkatan resolusi foto hingga 4K).
6. Rekomendasi Anime & Film (Sinopsis, rating, klip PV trailer sinematik).
7. Audio Studio (Slowed+Reverb, Voice Changer, Audio Cutter).
8. PDF & Dokumen (Gabung PDF, Tanda Tangan, Web to PDF, OCR Scanner).

Gunakan gaya bahasa santai seperti teman akrab, ramah, dan solutif. Format jawaban dengan markdown rapi. Jawab dalam Bahasa Indonesia.

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
              reply: replyText,
              message: replyText,
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call skipped or timed out, using intelligent AkaBot fallback:', geminiErr);
      }
    }

    // Built-in intelligent response
    const reply = generateAkaBotFallback(lastUserMessage);
    return NextResponse.json({
      success: true,
      reply: reply,
      message: reply,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        reply: 'Maaf, terjadi kendala saat memproses pesan. Silakan coba tanyakan kembali ya!',
        message: err.message || 'Gagal memproses pesan.',
      },
      { status: 200 } // Return 200 so frontend can display the friendly reply rather than throwing uncaught exception
    );
  }
}
