# 🌐 GlassHub — All-in-One Utility & Downloader Studio

Aplikasi web utilitas all-in-one modern dengan arsitektur **Glassmorphism**, antarmuka real-time berbasis **WebSockets**, dan integrasi backend **Python (FastAPI + yt-dlp + FFmpeg + Mutagen)**.

---

## 🚀 Fitur Utama

### 1. Navigasi & UI Glassmorphism
- **Desain Glassmorphism**: Efek transparan `backdrop-blur-xl`, border tipis neon, dan palet gelap minimalis (Navy Blue & Charcoal).
- **Desktop Floating Navbar**: Pill bar melayang di atas layar dengan indikator status backend dan tab "Beranda", "Riwayat", "Pengaturan".
- **Mobile Floating Bottom Bar**: Bar navigasi bawah ergonomis untuk tampilan smartphone dengan animasi transisi pegas (spring) Framer Motion.
- **Shared Element Transitions**: Menu beranda grid yang membesar dan bertransformasi secara mulus (`layoutId`) menjadi modal halaman kerja penuh tanpa pergeseran layout.

### 2. Hero Section (Kartu Identitas Pengguna)
- **Random Anime Avatar**: Sapaan dinamis `Guest_[RandomNumber]` dengan avatar anime beresolusi tinggi dan tombol regenerasi identitas.
- **Deteksi OS & Browser**: Menggunakan `UAParser.js` untuk mendeteksi sistem operasi (Windows, Mac, iOS, Android, Linux) dan browser (Chrome, Edge, Firefox, Safari) dengan ikon spesifik.
- **Web Battery API**: Menampilkan indikator level baterai, status pengisian daya (*charging*), dan persentase secara real-time.
- **Easter Egg (Fitur Rahasia)**: 5 kali klik cepat pada foto avatar akan memunculkan modal rahasia **Admin Authentication** (kata sandi bawaan: `admin123`) untuk membuka mode telemetri server (CPU, RAM, Disk).

### 3. Fitur Alat (Tools)
- **TikTok & Alight Motion Extractor**:
  - Unduh video TikTok kualitas HD MP4 (tanpa watermark) atau ekstrak audio MP3.
  - Regex web scraping otomatis memindai deskripsi dan komentar untuk menemukan tautan preset **Alight Motion** (`alight.link`), **Google Drive (XML)**, atau **MediaFire**.
  - Menampilkan kotak alert khusus glowing **"Preset Ditemukan!"** dengan tombol langsung membuka preset.
- **Spotify to MP3**:
  - Konversi lagu Spotify langsung ke berkas MP3 320kbps.
  - Secara otomatis mencari stream audio kualitas tertinggi via `yt-dlp` dan menyuntikkan metadata ID3 lengkap (Judul, Artis, Album, dan Gambar Sampul Album) menggunakan pustaka `mutagen`.
- **PDF Studio**:
  - Editor teks kaya mandiri berbasis **Tiptap**.
  - Fitur lengkap: Bold, Italic, Strikethrough, Heading 1/2, Bullet/Ordered List, Perataan Teks (Left, Center, Right, Justify), Pemilih Warna Teks, dan Sisipkan Gambar.
  - Kustomisasi ukuran margin kertas (Rapat 12mm, Normal 20mm, Lebar 28mm).
  - Konversi langsung ke PDF via browser print rendering presisi tinggi.

### 4. Progress Bar Real-Time (WebSockets)
- Tidak menggunakan polling HTTP! Progres unduhan dikirim langsung dari backend melalui WebSockets (`/ws/progress/{task_id}`).
- Menampilkan:
  - Persentase unduhan (0–100%) dengan bar neon berkilau (*shimmer effect*).
  - Kecepatan unduh real-time (MB/s).
  - Estimasi waktu sisa (ETA).
  - Letupan selebrasi kembang api (*canvas-confetti*) dan tombol unduh langsung saat berkas siap.

### 5. Pengaturan & Personalisasi (Zustand Local Storage)
- **Pilihan Tema Aksen Neon**:
  - `Neon Blue` (Cyan Glow `#00f0ff`)
  - `Matcha` (Emerald Glow `#10b981`)
  - `Sunset` (Rose Glow `#f43f5e`)
