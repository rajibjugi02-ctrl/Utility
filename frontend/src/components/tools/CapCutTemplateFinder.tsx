'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ExternalLink,
  Scissors,
  SlidersHorizontal,
  Search,
  X,
  Copy,
  Check,
  Play,
  User,
  Download,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';
import { CapCutTemplateMappedItem } from '@/lib/capcutMapper';

const POPULAR_CHIPS = [
  'JJ SANFONAMIX',
  'JJ Negoro Angin',
  'JJ Slowed Viral',
  'Velocity Aesthetic',
  'Jedag Jedug Kece',
  'Sound Kane TikTok',
];

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'my_templates', label: 'Template Saya', isSpecial: true },
  { id: 'sounds', label: 'Sounds' },
  { id: 'features', label: 'Features' },
  { id: 'users', label: 'Users' },
  { id: 'ai_search', label: 'AI search', hasSparkle: true },
];

const CLIPS_FILTER_OPTIONS = ['Semua Klip', '1-3 Klip', '4-7 Klip', '8+ Klip'];
const DURATION_FILTER_OPTIONS = ['Semua Durasi', '< 15s', '15s - 30s', '> 30s'];
const ASPECT_FILTER_OPTIONS = ['Semua Rasio', '9:16 (Portrait)', '16:9 (Landscape)', '1:1 (Square)'];

function formatCount(val: number | 'tidak tersedia'): string {
  if (val === 'tidak tersedia' || val === undefined || isNaN(val as number)) return 'tidak tersedia';
  const num = Number(val);
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(num);
}

function formatDuration(sec: number | 'tidak tersedia'): string {
  if (sec === 'tidak tersedia' || sec === undefined || isNaN(sec as number)) return 'tidak tersedia';
  const s = Math.max(0, Math.round(Number(sec)));
  const mins = Math.floor(s / 60);
  const remaining = s % 60;
  return `${mins < 10 ? '0' + mins : mins}:${remaining < 10 ? '0' + remaining : remaining}`;
}

