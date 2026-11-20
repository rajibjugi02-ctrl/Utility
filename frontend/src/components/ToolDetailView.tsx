'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toolsCatalog, resolveToolBySlug } from '@/lib/toolsRegistry';
import { i18n } from '@/utils/i18n';

const ToolLoadingFallback = () => (
  <div className="w-full min-h-[320px] p-8 rounded-3xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo flex flex-col items-center justify-center gap-3 animate-pulse">
    <div className="w-10 h-10 rounded-2xl bg-[var(--neo-accent)] text-[var(--neo-accent-text)] border-2 border-black flex items-center justify-center">
      <Sparkles className="w-5 h-5 animate-spin" />
    </div>
    <span className="text-xs font-mono font-bold text-[var(--neo-text)]">Memuat Alat...</span>
  </div>
);

// 6 Core Platform Downloader & Movie Finder
const MediaDownloaderHub = dynamic(() => import('./tools/MediaDownloaderHub').then(m => m.MediaDownloaderHub), { ssr: false, loading: ToolLoadingFallback });
const MovieRecommendationFinder = dynamic(() => import('./tools/MovieRecommendationFinder').then(m => m.MovieRecommendationFinder), { ssr: false, loading: ToolLoadingFallback });
const ApkDownloaderTool = dynamic(() => import('./tools/ApkDownloaderTool').then(m => m.ApkDownloaderTool), { ssr: false, loading: ToolLoadingFallback });

// Creator & Video Tools
const TikTokStalkerTool = dynamic(() => import('./tools/TikTokStalkerTool').then(m => m.TikTokStalkerTool), { ssr: false, loading: ToolLoadingFallback });
const AlightMotionPresetFinder = dynamic(() => import('./tools/AlightMotionPresetFinder').then(m => m.AlightMotionPresetFinder), { ssr: false, loading: ToolLoadingFallback });
const AnimeRecommendationFinder = dynamic(() => import('./tools/AnimeRecommendationFinder').then(m => m.AnimeRecommendationFinder), { ssr: false, loading: ToolLoadingFallback });
const AutoVectorXmlTool = dynamic(() => import('./tools/AutoVectorXmlTool').then(m => m.AutoVectorXmlTool), { ssr: false, loading: ToolLoadingFallback });
const SafeZonePreviewer = dynamic(() => import('./tools/SafeZonePreviewer').then(m => m.SafeZonePreviewer), { ssr: false, loading: ToolLoadingFallback });
const VideoGifStickerMaker = dynamic(() => import('./tools/VideoGifStickerMaker'), { ssr: false, loading: ToolLoadingFallback });
const VideoAudioMuteReplacer = dynamic(() => import('./tools/VideoAudioMuteReplacer'), { ssr: false, loading: ToolLoadingFallback });

// Audio Tools
const VoiceChangerStudio = dynamic(() => import('./tools/VoiceChangerStudio').then(m => m.VoiceChangerStudio), { ssr: false, loading: ToolLoadingFallback });
const AudioSlowedReverb = dynamic(() => import('./tools/AudioSlowedReverb').then(m => m.AudioSlowedReverb), { ssr: false, loading: ToolLoadingFallback });
const AudioCutterSplitter = dynamic(() => import('./tools/AudioCutterSplitter').then(m => m.AudioCutterSplitter), { ssr: false, loading: ToolLoadingFallback });

// Docs Tools
const PdfStudio = dynamic(() => import('./tools/PdfStudio').then(m => m.PdfStudio), { ssr: false, loading: ToolLoadingFallback });
const WebToPdf = dynamic(() => import('./tools/WebToPdf').then(m => m.WebToPdf), { ssr: false, loading: ToolLoadingFallback });
const OcrScanner = dynamic(() => import('./tools/OcrScanner').then(m => m.OcrScanner), { ssr: false, loading: ToolLoadingFallback });

// Images Tools
const RemoveBackgroundTool = dynamic(() => import('./tools/RemoveBackgroundTool').then(m => m.RemoveBackgroundTool), { ssr: false, loading: ToolLoadingFallback });
const PhotoUpscalerTool = dynamic(() => import('./tools/PhotoUpscalerTool').then(m => m.PhotoUpscalerTool), { ssr: false, loading: ToolLoadingFallback });
const KoreanPhotoboothStrip = dynamic(() => import('./tools/KoreanPhotoboothStrip').then(m => m.KoreanPhotoboothStrip), { ssr: false, loading: ToolLoadingFallback });
const CamScannerEnhancer = dynamic(() => import('./tools/CamScannerEnhancer'), { ssr: false, loading: ToolLoadingFallback });
const TargetSizeCompressor = dynamic(() => import('./tools/TargetSizeCompressor').then(m => m.TargetSizeCompressor), { ssr: false, loading: ToolLoadingFallback });
const ImagePaletteExtractor = dynamic(() => import('./tools/ImagePaletteExtractor').then(m => m.ImagePaletteExtractor), { ssr: false, loading: ToolLoadingFallback });
const IgGridSplitter = dynamic(() => import('./tools/IgGridSplitter').then(m => m.IgGridSplitter), { ssr: false, loading: ToolLoadingFallback });
const ImageConverter = dynamic(() => import('./tools/ImageConverter').then(m => m.ImageConverter), { ssr: false, loading: ToolLoadingFallback });

