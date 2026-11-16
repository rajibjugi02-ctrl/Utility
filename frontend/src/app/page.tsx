'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { SmartClipboardBar } from '@/components/home/SmartClipboardBar';
import { ToolsGrid } from '@/components/ToolsGrid';
import { ToolDetailView } from '@/components/ToolDetailView';
import { HistoryView } from '@/components/HistoryView';
import { SettingsView } from '@/components/SettingsView';
import { RealTimeProgress } from '@/components/RealTimeProgress';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';

export default function HomePage() {
  const { activeTab, setActiveTab, activeToolSlug, themeMode, textSize, bgStyle, fontFamily } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Sync query parameter tabs if present on client
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'history' || tab === 'riwayat') {
        setActiveTab('riwayat');
      } else if (tab === 'settings' || tab === 'pengaturan') {
        setActiveTab('pengaturan');
      } else if (tab === 'home' || tab === 'beranda') {
        setActiveTab('beranda');
      }
    }

    // Sync 6 eye-friendly Soft Neo-Brutalism themes
    document.documentElement.setAttribute('data-theme', themeMode);
    const isDark = themeMode === 'dark' || themeMode === 'charcoal-matte' || themeMode === 'nordic-midnight';
    if (isDark) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }

    document.documentElement.setAttribute('data-size', textSize);
    document.body.setAttribute('data-bg', bgStyle);
    document.body.setAttribute('data-font', fontFamily || 'plus-jakarta');
  }, [themeMode, textSize, bgStyle, fontFamily, setActiveTab]);

  return (
    <main className="min-h-screen relative flex flex-col justify-between selection:bg-neutral-800 selection:text-white">
      {/* Interactive Background Canvas */}
      <AnimatedBackground />

      {/* Floating Pill Navbar (Desktop Center Pill / Mobile Bottom Bar) */}
      <Navbar />

      {/* Main Tab & Full-Page View Router */}
      <div className="flex-1 w-full relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'beranda' && (
            <div key="beranda">
              {activeToolSlug ? (
                /* Dedicated Full-Page View for Selected Tool */
                <ToolDetailView />
              ) : (
                /* Main Home View: Compact Vertical Profile + Category Tools Grid */
                <div className="pt-4 md:pt-24 pb-28 md:pb-16 space-y-3 md:space-y-4">
                  <HeroSection />
                  <SmartClipboardBar />
                  <ToolsGrid />
                </div>
              )}
            </div>
          )}

          {activeTab === 'riwayat' && (
            <div key="riwayat">
              <HistoryView />
            </div>
          )}

          {activeTab === 'pengaturan' && (
            <div key="pengaturan">
              <SettingsView />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Real-time WebSocket Progress Bar */}
      <RealTimeProgress />

      {/* Minimal Footer */}
      <footer className="w-full text-center py-4 text-[11px] text-[var(--neo-text-muted)] font-mono relative z-10 hidden md:block">
        <p>UtilityHub · Soft Neo-Brutalism Modern Minimalist</p>
      </footer>
    </main>
  );
}
