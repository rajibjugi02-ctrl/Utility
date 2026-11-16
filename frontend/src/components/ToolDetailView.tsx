'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toolsCatalog } from '@/lib/toolsRegistry';
import { i18n } from '@/utils/i18n';

// Existing Tools
import { TikTokExtractor } from './tools/TikTokExtractor';
import { InstagramDownloader } from './tools/InstagramDownloader';
import { AlightMotionPresetFinder } from './tools/AlightMotionPresetFinder';
import { TikTokStalkerTool } from './tools/TikTokStalkerTool';
import { YouTubeDownloader } from './tools/YouTubeDownloader';
import { PdfStudio } from './tools/PdfStudio';
import { WebToPdf } from './tools/WebToPdf';
import { ImageConverter } from './tools/ImageConverter';
import { AudioSlowedReverb } from './tools/AudioSlowedReverb';
import { OcrScanner } from './tools/OcrScanner';
import { ExifRemover } from './tools/ExifRemover';
import { BeatMarkerAmXml } from './tools/BeatMarkerAmXml';
import { SafeZonePreviewer } from './tools/SafeZonePreviewer';
import { AudioCutterSplitter } from './tools/AudioCutterSplitter';
import { PdfMergeSplitSign } from './tools/PdfMergeSplitSign';
import { PasFotoMaker } from './tools/PasFotoMaker';
import { IgGridSplitter } from './tools/IgGridSplitter';
import { WebToDesignPromptMd } from './tools/WebToDesignPromptMd';
import { QrCodeStudio } from './tools/QrCodeStudio';
import { TargetSizeCompressor } from './tools/TargetSizeCompressor';
import { ImagePaletteExtractor } from './tools/ImagePaletteExtractor';
import { SubtitleLrcStudio } from './tools/SubtitleLrcStudio';
import { BatchRenamerZip } from './tools/BatchRenamerZip';

// 10 Advanced New Tools
import { SpatialAudioBpmDetector } from './tools/SpatialAudioBpmDetector';
import { KoreanPhotoboothStrip } from './tools/KoreanPhotoboothStrip';
import { VoiceChangerStudio } from './tools/VoiceChangerStudio';
import { DeviceMockupStudio } from './tools/DeviceMockupStudio';
import KtpWatermarkProtector from './tools/KtpWatermarkProtector';
import CamScannerEnhancer from './tools/CamScannerEnhancer';
import VideoGifStickerMaker from './tools/VideoGifStickerMaker';
import VideoAudioMuteReplacer from './tools/VideoAudioMuteReplacer';
import DigitalInvoiceGenerator from './tools/DigitalInvoiceGenerator';
import PdfPageNumberProtector from './tools/PdfPageNumberProtector';

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

  const tool = toolsCatalog.find((t) => t.id === activeToolSlug);

  if (!tool) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 pt-24 pb-20 text-center">
        <p className="text-[var(--neo-text-muted)] text-xs font-mono">Alat tidak ditemukan.</p>
        <button
          type="button"
          onClick={handleBack}
          className="mt-3 neo-btn neo-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
        >
          {t.back_to_home}
        </button>
      </div>
    );
  }

  const renderToolComponent = () => {
    switch (tool.id) {
      // Creator & Video
      case 'tiktok-downloader':
        return <TikTokExtractor />;
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
      case 'instagram-downloader':
        return <InstagramDownloader />;
      case 'youtube-downloader':
        return <YouTubeDownloader />;

      // Audio & Music
      case 'audio-8d-bpm-detector':
        return <SpatialAudioBpmDetector />;
      case 'voice-changer-studio':
        return <VoiceChangerStudio />;
      case 'beat-marker-am-xml':
        return <BeatMarkerAmXml />;
      case 'audio-slowed-reverb':
        return <AudioSlowedReverb />;
      case 'audio-cutter-splitter':
        return <AudioCutterSplitter />;
      case 'subtitle-lrc-studio':
        return <SubtitleLrcStudio />;

      // Docs & PDF
      case 'pdf-studio':
        return <PdfStudio />;
      case 'digital-invoice-generator':
        return <DigitalInvoiceGenerator />;
      case 'pdf-page-number-protector':
        return <PdfPageNumberProtector />;
      case 'pdf-merge-split-sign':
        return <PdfMergeSplitSign />;
      case 'web-to-pdf':
        return <WebToPdf />;
      case 'ocr-image-to-text':
        return <OcrScanner />;
      case 'batch-renamer-zip':
        return <BatchRenamerZip />;

      // Images & Design
      case 'korean-photobooth-strip':
        return <KoreanPhotoboothStrip />;
      case 'device-mockup-studio':
        return <DeviceMockupStudio />;
      case 'ktp-watermark-protector':
        return <KtpWatermarkProtector />;
      case 'camscanner-enhancer':
        return <CamScannerEnhancer />;
      case 'pas-foto-maker':
        return <PasFotoMaker />;
      case 'target-size-compressor':
        return <TargetSizeCompressor />;
      case 'image-palette-extractor':
        return <ImagePaletteExtractor />;
      case 'ig-grid-splitter':
        return <IgGridSplitter />;
      case 'image-converter':
        return <ImageConverter />;
      case 'exif-remover':
        return <ExifRemover />;

      // Dev & QR
      case 'web-to-design-prompt-md':
        return <WebToDesignPromptMd />;
      case 'qr-code-studio':
        return <QrCodeStudio />;

      default:
        return <div className="text-xs text-[var(--neo-text-muted)]">Sedang memuat alat...</div>;
    }
  };

  const Icon = tool.icon;

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 pt-4 md:pt-28 pb-32 md:pb-16 space-y-3 relative z-10">
      {/* Top Navigation Bar: Back to Home */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <button
          type="button"
          onClick={handleBack}
          className="neo-btn neo-btn-secondary px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.back_to_home}</span>
        </button>

        <span className="neo-badge bg-[var(--neo-surface)] text-[var(--neo-text)] text-xs">
          {tool.badge}
        </span>
      </div>

      {/* Tool Header Card */}
      <div className="neo-card p-4 sm:p-6 rounded-2xl bg-[var(--neo-surface)] shadow-[3px_3px_0px_#121212] md:shadow-[4px_4px_0px_#121212]">
        <div className="flex items-center gap-3 mb-4 pb-3.5 border-b-2 border-[var(--neo-border)]">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border-2 border-[var(--neo-border)] shadow-neo-sm ${tool.iconBg} ${tool.iconColor}`}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--neo-text)]">
                {tool.title}
              </h1>
              {tool.isNew && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white rounded-full border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  BARU
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--neo-text-muted)] mt-0.5 leading-relaxed">
              {tool.desc}
            </p>
          </div>
        </div>

        {/* Dedicated Full Tool Workspace */}
        <div className="pt-1">{renderToolComponent()}</div>
      </div>
    </div>
  );
};
