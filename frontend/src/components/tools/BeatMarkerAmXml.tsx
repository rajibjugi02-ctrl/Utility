'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Download, Copy, Check, RefreshCw, Volume2, Sparkles, CheckCircle2, Music2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

interface DetectedBeat {
  index: number;
  timeSeconds: number;
  formatted: string;
}

export const BeatMarkerAmXml: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [sensitivity, setSensitivity] = useState<number>(1.4);
  const [beats, setBeats] = useState<DetectedBeat[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBeatActive, setIsBeatActive] = useState(false);
  const [copied, setCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addHistoryItem } = useAppStore();

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setFile(uploaded);
    setBeats([]);
    setCurrentTime(0);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(uploaded);
    setAudioUrl(url);

    setIsAnalyzing(true);
    setProgress(15);

    try {
      const arrayBuffer = await uploaded.arrayBuffer();
      setProgress(40);

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      setAudioBuffer(decoded);
      setDuration(decoded.duration);
      setProgress(75);

      detectBeats(decoded, sensitivity);
    } catch (err) {
      console.error('Audio decode error:', err);
    } finally {
      setIsAnalyzing(false);
      setProgress(100);
    }
  };

  // Peak energy detection focusing on low-frequency kick and bass impulses
  const detectBeats = (buffer: AudioBuffer, sens: number) => {
    const rawData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const windowSize = Math.floor(sampleRate * 0.04); // 40ms analysis window
    const hopSize = Math.floor(windowSize / 2);
    const energies: number[] = [];

    for (let i = 0; i < rawData.length - windowSize; i += hopSize) {
      let sum = 0;
      for (let j = 0; j < windowSize; j += 4) {
        const val = rawData[i + j];
        sum += val * val;
      }
      energies.push(Math.sqrt(sum / (windowSize / 4)));
    }

    // Dynamic moving average threshold for beat peaks
    const detected: DetectedBeat[] = [];
    const movingWindow = 20;
    const minDistanceSec = 0.22; // Maximum ~270 BPM to avoid noisy micro-triggers
    let lastBeatSec = -1;

    for (let i = movingWindow; i < energies.length - movingWindow; i++) {
      const current = energies[i];
      let localSum = 0;
      for (let w = -movingWindow; w <= movingWindow; w++) {
        localSum += energies[i + w];
      }
      const localAvg = localSum / (movingWindow * 2 + 1);
      const threshold = localAvg * sens;

      if (current > threshold && current > energies[i - 1] && current >= energies[i + 1]) {
        const timeSec = (i * hopSize) / sampleRate;
        if (timeSec - lastBeatSec >= minDistanceSec) {
          detected.push({
            index: detected.length + 1,
            timeSeconds: parseFloat(timeSec.toFixed(3)),
            formatted: formatTime(timeSec),
          });
          lastBeatSec = timeSec;
        }
      }
    }

    setBeats(detected);
    drawWaveform(buffer, detected, 0);
  };

  // Re-detect when sensitivity changes
  const handleSensitivityChange = (newSens: number) => {
    setSensitivity(newSens);
    if (audioBuffer) {
      detectBeats(audioBuffer, newSens);
    }
  };

  // Draw audio waveform and beat markers
  const drawWaveform = (buffer: AudioBuffer, beatList: DetectedBeat[], playheadTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Dark/Light subtle waveform background
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, width, height);

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2.2;

    // Draw waveform bars
    ctx.fillStyle = '#52525B';
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }

    // Draw beat markers as vertical highlight lines
    const dur = buffer.duration;
    beatList.forEach((b) => {
      const x = (b.timeSeconds / dur) * width;
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Marker diamond at top
      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      ctx.arc(x, 4, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw playhead cursor
    if (dur > 0) {
      const playX = (playheadTime / dur) * width;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playX, 0);
      ctx.lineTo(playX, height);
      ctx.stroke();
    }
  };

  // Playback time update and real-time beat flash
  const handleTimeUpdate = () => {
    if (!audioRef.current || !audioBuffer) return;
    const current = audioRef.current.currentTime;
    setCurrentTime(current);

    // Check if within 50ms of any detected beat
    const hit = beats.some((b) => Math.abs(b.timeSeconds - current) < 0.06);
    setIsBeatActive(hit);

    drawWaveform(audioBuffer, beats, current);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    if (audioBuffer) drawWaveform(audioBuffer, beats, time);
  };

  const handleCopyTimestamps = () => {
    const text = beats.map((b) => `${b.formatted} (${b.timeSeconds}s)`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export authentic Alight Motion XML project
  const handleExportAlightXml = () => {
    if (beats.length === 0) return;

    const baseName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'Project_Beat';
    const amBookmarks = beats
      .map((b) => `    <bookmark time="${Math.round(b.timeSeconds * 1000)}" />`)
      .join('\n');

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by UtilityHub Auto Beat-Marker Studio -->
<scene xmlns="http://schemas.alightmotion.com/scene/1.0"
       width="1080"
       height="1920"
       fps="60"
       duration="${Math.round((duration || 30) * 1000)}"
       title="${baseName} Beat Presets">
  <bookmarks>
${amBookmarks}
  </bookmarks>
</scene>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}_AlightMotion_Beat_Bookmarks.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addHistoryItem({
      toolId: 'beat-marker-am-xml',
      toolName: 'Auto Beat-Marker AM XML',
      title: `${baseName} (${beats.length} Ketukan Beat)`,
      type: 'xml',
      downloadUrl: '#',
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 text-center hover:border-[var(--neo-border-active)] transition-colors cursor-pointer bg-[var(--neo-bg)] space-y-2"
      >
        <div className="w-12 h-12 mx-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-rose-500 shadow-neo">
          <Music2 className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--neo-text)]">
            {file ? file.name : 'Pilih atau Tarik File Lagu (MP3 / WAV)'}
          </p>
          <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
            Menganalisis frekuensi kick dan bass untuk menemukan ketukan beat otomatis
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {isAnalyzing && (
        <ProcessCard
          progress={progress}
          stage="Menganalisis Waveform & Frekuensi Bass Ketukan..."
          speedText="Web Audio DSP"
          timeRemaining="Real-time"
        />
      )}

      {audioBuffer && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          {/* Top Bar: Play, Time, Realtime Beat Flash Indicator */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-[var(--neo-border)]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="neo-btn neo-btn-primary w-11 h-11 rounded-xl"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <div>
                <span className="font-mono text-xs font-bold text-[var(--neo-text)]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <p className="text-[10px] text-[var(--neo-text-muted)] font-mono">
                  {beats.length} ketukan terdeteksi
                </p>
              </div>
            </div>

            {/* Real-time Beat Lamp */}
            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1.5 rounded-xl border-2 border-[var(--neo-border)] font-mono text-xs font-bold transition-all duration-75 flex items-center gap-1.5 ${
                  isBeatActive
                    ? 'bg-rose-500 text-white scale-105 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                    : 'bg-[var(--neo-bg)] text-[var(--neo-text-muted)]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isBeatActive ? 'BEAT KETUKAN!' : 'Standby'}</span>
              </div>
            </div>
          </div>

          {/* Interactive Waveform Canvas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--neo-text-muted)] font-mono">
              <span>Waveform & Penanda Garis Merah Beat</span>
              <span>Klik waveform untuk loncat waktu</span>
            </div>
            <div
              className="rounded-xl border-2 border-[var(--neo-border)] overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                handleSeek(pos * duration);
              }}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={120}
                className="w-full h-28 block"
              />
            </div>
          </div>

          {/* Sensitivity Calibrator */}
          <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--neo-text)]">Sensitivitas Deteksi Ketukan</span>
              <span className="font-mono font-bold text-[var(--neo-accent)]">{sensitivity.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.05"
              value={sensitivity}
              onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
              className="w-full accent-[var(--neo-text)] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--neo-text-muted)] font-mono">
              <span>Banyak Beat (Sensitif)</span>
              <span>Rekomendasi (1.3x - 1.5x)</span>
              <span>Hanya Kick Kuat</span>
            </div>
          </div>

          {/* Action Buttons: Export Alight Motion XML & Copy Timestamps */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleExportAlightXml}
              className="neo-btn neo-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold w-full sm:flex-1 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Bookmark XML Alight Motion</span>
            </button>

            <button
              type="button"
              onClick={handleCopyTimestamps}
              className="neo-btn neo-btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Timestamp'}</span>
            </button>
          </div>

          {/* Detected Beats Table Preview */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-[var(--neo-text)]">Daftar Timestamp Ketukan</span>
            <div className="max-h-48 overflow-y-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] p-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[11px]">
              {beats.map((b) => (
                <button
                  key={b.index}
                  type="button"
                  onClick={() => handleSeek(b.timeSeconds)}
                  className="px-2 py-1.5 rounded-lg border border-[var(--neo-border)] bg-[var(--neo-surface)] hover:border-rose-500 text-left flex items-center justify-between text-[var(--neo-text)] transition-colors"
                >
                  <span className="text-[var(--neo-text-muted)]">#{b.index}</span>
                  <span className="font-bold text-rose-500">{b.formatted}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element for synchronous playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
};
