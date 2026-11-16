'use client';

import React, { useState } from 'react';
import { Clipboard, ArrowRight, Video, Music2, Globe, Instagram, Youtube, Sparkles, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface DetectedLink {
  url: string;
  toolSlug: string;
  toolName: string;
  platform: string;
  icon: React.ElementType;
}

export const SmartClipboardBar: React.FC = () => {
  const { setActiveToolSlug, setPrefilledUrl } = useAppStore();
  const [detected, setDetected] = useState<DetectedLink | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  const parseClipboardUrl = (text: string): DetectedLink | null => {
    const trimmed = text.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return null;

    if (trimmed.includes('alight.link') || trimmed.includes('alightcreative.com')) {
      return {
        url: trimmed,
        toolSlug: 'alight-preset-finder',
        toolName: 'Alight Motion Preset Finder',
        platform: 'Alight Motion',
        icon: Video,
      };
    }
    if (trimmed.includes('tiktok.com/@') && !trimmed.includes('/video/')) {
      return {
        url: trimmed,
        toolSlug: 'tiktok-stalker',
        toolName: 'TikTok Profile Stalker',
        platform: 'TikTok Profile',
        icon: Video,
      };
    }
    if (trimmed.includes('tiktok.com')) {
      return {
        url: trimmed,
        toolSlug: 'tiktok-downloader',
        toolName: 'TikTok Downloader',
        platform: 'TikTok',
        icon: Video,
      };
    }
    if (trimmed.includes('instagram.com')) {
      return {
        url: trimmed,
        toolSlug: 'instagram-downloader',
        toolName: 'Instagram Downloader',
        platform: 'Instagram',
        icon: Instagram,
      };
    }
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      return {
        url: trimmed,
        toolSlug: 'youtube-downloader',
        toolName: 'YouTube Downloader',
        platform: 'YouTube',
        icon: Youtube,
      };
    }
    return {
      url: trimmed,
      toolSlug: 'web-to-pdf',
      toolName: 'Web to PDF',
      platform: 'Artikel Web',
      icon: Globe,
    };
  };

  const handleReadClipboard = async () => {
    setErrorMsg(null);
    setIsReading(true);

    try {
      if (!navigator.clipboard?.readText) {
        throw new Error('Clipboard API tidak didukung pada browser ini.');
      }
      const text = await navigator.clipboard.readText();
      const result = parseClipboardUrl(text);

      if (result) {
        setDetected(result);
      } else {
        setErrorMsg('Clipboard tidak memuat tautan URL yang valid.');
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } catch {
      setErrorMsg('Izin clipboard ditolak. Salin tautan manual ke input tool.');
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setIsReading(false);
    }
  };

  const handleJumpToTool = () => {
    if (!detected) return;
    setPrefilledUrl(detected.url);
    setActiveToolSlug(detected.toolSlug);
  };

  return (
    <section className="w-full max-w-5xl mx-auto px-3 sm:px-4 pb-3 relative z-10">
      <div className="neo-card p-3.5 sm:p-4 rounded-2xl bg-[var(--neo-surface)] space-y-2.5 shadow-[3px_3px_0px_#121212] md:shadow-[4px_4px_0px_#121212]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex items-center justify-center text-[var(--neo-text)] shrink-0">
              <Clipboard className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-[var(--neo-text)]">
              Smart Clipboard Auto-Detect
            </span>
          </div>

          <button
            type="button"
            onClick={handleReadClipboard}
            disabled={isReading}
            className="neo-btn neo-btn-primary px-3 py-2 rounded-xl text-xs font-bold w-full sm:w-auto justify-center flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{isReading ? 'Membaca...' : 'Deteksi Link Clipboard'}</span>
          </button>
        </div>

        {errorMsg && (
          <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1.5 pt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </p>
        )}

        {detected && (
          <div className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 overflow-hidden w-full sm:w-auto">
              <span className="neo-badge bg-[var(--neo-accent)] text-[var(--neo-accent-text)] text-[10px] shrink-0">
                {detected.platform}
              </span>
              <span className="text-xs font-mono text-[var(--neo-text-muted)] truncate flex-1 sm:max-w-[280px]">
                {detected.url}
              </span>
            </div>

            <button
              type="button"
              onClick={handleJumpToTool}
              className="neo-btn neo-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0"
            >
              <span>Buka {detected.toolName}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
