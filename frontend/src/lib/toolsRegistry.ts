import React from 'react';
import {
  Video,
  Music2,
  FileText,
  Youtube,
  Instagram,
  Layers,
  Globe,
  Image as ImageIcon,
  Sliders,
  ScanText,
  Eye,
  Scissors,
  LayoutGrid,
  QrCode,
  FileCode,
  Palette,
  Camera,
  Mic,
  FileCheck2,
  VolumeX,
  UserCheck,
  Film,
  Download,
} from 'lucide-react';
import { ToolCategory } from '@/store/useAppStore';

export interface ToolItem {
  id: string;
  title: string;
  desc: string;
  category: ToolCategory;
  badge: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  isNew?: boolean;
}

export const CATEGORY_FILTERS: Array<{ id: ToolCategory; label: string }> = [
  { id: 'all', label: 'Semua Alat' },
  { id: 'downloader', label: 'Downloader' },
  { id: 'creator', label: 'Kreator & Video' },
  { id: 'audio', label: 'Audio & Musik' },
  { id: 'docs', label: 'Dokumen & PDF' },
  { id: 'images', label: 'Gambar & Desain' },
  { id: 'dev', label: 'Developer & QR' },
];

export const toolsCatalog: ToolItem[] = [
  // --- DOWNLOADER UTAMA ---
  {
    id: 'media-downloader',
    title: 'Media Downloader',
    desc: 'Unduh video MP4 HD, foto slide/carousel, dan audio tanpa watermark dari 6 platform utama.',
    category: 'downloader',
    badge: '6 PLATFORM UTAMA',
    icon: Download,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-500/10',
    isNew: true,
  },

  // --- KREATOR & VIDEO ---
  {
    id: 'movie-finder',
    title: 'Pencari Rekomendasi Film',
    desc: 'Temukan film bioskop, box office, & series terbaik dengan rating tinggi, poster jernih, dan sinopsis seru.',
    category: 'creator',
    badge: 'FILM & SERIES',
    icon: Film,
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-500/10',
    isNew: true,
  },
  {
    id: 'tiktok-stalker',
    title: 'TikTok Profile Stalker',
    desc: 'Cek detail profil, followers, total likes, bio, & analitik akun TikTok secara real-time.',
    category: 'creator',
    badge: 'REAL-TIME STALK',
    icon: UserCheck,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
    isNew: true,
  },
  {
    id: 'alight-preset-finder',
    title: 'Alight Motion Preset Finder',
    desc: 'Deep scraping komentar, caption, dan bio untuk preset <5MB & XML.',
    category: 'creator',
    badge: 'Preset 5MB / XML',
    icon: Layers,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
  },
  {
    id: 'safe-zone-previewer',
    title: 'Safe Zone Previewer & HD Grabber',
    desc: 'Cek overlay TikTok/Reels/Shorts & ambil screenshot frame video HD.',
    category: 'creator',
    badge: 'Safe Zone & HD',
    icon: Eye,
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-500/10',
  },
  {
    id: 'video-gif-sticker-maker',
    title: 'Video to GIF & WA Sticker 512px',
    desc: 'Ubah klip video menjadi animasi GIF dan format stiker WhatsApp resmi.',
    category: 'creator',
    badge: 'Sticker & GIF',
    icon: Video,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
    isNew: true,
  },
  {
    id: 'video-mute-audio-replacer',
    title: 'Video Audio Mute & BGM Replacer',
    desc: 'Hapus audio asli video (1-klik mute) atau campur dengan backsound baru.',
    category: 'creator',
    badge: 'Mute & Mix',
    icon: VolumeX,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-500/10',
    isNew: true,
  },

  // --- AUDIO & MUSIK ---
  {
    id: 'voice-changer-studio',
    title: 'Voice Changer & Audio Anonymizer',
    desc: 'Ubah suara jadi Deep Hacker, Robot, Chipmunk, Walkie-Talkie, Megaphone.',
    category: 'audio',
    badge: 'Voice DSP',
    icon: Mic,
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-500/10',
    isNew: true,
  },
  {
    id: 'audio-slowed-reverb',
    title: 'Audio Slowed + Reverb Studio',
    desc: 'Atur tempo slowed, reverb ruang, dan bass boost dengan Web Audio DSP.',
    category: 'audio',
    badge: 'DSP Studio',
    icon: Sliders,
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-500/10',
  },
  {
    id: 'audio-cutter-splitter',
    title: 'Audio Cutter & Vocal Splitter',
    desc: 'Potong lagu, karaoke vocal remover (phase cancellation), & vocal boost.',
    category: 'audio',
    badge: 'Cutter & Vocal',
    icon: Scissors,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
  },

  // --- DOKUMEN & PDF ---
  {
    id: 'pdf-studio',
    title: 'PDF Studio (Text to PDF)',
    desc: 'Editor dokumen kanvas bersih, setup kertas presisi, dan live export PDF.',
    category: 'docs',
    badge: 'Kanvas Bersih',
    icon: FileText,
    iconColor: 'text-indigo-500',
    iconBg: 'bg-indigo-500/10',
  },
  {
    id: 'web-to-pdf',
    title: 'Link / Web to PDF',
    desc: 'Ubah artikel website atau tautan berita menjadi dokumen PDF bersih.',
    category: 'docs',
    badge: 'Clean PDF',
    icon: Globe,
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-500/10',
  },
  {
    id: 'ocr-image-to-text',
    title: 'OCR Image to Text Scanner',
    desc: 'Pindai teks dari foto catatan, struk, atau screenshot ke teks editable.',
    category: 'docs',
    badge: 'OCR Scanner',
    icon: ScanText,
    iconColor: 'text-teal-500',
    iconBg: 'bg-teal-500/10',
  },

  // --- GAMBAR & DESAIN ---
  {
    id: 'korean-photobooth-strip',
    title: 'Korean Photobooth (Life4Cuts)',
    desc: 'Foto 4-frame estetik via webcam/kamera HP dengan hitung mundur & filter.',
    category: 'images',
    badge: 'Life4Cuts 4-Frame',
    icon: Camera,
    iconColor: 'text-pink-500',
    iconBg: 'bg-pink-500/10',
    isNew: true,
  },
  {
    id: 'camscanner-enhancer',
    title: 'CamScanner Document Enhancer',
    desc: 'Bersihkan bayangan foto catatan/struk jadi putih bersih layaknya mesin scan.',
    category: 'images',
    badge: 'Clean Scanner',
    icon: FileCheck2,
    iconColor: 'text-teal-500',
    iconBg: 'bg-teal-500/10',
    isNew: true,
  },
  {
    id: 'target-size-compressor',
    title: 'Target-Size Media Compressor',
    desc: 'Kompres foto presisi ke target ukuran spesifik (<200KB, <1MB) untuk syarat upload.',
    category: 'images',
    badge: 'Batas KB/MB',
    icon: Sliders,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
  },
  {
    id: 'image-palette-extractor',
    title: 'Image Color Palette Extractor',
    desc: 'Ekstrak 8 warna dominan (#HEX, RGB, HSL) dan ekspor kartu palet desain .PNG.',
    category: 'images',
    badge: 'HEX Palette',
    icon: Palette,
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-500/10',
  },
  {
    id: 'ig-grid-splitter',
    title: 'Instagram Grid 3x3 Splitter',
    desc: 'Potong feed Instagram 3x1, 3x2, 3x3 rapi berurutan & unduh ZIP.',
    category: 'images',
    badge: 'Grid Splitter',
    icon: LayoutGrid,
    iconColor: 'text-pink-500',
    iconBg: 'bg-pink-500/10',
  },
  {
    id: 'image-converter',
    title: 'Image Converter & Compressor',
    desc: 'Ubah format WEBP/PNG/JPG dan kompres ukuran nyata dengan perbandingan live.',
    category: 'images',
    badge: 'Image Studio',
    icon: ImageIcon,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
  },

  // --- DEVELOPER & QR ---
  {
    id: 'web-to-design-prompt-md',
    title: 'Web to Design Prompt (.MD)',
    desc: 'Reverse-engineer UI/UX website menjadi dokumen prompt design system .md.',
    category: 'dev',
    badge: 'Prompt .MD',
    icon: FileCode,
    iconColor: 'text-indigo-500',
    iconBg: 'bg-indigo-500/10',
  },
  {
    id: 'qr-code-studio',
    title: 'Custom QR Code Studio',
    desc: 'Ubah link/teks/gambar ke QR Code kustom dengan panel bukti Before vs After.',
    category: 'dev',
    badge: 'QR Studio',
    icon: QrCode,
    iconColor: 'text-teal-500',
    iconBg: 'bg-teal-500/10',
  },
];

