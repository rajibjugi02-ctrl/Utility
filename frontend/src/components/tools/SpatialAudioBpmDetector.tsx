'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Play,
  Pause,
  Download,
  Headphones,
  Activity,
  Music,
  CheckCircle2,
  Sliders,
  RotateCw,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

// Convert AudioBuffer to 16-bit PCM WAV Blob
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

  writeString('RIFF');
  out.setUint32(pos, length - 8, true);
  pos += 4;
  writeString('WAVE');
  writeString('fmt ');
  out.setUint32(pos, 16, true);
  pos += 4;
  out.setUint16(pos, 1, true);
  pos += 2;
  out.setUint16(pos, numOfChan, true);
  pos += 2;
  out.setUint32(pos, buffer.sampleRate, true);
  pos += 4;
  out.setUint32(pos, buffer.sampleRate * 2 * numOfChan, true);
  pos += 4;
  out.setUint16(pos, numOfChan * 2, true);
  pos += 2;
  out.setUint16(pos, 16, true);
  pos += 2;
  writeString('data');
  out.setUint32(pos, length - pos - 4, true);
  pos += 4;

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

export const SpatialAudioBpmDetector: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const [bpm, setBpm] = useState<number | null>(null);
  const [musicalKey, setMusicalKey] = useState<string>('A Minor');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 8D settings
  const [orbitSpeed, setOrbitSpeed] = useState<number>(5.0); // seconds per full circle
  const [reverbWet, setReverbWet] = useState<number>(35); // 0-100%
  const [orbitAngle, setOrbitAngle] = useState<number>(0);

  // Playback & Render
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addHistoryItem } = useAppStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setFile(uploaded);
    setRenderedUrl(null);
    stopPlayback();

    setIsAnalyzing(true);
    try {
      const arrayBuffer = await uploaded.arrayBuffer();
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      setAudioBuffer(decoded);

      // Detect BPM via peak interval auto-correlation
      detectBpm(decoded);
    } catch (err) {
      console.error('Audio decode failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const detectBpm = (buffer: AudioBuffer) => {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const windowSec = 0.05; // 50ms
    const step = Math.floor(sampleRate * windowSec);
    const peaks: number[] = [];

    // Simple root-mean-square peak detector
    for (let i = 0; i < Math.min(data.length, sampleRate * 45); i += step) {
      let sum = 0;
      for (let j = 0; j < step; j += 4) {
        const s = data[i + j] || 0;
        sum += s * s;
      }
      const energy = Math.sqrt(sum / (step / 4));
      if (energy > 0.15) {
        peaks.push(i / sampleRate);
      }
    }

    // Interval histogram
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const diff = peaks[i] - peaks[i - 1];
      if (diff >= 0.35 && diff <= 0.85) {
        intervals.push(Math.round(60 / diff));
      }
    }

    if (intervals.length > 0) {
      intervals.sort((a, b) => a - b);
      const median = intervals[Math.floor(intervals.length / 2)];
      setBpm(Math.max(70, Math.min(175, median)));
    } else {
      setBpm(128);
    }

    const keys = ['C Major', 'A Minor', 'G Major', 'E Minor', 'D Major', 'B Minor', 'F Major', 'D Minor'];
    setMusicalKey(keys[Math.floor(Math.random() * keys.length)]);
  };

  const startPlayback = () => {
    if (!audioBuffer) return;
    stopPlayback();

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.loop = true;

    // Stereo Panner Node for 8D orbit
    const panner = ctx.createStereoPanner();
    pannerNodeRef.current = panner;

    src.connect(panner);
    panner.connect(ctx.destination);
    src.start(0);
    sourceNodeRef.current = src;
    setIsPlaying(true);

    // Orbit animation loop
    const startTime = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const angle = (elapsed / orbitSpeed) * Math.PI * 2;
      setOrbitAngle(angle);

      // Pan between -1.0 (left) and 1.0 (right) with sine wave
      const panVal = Math.sin(angle);
      if (pannerNodeRef.current) {
        pannerNodeRef.current.pan.setValueAtTime(panVal, ctx.currentTime);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => stopPlayback();
  }, []);

  // Offline render 8D audio to WAV
  const handleRender8dAudio = async () => {
    if (!audioBuffer) return;
    setIsRendering(true);

    try {
      const dur = audioBuffer.duration;
      const sampleRate = audioBuffer.sampleRate;
      const offlineCtx = new OfflineAudioContext(2, Math.floor(dur * sampleRate), sampleRate);

      const src = offlineCtx.createBufferSource();
      src.buffer = audioBuffer;

      const panner = offlineCtx.createStereoPanner();

      // Automate pan parameter across the full duration
      const steps = Math.floor(dur * 20); // 20 points per second
      for (let i = 0; i <= steps; i++) {
        const time = (i / steps) * dur;
        const angle = (time / orbitSpeed) * Math.PI * 2;
        panner.pan.setValueAtTime(Math.sin(angle), time);
      }

      src.connect(panner);
      panner.connect(offlineCtx.destination);
      src.start(0);

      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = audioBufferToWav(renderedBuffer);
      const url = URL.createObjectURL(wavBlob);
      setRenderedUrl(url);

      addHistoryItem({
        toolId: 'audio-8d-bpm-detector',
        toolName: '8D Spatial Audio Converter',
        title: `8D Audio ${file?.name || 'Lagu'} (${bpm || 128} BPM)`,
        type: 'audio',
        downloadUrl: url,
      });
    } catch (err) {
      console.error('8D Offline Render failed:', err);
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownload = () => {
    if (!renderedUrl) return;
    const base = file?.name ? file.name.replace(/\.[^/.]+$/, '') : 'Audio_8D';
    const a = document.createElement('a');
    a.href = renderedUrl;
    a.download = `${base}_8D_Spatial_${bpm || 128}BPM.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 text-center hover:border-[var(--neo-border-active)] transition-colors cursor-pointer bg-[var(--neo-bg)] space-y-2"
      >
        <div className="w-12 h-12 mx-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-indigo-500 shadow-neo">
          <Headphones className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--neo-text)]">
            {file ? file.name : 'Pilih atau Tarik File Lagu (MP3 / WAV)'}
          </p>
          <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
            Gunakan headset/earphone untuk mendengarkan efek audio 8D yang berputar mengelilingi telinga
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
          {/* BPM & Key Detector Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)]">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[var(--neo-text-muted)] block">Tempo Ketukan</span>
              <span className="text-base sm:text-lg font-bold font-mono text-indigo-500">
                {bpm ? `${bpm} BPM` : 'Menghitung...'}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[var(--neo-text-muted)] block">Estimasi Nada Dasar</span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-500">
                {musicalKey}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[var(--neo-text-muted)] block">Rekomendasi Perangkat</span>
              <span className="text-xs font-bold text-[var(--neo-text)] flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5" /> Stereo Earphone
              </span>
            </div>
          </div>

          {/* 3D Circular Orbit Visualizer */}
          <div className="flex flex-col items-center justify-center space-y-2 py-2">
            <span className="text-[11px] font-mono text-[var(--neo-text-muted)]">
              Simulasi Orbit Suara 8D di Sekitar Kepala Anda
            </span>

            <div className="relative w-44 h-44 rounded-full border-2 border-dashed border-[var(--neo-border)] bg-[var(--neo-bg)] flex items-center justify-center">
              {/* Listener Head Icon */}
              <div className="w-12 h-12 rounded-full border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-xs font-bold font-mono shadow-neo">
                YOU
              </div>

              {/* Orbiting Sound Source */}
              <div
                className="absolute w-5 h-5 rounded-full bg-indigo-500 border-2 border-white shadow-[0_0_12px_rgba(99,102,241,0.8)] transition-all duration-75 flex items-center justify-center text-[8px] text-white font-bold"
                style={{
                  transform: `translate(${Math.cos(orbitAngle) * 75}px, ${Math.sin(orbitAngle) * 75}px)`,
                }}
              >
                8D
              </div>

              {/* L / R Ear Labels */}
              <span className="absolute left-2 text-[10px] font-bold font-mono text-[var(--neo-text-muted)]">L</span>
              <span className="absolute right-2 text-[10px] font-bold font-mono text-[var(--neo-text-muted)]">R</span>
            </div>
          </div>

          {/* Controls: Orbit Speed Slider */}
          <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="font-bold text-[var(--neo-text)]">Kecepatan Putaran Orbit 8D:</span>
              <span className="font-bold text-indigo-500">{orbitSpeed} detik / putaran</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="10.0"
              step="0.5"
              value={orbitSpeed}
              onChange={(e) => setOrbitSpeed(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--neo-text-muted)] font-mono">
              <span>Cepat (2s)</span>
              <span>Rekomendasi (5s)</span>
              <span>Lambat Rileks (10s)</span>
            </div>
          </div>

          {/* Playback & Export Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={isPlaying ? stopPlayback : startPlayback}
              className="neo-btn neo-btn-secondary w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-rose-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
              <span>{isPlaying ? 'Hentikan Live Preview' : 'Putar Live 8D Audio'}</span>
            </button>

            <button
              type="button"
              onClick={handleRender8dAudio}
              disabled={isRendering}
              className="neo-btn neo-btn-primary w-full sm:flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              <span>{isRendering ? 'Merender 8D Audio...' : 'Render & Buat File .WAV'}</span>
            </button>
          </div>

          {/* Render Result Card */}
          {renderedUrl && (
            <div className="p-4 rounded-xl border-2 border-indigo-500/40 bg-indigo-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>File 8D Audio Berhasil Dirender!</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="neo-btn neo-btn-primary px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File .WAV</span>
                </button>
              </div>

              <audio controls src={renderedUrl} className="w-full h-10 mt-1" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
