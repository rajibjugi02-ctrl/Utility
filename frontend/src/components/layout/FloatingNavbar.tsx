'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, History, Settings, Sun, Moon, Smartphone } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { i18n } from '@/utils/i18n';
import { AppDownloadModal } from './AppDownloadModal';

export const FloatingNavbar: React.FC = () => {
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
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    let lastY = typeof window !== 'undefined' ? window.scrollY : 0;

    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 20);

      // Auto-hide promptly when scrolling down past 50px so it never blocks page content
      if (currentY > 50) {
        if (currentY > lastY + 2) {
          setVisible(false);
        } else if (currentY < lastY - 4) {
          setVisible(true);
        }
      } else {
        setVisible(true);
      }
      lastY = currentY;
    };

    // Watch document.body.style.overflow to hide FloatingNavbar during any modal presentation
    const checkModalState = () => {
      if (typeof document !== 'undefined') {
        setIsModalOpen(document.body.style.overflow === 'hidden');
      }
    };
    checkModalState();
    const observer = new MutationObserver(checkModalState);
    if (typeof document !== 'undefined' && document.body) {
      observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const t = i18n[language] || i18n['id'];

  const navItems = [
    { id: 'beranda', href: '/', label: t.nav_home, icon: Compass },
    { id: 'riwayat', href: '/history', label: t.nav_history, icon: History },
    { id: 'pengaturan', href: '/settings', label: t.nav_settings, icon: Settings },
  ] as const;

  // Determine active tab reliably from URL pathname
  let currentActiveTab: 'beranda' | 'riwayat' | 'pengaturan' = 'beranda';
  if (pathname === '/history') {
    currentActiveTab = 'riwayat';
  } else if (pathname === '/settings') {
    currentActiveTab = 'pengaturan';
  } else {
    currentActiveTab = 'beranda';
  }

  const handleNavClick = (id: 'beranda' | 'riwayat' | 'pengaturan') => {
    setActiveTab(id);
    setActiveToolSlug(null);
    setSettingsSubPage(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  if (isModalOpen) return null;

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
        <Link
          href="/"
          onClick={() => handleNavClick('beranda')}
          className="flex items-center px-2.5 py-1 text-[var(--neo-text)] hover:opacity-80 transition-opacity cursor-pointer font-black text-xs sm:text-sm tracking-tight"
        >
          <span>UtilityHub</span>
        </Link>

        {/* Sliding Pill Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 relative">
          <div className="h-4 w-px bg-[var(--neo-border)] mx-1" />
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentActiveTab === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleNavClick(item.id)}
                className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${isActive
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
              </Link>
            );
          })}
        </div>

        <div className="h-4 w-px bg-[var(--neo-border)] mx-1 hidden md:block" />

        {/* Unduh APK Quick Button */}
        <button
          type="button"
          onClick={() => setShowDownloadModal(true)}
          className="neo-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
          title="Unduh Aplikasi APK / Pasang PWA"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Unduh APK</span>
        </button>

        <div className="h-4 w-px bg-[var(--neo-border)] mx-1 hidden md:block" />

        {/* Quick Theme Toggle */}
        <button
          type="button"
          onClick={toggleThemeMode}
          className="neo-btn p-1.5 rounded-full bg-[var(--neo-surface)] text-[var(--neo-text)] ml-1 cursor-pointer"
          title="Toggle Dark/Light Mode"
        >
          {mounted && themeMode === 'light' ? (
            <Moon className="w-3.5 h-3.5 text-neutral-800" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          )}
        </button>
      </motion.nav>

      {/* App Download Modal */}
      <AppDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </header>
  );
};
