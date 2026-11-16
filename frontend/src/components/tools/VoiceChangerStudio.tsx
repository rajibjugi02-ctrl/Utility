'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Upload,
  Download,
  Radio,
  Sparkles,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

type VoicePreset = 'anonymous' | 'robot' | 'chipmunk' | 'walkietalkie' | 'megaphone';

interface PresetConfig {
  id: VoicePreset;
  title: string;
  desc: string;
  color: string;
}

const PRESETS: PresetConfig[] = [
  { id: 'anonymous', title: 'Deep Hacker / Anonymous', desc: 'Suara berat misterius pitch-down dengan filter bass.', color: 'text-indigo-500' },
  { id: 'robot', title: 'Robot Modulator', desc: 'Modulasi sinyal 50Hz layaknya mesin sci-fi.', color: 'text-sky-500' },
  { id: 'chipmunk', title: 'Chipmunk / Cute Pitch', desc: 'Suara melengking cepat bernada tinggi.', color: 'text-pink-500' },
  { id: 'walkietalkie', title: 'Walkie-Talkie Radio', desc: 'Distorsi bandpass radio komunikasi taktis.', color: 'text-amber-500' },
  { id: 'megaphone', title: 'Megaphone Echo', desc: 'Gema pengeras suara publik outdoor.', color: 'text-emerald-500' },
];

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

export const VoiceChangerStudio: React.FC = () => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<VoicePreset>('anonymous');

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Playback & Render
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderedUrl, setRenderedUrl] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addHistoryItem } = useAppStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRenderedUrl(null);
    stopPlayback();

    const arrayBuffer = await file.arrayBuffer();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    setAudioBuffer(decoded);
  };

  // Microphone recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decoded = await ctx.decodeAudioData(arrayBuffer);
        setAudioBuffer(decoded);
        setRenderedUrl(null);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSec(0);

      recordTimerRef.current = setInterval(() => {
        setRecordSec((prev) => prev + 1);
      }, 1000);
    } catch {
      alert('Izin mikrofon tidak diberikan.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  // Live preview playback
  const playPreset = () => {
    if (!audioBuffer) return;
    stopPlayback();

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;

    applyDspGraph(ctx, src, selectedPreset, ctx.destination);
    src.start(0);
    src.onended = () => setIsPlaying(false);
    sourceNodeRef.current = src;
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {}
      sourceNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  // Build Web Audio DSP chain
  const applyDspGraph = (
    ctx: BaseAudioContext,
    src: AudioBufferSourceNode,
    preset: VoicePreset,
    destination: AudioNode
  ) => {
    if (preset === 'anonymous') {
      src.playbackRate.value = 0.78; // Pitch down
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;
      src.connect(filter);
      filter.connect(destination);
    } else if (preset === 'chipmunk') {
      src.playbackRate.value = 1.48; // Pitch up
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 350;
      src.connect(filter);
      filter.connect(destination);
    } else if (preset === 'walkietalkie') {
      // Bandpass 400Hz - 2600Hz
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 2600;

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 450;

      src.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(destination);
    } else if (preset === 'megaphone') {
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 650;

      const delay = ctx.createDelay();
      delay.delayTime.value = 0.18;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.35;

      src.connect(highpass);
      highpass.connect(destination);
      highpass.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(destination);
    } else if (preset === 'robot') {
      // Oscillator amplitude modulation
      const mod = ctx.createOscillator();
      mod.type = 'sine';
      mod.frequency.value = 50;

      const modGain = ctx.createGain();
      modGain.gain.value = 0.7;

      const masterGain = ctx.createGain();

      mod.connect(modGain.gain);
      src.connect(masterGain);
      masterGain.connect(destination);
      mod.start(0);
    } else {
      src.connect(destination);
    }
  };

  // Offline render to WAV
  const handleRenderVoice = async () => {
    if (!audioBuffer) return;
    setIsRendering(true);

    try {
      const rate = selectedPreset === 'anonymous' ? 0.78 : selectedPreset === 'chipmunk' ? 1.48 : 1.0;
      const dur = audioBuffer.duration / rate;
      const sampleRate = audioBuffer.sampleRate;
      const offlineCtx = new OfflineAudioContext(1, Math.floor(dur * sampleRate), sampleRate);

      const src = offlineCtx.createBufferSource();
      src.buffer = audioBuffer;

      applyDspGraph(offlineCtx, src, selectedPreset, offlineCtx.destination);
      src.start(0);

      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = audioBufferToWav(renderedBuffer);
      const url = URL.createObjectURL(wavBlob);
      setRenderedUrl(url);

      addHistoryItem({
        toolId: 'voice-changer-studio',
        toolName: 'Voice Changer Studio',
        title: `Suara ${selectedPreset.toUpperCase()} (${dur.toFixed(1)}s)`,
        type: 'audio',
        downloadUrl: url,
      });
    } catch (err) {
      console.error('Voice DSP render failed:', err);
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownload = () => {
    if (!renderedUrl) return;
    const a = document.createElement('a');
    a.href = renderedUrl;
    a.download = `Voice_${selectedPreset}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Top Input Bar: Mic Record or File Upload */}
      <div className="neo-card p-5 rounded-2xl bg-[var(--neo-surface)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="neo-btn neo-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>Mulai Rekam Suara Mikrofon</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="neo-btn px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white flex items-center gap-2 animate-pulse"
              >
                <Square className="w-4 h-4" />
                <span>Hentikan Rekam ({recordSec}s)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="neo-btn neo-btn-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Audio (MP3/WAV)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {audioBuffer && (
            <span className="text-xs font-mono font-bold text-emerald-500">
              Audio Siap ({audioBuffer.duration.toFixed(1)}s)
            </span>
          )}
        </div>
      </div>

      {/* Preset Selector */}
      {audioBuffer && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--neo-text)]">
              Pilih Efek Pengubah Suara:
            </h3>
            <p className="text-xs text-[var(--neo-text-muted)]">
              Efek Web Audio DSP nyata mengubah formant, pitch, dan frekuensi gelombang suara.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRESETS.map((p) => {
              const isActive = selectedPreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(p.id);
                    stopPlayback();
                  }}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                    isActive
                      ? 'border-[var(--neo-border-active)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)] font-bold shadow-neo'
                      : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)]'
                  }`}
                >
                  <span className={`text-xs font-bold block ${p.color}`}>{p.title}</span>
                  <span className="text-[11px] opacity-80 mt-0.5 block leading-tight">{p.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={isPlaying ? stopPlayback : playPreset}
              className="neo-btn neo-btn-secondary w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-rose-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
              <span>{isPlaying ? 'Stop Preview' : `Dengarkan (${selectedPreset.toUpperCase()})`}</span>
            </button>

            <button
              type="button"
              onClick={handleRenderVoice}
              disabled={isRendering}
              className="neo-btn neo-btn-primary w-full sm:flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRendering ? 'Memproses DSP...' : 'Render & Buat File Audio (.WAV)'}</span>
            </button>
          </div>

          {/* Render Result Card */}
          {renderedUrl && (
            <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Suara Berhasil Diubah! ({selectedPreset})</span>
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

              <audio controls src={renderedUrl} className="w-full h-10 mt-1" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
