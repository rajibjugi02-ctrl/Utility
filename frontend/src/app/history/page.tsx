'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Navbar } from '@/components/Navbar';
import { HistoryView } from '@/components/HistoryView';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';

export default function HistoryPage() {
  const { setActiveTab, setActiveToolSlug } = useAppStore();

  useEffect(() => {
    setActiveTab('riwayat');
    setActiveToolSlug(null);
  }, [setActiveTab, setActiveToolSlug]);

  return (
    <main className="min-h-screen relative flex flex-col justify-between selection:bg-neutral-800 selection:text-white">
      <AnimatedBackground />
      <Navbar />
      <div className="flex-1 w-full relative z-10">
        <HistoryView />
      </div>
      <footer className="w-full text-center py-4 text-[11px] text-[var(--neo-text-muted)] font-mono relative z-10 hidden md:block">
        <p>UtilityHub · Soft Neo-Brutalism Modern Minimalist</p>
      </footer>
    </main>
  );
}
