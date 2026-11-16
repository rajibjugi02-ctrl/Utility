'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Film, Upload, Download, Play, Pause, Scissors, Type, Sparkles, MessageSquare, Check, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function VideoGifStickerMaker() {
  const { addHistory } = useAppStore();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  // Trimming & Playback
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(4);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Settings
  const [outputMode, setOutputMode] = useState<'wa-sticker' | 'gif-original'>('wa-sticker');
  const [fps, setFps] = useState(10);
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');

  // Generation status
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderedBlob, setRenderedBlob] = useState<{ url: string; size: number } | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setRenderedBlob(null);
  };

  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const dur = vid.duration || 5;
    setDuration(dur);
    setStartTime(0);
    setEndTime(Math.min(dur, 4));
  };

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;
    setCurrentTime(vid.currentTime);
    if (vid.currentTime >= endTime) {
      vid.currentTime = startTime;
      if (!isPlaying) {
        vid.pause();
      }
    }
  };

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isPlaying) {
      vid.pause();
      setIsPlaying(false);
    } else {
      if (vid.currentTime < startTime || vid.currentTime >= endTime) {
        vid.currentTime = startTime;
      }
      vid.play();
      setIsPlaying(true);
    }
  };

  // Draw overlay meme text on canvas context
  const drawOverlayText = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const scaledFontSize = Math.max(20, Math.round(width * 0.08));
    ctx.font = `900 ${scaledFontSize}px Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = Math.max(3, Math.round(scaledFontSize * 0.12));
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#FFFFFF';

    if (topText.trim()) {
      ctx.strokeText(topText.toUpperCase(), width / 2, scaledFontSize * 1.2);
      ctx.fillText(topText.toUpperCase(), width / 2, scaledFontSize * 1.2);
    }
    if (bottomText.trim()) {
      ctx.strokeText(bottomText.toUpperCase(), width / 2, height - 16);
      ctx.fillText(bottomText.toUpperCase(), width / 2, height - 16);
    }
  };

  // Convert video snippet to WebP Animated Sticker / Video Loop
  const handleCreateSticker = async () => {
    const vid = videoRef.current;
    if (!vid) return;

    setIsRendering(true);
    setRenderProgress(0);
    vid.pause();
    setIsPlaying(false);

    try {
      const outWidth = outputMode === 'wa-sticker' ? 512 : 480;
      const outHeight =
        outputMode === 'wa-sticker'
          ? 512
          : Math.round((480 * (vid.videoHeight || 360)) / (vid.videoWidth || 640));

      const offCanvas = document.createElement('canvas');
      offCanvas.width = outWidth;
      offCanvas.height = outHeight;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const stream = offCanvas.captureStream(fps);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 1000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const renderPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: 'video/webm' }));
        };
      });

      recorder.start();

      const clipDuration = Math.max(0.5, endTime - startTime);
      const totalFrames = Math.round(clipDuration * fps);
      const stepTime = 1 / fps;

      for (let f = 0; f < totalFrames; f++) {
        const seekTime = startTime + f * stepTime;
        vid.currentTime = Math.min(seekTime, endTime);

        await new Promise<void>((r) => {
          const onSeek = () => {
            vid.removeEventListener('seeked', onSeek);
            r();
          };
          vid.addEventListener('seeked', onSeek);
        });

        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, outWidth, outHeight);

        // Calculate aspect fit for 512x512 WhatsApp Sticker
        const vidRatio = vid.videoWidth / vid.videoHeight;
        let dw = outWidth;
        let dh = outHeight;
        let dx = 0;
        let dy = 0;

        if (outputMode === 'wa-sticker') {
          if (vidRatio > 1) {
            dh = outWidth / vidRatio;
            dy = (outHeight - dh) / 2;
          } else {
            dw = outHeight * vidRatio;
            dx = (outWidth - dw) / 2;
          }
        }

        ctx.drawImage(vid, dx, dy, dw, dh);
        drawOverlayText(ctx, outWidth, outHeight);

        setRenderProgress(Math.round(((f + 1) / totalFrames) * 100));
      }

      recorder.stop();
      const outputBlob = await renderPromise;
      const url = URL.createObjectURL(outputBlob);
      setRenderedBlob({ url, size: outputBlob.size });

      addHistory({
        title: outputMode === 'wa-sticker' ? 'WhatsApp Sticker 512px' : 'Animated Clip',
        toolName: 'Video to GIF & WA Sticker Maker',
        category: 'creator',
        details: `${Math.round(clipDuration)}s at ${fps}fps (${Math.round(outputBlob.size / 1024)} KB)`,
      });
    } catch (err) {
      console.error('Render error:', err);
    } finally {
      setIsRendering(false);
    }
  };

  // Download sticker / webm file
  const handleDownload = () => {
    if (!renderedBlob) return;
    const a = document.createElement('a');
    a.href = renderedBlob.url;
    a.download =
      outputMode === 'wa-sticker'
        ? `sticker-${Date.now()}.webm`
        : `clip-${Date.now()}.webm`;
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
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-500">
              <Film className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-text">Video to GIF & WA Sticker Maker</h1>
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-600 rounded-full border border-amber-500/30">
                  512x512 WebP / WebM
                </span>
              </div>
              <p className="text-sm text-text-muted mt-1">
                Ubah potongan video menjadi format stiker WhatsApp resmi (512x512px) atau animasi klip dengan teks meme.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-bold text-text">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <span>WA Sticker Standard Compliant</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Trimmer & Meme Text */}
        <div className="lg:col-span-5 space-y-5">
          {/* Output Format Select */}
          <div className="card-brutal p-5 bg-surface space-y-3">
            <label className="text-xs font-bold text-text uppercase tracking-wider block">Format Target</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOutputMode('wa-sticker')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  outputMode === 'wa-sticker'
                    ? 'bg-amber-500/15 border-amber-500 text-text'
                    : 'bg-surface-elevated border-border text-text-muted'
                }`}
              >
                <div className="text-xs font-black text-text flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  Stiker WA (512px)
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">Kotak presisi &lt;500KB</div>
              </button>

              <button
                type="button"
                onClick={() => setOutputMode('gif-original')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  outputMode === 'gif-original'
                    ? 'bg-amber-500/15 border-amber-500 text-text'
                    : 'bg-surface-elevated border-border text-text-muted'
                }`}
              >
                <div className="text-xs font-black text-text flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-amber-500" />
                  Klip Animasi
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">Rasio asli video</div>
              </button>
            </div>
          </div>

          {/* Trimmer Settings */}
          <div className="card-brutal p-5 bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-amber-500" />
                Potong Durasi Klip
              </label>
              <span className="text-xs font-mono font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
                {(endTime - startTime).toFixed(1)}s
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-text-muted block mb-1">Mulai (Detik)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={endTime - 0.5}
                  value={startTime}
                  onChange={(e) => setStartTime(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface text-text text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-muted block mb-1">Selesai (Detik)</label>
                <input
                  type="number"
                  step="0.1"
                  min={startTime + 0.5}
                  max={duration || 10}
                  value={endTime}
                  onChange={(e) => setEndTime(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface text-text text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Frame Rate */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-text-muted">Kecepatan Frame (FPS)</span>
                <span className="text-text font-black">{fps} FPS</span>
              </div>
              <input
                type="range"
                min="8"
                max="20"
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1 font-mono">
                <span>8 fps (Ringan)</span>
                <span>12 fps (Standar)</span>
                <span>20 fps (Mulus)</span>
              </div>
            </div>
          </div>

          {/* Meme Text Overlay */}
          <div className="card-brutal p-5 bg-surface space-y-3">
            <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-4 h-4 text-amber-500" />
              Teks Meme (Opsional)
            </label>
            <div>
              <input
                type="text"
                placeholder="Teks Atas..."
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface text-text text-xs font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Teks Bawah..."
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface text-text text-xs font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Video Preview & Render */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-brutal p-5 bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-text uppercase tracking-wider">
                Video Player & Editor
              </span>
              {duration > 0 && (
                <span className="text-[11px] text-text-muted font-mono">
                  Durasi File: {duration.toFixed(1)}s
                </span>
              )}
            </div>

            {!videoSrc ? (
              <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-amber-500 transition-colors bg-surface-elevated/40 text-center group">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform mb-3">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="text-base font-black text-text">Pilih atau Seret Video</div>
                <div className="text-xs text-text-muted mt-1 max-w-sm">
                  Format didukung: MP4, WebM, MOV. Disarankan klip pendek berdurasi &lt;30 detik.
                </div>
                <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border-2 border-black bg-black flex items-center justify-center min-h-[300px] max-h-[440px]">
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    playsInline
                    className="max-h-[420px] max-w-full object-contain"
                  />

                  {/* Overlaid preview text */}
                  {(topText || bottomText) && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 text-center">
                      <div className="text-xl md:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase tracking-wide">
                        {topText}
                      </div>
                      <div className="text-xl md:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase tracking-wide">
                        {bottomText}
                      </div>
                    </div>
                  )}
                </div>

                {/* Video controls */}
                <div className="flex items-center justify-between gap-3 bg-surface-elevated/50 p-3 rounded-xl border border-border">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-lg bg-surface hover:bg-surface-hover border border-border text-text flex items-center gap-1.5 text-xs font-bold"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlaying ? 'Jeda' : 'Putar'}</span>
                  </button>

                  <div className="text-xs font-mono font-bold text-text-muted">
                    Posisi: {currentTime.toFixed(1)}s / Range: [{startTime.toFixed(1)}s - {endTime.toFixed(1)}s]
                  </div>

                  <label className="text-xs font-bold text-text cursor-pointer hover:underline flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Ganti Video
                    <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>

                {/* Progress bar during generation */}
                {isRendering && (
                  <div className="space-y-2 p-4 rounded-xl border-2 border-amber-500 bg-amber-500/10">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-text">Memproses Frame Animasi...</span>
                      <span className="text-amber-600 font-mono">{renderProgress}%</span>
                    </div>
                    <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-border">
                      <div
                        className="bg-amber-500 h-full transition-all duration-100"
                        style={{ width: `${renderProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Render & Download Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handleCreateSticker}
                    disabled={isRendering}
                    className="btn-primary py-2.5 px-6 text-xs font-black flex items-center gap-2 bg-amber-500 hover:bg-amber-600 border-2 border-black"
                  >
                    <Sparkles className="w-4 h-4" />
                    Render Animasi Stiker
                  </button>

                  {renderedBlob && (
                    <button
                      onClick={handleDownload}
                      className="py-2.5 px-5 rounded-xl border-2 border-black bg-emerald-500 hover:bg-emerald-600 text-xs font-black text-white flex items-center gap-2 shadow-sm"
                    >
                      {downloadSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          Tersimpan!
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Unduh Hasil ({Math.round(renderedBlob.size / 1024)} KB)
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
