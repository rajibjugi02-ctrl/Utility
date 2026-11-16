'use client';

import React, { useState, useRef } from 'react';
import { Upload, Play, Pause, Camera, Download, Eye, CheckCircle2, Heart, MessageCircle, Bookmark, Share2, Music, Disc3, ThumbsUp, ThumbsDown, Repeat } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

type PlatformOverlay = 'tiktok' | 'reels' | 'shorts' | 'grid' | 'none';

export const SafeZonePreviewer: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [platform, setPlatform] = useState<PlatformOverlay>('tiktok');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.85);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [capturedFrameUrl, setCapturedFrameUrl] = useState<string | null>(null);
  const [frameDimensions, setFrameDimensions] = useState<{ w: number; h: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addHistoryItem } = useAppStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setCapturedFrameUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Full native-resolution frame capture using HTML5 Canvas
  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setCapturedFrameUrl(dataUrl);
    setFrameDimensions({ w: video.videoWidth, h: video.videoHeight });

    addHistoryItem({
      toolId: 'safe-zone-previewer',
      toolName: 'Safe Zone Previewer Frame HD',
      title: `Frame ${videoFile?.name || 'Video'} (${video.videoWidth}x${video.videoHeight})`,
      type: 'image',
      downloadUrl: dataUrl,
    });
  };

  const handleDownloadFrame = () => {
    if (!capturedFrameUrl) return;
    const a = document.createElement('a');
    a.href = capturedFrameUrl;
    a.download = `Frame_HD_${Math.round(currentTime)}s_${frameDimensions?.w || 1080}x${frameDimensions?.h || 1920}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 text-center hover:border-[var(--neo-border-active)] transition-colors cursor-pointer bg-[var(--neo-bg)] space-y-2"
      >
        <div className="w-12 h-12 mx-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-sky-500 shadow-neo">
          <Eye className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--neo-text)]">
            {videoFile ? videoFile.name : 'Pilih atau Tarik File Video (MP4 / WebM / MOV)'}
          </p>
          <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
            Cek apakah teks atau wajah tertutup tombol UI TikTok, Reels, atau Shorts
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {videoUrl && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          {/* Controls Header: Select Overlay & Opacity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-[var(--neo-border)]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-[var(--neo-text)] mr-1">Platform UI:</span>
              <button
                type="button"
                onClick={() => setPlatform('tiktok')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                  platform === 'tiktok'
                    ? 'bg-[var(--neo-accent)] text-[var(--neo-accent-text)] border-[var(--neo-border)]'
                    : 'bg-[var(--neo-bg)] text-[var(--neo-text-muted)] border-[var(--neo-border)] hover:text-[var(--neo-text)]'
                }`}
              >
                TikTok
              </button>
              <button
                type="button"
                onClick={() => setPlatform('reels')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                  platform === 'reels'
                    ? 'bg-[var(--neo-accent)] text-[var(--neo-accent-text)] border-[var(--neo-border)]'
                    : 'bg-[var(--neo-bg)] text-[var(--neo-text-muted)] border-[var(--neo-border)] hover:text-[var(--neo-text)]'
                }`}
              >
                Instagram Reels
              </button>
              <button
                type="button"
                onClick={() => setPlatform('shorts')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                  platform === 'shorts'
                    ? 'bg-[var(--neo-accent)] text-[var(--neo-accent-text)] border-[var(--neo-border)]'
                    : 'bg-[var(--neo-bg)] text-[var(--neo-text-muted)] border-[var(--neo-border)] hover:text-[var(--neo-text)]'
                }`}
              >
                YT Shorts
              </button>
              <button
                type="button"
                onClick={() => setPlatform('grid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                  platform === 'grid'
                    ? 'bg-[var(--neo-accent)] text-[var(--neo-accent-text)] border-[var(--neo-border)]'
                    : 'bg-[var(--neo-bg)] text-[var(--neo-text-muted)] border-[var(--neo-border)] hover:text-[var(--neo-text)]'
                }`}
              >
                Safe Grid
              </button>
            </div>

            {/* Opacity slider */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[var(--neo-text-muted)]">Opacity:</span>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-20 accent-[var(--neo-text)] cursor-pointer"
              />
              <span className="font-bold text-[var(--neo-text)]">{Math.round(overlayOpacity * 100)}%</span>
            </div>
          </div>

          {/* Interactive Safe Zone Phone Mockup Canvas */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-3xl border-4 border-[var(--neo-border)] overflow-hidden bg-black shadow-neo select-none">
              {/* Video Player */}
              <video
                ref={videoRef}
                src={videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                playsInline
                className="w-full h-full object-cover"
              />

              {/* OVERLAY: TIKTOK */}
              {platform === 'tiktok' && (
                <div
                  className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3.5 font-sans"
                  style={{ opacity: overlayOpacity }}
                >
                  {/* Top Bar */}
                  <div className="pt-2 flex items-center justify-center gap-4 text-white text-xs font-bold drop-shadow-md">
                    <span className="opacity-70">Mengikuti</span>
                    <span className="border-b-2 border-white pb-0.5">Untuk Anda</span>
                  </div>

                  {/* Right Action Rail */}
                  <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 text-white drop-shadow-md">
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-neutral-800 flex items-center justify-center relative">
                      <div className="w-7 h-7 rounded-full bg-rose-500" />
                      <div className="absolute -bottom-1.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">
                        +
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <Heart className="w-7 h-7 fill-white/20 stroke-white" />
                      <span className="text-[10px] font-bold mt-0.5">142K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <MessageCircle className="w-7 h-7 fill-white/20 stroke-white" />
                      <span className="text-[10px] font-bold mt-0.5">1.2K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Bookmark className="w-7 h-7 fill-white/20 stroke-white" />
                      <span className="text-[10px] font-bold mt-0.5">28K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Share2 className="w-7 h-7 stroke-white" />
                      <span className="text-[10px] font-bold mt-0.5">Share</span>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-white/50 bg-neutral-900 flex items-center justify-center animate-spin">
                      <Disc3 className="w-5 h-5 text-neutral-300" />
                    </div>
                  </div>

                  {/* Bottom Metadata */}
                  <div className="pr-16 space-y-1.5 text-white drop-shadow-md text-left pb-2">
                    <p className="font-bold text-xs">@kreator.konten</p>
                    <p className="text-[11px] leading-tight line-clamp-2 opacity-95">
                      Draf video jedag-jedug aesthetic tanpa watermark #trending #fyp
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                      <Music className="w-3 h-3" />
                      <span className="truncate">Suara Asli - Creator Sound Viral</span>
                    </div>
                  </div>
                </div>
              )}

              {/* OVERLAY: REELS */}
              {platform === 'reels' && (
                <div
                  className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3.5 font-sans"
                  style={{ opacity: overlayOpacity }}
                >
                  <div className="pt-2 flex items-center justify-between text-white text-xs font-bold drop-shadow-md">
                    <span>Reels</span>
                  </div>

                  {/* Right Action Rail */}
                  <div className="absolute right-3 bottom-16 flex flex-col items-center gap-4 text-white drop-shadow-md">
                    <Heart className="w-6 h-6 stroke-white" />
                    <span className="text-[10px] font-bold">89.4K</span>
                    <MessageCircle className="w-6 h-6 stroke-white" />
                    <span className="text-[10px] font-bold">540</span>
                    <Share2 className="w-6 h-6 stroke-white" />
                  </div>

                  {/* Bottom User info */}
                  <div className="pr-14 space-y-1 text-white drop-shadow-md text-left pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-pink-500" />
                      <span className="text-xs font-bold">user_instagram</span>
                      <button className="px-2 py-0.5 rounded border border-white text-[9px] font-bold">
                        Ikuti
                      </button>
                    </div>
                    <p className="text-[11px] line-clamp-2">Deskripsi video Instagram Reels aesthetic...</p>
                  </div>
                </div>
              )}

              {/* OVERLAY: SHORTS */}
              {platform === 'shorts' && (
                <div
                  className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3.5 font-sans"
                  style={{ opacity: overlayOpacity }}
                >
                  <div className="pt-2 text-white text-xs font-bold drop-shadow-md text-left">
                    <span>Shorts</span>
                  </div>

                  <div className="absolute right-3 bottom-16 flex flex-col items-center gap-4 text-white drop-shadow-md">
                    <ThumbsUp className="w-6 h-6 stroke-white" />
                    <span className="text-[10px] font-bold">Like</span>
                    <ThumbsDown className="w-6 h-6 stroke-white" />
                    <span className="text-[10px] font-bold">Dislike</span>
                    <MessageCircle className="w-6 h-6 stroke-white" />
                    <span className="text-[10px] font-bold">Komentar</span>
                    <Repeat className="w-6 h-6 stroke-white" />
                    <span className="text-[10px] font-bold">Remix</span>
                  </div>

                  <div className="pr-14 space-y-1 text-white drop-shadow-md text-left pb-2">
                    <p className="text-xs font-bold">Channel Title</p>
                    <p className="text-[11px] line-clamp-2">Judul YouTube Shorts keren #shorts</p>
                  </div>
                </div>
              )}

              {/* OVERLAY: SAFE GRID GUIDE */}
              {platform === 'grid' && (
                <div
                  className="absolute inset-0 pointer-events-none p-4"
                  style={{ opacity: overlayOpacity }}
                >
                  <div className="w-full h-full border-2 border-dashed border-rose-500 rounded-2xl flex flex-col justify-between p-2">
                    <div className="bg-rose-500/80 text-white font-mono text-[9px] px-1.5 py-0.5 rounded self-center">
                      SAFE ZONE (Teks & Objek Utama Aman)
                    </div>
                    <div className="text-rose-400 font-mono text-[9px] text-center">
                      9:16 Inner Boundary
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video Playback & Scrub Bar */}
          <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <button
                type="button"
                onClick={togglePlay}
                className="neo-btn neo-btn-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Putar Video'}</span>
              </button>

              <span className="text-[var(--neo-text)] font-bold">
                {formatSeconds(currentTime)} / {formatSeconds(duration)}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.05"
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full accent-[var(--neo-text)] cursor-pointer"
            />
          </div>

          {/* Action: HD Frame Grabber Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleCaptureFrame}
              className="neo-btn neo-btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Ambil Screenshot Frame HD ({formatSeconds(currentTime)})</span>
            </button>
          </div>

          {/* Captured Frame Preview Card */}
          {capturedFrameUrl && (
            <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Frame HD Berhasil Ditangkap ({frameDimensions?.w} x {frameDimensions?.h} px)</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadFrame}
                  className="neo-btn neo-btn-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .PNG</span>
                </button>
              </div>

              <div className="rounded-xl overflow-hidden border-2 border-[var(--neo-border)] bg-black max-w-xs mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedFrameUrl}
                  alt="HD Frame Capture"
                  className="w-full h-auto block"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
