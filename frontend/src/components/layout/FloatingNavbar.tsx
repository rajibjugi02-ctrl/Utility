'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Compass, History, Settings, Command, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { i18n } from '@/utils/i18n';

export const FloatingNavbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const {
    activeTab,
    setActiveTab,
    setActiveToolSlug,
    setSettingsSubPage,
    themeMode,
    toggleThemeMode,
    language,
  } = useAppStore();

  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let lastY = typeof window !== 'undefined' ? window.scrollY : 0;

    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 20);

      // Auto-hide when scrolling down past 80px to prevent overlapping category filters
      if (currentY > 80) {
        if (currentY > lastY + 5) {
          setVisible(false);
        } else if (currentY < lastY - 5) {
          setVisible(true);
        }
      } else {
        setVisible(true);
      }
      lastY = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const t = i18n[language] || i18n['id'];

  const navItems = [
    { id: 'beranda', label: t.nav_home, icon: Compass },
    { id: 'riwayat', label: t.nav_history, icon: History },
    { id: 'pengaturan', label: t.nav_settings, icon: Settings },
  ] as const;

  // Determine active tab reliably from URL pathname
  let currentActiveTab: 'beranda' | 'riwayat' | 'pengaturan' = activeTab;
  if (pathname === '/history') {
    currentActiveTab = 'riwayat';
  } else if (pathname === '/settings') {
    currentActiveTab = 'pengaturan';
  } else if (pathname === '/') {
    currentActiveTab = activeTab || 'beranda';
  } else if (pathname?.startsWith('/tools')) {
    currentActiveTab = 'beranda';
  }

  const handleTabClick = (id: 'beranda' | 'riwayat' | 'pengaturan') => {
    setActiveTab(id);
    setActiveToolSlug(null);
    setSettingsSubPage(null);

    if (id === 'beranda') {
      router.push('/');
    } else if (id === 'riwayat') {
      router.push('/history');
    } else if (id === 'pengaturan') {
      router.push('/settings');
    }
  };

  return (
    <header className="hidden md:flex fixed top-4 inset-x-0 z-[100] justify-center px-4 pointer-events-none">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{
          y: visible ? 0 : -80,
          opacity: visible ? 1 : 0,
          scale: scrolled ? 0.96 : 1,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="pointer-events-auto flex items-center justify-between md:justify-start gap-1.5 px-3 py-1.5 rounded-full neo-card bg-[var(--neo-surface)] max-w-fit shadow-neo"
      >
        {/* Brand / Home Link */}
        <button
          type="button"
          onClick={() => handleTabClick('beranda')}
          className="flex items-center gap-2 px-2.5 py-1 text-[var(--neo-text)] hover:opacity-80 transition-opacity cursor-pointer font-bold text-xs"
        >
          <img
            src="/logo.png"
            alt="UtilityHub"
            className="w-5 h-5 object-contain"
          />
          <span className="tracking-tight font-black">UtilityHub</span>
        </button>

        {/* Sliding Pill Navigation Tabs (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-1 relative">
          <div className="h-4 w-px bg-[var(--neo-border)] mx-1" />
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentActiveTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[var(--neo-accent-text)]'
                    : 'text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{item.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="desktopNavIndicator"
                    className="absolute inset-0 bg-[var(--neo-accent)] rounded-full border border-[var(--neo-border)] -z-0 shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-[var(--neo-border)] mx-1 hidden md:block" />

        {/* Quick Theme Toggle */}
        <button
          type="button"
          onClick={toggleThemeMode}
          className="neo-btn p-1.5 rounded-full bg-[var(--neo-surface)] text-[var(--neo-text)] ml-1"
          title="Toggle Dark/Light Mode"
        >
          {mounted && themeMode === 'light' ? (
            <Moon className="w-3.5 h-3.5 text-neutral-800" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          )}
        </button>
      </motion.nav>
    </header>
  );
};
