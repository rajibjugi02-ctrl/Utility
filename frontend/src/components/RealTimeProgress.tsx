'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle2, AlertTriangle, X, Gauge, Clock, ArrowDownToLine } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '@/store/useAppStore';
import { i18n } from '@/utils/i18n';

export const RealTimeProgress: React.FC = () => {
  const { activeJob, updateActiveJob, setActiveJob, addHistoryItem, language } = useAppStore();
  const socketRef = useRef<WebSocket | null>(null);
  const t = i18n[language] || i18n['id'];

  useEffect(() => {
    if (!activeJob || !activeJob.taskId) return;
    if (typeof window === 'undefined') return;

    let ws: WebSocket | null = null;
    let pingInterval: any = null;

    try {
      const host = window.location.hostname || 'localhost';
      // Only connect to port 8000 in local dev environment where python backend runs
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.');
      if (!isLocal) {
        return;
      }

      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${host}:8000/ws/progress/${activeJob.taskId}`;

      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        pingInterval = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 5000);
      };

      ws.onmessage = (event) => {
        try {
          if (event.data === 'pong') return;
          const data = JSON.parse(event.data);

          updateActiveJob({
            status: data.status,
            progress: typeof data.progress === 'number' ? data.progress : activeJob.progress,
            speed: data.speed || activeJob.speed,
            eta: data.eta || activeJob.eta,
            message: data.message || activeJob.message,
            downloadUrl: data.download_url || activeJob.downloadUrl,
          });

          if (data.status === 'completed') {
            try {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
              });
            } catch {}

            addHistoryItem({
              type: activeJob.type || 'download',
              title: activeJob.title || 'Media Download',
              subtitle: data.filename || 'Berkas selesai diunduh',
              downloadUrl: data.download_url,
            });
          }
        } catch (err) {
          console.error('WS Error:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('WS connection warning:', err);
      };

      ws.onclose = () => {
        if (pingInterval) clearInterval(pingInterval);
      };
    } catch (e) {
      console.warn('WebSocket init exception caught:', e);
    }

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      if (ws) {
        try {
          ws.close();
        } catch {}
      }
    };
  }, [activeJob?.taskId]);

  if (!activeJob) return null;

  const isComplete = activeJob.status === 'completed';
  const isError = activeJob.status === 'error';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-[400px] z-50 pointer-events-auto"
      >
        <div className="neo-card p-4 rounded-2xl bg-[var(--neo-surface)] space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : isError ? (
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <ArrowDownToLine className="w-4 h-4 text-[var(--neo-text)] animate-pulse shrink-0" />
              )}
              <div className="truncate">
                <h4 className="text-xs font-bold text-[var(--neo-text)] truncate">
                  {activeJob.title || t.processing}
                </h4>
                <p className="text-[11px] text-[var(--neo-text-muted)] truncate">{activeJob.message}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveJob(null)}
              className="p-1 rounded-lg text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Striped Diagonal Progress Bar */}
          <div className="w-full h-2.5 rounded-full border border-[var(--neo-border)] bg-[var(--neo-bg)] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isComplete
                  ? 'bg-emerald-500'
                  : isError
                  ? 'bg-rose-500'
                  : 'bg-[var(--neo-accent)] striped-progress-bar'
              }`}
              style={{ width: `${Math.max(activeJob.progress, 5)}%` }}
            />
          </div>

          {/* Metric Indicators */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--neo-text-muted)]">
            <span className="flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              <span>{activeJob.speed || '0 MB/s'}</span>
            </span>

            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>ETA: {activeJob.eta || '--:--'}</span>
            </span>

            <span className="font-bold text-[var(--neo-text)]">
              {Math.round(activeJob.progress)}%
            </span>
          </div>

          {/* Download Button on Completion */}
          {isComplete && activeJob.downloadUrl && (
            <div className="pt-2 border-t border-[var(--neo-border)] flex items-center justify-between gap-2">
              <span className="text-[11px] text-emerald-500 font-bold">
                {t.file_ready}
              </span>
              <a
                href={activeJob.downloadUrl}
                download
                className="neo-btn neo-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.save_file}</span>
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
