'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';

export default function NotFound() {
  return (
    <main className="min-h-screen relative flex flex-col justify-between selection:bg-neutral-800 selection:text-white">
      <AnimatedBackground />
      <Navbar />

      <div className="flex-1 w-full max-w-lg mx-auto px-4 pt-32 pb-24 text-center space-y-5 relative z-10">
        <div className="w-16 h-16 rounded-3xl bg-[var(--neo-surface)] border-3 border-[var(--neo-border)] shadow-neo flex items-center justify-center mx-auto text-[var(--neo-text)]">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <span className="neo-badge bg-[var(--neo-accent)] text-[var(--neo-accent-text)] text-xs font-black px-3 py-1 rounded-full border-2 border-[var(--neo-border)] shadow-sm">
            404 · HALAMAN TIDAK DITEMUKAN
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--neo-text)]">
            Halaman atau Alat Tidak Ada
          </h1>
          <p className="text-xs sm:text-sm text-[var(--neo-text-muted)] max-w-sm mx-auto">
            Alamat URL yang Anda tuju mungkin telah dipindahkan atau salah ketik. Silakan kembali ke Beranda untuk melihat katalog alat yang tersedia.
          </p>
        </div>

        <div>
          <Link
            href="/"
            className="inline-flex neo-btn neo-btn-primary px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold gap-2 shadow-neo-sm hover:shadow-neo"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda Utama</span>
          </Link>
        </div>
      </div>

      <footer className="w-full text-center py-4 text-[11px] text-[var(--neo-text-muted)] font-mono relative z-10 hidden md:block">
        <p>UtilityHub · Soft Neo-Brutalism Modern Minimalist</p>
      </footer>
    </main>
  );
}