// Dev Tools
const WebToDesignPromptMd = dynamic(() => import('./tools/WebToDesignPromptMd').then(m => m.WebToDesignPromptMd), { ssr: false, loading: ToolLoadingFallback });
const QrCodeStudio = dynamic(() => import('./tools/QrCodeStudio').then(m => m.QrCodeStudio), { ssr: false, loading: ToolLoadingFallback });

export const ToolDetailView: React.FC = () => {
  const router = useRouter();
  const { activeToolSlug, setActiveToolSlug, language } = useAppStore();
  const t = i18n[language] || i18n['id'];

  const handleBack = () => {
    setActiveToolSlug(null);
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/tools/')) {
      router.push('/');
    }
  };

  // Safe slug resolution through single-source-of-truth resolver
  const tool = resolveToolBySlug(activeToolSlug || '');

  if (!tool) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 pt-24 pb-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border-2 border-amber-500 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="text-sm font-bold text-[var(--neo-text)]">Mengarahkan ke Alat...</div>
        <p className="text-xs text-[var(--neo-text-muted)]">
          Sedang menyiapkan antarmuka alat yang Anda pilih.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="neo-btn neo-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
        >
          {t.back_to_home}
        </button>
      </div>
    );
  }

  const renderToolComponent = () => {
    switch (tool.id) {
      // Primary Unified Media Downloader & Movie Finder
      case 'media-downloader':
        return <MediaDownloaderHub />;
      case 'apk-downloader':
        return <ApkDownloaderTool />;
      case 'movie-finder':
        return <MovieRecommendationFinder />;

      // Creator & Video
      case 'tiktok-stalker':
        return <TikTokStalkerTool />;
      case 'alight-preset-finder':
        return <AlightMotionPresetFinder />;
      case 'anime-finder':
        return <AnimeRecommendationFinder />;
      case 'auto-vector-xml':
        return <AutoVectorXmlTool />;
      case 'safe-zone-previewer':
        return <SafeZonePreviewer />;
      case 'video-gif-sticker-maker':
        return <VideoGifStickerMaker />;
      case 'video-mute-audio-replacer':
        return <VideoAudioMuteReplacer />;

      // Audio & Music
      case 'voice-changer-studio':
        return <VoiceChangerStudio />;
      case 'audio-slowed-reverb':
        return <AudioSlowedReverb />;
      case 'audio-cutter-splitter':
        return <AudioCutterSplitter />;

      // Docs & PDF
      case 'pdf-studio':
        return <PdfStudio />;
      case 'web-to-pdf':
        return <WebToPdf />;
      case 'ocr-image-to-text':
        return <OcrScanner />;

      // Images & Design
      case 'remove-background':
        return <RemoveBackgroundTool />;
      case 'photo-upscaler':
        return <PhotoUpscalerTool />;
      case 'korean-photobooth-strip':
        return <KoreanPhotoboothStrip />;
      case 'camscanner-enhancer':
        return <CamScannerEnhancer />;
      case 'target-size-compressor':
        return <TargetSizeCompressor />;
      case 'image-palette-extractor':
        return <ImagePaletteExtractor />;
      case 'ig-grid-splitter':
        return <IgGridSplitter />;
      case 'image-converter':
        return <ImageConverter />;

      // Developer & QR
      case 'web-to-design-prompt-md':
        return <WebToDesignPromptMd />;
      case 'qr-code-studio':
        return <QrCodeStudio />;

      default:
        return <MediaDownloaderHub />;
    }
  };

  return (
    <div key={tool.id} className="w-full max-w-5xl mx-auto px-3 sm:px-4 pt-4 md:pt-24 pb-28 md:pb-16 space-y-4">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b-2 border-[var(--neo-border)]">
        <button
          type="button"
          onClick={handleBack}
          className="neo-btn neo-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.back_to_home}</span>
        </button>

        <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] text-xs font-bold px-3 py-1 rounded-full border-2 border-[var(--neo-border)] shadow-sm">
          {tool.badge}
        </span>
      </div>

      {/* Dynamic Tool Workspace */}
      <div className="w-full neo-card p-4 sm:p-6 rounded-3xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo">
        {renderToolComponent()}
      </div>
    </div>
  );
};
