'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Search,
  X,
  Compass,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { i18n } from '@/utils/i18n';
import { toolsCatalog, CATEGORY_FILTERS, ToolItem } from '@/lib/toolsRegistry';

export { toolsCatalog, CATEGORY_FILTERS };
export type { ToolItem };

export const ToolsGrid: React.FC = () => {
  const {
    selectedCategory,
    setSelectedCategory,
    setActiveToolSlug,
    language,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const t = i18n[language] || i18n['id'];

  // Count tools per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: toolsCatalog.length };
    toolsCatalog.forEach((tool) => {
      counts[tool.category] = (counts[tool.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Filter tools based on category & search query
  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return toolsCatalog.filter((tool) => {
      const matchCategory =
        selectedCategory === 'all' ||
        tool.category === selectedCategory ||
        (selectedCategory === 'social' && tool.category === 'creator');

      if (!matchCategory) return false;

      if (!q) return true;

      return (
        tool.title.toLowerCase().includes(q) ||
        tool.desc.toLowerCase().includes(q) ||
        tool.badge.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section className="w-full max-w-5xl mx-auto px-3 sm:px-4 pb-28 md:pb-16 relative z-10 space-y-3.5">
      {/* 1. Header Seksi: DAFTAR ALAT UTAMA [XX ALAT] - Matching Screenshot 1 */}
      <div className="pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-2xl font-black tracking-tight text-[var(--neo-text)] uppercase">
            DAFTAR ALAT UTAMA
          </h2>
          <span className="neo-badge bg-[#121212] text-white dark:bg-[#F4F4F0] dark:text-[#121212] text-[10px] sm:text-xs font-mono font-black px-2.5 py-0.5 rounded-full border border-[var(--neo-border)] shadow-sm">
            {toolsCatalog.length} ALAT
          </span>
        </div>
        <p className="text-xs text-[var(--neo-text-muted)] mt-0.5">
          Pilih alat utilitas yang ingin digunakan. Setiap alat membuka halaman kerja khusus.
        </p>
      </div>

      {/* 2. Live Search Input & Horizontal Category Bar */}
      <div className="neo-card p-3 sm:p-4 rounded-2xl bg-[var(--neo-surface)] space-y-3 border-2 border-[var(--neo-border)] shadow-neo-sm">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--neo-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari alat (misal: Media Downloader, Stalk, Film, CapCut, Preset, QR)..."
            className="w-full pl-10 pr-9 py-2 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] text-xs font-semibold focus:outline-none shadow-sm placeholder:text-[var(--neo-text-muted)] font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Horizontal Category Bar with Count Badges - Matching Screenshot 1 */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1 whitespace-nowrap touch-pan-x">
          {CATEGORY_FILTERS.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] ?? 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all border-2 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#121212] text-white dark:bg-[#F4F4F0] dark:text-[#121212] border-[#121212] dark:border-white shadow-sm'
                    : 'bg-[var(--neo-bg)] border-[var(--neo-border)] text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#121212] border-transparent'
                      : 'bg-[var(--neo-surface)] text-[var(--neo-text-muted)] border-[var(--neo-border)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Compact 2-Column Mobile Grid / 3-4 Col Desktop - Matching Screenshot 1 */}
      {filteredTools.length === 0 ? (
        <div className="neo-card p-8 rounded-2xl bg-[var(--neo-surface)] text-center space-y-2 border-2 border-[var(--neo-border)] shadow-neo-sm">
          <Compass className="w-8 h-8 text-[var(--neo-text-muted)] mx-auto opacity-50" />
          <div className="text-sm font-bold text-[var(--neo-text)]">Tidak ada alat yang cocok</div>
          <p className="text-xs text-[var(--neo-text-muted)]">
            Coba gunakan kata kunci pencarian lain atau pilih kategori Semua Alat.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="neo-btn neo-btn-secondary px-3 py-1.5 rounded-xl text-xs font-bold"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className="neo-card p-3 sm:p-4 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 active:translate-y-0 transition-all flex flex-col justify-between text-left group"
              >
                <div>
                  {/* Top Row: Square Icon Box on left, Pill Badge on right */}
                  <div className="flex items-start justify-between gap-1 w-full">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border-2 border-[var(--neo-border)] shadow-sm ${tool.iconBg} ${tool.iconColor}`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    <span className="neo-badge bg-[var(--neo-bg)] text-[var(--neo-text)] text-[9px] sm:text-[10px] font-mono font-extrabold border border-[var(--neo-border)] px-1.5 py-0.5 rounded-full truncate max-w-[95px] uppercase">
                      {tool.badge}
                    </span>
                  </div>

                  {/* Middle: Title & 2-Line Description */}
                  <h3 className="font-black text-xs sm:text-sm text-[var(--neo-text)] tracking-tight line-clamp-1 mt-2.5 group-hover:text-[var(--neo-accent-text)] transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-[var(--neo-text-muted)] line-clamp-2 min-h-[2rem] mt-1 leading-tight">
                    {tool.desc}
                  </p>
                </div>

                {/* Bottom Row: Buka Alat Button - Matching Screenshot 1 */}
                <div className="pt-2.5 mt-2 border-t border-[var(--neo-border)] w-full">
                  <Link
                    href={`/tools/${tool.id}`}
                    onClick={() => setActiveToolSlug(tool.id)}
                    className="w-full py-1.5 sm:py-2 rounded-xl bg-[#121212] text-white dark:bg-[#F4F4F0] dark:text-[#121212] text-xs font-bold flex items-center justify-center gap-1 shadow-sm hover:opacity-90 active:scale-98 transition-all block text-center no-underline"
                  >
                    <span>Buka Alat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
