'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toolsCatalog, resolveToolBySlug } from '@/lib/toolsRegistry';
import { i18n } from '@/utils/i18n';

// 6 Core Platform Downloader & Movie Finder
import { MediaDownloaderHub } from './tools/MediaDownloaderHub';
import { MovieRecommendationFinder } from './tools/MovieRecommendationFinder';

// Creator & Video Tools
import { TikTokStalkerTool } from './tools/TikTokStalkerTool';
import { AlightMotionPresetFinder } from './tools/AlightMotionPresetFinder';
import { SafeZonePreviewer } from './tools/SafeZonePreviewer';
import VideoGifStickerMaker from './tools/VideoGifStickerMaker';
import VideoAudioMuteReplacer from './tools/VideoAudioMuteReplacer';

// Audio Tools
import { VoiceChangerStudio } from './tools/VoiceChangerStudio';
import { AudioSlowedReverb } from './tools/AudioSlowedReverb';
import { AudioCutterSplitter } from './tools/AudioCutterSplitter';

// Docs Tools
import { PdfStudio } from './tools/PdfStudio';
import { WebToPdf } from './tools/WebToPdf';
import { OcrScanner } from './tools/OcrScanner';

// Images Tools
import { KoreanPhotoboothStrip } from './tools/KoreanPhotoboothStrip';
import CamScannerEnhancer from './tools/CamScannerEnhancer';
import { TargetSizeCompressor } from './tools/TargetSizeCompressor';
import { ImagePaletteExtractor } from './tools/ImagePaletteExtractor';
import { IgGridSplitter } from './tools/IgGridSplitter';
import { ImageConverter } from './tools/ImageConverter';

// Dev Tools
import { WebToDesignPromptMd } from './tools/WebToDesignPromptMd';
import { QrCodeStudio } from './tools/QrCodeStudio';

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
      case 'movie-finder':
        return <MovieRecommendationFinder />;

      // Creator & Video
      case 'tiktok-stalker':
        return <TikTokStalkerTool />;
      case 'alight-preset-finder':
        return <AlightMotionPresetFinder />;
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
    <div key={tool.id} className="w-full max-w-5xl mx-auto px-3 sm:px-4 pt-4 md:pt-20 pb-28 md:pb-16 space-y-4">
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