export const CapCutTemplateFinder: React.FC = () => {
  const { prefilledUrl, setPrefilledUrl, addHistoryItem } = useAppStore();
  const [query, setQuery] = useState('');
  const [myCreatorId, setMyCreatorId] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [templates, setTemplates] = useState<CapCutTemplateMappedItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<CapCutTemplateMappedItem | null>(null);

  // Filters
  const [selectedClips, setSelectedClips] = useState('Semua Klip');
  const [selectedDuration, setSelectedDuration] = useState('Semua Durasi');
  const [selectedAspect, setSelectedAspect] = useState('Semua Rasio');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (prefilledUrl) {
      setQuery(prefilledUrl);
      setPrefilledUrl('');
      handleSearch(prefilledUrl);
    }
  }, [prefilledUrl, setPrefilledUrl]);

  const handleSearch = async (searchTerm?: string) => {
    const finalSearch = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!finalSearch && activeTab !== 'my_templates') {
      return;
    }

    setLoading(true);
    setProgress(30);
    setStage(`Mencari template "${finalSearch || myCreatorId}"...`);

    try {
      const res = await fetch('/api/capcut-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: finalSearch,
          creator_id: myCreatorId.trim(),
          tab: activeTab,
        }),
      });

      setProgress(85);
      const data = await res.json();
      setProgress(100);

      if (data.success && Array.isArray(data.templates) && data.templates.length > 0) {
        setTemplates(data.templates);
        setStage(`Ditemukan ${data.templates.length} template siap pakai!`);
        addHistoryItem({
          type: 'capcut',
          title: `CapCut: ${finalSearch || myCreatorId}`,
          subtitle: `${data.templates.length} template ditemukan`,
          downloadUrl: data.templates[0].capcutUrl,
        });
      } else {
        setTemplates([]);
      }
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      if (selectedClips === '1-3 Klip') {
        if (typeof item.clipsCount !== 'number' || item.clipsCount > 3) return false;
      } else if (selectedClips === '4-7 Klip') {
        if (typeof item.clipsCount !== 'number' || item.clipsCount < 4 || item.clipsCount > 7) return false;
      } else if (selectedClips === '8+ Klip') {
        if (typeof item.clipsCount !== 'number' || item.clipsCount < 8) return false;
      }

      if (selectedDuration === '< 15s') {
        if (typeof item.duration !== 'number' || item.duration >= 15) return false;
      } else if (selectedDuration === '15s - 30s') {
        if (typeof item.duration !== 'number' || item.duration < 15 || item.duration > 30) return false;
      } else if (selectedDuration === '> 30s') {
        if (typeof item.duration !== 'number' || item.duration <= 30) return false;
      }

      if (selectedAspect === '9:16 (Portrait)' && item.aspectRatio !== '9:16') {
        return false;
      }

      return true;
    });
  }, [templates, selectedClips, selectedDuration, selectedAspect]);

  const officialCapCutWebSearchUrl = query.trim()
    ? `https://www.capcut.com/template?query=${encodeURIComponent(query.trim())}`
    : 'https://www.capcut.com/template';

  return (
    <div className="space-y-4 pb-16 sm:pb-8">
      {/* Search Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="space-y-2.5"
      >
        <div className="space-y-1">
          <label className="text-[11px] font-black uppercase tracking-wider text-[var(--neo-text)] block">
            KATA KUNCI TREN / JUDUL LAGU / LINK VIDEO CAPCUT ATAU TIKTOK
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-[var(--neo-text-muted)] pointer-events-none">
              <Search className="w-4 h-4" />
            </div>

            <input
              type="text"
              placeholder={
                activeTab === 'my_templates'
                  ? 'Cari di dalam template saya atau masukkan judul...'
                  : 'Contoh: JJ SANFONAMIX, Negoro Angin, atau link https://www.capcut.com/t/...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl neo-input text-xs sm:text-sm font-medium border-2 border-[var(--neo-border)] bg-[var(--neo-bg)]"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 p-1 rounded-full text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]"
                title="Hapus"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Creator UID / Username input when tab "Template Saya" is active */}
        {activeTab === 'my_templates' && (
          <div className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
            <label className="text-xs font-bold text-[var(--neo-text)] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-500" />
              Creator / User ID CapCut Anda:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: 71239849201 atau username CapCut Anda..."
                value={myCreatorId}
                onChange={(e) => setMyCreatorId(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono border-2 border-[var(--neo-border)] bg-[var(--neo-surface)]"
              />
              <button
                type="button"
                onClick={() => handleSearch()}
                className="neo-btn neo-btn-primary px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
              >
                Muat Template Saya
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (!query.trim() && !myCreatorId.trim())}
          className="neo-btn neo-btn-primary w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-neo-sm disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? 'Mencari Template...' : 'Cari Template'}</span>
        </button>
      </form>

      {/* CapCut Category Tabs */}
      <div className="flex items-center gap-1.5 border-b-2 border-[var(--neo-border)] pb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'my_templates' && myCreatorId) {
                  handleSearch();
                }
              }}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all shrink-0 flex items-center gap-1 ${
                isActive
                  ? 'bg-[var(--neo-text)] text-[var(--neo-bg)] shadow-sm'
                  : 'text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]'
              }`}
            >
              {tab.hasSparkle && <Sparkles className="w-3 h-3 text-cyan-400 fill-cyan-400 shrink-0" />}
              {tab.isSpecial && <User className="w-3 h-3 text-amber-400 shrink-0" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Options */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-0.5 px-0.5 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`neo-btn px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 ${
              showFilters ? 'neo-btn-primary' : 'neo-btn-secondary'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          <select
            value={selectedClips}
            onChange={(e) => setSelectedClips(e.target.value)}
            className="neo-btn neo-btn-secondary px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 cursor-pointer border-2 border-[var(--neo-border)] bg-[var(--neo-surface)]"
          >
            {CLIPS_FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
            className="neo-btn neo-btn-secondary px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 cursor-pointer border-2 border-[var(--neo-border)] bg-[var(--neo-surface)]"
          >
            {DURATION_FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <select
            value={selectedAspect}
            onChange={(e) => setSelectedAspect(e.target.value)}
            className="neo-btn neo-btn-secondary px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 cursor-pointer border-2 border-[var(--neo-border)] bg-[var(--neo-surface)]"
          >
            {ASPECT_FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trending Keyword Chips */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--neo-text-muted)]">
          TREN POPULER HARI INI:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-0.5 px-0.5 whitespace-nowrap">
          {POPULAR_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(chip);
                handleSearch(chip);
              }}
              className="neo-btn px-2.5 py-1 rounded-lg text-[11px] sm:text-xs neo-btn-secondary shrink-0 whitespace-nowrap hover:neo-btn-primary transition-all"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Progress State */}
      {(loading || (progress > 0 && progress < 100)) && (
        <ProcessCard
          stage={stage}
          progress={progress}
          speed="36.4 KB/s"
          eta="00:01"
          isCompleted={progress === 100}
        />
      )}

      {/* Status Bar saat template ditemukan */}
      {filteredTemplates.length > 0 && (
        <div className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] shadow-neo-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-[var(--neo-text)]">
              DITEMUKAN {filteredTemplates.length} TEMPLATE SIAP PAKAI
            </span>
          </div>

          <a
            href={officialCapCutWebSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="neo-btn neo-btn-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka di Web CapCut ↗</span>
          </a>
        </div>
      )}

      {/* Initial Empty State (Tanpa pesan error statis) */}
      {filteredTemplates.length === 0 && !loading && (
        <div className="p-8 text-center rounded-2xl border-2 border-dashed border-[var(--neo-border)] bg-[var(--neo-surface)]/40 space-y-2">
          <p className="text-xs sm:text-sm font-bold text-[var(--neo-text)]">
            Cari Template CapCut Siap Pakai
          </p>
          <p className="text-[11px] text-[var(--neo-text-muted)] max-w-sm mx-auto">
            Ketik kata kunci tren di atas atau klik salah satu rekomendasi tren populer untuk menampilkan template video.
          </p>
        </div>
      )}

      {/* Template Cards Grid - Real Authentic 9:16 Cards */}
      {filteredTemplates.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {filteredTemplates.map((item) => {
              const isPro = item.isPro;
              const hasVideo = Boolean(item.videoUrl);

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between space-y-1.5 group"
                >
                  {/* 9:16 Vertical Preview Container */}
                  <div className="relative aspect-[9/16] w-full rounded-xl sm:rounded-2xl overflow-hidden border-2 border-[var(--neo-border)] bg-neutral-900 shadow-[2px_2px_0px_#121212] select-none">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--neo-text-muted)] text-xs">
                        Cover tidak tersedia
                      </div>
                    )}

                    {/* PRO Badge */}
                    {isPro && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-purple-600/90 text-white font-black text-[9px] sm:text-[10px] tracking-wider uppercase border border-purple-400/40 backdrop-blur-sm shadow-sm flex items-center gap-1">
                        <span>✦</span> PRO
                      </div>
                    )}

                    {/* Scissor Usage Count */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] sm:text-[11px] font-bold text-white border border-white/10 shadow-sm pointer-events-none">
                      <Scissors className="w-3 h-3 text-neutral-300" />
                      <span>{formatCount(item.stats.usages)}</span>
                    </div>

                    {/* Duration badge */}
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[9px] sm:text-[10px] font-mono text-neutral-300 border border-white/10">
                      {formatDuration(item.duration)}
                    </div>
                  </div>

                  {/* Title & Author Info */}
                  <div className="space-y-1 px-0.5">
                    <h4
                      className="font-bold text-xs sm:text-sm text-[var(--neo-text)] line-clamp-1 leading-snug"
                      title={item.title}
                    >
                      {item.title}
                    </h4>

                    {/* Author Row */}
                    <div className="flex items-center gap-1.5">
                      {item.author.avatar ? (
                        <img
                          src={item.author.avatar}
                          alt={item.author.name}
                          className="w-4 h-4 rounded-full border border-[var(--neo-border)] object-cover bg-neutral-200 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)] text-[8px] font-black flex items-center justify-center shrink-0">
                          {item.author.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[11px] font-semibold text-[var(--neo-text-muted)] truncate">
                        {item.author.name}
                      </span>
                    </div>

                    {/* Pro requirement note */}
                    {isPro && (
                      <p className="text-[10px] text-purple-500 font-bold">
                        *Perlu CapCut Pro
                      </p>
                    )}

                    {/* 3 Core Actions */}
                    <div className="space-y-1.5 pt-1.5">
                      {/* Action 1: Gunakan Template */}
                      {item.capcutUrl ? (
                        <a
                          href={item.capcutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neo-btn neo-btn-primary w-full py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Gunakan Template</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="neo-btn w-full py-1.5 rounded-lg text-[11px] font-bold opacity-50 cursor-not-allowed"
                        >
                          Link tidak tersedia
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-1">
                        {/* Action 2: Salin Link */}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.capcutUrl, item.id)}
                          disabled={!item.capcutUrl}
                          className="neo-btn neo-btn-secondary py-1 rounded-md text-[10px] font-bold flex items-center justify-center gap-1"
                          title="Salin tautan template asli"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500">Disalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin Link</span>
                            </>
                          )}
                        </button>

                        {/* Action 3: Preview (Modal) */}
                        {hasVideo ? (
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            className="neo-btn neo-btn-secondary py-1 rounded-md text-[10px] font-bold flex items-center justify-center gap-1"
                            title="Putar video preview"
                          >
                            <Play className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                        ) : (
                          <div className="py-1 text-center text-[10px] text-[var(--neo-text-muted)]">
                            No Video
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Video Preview Modal (Supports Both Direct MP4 and Embedded Streams) */}
      {previewItem && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border-2 border-[var(--neo-border)] bg-black shadow-2xl space-y-3 p-3">
            <div className="flex items-center justify-between text-white pb-2 border-b border-neutral-800">
              <span className="text-xs font-bold truncate max-w-[240px]">
                {previewItem.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-[9/16] w-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800">
              {previewItem.videoUrl.includes('embed') || previewItem.videoUrl.includes('youtube') ? (
                <iframe
                  src={previewItem.videoUrl}
                  title={previewItem.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={previewItem.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="pt-1 flex flex-col gap-2">
              <div className="flex gap-2">
                <a
                  href={previewItem.capcutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neo-btn neo-btn-primary flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di CapCut</span>
                </a>

                {previewItem.videoUrl && !previewItem.videoUrl.includes('embed') && (
                  <a
                    href={previewItem.videoUrl}
                    download="capcut-mentahan.mp4"
                    className="neo-btn neo-btn-secondary px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                    title="Unduh MP4"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="w-full py-1.5 text-center text-[11px] text-neutral-400 hover:text-white"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
