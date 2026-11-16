'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProcessCardProps {
  stage: string;
  progress: number; // 0 - 100
  speed?: string; // e.g. "14.2 MB/s"
  speedText?: string;
  eta?: string; // e.g. "00:02"
  timeRemaining?: string;
  isCompleted?: boolean;
  error?: string | null;
}

export const ProcessCard: React.FC<ProcessCardProps> = ({
  stage,
  progress,
  speed,
  speedText,
  eta,
  timeRemaining,
  isCompleted = false,
  error = null,
}) => {
  const displaySpeed = speedText || speed || '12.5 MB/s';
  const displayEta = timeRemaining || eta || '00:03';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="neo-card p-4 sm:p-5 rounded-2xl bg-[var(--neo-surface)] space-y-3"
    >
      {/* Header status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {error ? (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <Loader2 className="w-4 h-4 text-[var(--neo-text)] animate-spin" />
          )}
          <span className="text-xs sm:text-sm font-bold text-[var(--neo-text)]">
            {error ? 'Proses Gagal' : isCompleted ? 'Proses Selesai (100%)' : stage}
          </span>
        </div>

        <span className="font-mono text-xs font-bold text-[var(--neo-text)]">
          {Math.min(100, Math.max(0, Math.round(progress)))}%
        </span>
      </div>

      {/* Striped Diagonal Animated Bar */}
      <div className="w-full h-3 rounded-full border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-200 ${
            error
              ? 'bg-rose-500'
              : isCompleted
              ? 'bg-emerald-500'
              : 'bg-[var(--neo-accent)] striped-progress-bar'
          }`}
          style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
        />
      </div>

      {/* Speed & ETA metrics */}
      {!error && !isCompleted && (
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--neo-text-muted)] pt-0.5">
          <span>Kecepatan: <strong className="text-[var(--neo-text)]">{displaySpeed}</strong></span>
          <span>Estimasi: <strong className="text-[var(--neo-text)]">{displayEta}</strong></span>
        </div>
      )}

      {error && (
        <p className="text-xs font-semibold text-rose-500">{error}</p>
      )}
    </motion.div>
  );
};