/**
 * Dictionary of slug aliases to prevent 404 / 'Alat tidak ditemukan'
 */
export const SLUG_ALIASES: Record<string, string> = {
  // Downloader Aliases -> media-downloader
  'tiktok-downloader': 'media-downloader',
  'tiktok': 'media-downloader',
  'ig-downloader': 'media-downloader',
  'instagram-downloader': 'media-downloader',
  'instagram': 'media-downloader',
  'youtube-downloader': 'media-downloader',
  'youtube': 'media-downloader',
  'x-downloader': 'media-downloader',
  'twitter-downloader': 'media-downloader',
  'twitter': 'media-downloader',
  'facebook-downloader': 'media-downloader',
  'fb-downloader': 'media-downloader',
  'facebook': 'media-downloader',
  'pinterest-downloader': 'media-downloader',
  'pinterest': 'media-downloader',
  'downloader': 'media-downloader',
  'multi-downloader': 'media-downloader',
  'media': 'media-downloader',

  // Movie Finder Aliases -> movie-finder
  'rekomendasi-film': 'movie-finder',
  'film-finder': 'movie-finder',
  'pencari-film': 'movie-finder',
  'film': 'movie-finder',
  'movie': 'movie-finder',
  'movies': 'movie-finder',
  'bioskop': 'movie-finder',

  // TikTok Stalker Aliases -> tiktok-stalker
  'tiktok-stalk': 'tiktok-stalker',
  'stalk-tiktok': 'tiktok-stalker',
  'stalker': 'tiktok-stalker',

  // Alight Motion Aliases -> alight-preset-finder
  'alight-motion': 'alight-preset-finder',
  'alight-preset': 'alight-preset-finder',
  'preset-am': 'alight-preset-finder',
  'cari-link-jj': 'alight-preset-finder',
  'link-jj': 'alight-preset-finder',

  // PDF & Docs Aliases -> pdf-studio / web-to-pdf
  'text-to-pdf': 'pdf-studio',
  'pdf': 'pdf-studio',
  'link-to-pdf': 'web-to-pdf',
  'html-to-pdf': 'web-to-pdf',
  'web-pdf': 'web-to-pdf',
  'ocr': 'ocr-image-to-text',
  'scanner': 'camscanner-enhancer',
  'camscanner': 'camscanner-enhancer',

  // Images Aliases
  'photobooth': 'korean-photobooth-strip',
  'life4cuts': 'korean-photobooth-strip',
  'compressor': 'target-size-compressor',
  'palette': 'image-palette-extractor',
  'grid-splitter': 'ig-grid-splitter',
  'converter': 'image-converter',

  // Audio Aliases
  'slowed-reverb': 'audio-slowed-reverb',
  'voice-changer': 'voice-changer-studio',
  'audio-cutter': 'audio-cutter-splitter',
  'vocal-remover': 'audio-cutter-splitter',

  // Video & Creator Aliases
  'video-to-gif': 'video-gif-sticker-maker',
  'gif-maker': 'video-gif-sticker-maker',
  'sticker-maker': 'video-gif-sticker-maker',
  'mute-video': 'video-mute-audio-replacer',
  'safe-zone': 'safe-zone-previewer',

  // Dev Aliases
  'qr-code': 'qr-code-studio',
  'qr-studio': 'qr-code-studio',
  'qr': 'qr-code-studio',
  'design-prompt': 'web-to-design-prompt-md',
};

/**
 * Safe, single-source-of-truth tool resolver with alias normalization
 */
export const resolveToolBySlug = (rawSlug: string): ToolItem | undefined => {
  if (!rawSlug) return undefined;
  try {
    const normalized = decodeURIComponent(rawSlug).toLowerCase().trim();
    // 1. Direct match
    const directMatch = toolsCatalog.find((t) => t.id === normalized);
    if (directMatch) return directMatch;
    // 2. Alias match
    const aliasId = SLUG_ALIASES[normalized];
    if (aliasId) {
      return toolsCatalog.find((t) => t.id === aliasId);
    }
  } catch {}
  return undefined;
};
