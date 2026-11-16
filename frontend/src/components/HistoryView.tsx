'use client';

import React from 'react';
import {
  History,
  Video,
  Music2,
  FileText,
  Layers,
  Download,
  ExternalLink,
  Trash2,
  Clock,
  Instagram,
  Youtube,
  Globe,
  Image as ImageIcon,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { i18n } from '@/utils/i18n';

export const HistoryView: React.FC = () => {
  const { history, deleteHistoryItem, clearHistory, language } = useAppStore();
  const t = i18n[language] || i18n['id'];

  const getIcon = (type?: string) => {
    switch (type) {
      case 'tiktok':
        return <Video className="w-4 h-4 text-rose-500" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'spotify':
        return <Music2 className="w-4 h-4 text-green-500" />;
      case 'preset':
        return <Layers className="w-4 h-4 text-emerald-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'web':
        return <Globe className="w-4 h-4 text-sky-500" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-amber-500" />;
      default:
        return <History className="w-4 h-4 text-[var(--neo-text)]" />;
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString();
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pt-4 md:pt-24 pb-28 md:pb-16 space-y-4 relative z-10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-[var(--neo-text)] tracking-tight">
            {t.history_title}
          </h2>
          <p className="text-xs text-[var(--neo-text-muted)] mt-0.5">
            {t.history_desc}
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="neo-btn px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 bg-[var(--neo-surface)] hover:bg-rose-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.history_clear}</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="p-8 text-center rounded-2xl neo-card bg-[var(--neo-surface)] space-y-2 shadow-[3px_3px_0px_#121212]">
          <div className="w-10 h-10 rounded-xl bg-[var(--neo-bg)] border-2 border-[var(--neo-border)] flex items-center justify-center text-[var(--neo-text-muted)] mx-auto">
            <History className="w-5 h-5" />
          </div>
          <p className="text-xs font-mono text-[var(--neo-text-muted)]">{t.history_empty}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-3.5 sm:p-4 rounded-2xl neo-card bg-[var(--neo-surface)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[3px_3px_0px_#121212] md:shadow-[4px_4px_0px_#121212]"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--neo-bg)] border-2 border-[var(--neo-border)] flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>

                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--neo-text)] line-clamp-1">
                    {item.title}
                  </h4>
                  {(item.subtitle || item.toolName) && (
                    <p className="text-xs text-[var(--neo-text-muted)] line-clamp-1">
                      {item.subtitle || item.toolName}
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-[10px] text-[var(--neo-text-muted)] font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(item.timestamp)}</span>
                  </div>

                  {item.presetUrls && item.presetUrls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {item.presetUrls.map((p, idx) => (
                        <a
                          key={idx}
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="neo-badge bg-emerald-500/10 text-emerald-500 border-emerald-500/40 text-[10px]"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>{p.service}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {item.downloadUrl && (
                  <a
                    href={item.downloadUrl}
                    download
                    className="neo-btn neo-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.download}</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => deleteHistoryItem(item.id)}
                  className="neo-btn p-2 rounded-xl text-[var(--neo-text-muted)] hover:text-rose-500 neo-btn-secondary"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
