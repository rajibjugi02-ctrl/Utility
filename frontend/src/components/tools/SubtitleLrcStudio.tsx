'use client';

import React, { useState, useRef } from 'react';
import { Upload, Play, Pause, Download, Plus, Trash2, Clock, FileText, Music2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface SubtitleLine {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
}

export const SubtitleLrcStudio: React.FC = () => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [lines, setLines] = useState<SubtitleLine[]>([
    { id: '1', startSec: 1.0, endSec: 4.0, text: 'Halo selamat datang di video ini' },
    { id: '2', startSec: 4.5, endSec: 8.0, text: 'Tutorial lengkap pembuatan konten aesthetic' },
  ]);

  const [copied, setCopied] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addHistoryItem } = useAppStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    setIsVideo(file.type.startsWith('video/'));
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    setMediaUrl(URL.createObjectURL(file));
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatSrtTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };

  const formatLrcTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}]`;
  };

  const addLine = () => {
    const nextStart = Math.round(currentTime * 10) / 10;
    const newLine: SubtitleLine = {
      id: `${Date.now()}`,
      startSec: nextStart,
      endSec: nextStart + 3.0,
      text: '',
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, patch: Partial<SubtitleLine>) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const setLineTimeToCurrent = (id: string, type: 'start' | 'end') => {
    if (!mediaRef.current) return;
    const time = Math.round(mediaRef.current.currentTime * 10) / 10;
    updateLine(id, type === 'start' ? { startSec: time } : { endSec: time });
  };

  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      mediaRef.current.play();
      setIsPlaying(true);
    }
  };

  // Generate SRT text
  const generateSrt = () => {
    return lines
      .map(
        (l, i) =>
          `${i + 1}\n${formatSrtTime(l.startSec)} --> ${formatSrtTime(l.endSec)}\n${l.text}\n`
      )
      .join('\n');
  };

  // Generate LRC text
  const generateLrc = () => {
    return lines.map((l) => `${formatLrcTime(l.startSec)}${l.text}`).join('\n');
  };

  const handleDownloadSrt = () => {
    const content = generateSrt();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mediaFile?.name ? mediaFile.name.replace(/\.[^/.]+$/, '') : 'subtitle'}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadLrc = () => {
    const content = generateLrc();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mediaFile?.name ? mediaFile.name.replace(/\.[^/.]+$/, '') : 'lyrics'}.lrc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 text-center hover:border-[var(--neo-border-active)] transition-colors cursor-pointer bg-[var(--neo-bg)] space-y-2"
      >
        <div className="w-12 h-12 mx-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-teal-500 shadow-neo">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--neo-text)]">
            {mediaFile ? mediaFile.name : 'Pilih atau Tarik File Lagu atau Video'}
          </p>
          <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
            Buat timestamp lirik lagu (.LRC) atau subtitle video (.SRT) secara sinkron
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Media Player Control */}
      {mediaUrl && (
        <div className="neo-card p-4 rounded-2xl bg-[var(--neo-surface)] space-y-3">
          {isVideo ? (
            <video
              ref={mediaRef as any}
              src={mediaUrl}
              onTimeUpdate={() => setCurrentTime(mediaRef.current?.currentTime || 0)}
              onLoadedMetadata={() => setDuration(mediaRef.current?.duration || 0)}
              className="max-h-48 w-full object-contain rounded-xl bg-black"
            />
          ) : (
            <audio
              ref={mediaRef as any}
              src={mediaUrl}
              onTimeUpdate={() => setCurrentTime(mediaRef.current?.currentTime || 0)}
              onLoadedMetadata={() => setDuration(mediaRef.current?.duration || 0)}
              className="hidden"
            />
          )}

          <div className="flex items-center justify-between text-xs font-mono">
            <button
              type="button"
              onClick={togglePlay}
              className="neo-btn neo-btn-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Putar'}</span>
            </button>
            <span className="font-bold text-[var(--neo-text)]">
              {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
            </span>
          </div>
        </div>
      )}

      {/* Lines Editor */}
      <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--neo-border)]">
          <h3 className="text-sm font-bold text-[var(--neo-text)]">
            Daftar Baris Subtitle & Lirik ({lines.length})
          </h3>
          <button
            type="button"
            onClick={addLine}
            className="neo-btn neo-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris</span>
          </button>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {lines.map((line, idx) => (
            <div
              key={line.id}
              className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className="text-[var(--neo-text-muted)] font-bold">#{idx + 1}</span>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span>Mulai:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={line.startSec}
                      onChange={(e) => updateLine(line.id, { startSec: parseFloat(e.target.value) || 0 })}
                      className="neo-input w-16 px-1.5 py-0.5 text-center text-xs rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setLineTimeToCurrent(line.id, 'start')}
                      className="p-1 rounded bg-[var(--neo-surface)] hover:text-emerald-500"
                      title="Set ke detik sekarang"
                    >
                      <Clock className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <span>Selesai:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={line.endSec}
                      onChange={(e) => updateLine(line.id, { endSec: parseFloat(e.target.value) || 0 })}
                      className="neo-input w-16 px-1.5 py-0.5 text-center text-xs rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setLineTimeToCurrent(line.id, 'end')}
                      className="p-1 rounded bg-[var(--neo-surface)] hover:text-emerald-500"
                      title="Set ke detik sekarang"
                    >
                      <Clock className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={line.text}
                onChange={(e) => updateLine(line.id, { text: e.target.value })}
                placeholder="Tulis lirik atau teks subtitle di sini..."
                className="neo-input w-full px-3 py-1.5 text-xs rounded-lg"
              />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownloadSrt}
            className="neo-btn neo-btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Subtitle (.SRT)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadLrc}
            className="neo-btn neo-btn-secondary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <Music2 className="w-4 h-4 text-emerald-500" />
            <span>Download Lirik (.LRC)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
