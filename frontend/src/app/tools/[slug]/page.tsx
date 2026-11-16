'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Navbar } from '@/components/Navbar';
import { ToolDetailView } from '@/components/ToolDetailView';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';

export default function ToolPage() {
  const params = useParams();
  const router = useRouter();
  const { setActiveToolSlug } = useAppStore();

  const slug = Array.isArray(params?.slug) ? params?.slug[0] : (params?.slug as string);

  useEffect(() => {
    if (!slug) return;

    // Safety redirects for main tabs accidentally accessed via /tools/[slug]
    if (slug === 'history' || slug === 'riwayat') {
      router.replace('/history');
      return;
    }
    if (slug === 'settings' || slug === 'pengaturan') {
      router.replace('/settings');
      return;
    }
    if (slug === 'home' || slug === 'beranda') {
      router.replace('/');
      return;
    }

    setActiveToolSlug(slug);
  }, [slug, setActiveToolSlug, router]);

  return (
    <main className="min-h-screen relative flex flex-col justify-between selection:bg-neutral-800 selection:text-white">
      <AnimatedBackground />
      <Navbar />
      <div className="flex-1 w-full relative z-10">
        <ToolDetailView />
      </div>
      <footer className="w-full text-center py-4 text-[11px] text-[var(--neo-text-muted)] font-mono relative z-10 hidden md:block">
        <p>UtilityHub · Soft Neo-Brutalism Modern Minimalist</p>
      </footer>
    </main>
  );
}
