'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Download, Volume2, Sliders, RefreshCw, CheckCircle2, Music } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

// Synthesize an impulse response buffer for the ConvolverNode
function createReverbImpulse(ctx: BaseAudioContext, duration: number = 2.5, decay: number = 2.0): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = i / length;
    const mult = Math.pow(1 - n, decay);
    left[i] = (Math.random() * 2 - 1) * mult;
    right[i] = (Math.random() * 2 - 1) * mult;
  }
  return impulse;
}

// Convert AudioBuffer to standard 16-bit PCM WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  writeString('RIFF');
  out.setUint32(pos, length - 8, true); pos += 4;
  writeString('WAVE');
  writeString('fmt ');
  out.setUint32(pos, 16, true); pos += 4; // SubChunk1Size (16 for PCM)
  out.setUint16(pos, 1, true); pos += 2; // AudioFormat (1 for PCM)
  out.setUint16(pos, numOfChan, true); pos += 2;
  out.setUint32(pos, buffer.sampleRate, true); pos += 4;
  out.setUint32(pos, buffer.sampleRate * 2 * numOfChan, true); pos += 4; // byte rate
  out.setUint16(pos, numOfChan * 2, true); pos += 2; // block align
  out.setUint16(pos, 16, true); pos += 2; // bits per sample
  writeString('data');
  out.setUint32(pos, length - pos - 4, true); pos += 4;

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

