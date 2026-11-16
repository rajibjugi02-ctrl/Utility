'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Download, Scissors, Mic, Music, CheckCircle2, Sliders } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

type SplitterMode = 'normal' | 'karaoke' | 'vocal';

// Convert AudioBuffer to standard 16-bit PCM WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  // RIFF header
  writeString('RIFF');
  out.setUint32(pos, length - 8, true);
  pos += 4;
  writeString('WAVE');
  writeString('fmt ');
  out.setUint32(pos, 16, true);
  pos += 4; // SubChunk1Size (16 for PCM)
  out.setUint16(pos, 1, true);
  pos += 2; // AudioFormat (1 for PCM)
  out.setUint16(pos, numOfChan, true);
  pos += 2;
  out.setUint32(pos, buffer.sampleRate, true);
  pos += 4;
  out.setUint32(pos, buffer.sampleRate * 2 * numOfChan, true);
  pos += 4; // ByteRate
  out.setUint16(pos, numOfChan * 2, true);
  pos += 2; // BlockAlign
  out.setUint16(pos, 16, true);
  pos += 2; // BitsPerSample
  writeString('data');
  out.setUint32(pos, length - pos - 4, true);
  pos += 4;

  // Interleave channel samples
  const channels: Float32Array[] = [];
  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 0;
  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      out.setInt16(pos, Math.floor(sample), true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

export const AudioCutterSplitter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(30);
  const [duration, setDuration] = useState<number>(0);

  const [mode, setMode] = useState<SplitterMode>('normal');
  const [fadeIn, setFadeIn] = useState<boolean>(true);
  const [fadeOut, setFadeOut] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(null);

  // Live preview playback
  const [isPlaying, setIsPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addHistoryItem } = useAppStore();

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${String(sec).padStart(2, '0')}.${ms}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setFile(uploaded);
    setRenderedBlobUrl(null);
    setIsPlaying(false);

    const arrayBuffer = await uploaded.arrayBuffer();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decoded = await ctx.decodeAudioData(arrayBuffer);

    setAudioBuffer(decoded);
    setDuration(decoded.duration);
    setStartTime(0);
    setEndTime(Math.min(30, decoded.duration));

    drawWaveform(decoded, 0, Math.min(30, decoded.duration));
  };

  const drawWaveform = (buf: AudioBuffer, start: number, end: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, width, height);

    const data = buf.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2.2;
    const dur = buf.duration;

    const startX = (start / dur) * width;
    const endX = (end / dur) * width;

    // Draw active selection region highlight
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.fillRect(startX, 0, endX - startX, height);

    // Waveform bars
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      // Selected vs unselected bar color
      if (i >= startX && i <= endX) {
        ctx.fillStyle = '#10B981';
      } else {
        ctx.fillStyle = '#3F3F46';
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }

    // Cut handles
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();
  };

  // Re-draw when start/end changes
  const handleRangeChange = (newStart: number, newEnd: number) => {
    setStartTime(newStart);
    setEndTime(newEnd);
    if (audioBuffer) drawWaveform(audioBuffer, newStart, newEnd);
  };

  // Process and render trimmed/split audio offline
  const handleProcessAudio = async () => {
    if (!audioBuffer) return;

    setIsProcessing(true);
    setProgress(20);
    setRenderedBlobUrl(null);
    setIsPlaying(false);

    try {
      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const frameCount = Math.max(1, endSample - startSample);

      setProgress(40);

      // Create OfflineAudioContext for the trimmed slice
      const offlineCtx = new OfflineAudioContext(2, frameCount, sampleRate);
      const source = offlineCtx.createBufferSource();

      // Extract sliced buffer
      const sliceBuffer = offlineCtx.createBuffer(2, frameCount, sampleRate);
      const srcLeft = audioBuffer.getChannelData(0);
      const srcRight = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : srcLeft;

      const destLeft = sliceBuffer.getChannelData(0);
      const destRight = sliceBuffer.getChannelData(1);

      if (mode === 'karaoke') {
        // Instrumental / Karaoke: Phase Cancellation of center-panned vocals (L - R)
        for (let i = 0; i < frameCount; i++) {
          const l = srcLeft[startSample + i] || 0;
          const r = srcRight[startSample + i] || 0;
          const diff = (l - r) * 0.85; // Center vocal cancellation
          destLeft[i] = diff;
          destRight[i] = -diff; // Inverted stereo image
        }
      } else if (mode === 'vocal') {
        // Vocal Isolation: Center mono summing (L + R) / 2
        for (let i = 0; i < frameCount; i++) {
          const l = srcLeft[startSample + i] || 0;
          const r = srcRight[startSample + i] || 0;
          const center = (l + r) * 0.7;
          destLeft[i] = center;
          destRight[i] = center;
        }
      } else {
        // Normal Trim
        for (let i = 0; i < frameCount; i++) {
          destLeft[i] = srcLeft[startSample + i] || 0;
          destRight[i] = srcRight[startSample + i] || 0;
        }
      }

      // Apply Fade-In / Fade-Out directly to samples
      const fadeLength = Math.floor(sampleRate * 1.0); // 1.0s fade
      if (fadeIn && frameCount > fadeLength) {
        for (let i = 0; i < fadeLength; i++) {
          const mult = i / fadeLength;
          destLeft[i] *= mult;
          destRight[i] *= mult;
        }
      }
      if (fadeOut && frameCount > fadeLength) {
        for (let i = 0; i < fadeLength; i++) {
          const mult = (fadeLength - i) / fadeLength;
          destLeft[frameCount - fadeLength + i] *= mult;
          destRight[frameCount - fadeLength + i] *= mult;
        }
      }

      setProgress(70);

      // Convert rendered AudioBuffer to WAV
      const wavBlob = audioBufferToWav(sliceBuffer);
      const blobUrl = URL.createObjectURL(wavBlob);
      setRenderedBlobUrl(blobUrl);
      setProgress(100);

      const baseName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'Audio';
      const label = mode === 'karaoke' ? 'Instrumental' : mode === 'vocal' ? 'Vocal' : 'Cut';

      addHistoryItem({
        toolId: 'audio-cutter-splitter',
        toolName: 'Audio Cutter & Splitter',
        title: `${baseName} (${label} ${formatSecs(endTime - startTime)})`,
        type: 'audio',
        downloadUrl: blobUrl,
      });
    } catch (err) {
      console.error('Audio processing failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!renderedBlobUrl) return;
    const baseName = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'Audio';
    const a = document.createElement('a');
    a.href = renderedBlobUrl;
    a.download = `${baseName}_${mode}_${Math.round(startTime)}s_${Math.round(endTime)}s.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPlaying) {
      previewAudioRef.current.pause();
      setIsPlaying(false);
    } else {
      previewAudioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 text-center hover:border-[var(--neo-border-active)] transition-colors cursor-pointer bg-[var(--neo-bg)] space-y-2"
      >
        <div className="w-12 h-12 mx-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-emerald-500 shadow-neo">
          <Scissors className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--neo-text)]">
            {file ? file.name : 'Pilih atau Tarik File Audio (MP3 / WAV)'}
          </p>
          <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
            Potong nada dering, pisahkan vokal karaoke (phase cancellation), atau buat klip audio
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

      {audioBuffer && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          {/* Waveform Selection Canvas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--neo-text-muted)] font-mono">
              <span>Rentang Potong: {formatSecs(startTime)} sampai {formatSecs(endTime)}</span>
              <span>Durasi Klip: {formatSecs(endTime - startTime)}</span>
            </div>

            <div className="rounded-xl border-2 border-[var(--neo-border)] overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800}
                height={120}
                className="w-full h-28 block"
              />
            </div>
          </div>

          {/* Start and End Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[var(--neo-text)]">Detik Awal (Start):</span>
                <span className="font-bold text-emerald-500">{formatSecs(startTime)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, endTime - 0.5)}
                step="0.1"
                value={startTime}
                onChange={(e) => handleRangeChange(parseFloat(e.target.value), endTime)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[var(--neo-text)]">Detik Akhir (End):</span>
                <span className="font-bold text-emerald-500">{formatSecs(endTime)}</span>
              </div>
              <input
                type="range"
                min={startTime + 0.5}
                max={duration || 60}
                step="0.1"
                value={endTime}
                onChange={(e) => handleRangeChange(startTime, parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[var(--neo-text)]">Pilih Mode Pemrosesan Audio:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('normal')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  mode === 'normal'
                    ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)]'
                    : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Scissors className="w-4 h-4" />
                  <span className="text-xs font-bold">Normal Trim</span>
                </div>
                <p className="text-[10px] opacity-80 leading-tight">
                  Potong bersih tanpa modifikasi frekuensi (Ringtone / TikTok sound).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('karaoke')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  mode === 'karaoke'
                    ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)]'
                    : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Music className="w-4 h-4" />
                  <span className="text-xs font-bold">Instrumental / Karaoke</span>
                </div>
                <p className="text-[10px] opacity-80 leading-tight">
                  Phase cancellation membuang vokal tengah, menyisakan instrumen stereo.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('vocal')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  mode === 'vocal'
                    ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)]'
                    : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="w-4 h-4" />
                  <span className="text-xs font-bold">Vocal Boost</span>
                </div>
                <p className="text-[10px] opacity-80 leading-tight">
                  Isolasi kanal tengah memperkuat vokal vokal manusia.
                </p>
              </button>
            </div>
          </div>

          {/* Fade Effects */}
          <div className="flex items-center gap-4 text-xs font-bold text-[var(--neo-text)] pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fadeIn}
                onChange={(e) => setFadeIn(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span>Fade In (Halus di Awal)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fadeOut}
                onChange={(e) => setFadeOut(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span>Fade Out (Halus di Akhir)</span>
            </label>
          </div>

          {/* Render Button */}
          <button
            type="button"
            onClick={handleProcessAudio}
            disabled={isProcessing}
            className="neo-btn neo-btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <Scissors className="w-4 h-4" />
            <span>Proses Audio ({mode.toUpperCase()})</span>
          </button>

          {isProcessing && (
            <ProcessCard
              progress={progress}
              stage="Memproses DSP Audio Offline (Fade & Phase Splitting)..."
              speedText="Web Audio API"
              timeRemaining="1-2 detik"
            />
          )}

          {/* Rendered Result Preview Card */}
          {renderedBlobUrl && (
            <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Audio Siap! ({formatSecs(endTime - startTime)})</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="neo-btn neo-btn-primary px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .WAV</span>
                </button>
              </div>

              {/* Audio Player */}
              <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-[var(--neo-border)] bg-[var(--neo-surface)]">
                <button
                  type="button"
                  onClick={togglePreviewPlay}
                  className="neo-btn neo-btn-primary w-9 h-9 rounded-lg"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div className="text-xs font-mono text-[var(--neo-text)]">
                  <span className="font-bold">Preview Hasil Pemrosesan</span>
                  <p className="text-[10px] text-[var(--neo-text-muted)]">Format 16-bit PCM Audio WAV Jernih</p>
                </div>
              </div>

              <audio
                ref={previewAudioRef}
                src={renderedBlobUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
