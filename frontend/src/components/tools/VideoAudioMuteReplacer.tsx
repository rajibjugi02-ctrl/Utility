'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  VolumeX,
  Volume2,
  Upload,
  Download,
  Play,
  Pause,
  Music,
  Sliders,
  Sparkles,
  Check,
  RefreshCw,
  Film,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function VideoAudioMuteReplacer() {
  const { addHistory } = useAppStore();

  // Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);

  // Audio State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  // Mixer Volumes (0 to 100)
  const [originalVolume, setOriginalVolume] = useState(0); // 0 = 100% muted
  const [bgmVolume, setBgmVolume] = useState(80);
  const [loopBgm, setLoopBgm] = useState(true);

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Processing & Export
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load video
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setExportedUrl(null);
  };

  // Load BGM audio
  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioSrc(url);
    setExportedUrl(null);
  };

  // Synchronized playback controls
  const togglePlay = () => {
    const vid = videoRef.current;
    const aud = audioRef.current;
    if (!vid) return;

    if (isPlaying) {
      vid.pause();
      if (aud) aud.pause();
      setIsPlaying(false);
    } else {
      vid.play();
      if (aud && audioSrc) {
        aud.currentTime = vid.currentTime;
        aud.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  };

  // Update volumes on DOM elements
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = originalVolume / 100;
    }
  }, [originalVolume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = bgmVolume / 100;
      audioRef.current.loop = loopBgm;
    }
  }, [bgmVolume, loopBgm]);

  // Synchronize audio on seek
  const handleSeek = (newTime: number) => {
    const vid = videoRef.current;
    const aud = audioRef.current;
    if (vid) {
      vid.currentTime = newTime;
      setCurrentTime(newTime);
    }
    if (aud) {
      aud.currentTime = newTime;
    }
  };

  // Mix and export video with new audio tracks
  const handleExport = async () => {
    const vid = videoRef.current;
    if (!vid) return;

    setIsExporting(true);
    setExportProgress(0);
    vid.pause();
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const dest = audioCtx.createMediaStreamDestination();

      // Original video audio track
      if (originalVolume > 0) {
        const vidSource = audioCtx.createMediaElementSource(vid);
        const vidGain = audioCtx.createGain();
        vidGain.gain.value = originalVolume / 100;
        vidSource.connect(vidGain);
        vidGain.connect(dest);
      }

      // Replacement BGM audio track
      if (audioRef.current && audioSrc && bgmVolume > 0) {
        const bgmSource = audioCtx.createMediaElementSource(audioRef.current);
        const bgmGain = audioCtx.createGain();
        bgmGain.gain.value = bgmVolume / 100;
        bgmSource.connect(bgmGain);
        bgmGain.connect(dest);
      }

      // Video canvas capture stream
      const w = vid.videoWidth || 640;
      const h = vid.videoHeight || 360;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2D canvas context');

      const videoStream = canvas.captureStream(30);

      // Combine video stream with audio destination stream
      const combinedStream = new MediaStream();
      videoStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
      dest.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const exportPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: 'video/webm' }));
        };
      });

      // Start recording and playback simultaneously
      recorder.start();
      vid.currentTime = 0;
      if (audioRef.current) audioRef.current.currentTime = 0;

      await vid.play();
      if (audioRef.current && audioSrc) {
        audioRef.current.play().catch(() => {});
      }

      // Draw frames loop
      let animId = 0;
      const drawFrame = () => {
        ctx.drawImage(vid, 0, 0, w, h);
        const currentProgress = Math.min(100, Math.round((vid.currentTime / (vid.duration || 1)) * 100));
        setExportProgress(currentProgress);

        if (!vid.paused && !vid.ended) {
          animId = requestAnimationFrame(drawFrame);
        }
      };
      drawFrame();

      // Wait until video ends
      await new Promise<void>((resolve) => {
        const onEnded = () => {
          vid.removeEventListener('ended', onEnded);
          resolve();
        };
        vid.addEventListener('ended', onEnded);
      });

      if (animId) {
        cancelAnimationFrame(animId);
      }
      recorder.stop();
      if (audioRef.current) audioRef.current.pause();

      const finalBlob = await exportPromise;
      const downloadUrl = URL.createObjectURL(finalBlob);
      setExportedUrl(downloadUrl);

      addHistory({
        title: originalVolume === 0 ? 'Muted Video' : 'Video BGM Mixed',
        toolName: 'Video Audio Mute & BGM Replacer',
        category: 'creator',
        details: `${Math.round(vid.duration)}s video (${Math.round(finalBlob.size / 1024)} KB)`,
      });
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportedUrl) return;
    const a = document.createElement('a');
    a.href = exportedUrl;
    a.download = `video-bgm-mixed-${Date.now()}.webm`;
    a.click();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="card-brutal p-6 bg-surface">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center text-rose-500">
              <VolumeX className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-text">Video Audio Mute & BGM Replacer</h1>
                <span className="px-2 py-0.5 text-xs font-bold bg-rose-500/20 text-rose-600 rounded-full border border-rose-500/30">
                  Audio Replacer
                </span>
              </div>
              <p className="text-sm text-text-muted mt-1">
                Hapus suara asli video (1-klik bisukan total) atau campur dan ganti dengan track musik latar (BGM) pilihan Anda.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-bold text-text">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>Mixer Multi-Track Canvas DSP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Audio Source & Volume Mixer */}
        <div className="lg:col-span-5 space-y-5">
          {/* Quick Mute Preset */}
          <div className="card-brutal p-5 bg-surface space-y-3">
            <label className="text-xs font-bold text-text uppercase tracking-wider block">Mode Suara</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setOriginalVolume(0);
                  setBgmVolume(0);
                }}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  originalVolume === 0 && !audioSrc
                    ? 'bg-rose-500/15 border-rose-500 text-text'
                    : 'bg-surface-elevated border-border text-text-muted'
                }`}
              >
                <div className="text-xs font-black text-text flex items-center gap-1.5">
                  <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                  Mute Total (Hening)
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">Hapus audio asli 1-klik</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOriginalVolume(0);
                  setBgmVolume(80);
                }}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  originalVolume === 0 && bgmVolume > 0
                    ? 'bg-rose-500/15 border-rose-500 text-text'
                    : 'bg-surface-elevated border-border text-text-muted'
                }`}
              >
                <div className="text-xs font-black text-text flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-purple-500" />
                  Ganti Musik Baru
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">BGM baru tanpa suara asli</div>
              </button>
            </div>
          </div>

          {/* BGM Audio File Upload */}
          <div className="card-brutal p-5 bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-4 h-4 text-purple-500" />
                Musik Latar / BGM (MP3/WAV)
              </label>
              {audioFile && (
                <span className="text-[10px] text-purple-600 font-bold bg-purple-500/10 px-2 py-0.5 rounded truncate max-w-[120px]">
                  {audioFile.name}
                </span>
              )}
            </div>

            <label className="flex items-center justify-center p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-purple-500 transition-colors bg-surface-elevated/40 text-center">
              <div className="flex items-center gap-2 text-xs font-bold text-text">
                <Upload className="w-4 h-4 text-purple-500" />
                <span>{audioFile ? 'Ganti File Lagu / BGM' : 'Pilih File Lagu / BGM'}</span>
              </div>
              <input type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" />
            </label>

            {audioSrc && (
              <audio ref={audioRef} src={audioSrc} className="hidden" preload="auto" />
            )}
          </div>

          {/* Volume Mix Sliders */}
          <div className="card-brutal p-5 bg-surface space-y-4">
            <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-rose-500" />
              Mixer Volume Audio
            </label>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-text-muted">Volume Suara Asli Video</span>
                  <span className="text-text font-black">{originalVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={originalVolume}
                  onChange={(e) => setOriginalVolume(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-text-muted">Volume Musik Latar Baru (BGM)</span>
                  <span className="text-text font-black">{bgmVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={!audioSrc}
                  value={bgmVolume}
                  onChange={(e) => setBgmVolume(Number(e.target.value))}
                  className="w-full accent-purple-500 disabled:opacity-40"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs font-bold text-text cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={loopBgm}
                  onChange={(e) => setLoopBgm(e.target.checked)}
                  disabled={!audioSrc}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-border"
                />
                Ulangi Musik (Loop BGM jika video lebih panjang)
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Video Preview & Export */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-brutal p-5 bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-text uppercase tracking-wider">
                Video Player & Live Mixer
              </span>
              {videoDuration > 0 && (
                <span className="text-[11px] text-text-muted font-mono">
                  Durasi: {videoDuration.toFixed(1)}s
                </span>
              )}
            </div>

            {!videoSrc ? (
              <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-rose-500 transition-colors bg-surface-elevated/40 text-center group">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform mb-3">
                  <Film className="w-8 h-8" />
                </div>
                <div className="text-base font-black text-text">Pilih atau Seret Video</div>
                <div className="text-xs text-text-muted mt-1 max-w-sm">
                  Format didukung: MP4, WebM, MOV.
                </div>
                <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border-2 border-black bg-black flex items-center justify-center min-h-[300px] max-h-[440px]">
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    onLoadedMetadata={() => {
                      if (videoRef.current) setVideoDuration(videoRef.current.duration);
                    }}
                    onTimeUpdate={() => {
                      if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                    }}
                    playsInline
                    className="max-h-[420px] max-w-full object-contain"
                  />
                </div>

                {/* Player Toolbar */}
                <div className="flex items-center justify-between gap-3 bg-surface-elevated/50 p-3 rounded-xl border border-border">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-lg bg-surface hover:bg-surface-hover border border-border text-text flex items-center gap-1.5 text-xs font-bold"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlaying ? 'Jeda' : 'Putar Mix'}</span>
                  </button>

                  <div className="flex-1 mx-3">
                    <input
                      type="range"
                      min="0"
                      max={videoDuration || 100}
                      step="0.1"
                      value={currentTime}
                      onChange={(e) => handleSeek(Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>

                  <label className="text-xs font-bold text-text cursor-pointer hover:underline flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Ganti Video
                    <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
                  </label>
                </div>

                {/* Progress bar during export */}
                {isExporting && (
                  <div className="space-y-2 p-4 rounded-xl border-2 border-rose-500 bg-rose-500/10">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-text">Memproses Audio & Encoding Video...</span>
                      <span className="text-rose-600 font-mono">{exportProgress}%</span>
                    </div>
                    <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-border">
                      <div
                        className="bg-rose-500 h-full transition-all duration-100"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="btn-primary py-2.5 px-6 text-xs font-black flex items-center gap-2 bg-rose-500 hover:bg-rose-600 border-2 border-black"
                  >
                    <Sparkles className="w-4 h-4" />
                    Ekspor Video Baru
                  </button>

                  {exportedUrl && (
                    <button
                      onClick={handleDownload}
                      className="py-2.5 px-5 rounded-xl border-2 border-black bg-emerald-500 hover:bg-emerald-600 text-xs font-black text-white flex items-center gap-2 shadow-sm"
                    >
                      {downloadSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          Tersimpan di Download!
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Unduh Video Hasil Mix (.webm)
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
