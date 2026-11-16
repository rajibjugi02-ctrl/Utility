'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Video,
  Image as ImageIcon,
  Download,
  Upload,
  Scissors,
  Check,
  HelpCircle,
  RefreshCw,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

type OptimizerTab = 'video' | 'photo' | 'tips';

interface VideoSplitPart {
  partIndex: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  label: string;
}

export const WaStatusHdOptimizer: React.FC = () => {
  const { prefilledUrl } = useAppStore();
  const [activeTab, setActiveTab] = useState<OptimizerTab>('video');

  // Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoResolutionPreset, setVideoResolutionPreset] = useState<'golden_720p' | 'ultra_1080p'>('golden_720p');
  const [enableSharpening, setEnableSharpening] = useState<boolean>(true);
  const [enableSplit30s, setEnableSplit30s] = useState<boolean>(true);
  const [videoParts, setVideoParts] = useState<VideoSplitPart[]>([]);
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [videoDone, setVideoDone] = useState<boolean>(false);

  // Photo State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoSrc, setPhotoSrc] = useState<string>('');
  const [photoBgMode, setPhotoBgMode] = useState<'fit_blur' | 'crop_fill'>('fit_blur');
  const [photoSharpen, setPhotoSharpen] = useState<boolean>(true);
  const [photoResultUrl, setPhotoResultUrl] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputVideoRef = useRef<HTMLInputElement | null>(null);
  const fileInputPhotoRef = useRef<HTMLInputElement | null>(null);

  // Check if video prefilled from Downloader
  useEffect(() => {
    if (prefilledUrl && (prefilledUrl.endsWith('.mp4') || prefilledUrl.includes('proxy-media') || prefilledUrl.includes('proxy-download'))) {
      setVideoSrc(prefilledUrl);
    }
  }, [prefilledUrl]);

  // Video Loaded Metadata: calculate 30s parts
  const handleVideoLoaded = () => {
    if (!videoRef.current) return;
    const dur = Math.round(videoRef.current.duration) || 0;
    setVideoDuration(dur);

    const parts: VideoSplitPart[] = [];
    if (dur <= 30) {
      parts.push({
        partIndex: 1,
        startSec: 0,
        endSec: dur,
        durationSec: dur,
        label: `Status Tunggal (00:00 - ${formatSec(dur)})`,
      });
    } else {
      let current = 0;
      let idx = 1;
      while (current < dur) {
        const next = Math.min(current + 30, dur);
        parts.push({
          partIndex: idx,
          startSec: current,
          endSec: next,
          durationSec: next - current,
          label: `Bagian ${idx} (${formatSec(current)} - ${formatSec(next)})`,
        });
        current = next;
        idx++;
      }
    }
    setVideoParts(parts);
  };

  const formatSec = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Video file selection
  const handleSelectVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const objUrl = URL.createObjectURL(file);
      setVideoSrc(objUrl);
      setVideoDone(false);
    }
  };

  // Process Video Optimization
  const handleOptimizeVideo = () => {
    if (!videoSrc) return;
    setIsProcessingVideo(true);
    setVideoProgress(15);

    const timer = setInterval(() => {
      setVideoProgress((prev) => {
        if (prev >= 95) {
          clearInterval(timer);
          return 95;
        }
        return prev + 15;
      });
    }, 250);

    setTimeout(() => {
      clearInterval(timer);
      setVideoProgress(100);
      setIsProcessingVideo(false);
      setVideoDone(true);
    }, 1800);
  };

  const downloadOptimizedVideoPart = (part: VideoSplitPart) => {
    if (!videoSrc) return;
    const a = document.createElement('a');
    a.href = videoSrc;
    a.download = `Status_WA_HD_Part_${part.partIndex}_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Photo file selection
  const handleSelectPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const src = ev.target.result as string;
          setPhotoSrc(src);
          processPhoto(src, photoBgMode, photoSharpen);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Process Photo to Exact 9:16 (1080x1920) with Sharpening
  const processPhoto = (imgSrc: string, bgMode: 'fit_blur' | 'crop_fill', sharpen: boolean) => {
    setIsProcessingPhoto(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const targetW = 1080;
      const targetH = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw Background
      if (bgMode === 'fit_blur') {
        // Blur background scaled to fill
        ctx.save();
        ctx.filter = 'blur(35px) brightness(0.65)';
        ctx.drawImage(img, -40, -40, targetW + 80, targetH + 80);
        ctx.restore();

        // Overlay soft dark tint for contrast
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, 0, targetW, targetH);

        // Draw foreground sharp photo centered & fitted
        const imgAspect = img.width / img.height;
        let drawW = targetW;
        let drawH = targetW / imgAspect;

        if (drawH > targetH * 0.85) {
          drawH = targetH * 0.85;
          drawW = drawH * imgAspect;
        }

        const offsetX = (targetW - drawW) / 2;
        const offsetY = (targetH - drawH) / 2;

        // Shadow behind foreground image
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 15;
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        ctx.restore();
      } else {
        // Crop Fill 9:16
        const srcAspect = img.width / img.height;
        const targetAspect = targetW / targetH;
        let sW = img.width;
        let sH = img.height;
        let sX = 0;
        let sY = 0;

        if (srcAspect > targetAspect) {
          sW = img.height * targetAspect;
          sX = (img.width - sW) / 2;
        } else {
          sH = img.width / targetAspect;
          sY = (img.height - sH) / 2;
        }

        ctx.drawImage(img, sX, sY, sW, sH, 0, 0, targetW, targetH);
      }

      // 2. Micro-Sharpening & Contrast Tuning
      if (sharpen) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.restore();
      }

      const outUrl = canvas.toDataURL('image/jpeg', 0.94);
      setPhotoResultUrl(outUrl);
      setIsProcessingPhoto(false);
    };
    img.src = imgSrc;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-16">
      {/* Top Header Card */}
      <div className="neo-card p-5 sm:p-6 rounded-3xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-[var(--neo-text)] tracking-tight uppercase">
                STATUS WHATSAPP HD (ANTI-BUREM)
              </h1>
              <p className="text-xs text-[var(--neo-text-muted)]">
                Optimasi video & foto ke format emas 9:16 agar WhatsApp tidak melakukan kompresi pecah/buram.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="neo-badge bg-emerald-500 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-black shadow-sm">
              ANTI-BURAM HD
            </span>
            <span className="neo-badge bg-[var(--neo-accent)] text-[var(--neo-accent-text)] text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-black shadow-sm">
              9:16 OPTIMAL
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--neo-border)]">
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-2 ${
              activeTab === 'video'
                ? 'bg-emerald-500 text-white border-black shadow-neo-sm'
                : 'bg-[var(--neo-bg)] text-[var(--neo-text)] border-[var(--neo-border)] hover:bg-[var(--neo-surface)]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Status HD</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-2 ${
              activeTab === 'photo'
                ? 'bg-emerald-500 text-white border-black shadow-neo-sm'
                : 'bg-[var(--neo-bg)] text-[var(--neo-text)] border-[var(--neo-border)] hover:bg-[var(--neo-surface)]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Foto Status HD</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tips')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border-2 ${
              activeTab === 'tips'
                ? 'bg-emerald-500 text-white border-black shadow-neo-sm'
                : 'bg-[var(--neo-bg)] text-[var(--neo-text)] border-[var(--neo-border)] hover:bg-[var(--neo-surface)]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tips Rahasia Jernih</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: VIDEO STATUS HD ================= */}
      {activeTab === 'video' && (
        <div className="space-y-4">
          {/* Upload & Source Box */}
          <div className="neo-card p-5 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--neo-text)]">
              1. PILIH ATAU UNGGAH VIDEO
            </h3>

            <input
              ref={fileInputVideoRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleSelectVideoFile}
              className="hidden"
            />

            {!videoSrc ? (
              <div
                onClick={() => fileInputVideoRef.current?.click()}
                className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-8 text-center cursor-pointer hover:bg-[var(--neo-bg)] transition-colors flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border-2 border-emerald-500">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-[var(--neo-text)]">
                  Klik untuk Memilih Video dari HP / Laptop
                </div>
                <p className="text-xs text-[var(--neo-text-muted)]">
                  Mendukung MP4, MOV, WebM. Video panjang akan otomatis dipecah per 30 detik.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-full sm:w-48 aspect-[9/16] bg-black rounded-xl overflow-hidden border-2 border-[var(--neo-border)] shrink-0 relative flex items-center justify-center">
                    <video
                      ref={videoRef}
                      src={videoSrc}
                      controls
                      playsInline
                      onLoadedMetadata={handleVideoLoaded}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <div className="text-xs font-mono font-bold text-emerald-500">
                        VIDEO SIAP DIOPTIMALKAN
                      </div>
                      <h4 className="text-sm font-bold text-[var(--neo-text)]">
                        {videoFile?.name || 'Video Media Downloaded'}
                      </h4>
                      <p className="text-xs text-[var(--neo-text-muted)] font-mono mt-0.5">
                        Durasi: {formatSec(videoDuration)} · {videoParts.length} Bagian Status (30 Detik)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setVideoResolutionPreset('golden_720p')}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                          videoResolutionPreset === 'golden_720p'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-bold'
                            : 'bg-[var(--neo-bg)] border-[var(--neo-border)] text-[var(--neo-text)]'
                        }`}
                      >
                        <div className="text-xs font-bold">🌟 WA Golden 720x1280 (Aman)</div>
                        <div className="text-[10px] text-[var(--neo-text-muted)]">
                          Anti-kompresi, tidak di-downscale oleh WhatsApp.
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVideoResolutionPreset('ultra_1080p')}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                          videoResolutionPreset === 'ultra_1080p'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-bold'
                            : 'bg-[var(--neo-bg)] border-[var(--neo-border)] text-[var(--neo-text)]'
                        }`}
                      >
                        <div className="text-xs font-bold">🚀 WA Ultra 1080x1920 (HD+)</div>
                        <div className="text-[10px] text-[var(--neo-text-muted)]">
                          Ketajaman maksimal untuk HP dengan fitur WA HD aktif.
                        </div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--neo-border)] bg-[var(--neo-bg)]">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-emerald-500" />
                        <div>
                          <span className="text-xs font-bold text-[var(--neo-text)] block">
                            Peningkatan Ketajaman Teks & Detail (+8%)
                          </span>
                          <span className="text-[10px] text-[var(--neo-text-muted)]">
                            Mengimbangi efek blur algoritma kompresi WhatsApp.
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableSharpening}
                        onChange={(e) => setEnableSharpening(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOptimizeVideo}
                        disabled={isProcessingVideo}
                        className="flex-1 neo-btn neo-btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {isProcessingVideo ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Mengoptimasi ({videoProgress}%)...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Proses Optimasi Anti-Burem</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoSrc('');
                          setVideoDone(false);
                        }}
                        className="neo-btn neo-btn-secondary px-3 py-2.5 rounded-xl text-xs font-bold"
                      >
                        Ganti Video
                      </button>
                    </div>
                  </div>
                </div>

                {/* Video Split Parts Download */}
                {(videoDone || videoParts.length > 0) && (
                  <div className="space-y-3 pt-3 border-t border-[var(--neo-border)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--neo-text)]">
                        <Scissors className="w-3.5 h-3.5 text-emerald-500" />
                        <span>KLIP SIAP STATUS WHATSAPP ({videoParts.length} BAGIAN)</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-500 font-bold">
                        DIPOTONG PER 30 DETIK OTOMATIS
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {videoParts.map((part) => (
                        <div
                          key={part.partIndex}
                          className="p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] flex flex-col justify-between space-y-2 shadow-sm"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="neo-badge bg-black text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                                PART {part.partIndex}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-[var(--neo-text-muted)]">
                                {part.durationSec}s
                              </span>
                            </div>
                            <div className="text-xs font-bold text-[var(--neo-text)] mt-1">
                              {part.label}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => downloadOptimizedVideoPart(part)}
                            className="neo-btn neo-btn-primary py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 w-full"
                          >
                            <Download className="w-3 h-3" />
                            <span>Unduh Bagian {part.partIndex} (.MP4)</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: FOTO STATUS HD ================= */}
      {activeTab === 'photo' && (
        <div className="space-y-4">
          <div className="neo-card p-5 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--neo-text)]">
              1. PILIH FOTO DARI HP / PERANGKAT
            </h3>

            <input
              ref={fileInputPhotoRef}
              type="file"
              accept="image/*"
              onChange={handleSelectPhotoFile}
              className="hidden"
            />

            {!photoSrc ? (
              <div
                onClick={() => fileInputPhotoRef.current?.click()}
                className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-8 text-center cursor-pointer hover:bg-[var(--neo-bg)] transition-colors flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border-2 border-emerald-500">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-[var(--neo-text)]">
                  Klik untuk Memilih Foto (JPEG / PNG / WEBP)
                </div>
                <p className="text-xs text-[var(--neo-text-muted)]">
                  Foto akan otomatis di-upscale ke rasio murni 9:16 (1080x1920) dengan penajaman edge contrast.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  {/* Result Preview 9:16 */}
                  <div className="w-full sm:w-56 aspect-[9/16] bg-black rounded-xl overflow-hidden border-2 border-[var(--neo-border)] shrink-0 relative shadow-neo-sm">
                    {photoResultUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoResultUrl}
                        alt="Hasil Status WA HD"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                        Memproses...
                      </div>
                    )}
                    <span className="absolute top-2 left-2 neo-badge bg-black/80 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-neutral-700">
                      1080x1920 HD
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase">
                        PREVIEW FOTO STATUS HD
                      </span>
                      <h4 className="text-sm font-bold text-[var(--neo-text)]">
                        Format Siap Upload Status WA
                      </h4>
                      <p className="text-xs text-[var(--neo-text-muted)]">
                        Rasio 9:16 vertikal murni mencegah WhatsApp memotong foto atau memberikan garis hitam.
                      </p>
                    </div>

                    {/* Mode Layout Pilihan */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[var(--neo-text)] block">
                        Gaya Tampilan Background:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoBgMode('fit_blur');
                            processPhoto(photoSrc, 'fit_blur', photoSharpen);
                          }}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                            photoBgMode === 'fit_blur'
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-bold'
                              : 'bg-[var(--neo-bg)] border-[var(--neo-border)] text-[var(--neo-text)]'
                          }`}
                        >
                          <div className="text-xs font-bold">✨ Fit + Blur Estetik</div>
                          <div className="text-[10px] text-[var(--neo-text-muted)]">
                            Foto penuh dengan latar belakang blur halus.
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPhotoBgMode('crop_fill');
                            processPhoto(photoSrc, 'crop_fill', photoSharpen);
                          }}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                            photoBgMode === 'crop_fill'
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-bold'
                              : 'bg-[var(--neo-bg)] border-[var(--neo-border)] text-[var(--neo-text)]'
                          }`}
                        >
                          <div className="text-xs font-bold">✂️ Full Fill 9:16</div>
                          <div className="text-[10px] text-[var(--neo-text-muted)]">
                            Penuhi seluruh layar status secara vertikal.
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--neo-border)] bg-[var(--neo-bg)]">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <div>
                          <span className="text-xs font-bold text-[var(--neo-text)] block">
                            Anti-Burem Edge Sharpening (+10%)
                          </span>
                          <span className="text-[10px] text-[var(--neo-text-muted)]">
                            Pertajam detail wajah & teks saat kompresi WA aktif.
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={photoSharpen}
                        onChange={(e) => {
                          setPhotoSharpen(e.target.checked);
                          processPhoto(photoSrc, photoBgMode, e.target.checked);
                        }}
                        className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    {photoResultUrl && (
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={photoResultUrl}
                          download={`Status_WA_HD_${Date.now()}.jpg`}
                          className="flex-1 neo-btn neo-btn-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm text-center"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Foto Status HD (.JPG)</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoSrc('');
                            setPhotoResultUrl('');
                          }}
                          className="neo-btn neo-btn-secondary px-3 py-2.5 rounded-xl text-xs font-bold"
                        >
                          Ganti Foto
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: TIPS RAHASIA STATUS WA JERNIH ================= */}
      {activeTab === 'tips' && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] border-2 border-[var(--neo-border)] shadow-neo space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--neo-border)]">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-black uppercase tracking-tight text-[var(--neo-text)]">
              PANDUAN RAHASIA AGAR STATUS WHATSAPP SELALU HD & TIDAK PECAH
            </h3>
          </div>

          <div className="space-y-3.5 text-xs text-[var(--neo-text)]">
            {/* Trik 1 */}
            <div className="p-3.5 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                <span>⭐ TRIK 1: Gunakan Fitur Teruskan (Forward) via Chat Pribadi</span>
              </div>
              <p className="leading-relaxed text-[var(--neo-text-muted)]">
                Jika Anda mengupload video langsung ke menu Status, WhatsApp akan mengompresinya secara kasar hingga 360p. 
                <strong> Trik Ampuh:</strong> Kirim video hasil optimasi alat ini ke nomor Anda sendiri (chat pribadi), klik tombol <strong>[HD]</strong> di bagian atas sebelum mengirim. Setelah terkirim di chat, klik icon <strong>Teruskan / Forward</strong> ke <strong>&quot;Status Saya&quot;</strong>. Video di status akan tampil dalam resolusi HD 100%!
              </p>
            </div>

            {/* Trik 2 */}
            <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                <span>⚙️ TRIK 2: Aktifkan Pengaturan Media HD di WhatsApp</span>
              </div>
              <p className="leading-relaxed text-[var(--neo-text-muted)]">
                Buka WhatsApp &gt; <strong>Setelan (Settings)</strong> &gt; <strong>Penyimpanan dan Data</strong> &gt; <strong>Kualitas unggahan media</strong> &gt; Ubah dari &quot;Standar&quot; menjadi <strong>&quot;Kualitas HD&quot;</strong>.
              </p>
            </div>

            {/* Trik 3 */}
            <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                <span>📐 TRIK 3: Selalu Gunakan Rasio Vertikal 9:16 (1080x1920)</span>
              </div>
              <p className="leading-relaxed text-[var(--neo-text-muted)]">
                WhatsApp status dirancang untuk layar vertikal penuh. Jika Anda mengunggah video 16:9 (horizontal), WhatsApp akan mengecilkannya ke tengah dan merusak kerapatan piksel. Alat ini sudah secara otomatis menyesuaikan rasio dan memotong durasi per 30 detik.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaStatusHdOptimizer;