- **Kepadatan & Ukuran Teks**: Ringkas (Compact), Standar (Normal), atau Lega (Spacious).
- **Multi-bahasa**: Beralih antara Bahasa Indonesia (`id`) dan English (`en`).
- **Latar Belakang Animasi**: Kanvas partikel interaktif yang merespons kursor mouse dengan sakelar On/Off.

### 6. PWA Ready
- Dilengkapi berkas `manifest.json` dan konfigurasi mobile viewport agar dapat diinstal sebagai Progressive Web App (PWA) di Android/iOS/Desktop.

---

## 🛠️ Struktur Folder

```
mydownloader/
├── backend/
│   ├── venv/                       # Virtual environment Python
│   ├── downloads/                  # Folder penyimpanan berkas unduhan
│   ├── services/
│   │   ├── ffmpeg_helper.py        # Resolusi otomatis FFmpeg & imageio-ffmpeg
│   │   ├── ws_manager.py           # Pengelola koneksi real-time WebSocket
│   │   ├── tiktok_service.py       # Scraper TikTok & detektor preset Alight Motion
│   │   ├── spotify_service.py      # Metadata Spotify & penyuntik tag ID3 Mutagen
│   │   └── task_runner.py          # Runner background task (Celery + Thread worker)
│   ├── celery_app.py               # Konfigurasi Celery (opsional dengan Redis)
│   ├── main.py                     # Entry point FastAPI & rute API
│   └── requirements.txt            # Dependensi backend Python
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css         # Styling Glassmorphism & variabel tema CSS
│   │   │   ├── layout.tsx          # Root Layout & metadata PWA
│   │   │   └── page.tsx            # Halaman utama & router tab
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Floating Navbar (Desktop) & Floating Bottom Bar (Mobile)
│   │   │   ├── HeroSection.tsx     # Kartu Avatar Anime, UAParser, Baterai, Easter Egg
│   │   │   ├── ToolsGrid.tsx       # Grid Beranda dengan Shared Element Transition
│   │   │   ├── RealTimeProgress.tsx# UI Bar Progres Real-Time via WebSockets
│   │   │   ├── HistoryView.tsx     # Tampilan Riwayat Unduhan & Preset
│   │   │   ├── SettingsView.tsx    # Halaman Pengaturan & Tema Neon
│   │   │   ├── ParticleBackground.tsx # Animasi kanvas partikel responsif
│   │   │   └── tools/
│   │   │       ├── TikTokExtractor.tsx   # Komponen TikTok & Alight Motion
│   │   │       ├── SpotifyDownloader.tsx # Komponen Spotify to MP3
│   │   │       └── PdfStudio.tsx         # Komponen Editor Tiptap & Cetak PDF
│   │   ├── store/
│   │   │   └── useAppStore.ts      # State management Zustand (tersimpan di localStorage)
│   │   └── utils/
│   │       └── i18n.ts             # Kamus terjemahan bilingual (ID & EN)
│   ├── public/
│   │   └── manifest.json           # Konfigurasi PWA
│   ├── tailwind.config.js
│   ├── next.config.mjs
│   └── package.json
│
├── run_backend.bat                 # Skrip sekali klik untuk menjalankan backend
├── run_frontend.bat                # Skrip sekali klik untuk menjalankan frontend
└── run_all.bat                     # Skrip sekali klik untuk menjalankan keduanya
```

---

## 💻 Cara Menjalankan Aplikasi

### Opsi 1: Menjalankan Sekaligus (Paling Praktis)
Cukup klik ganda pada berkas:
```powershell
.\run_all.bat
```
Skrip ini akan otomatis membuka terminal backend di port `8000` dan frontend di port `3000`.

---

### Opsi 2: Menjalankan Secara Manual

#### 1. Menjalankan Backend (FastAPI):
Buka terminal PowerShell:
```powershell
cd c:\mydownloader\backend
.\venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- API & WebSocket berjalan di: `http://localhost:8000`
- Dokumentasi interaktif Swagger UI: `http://localhost:8000/docs`

#### 2. Menjalankan Frontend (Next.js):
Buka terminal baru:
```powershell
cd c:\mydownloader\frontend
npm run dev
```
- Buka browser di: `http://localhost:3000`
