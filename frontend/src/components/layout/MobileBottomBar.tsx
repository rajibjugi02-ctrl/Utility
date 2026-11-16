'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, History, Settings, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { i18n } from '@/utils/i18n';

export const MobileBottomBar: React.FC = () => {
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const t = i18n[language] || i18n['id'];

  const navItems = [
    { id: 'beranda', href: '/', label: t.nav_home, icon: Compass },
    { id: 'riwayat', href: '/history', label: t.nav_history, icon: History },
    { id: 'pengaturan', href: '/settings', label: t.nav_settings, icon: Settings },
  ] as const;

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

  return (
    <nav className="md:hidden fixed bottom-3 inset-x-3 z-[100] flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm flex items-center justify-between p-1.5 rounded-2xl neo-card bg-[var(--neo-surface)] shadow-[3px_3px_0px_#121212]">
        <div className="flex items-center justify-around flex-1 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentActiveTab === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleNavClick(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer select-none ${
                  isActive
                    ? 'text-[var(--neo-accent-text)]'
                    : 'text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
                }`}
              >
                <Icon className="w-4 h-4 relative z-10" />
                <span className="text-[10px] mt-0.5 font-bold tracking-tight relative z-10">
                  {item.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="mobileNavIndicator"
                    className="absolute inset-0 bg-[var(--neo-accent)] rounded-xl border-2 border-[var(--neo-border)] -z-0"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="h-6 w-px bg-[var(--neo-border)] mx-1" />

        {/* Mobile Quick Theme Toggle */}
        <button
          type="button"
          onClick={toggleThemeMode}
          className="neo-btn p-2 rounded-xl bg-[var(--neo-surface)] text-[var(--neo-text)] cursor-pointer"
          title="Toggle Theme"
        >
          {mounted && themeMode === 'light' ? (
            <Moon className="w-3.5 h-3.5 text-neutral-800" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          )}
        </button>
      </div>
    </nav>
  );
};
