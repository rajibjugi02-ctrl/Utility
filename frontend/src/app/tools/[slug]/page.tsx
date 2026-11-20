'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Navbar } from '@/components/Navbar';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { resolveToolBySlug } from '@/lib/toolsRegistry';
import { Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const ToolDetailView = dynamic(() => import('@/components/ToolDetailView').then(m => m.ToolDetailView), { ssr: false });

export default function ToolPage() {
  const params = useParams();
  const router = useRouter();
  const { setActiveToolSlug, fontFamily, themeMode, textSize, bgStyle } = useAppStore();
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const rawSlug = Array.isArray(params?.slug) ? params?.slug[0] : (params?.slug as string);

  useEffect(() => {
    // 1. Theme and typography sync
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.body.setAttribute('data-font', fontFamily || 'plus-jakarta');
      document.documentElement.setAttribute('data-theme', themeMode);
      document.documentElement.setAttribute('data-size', textSize);
      document.body.setAttribute('data-bg', bgStyle);
    }

    if (!rawSlug) return;

    const lowerSlug = decodeURIComponent(rawSlug).toLowerCase().trim();

    // 2. Auto-Redirect Guard for core pages
    if (lowerSlug === 'home' || lowerSlug === 'beranda' || lowerSlug === 'index') {
      setIsRedirecting(true);
      router.replace('/');
      return;
    }
    if (lowerSlug === 'history' || lowerSlug === 'riwayat') {
      setIsRedirecting(true);
      router.replace('/history');
      return;
    }
    if (lowerSlug === 'settings' || lowerSlug === 'pengaturan') {
      setIsRedirecting(true);
      router.replace('/settings');
      return;
    }

    // 3. Resolve tool via single-source-of-truth alias resolver
    const matchedTool = resolveToolBySlug(lowerSlug);
    if (matchedTool) {
      setResolvedId(matchedTool.id);
      setActiveToolSlug(matchedTool.id);
    } else {
      setResolvedId(null);
    }
  }, [rawSlug, setActiveToolSlug, router, fontFamily, themeMode, textSize, bgStyle]);

  // Loading skeleton while resolving or redirecting (never show raw 404 flash)
  if (isRedirecting || !resolvedId) {
    const isDirectMatch = resolveToolBySlug(rawSlug || '');
    if (!isDirectMatch && !isRedirecting && rawSlug) {
      return (
        <main className="min-h-screen relative flex flex-col justify-between selection:bg-neutral-800 selection:text-white">
          <AnimatedBackground />
          <Navbar />
          <div className="flex-1 w-full max-w-xl mx-auto px-4 pt-32 pb-20 text-center space-y-4 relative z-10">
            <div className="w-14 h-14 rounded-3xl bg-amber-500/10 border-2 border-amber-500 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-[var(--neo-text)]">Alat Tidak Ditemukan</h2>
            <p className="text-xs text-[var(--neo-text-muted)]">
              Tautan &quot;{rawSlug}&quot; tidak terdaftar dalam katalog. Anda dapat mencari alat lain di Beranda.
            </p>
            <Link
              href="/"
              className="inline-flex neo-btn neo-btn-primary px-5 py-2.5 rounded-2xl text-xs font-bold gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen relative flex flex-col justify-between selection:bg-neutral-800 selection:text-white">
        <AnimatedBackground />
        <Navbar />
        <div className="flex-1 w-full max-w-3xl mx-auto px-4 pt-32 pb-20 text-center space-y-3 relative z-10 animate-pulse">
          <div className="h-8 bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] rounded-2xl w-48 mx-auto" />
          <div className="h-64 bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] rounded-3xl w-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative flex flex-col justify-between selection:bg-neutral-800 selection:text-white">
      <AnimatedBackground />
      <Navbar />
      <div key={resolvedId} className="flex-1 w-full relative z-10">
        <ToolDetailView />
      </div>
      <footer className="w-full text-center py-4 text-[11px] text-[var(--neo-text-muted)] font-mono relative z-10 hidden md:block">
        <p>UtilityHub · Soft Neo-Brutalism Modern Minimalist</p>
      </footer>
    </main>
  );
}