export const AudioSlowedReverb: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  // Sliders
  const [speed, setSpeed] = useState<number>(0.85); // 0.5x to 1.5x
  const [reverbMix, setReverbMix] = useState<number>(45); // 0 to 100%
  const [bassBoost, setBassBoost] = useState<number>(6); // 0 to 15 dB

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const dryGainRef = useRef<GainNode | null>(null);
  const wetGainRef = useRef<GainNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addHistoryItem } = useAppStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setFile(uploaded);
    setRenderedBlobUrl(null);
    stopPlayback();

    const arrayBuffer = await uploaded.arrayBuffer();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    const decoded = await ctx.decodeAudioData(arrayBuffer);
    setAudioBuffer(decoded);
  };

  const startPlayback = () => {
    if (!audioBuffer) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    stopPlayback();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = speed;
    source.loop = true;

    // Bass Filter
    const bass = ctx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 120;
    bass.gain.value = bassBoost;

    // Reverb node
    const convolver = ctx.createConvolver();
    convolver.buffer = createReverbImpulse(ctx, 2.5, 2.0);

    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    dryGain.gain.value = 1 - reverbMix / 100;
    wetGain.gain.value = reverbMix / 100;

    source.connect(bass);
    bass.connect(dryGain);
    bass.connect(convolver);
    convolver.connect(wetGain);

    dryGain.connect(ctx.destination);
    wetGain.connect(ctx.destination);

    sourceNodeRef.current = source;
    bassFilterRef.current = bass;
    dryGainRef.current = dryGain;
    wetGainRef.current = wetGain;

    source.start(0);
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  // Adjust parameters on the fly
  useEffect(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = speed;
    }
  }, [speed]);

  useEffect(() => {
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.value = bassBoost;
    }
  }, [bassBoost]);

  useEffect(() => {
    if (dryGainRef.current && wetGainRef.current) {
      dryGainRef.current.gain.value = 1 - reverbMix / 100;
      wetGainRef.current.gain.value = reverbMix / 100;
    }
  }, [reverbMix]);

  // Offline render full audio to WAV
  const handleRenderWav = async () => {
    if (!audioBuffer) return;
    stopPlayback();
    setIsRendering(true);
    setRenderProgress(20);

    const duration = audioBuffer.duration / speed;
    const sampleRate = audioBuffer.sampleRate;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = speed;

    const bass = offlineCtx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 120;
    bass.gain.value = bassBoost;

    const convolver = offlineCtx.createConvolver();
    convolver.buffer = createReverbImpulse(offlineCtx, 2.5, 2.0);

    const dryGain = offlineCtx.createGain();
    const wetGain = offlineCtx.createGain();
    dryGain.gain.value = 1 - reverbMix / 100;
    wetGain.gain.value = reverbMix / 100;

    source.connect(bass);
    bass.connect(dryGain);
    bass.connect(convolver);
    convolver.connect(wetGain);

    dryGain.connect(offlineCtx.destination);
    wetGain.connect(offlineCtx.destination);

    source.start(0);

    setRenderProgress(60);
    const rendered = await offlineCtx.startRendering();
    setRenderProgress(90);

    const wavBlob = audioBufferToWav(rendered);
    const blobUrl = URL.createObjectURL(wavBlob);

    setRenderedBlobUrl(blobUrl);
    setRenderProgress(100);
    setIsRendering(false);

    addHistoryItem({
      type: 'audio',
      title: `${file?.name.replace(/\.[^/.]+$/, '')} (Slowed + Reverb).wav`,
      subtitle: `Tempo ${speed}x · Reverb ${reverbMix}% · Bass +${bassBoost}dB`,
      downloadUrl: blobUrl,
    });
  };

  return (
    <div className="space-y-5">
      {/* Upload Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 sm:p-8 text-center cursor-pointer hover:border-[var(--neo-border-active)] bg-[var(--neo-bg)] transition-colors select-none"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--neo-accent)] text-[var(--neo-accent-text)] flex items-center justify-center mb-3">
          <Upload className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-sm text-[var(--neo-text)]">
          {file ? file.name : 'Pilih atau Tarik File Lagu (MP3 / WAV) ke Sini'}
        </h4>
        <p className="text-xs text-[var(--neo-text-muted)] mt-1 font-mono">
          {file ? 'File audio siap diolah dengan Web Audio DSP' : 'Mendukung format MP3, WAV, AAC, M4A'}
        </p>
      </div>

      {/* DSP Effect Controls */}
      {audioBuffer && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--neo-border)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--neo-text)] flex items-center gap-2">
              <Sliders className="w-4 h-4" /> Pengaturan Efek Slowed & Reverb
            </span>

            {/* Live Play / Stop Button */}
            <button
              type="button"
              onClick={isPlaying ? stopPlayback : startPlayback}
              className={`neo-btn px-4 py-2 rounded-xl text-xs font-bold ${
                isPlaying ? 'bg-rose-500 text-white border-rose-600' : 'neo-btn-primary'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Hentikan Preview' : 'Dengar Preview'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Speed / Tempo */}
            <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--neo-text)]">
                <span>Kecepatan / Tempo:</span>
                <span className="font-mono text-xs">{speed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-[var(--neo-accent)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--neo-text-muted)] font-mono">
                <span>0.5x Slow</span>
                <span>1.0x Normal</span>
                <span>1.5x Nightcore</span>
              </div>
            </div>

            {/* Reverb Wet/Dry */}
            <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--neo-text)]">
                <span>Reverb Space:</span>
                <span className="font-mono text-xs">{reverbMix}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={reverbMix}
                onChange={(e) => setReverbMix(parseInt(e.target.value))}
                className="w-full accent-[var(--neo-accent)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--neo-text-muted)] font-mono">
                <span>0% Dry</span>
                <span>Room</span>
                <span>100% Cathedral</span>
              </div>
            </div>

            {/* Bass Boost */}
            <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--neo-text)]">
                <span>Bass Boost:</span>
                <span className="font-mono text-xs">+{bassBoost} dB</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={bassBoost}
                onChange={(e) => setBassBoost(parseInt(e.target.value))}
                className="w-full accent-[var(--neo-accent)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--neo-text-muted)] font-mono">
                <span>Flat (0 dB)</span>
                <span>Warm</span>
                <span>Extreme (+15 dB)</span>
              </div>
            </div>
          </div>

          {/* Render Action */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleRenderWav}
              disabled={isRendering}
              className="neo-btn neo-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold"
            >
              <RefreshCw className={`w-4 h-4 ${isRendering ? 'animate-spin' : ''}`} />
              <span>{isRendering ? 'Sedang Merender Audio...' : 'Render & Buat File Audio (.WAV)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Animated Process Card while rendering */}
      {(isRendering || (renderProgress > 0 && renderProgress < 100)) && (
        <ProcessCard
          stage="Merender audio buffer dengan Web Audio DSP..."
          progress={renderProgress}
          speed="32.0 MB/s"
          eta="00:01"
          isCompleted={renderProgress === 100}
        />
      )}

      {/* Rendered Result Preview Card */}
      {renderedBlobUrl && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--neo-border)]">
            <span className="neo-badge bg-emerald-500/10 text-emerald-500 border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" /> Audio Slowed + Reverb Siap
            </span>
            <span className="text-xs font-mono font-bold text-[var(--neo-text)]">
              Tempo: {speed.toFixed(2)}x · Reverb: {reverbMix}%
            </span>
          </div>

          <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
            <span className="text-xs font-bold text-[var(--neo-text)] block">
              Dengarkan Hasil Render:
            </span>
            <audio src={renderedBlobUrl} controls className="w-full h-10 accent-[var(--neo-accent)]" />
          </div>

          <div className="flex justify-end pt-2">
            <a
              href={renderedBlobUrl}
              download={`${file?.name.replace(/\.[^/.]+$/, '') || 'audio'}_slowed_reverb.wav`}
              className="neo-btn neo-btn-primary px-6 py-3 rounded-xl text-xs font-bold w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              <span>Download File Audio (.WAV)</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
