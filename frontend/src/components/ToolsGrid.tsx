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
    <section className="w-full max-w-5xl mx-auto px-3 sm:px-4 pb-28 md:pb-16 relative z-10 space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="neo-card p-3.5 sm:p-5 rounded-2xl bg-[var(--neo-surface)] space-y-3 shadow-[3px_3px_0px_#121212] md:shadow-[4px_4px_0px_#121212]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--neo-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari alat (misal: TikTok Stalk, KTP, QR, Alight, 8D, Mockup)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-input-bg)] text-[var(--neo-text)] text-xs font-bold focus:outline-none focus:border-[var(--neo-border-active)] shadow-neo-sm transition-colors placeholder:text-[var(--neo-text-muted)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--neo-text-muted)] hover:text-[var(--neo-text)] transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Counter Badge */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="neo-badge bg-[var(--neo-bg)] text-[var(--neo-text-muted)] border-[var(--neo-border)] font-mono text-xs">
              {filteredTools.length} / {toolsCatalog.length} Alat
            </span>
          </div>
        </div>

        {/* Horizontal Swipeable Category Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5 -mx-1 px-1 whitespace-nowrap touch-pan-x">
          {CATEGORY_FILTERS.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all border-2 cursor-pointer select-none ${
                  isActive
                    ? 'bg-[var(--neo-accent)] text-[var(--neo-accent-text)] border-[var(--neo-border-active)] shadow-neo font-black'
                    : 'bg-[var(--neo-bg)] border-[var(--neo-border)] text-[var(--neo-text-muted)] hover:text-[var(--neo-text)] hover:border-[var(--neo-border-active)]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Tools */}
      {filteredTools.length === 0 ? (
        <div className="neo-card p-8 sm:p-12 rounded-2xl bg-[var(--neo-surface)] text-center space-y-3 shadow-[3px_3px_0px_#121212]">
          <Compass className="w-10 h-10 text-[var(--neo-text-muted)] mx-auto opacity-50" />
          <div className="text-base font-bold text-[var(--neo-text)]">Tidak ada alat yang cocok</div>
          <p className="text-xs text-[var(--neo-text-muted)] max-w-sm mx-auto">
            Tidak ditemukan alat dengan kata kunci &quot;{searchQuery}&quot;. Coba gunakan kata kunci lain seperti TikTok, Preset, PDF, Watermark, atau Foto.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="neo-btn neo-btn-secondary px-4 py-2 rounded-xl text-xs font-bold"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={`/tools/${tool.id}`}
                onClick={() => setActiveToolSlug(tool.id)}
                className="neo-card-interactive p-4 sm:p-5 rounded-2xl flex flex-col justify-between group select-none block no-underline transition-all hover:-translate-y-1 shadow-[3px_3px_0px_#121212] md:shadow-[4px_4px_0px_#121212]"
              >
                <div>
                  {/* Top Bar: Colored Icon Box & Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border-2 border-[var(--neo-border)] shadow-neo-sm ${tool.iconBg} ${tool.iconColor}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {tool.isNew && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white rounded-full border border-[var(--neo-border)] shadow-neo-sm">
                          BARU
                        </span>
                      )}
                      <span className="neo-badge bg-[var(--neo-bg)] text-[var(--neo-text-muted)] border-[var(--neo-border)] text-[10px] font-bold">
                        {tool.badge}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm sm:text-base font-bold text-[var(--neo-text)] group-hover:text-[var(--neo-accent)] transition-colors mb-1 line-clamp-1">
                    {tool.title}
                  </h3>

                  <p className="text-xs text-[var(--neo-text-muted)] line-clamp-2 leading-relaxed mb-3 sm:mb-4">
                    {tool.desc}
                  </p>
                </div>

                {/* Tactile Neo-Brutalist Bottom Button */}
                <div className="neo-btn neo-btn-primary w-full py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl text-xs font-bold flex items-center justify-between group-hover:shadow-neo transition-all">
                  <span>Buka Halaman Alat</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};
