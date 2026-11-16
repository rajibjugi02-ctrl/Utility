'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  Download,
  Trash2,
  Sparkles,
  Palette,
  Sticker,
  Plus,
  RotateCw,
  Image as ImageIcon,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

type FilterType = 'normal' | 'bw' | 'vintage' | 'warm' | 'cool';
type PatternType =
  | 'solid'
  | 'checkerboard'
  | 'coquette-polka'
  | 'blueprint-grid'
  | 'clouds-stars'
  | 'retro-film'
  | 'cow-spots'
  | 'aura-gradient'
  | 'comic-halftone';

interface PlacedSticker {
  id: string;
  type: 'emoji' | 'badge';
  content: string;
  label: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  scale: number; // 0.8 - 1.8
  rotation: number; // -30 to 30 deg
}

const PATTERN_OPTIONS: { id: PatternType; name: string; tag: string }[] = [
  { id: 'solid', name: 'Warna Solid', tag: 'Minimalis' },
  { id: 'checkerboard', name: 'Y2K Checkerboard', tag: 'Retro' },
  { id: 'coquette-polka', name: 'Coquette Polka & Ribbon', tag: 'Aesthetic' },
  { id: 'blueprint-grid', name: 'Blueprint Grid Paper', tag: 'Notebook' },
  { id: 'clouds-stars', name: 'Dreamy Clouds & Stars', tag: 'Pastel' },
  { id: 'retro-film', name: 'Retro Film Negative', tag: 'Kodak 400' },
  { id: 'cow-spots', name: 'Cow / Dalmatian Spots', tag: 'Cute' },
  { id: 'aura-gradient', name: 'Soft Gradient Aura', tag: 'Y2K Glow' },
  { id: 'comic-halftone', name: 'Neo-Brutalist Comic', tag: 'Pop Art' },
];

const SOLID_COLORS = [
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#121212', name: 'Black' },
  { hex: '#FCE7F3', name: 'Baby Pink' },
  { hex: '#E0F2FE', name: 'Sky Blue' },
  { hex: '#EBF3E8', name: 'Sage Green' },
  { hex: '#EDE9FE', name: 'Lavender' },
  { hex: '#FEF3C7', name: 'Butter' },
];

const STICKER_CATALOG: { type: 'emoji' | 'badge'; content: string; label: string }[] = [
  { type: 'emoji', content: '🎀', label: 'Pita Coquette' },
  { type: 'emoji', content: '💖', label: 'Hati Pixel' },
  { type: 'emoji', content: '✨', label: 'Bintang Y2K' },
  { type: 'emoji', content: '👑', label: 'Mahkota' },
  { type: 'emoji', content: '🕶️', label: 'Kacamata Kece' },
  { type: 'emoji', content: '🐰', label: 'Kelinci Imut' },
  { type: 'emoji', content: '🌼', label: 'Bunga Daisy' },
  { type: 'emoji', content: '🌸', label: 'Cherry Blossom' },
  { type: 'emoji', content: '😊', label: 'Pipi Merah' },
  { type: 'badge', content: 'BESTIE! 💖', label: 'Bestie' },
  { type: 'badge', content: 'CUTE! ✨', label: 'Cute' },
  { type: 'badge', content: '2026 MEMORIES', label: '2026 Memories' },
  { type: 'badge', content: 'OOTD 📸', label: 'OOTD' },
  { type: 'badge', content: 'SLAY! 👑', label: 'Slay' },
  { type: 'badge', content: 'LIFECUTS ★', label: 'LifeCuts' },
];

const DEMO_POSES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
];

export const KoreanPhotoboothStrip: React.FC = () => {
  const [frames, setFrames] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('vintage');
  const [pattern, setPattern] = useState<PatternType>('coquette-polka');
  const [frameColor, setFrameColor] = useState('#FFFFFF');
  const [caption, setCaption] = useState('LIFE 4 CUTS ★ MEMORIES');
  const [dateStr, setDateStr] = useState('2026.11.15');
  const [stickers, setStickers] = useState<PlacedSticker[]>([
    {
      id: 'init_1',
      type: 'emoji',
      content: '🎀',
      label: 'Pita Coquette',
      x: 14,
      y: 5,
      scale: 1.3,
      rotation: -12,
    },
    {
      id: 'init_2',
      type: 'badge',
      content: 'BESTIE! 💖',
      label: 'Bestie',
      x: 82,
      y: 18,
      scale: 1.0,
      rotation: 8,
    },
    {
      id: 'init_3',
      type: 'emoji',
      content: '✨',
      label: 'Bintang Y2K',
      x: 86,
      y: 52,
      scale: 1.2,
      rotation: 15,
    },
    {
      id: 'init_4',
      type: 'badge',
      content: '2026 MEMORIES',
      label: '2026 Memories',
      x: 50,
      y: 92,
      scale: 1.1,
      rotation: 0,
    },
  ]);

  // Webcam states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isMirror, setIsMirror] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasStripRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { addHistoryItem } = useAppStore();

  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setDateStr(`${y}.${m}.${d}`);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch {
      alert('Izin kamera tidak diberikan atau perangkat tidak mendukung.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleCountdownSnap = () => {
    if (frames.length >= 4) return;
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          captureCurrentFrame();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const captureCurrentFrame = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isMirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setFrames((prev) => [...prev.slice(0, 3), dataUrl]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = Array.from(e.target.files || []);
    if (uploaded.length === 0) return;

    uploaded.slice(0, 4 - frames.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFrames((prev) => [...prev.slice(0, 3), event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLoadDemo = () => {
    setFrames([...DEMO_POSES]);
  };

  const handleAddSticker = (item: { type: 'emoji' | 'badge'; content: string; label: string }) => {
    const count = stickers.length;
    // Default smart positioning around margins
    const defaultPositions = [
      { x: 12, y: 7, rot: -10 },
      { x: 88, y: 15, rot: 12 },
      { x: 12, y: 35, rot: 8 },
      { x: 88, y: 48, rot: -8 },
      { x: 12, y: 68, rot: 14 },
      { x: 88, y: 75, rot: -12 },
      { x: 50, y: 92, rot: 0 },
    ];
    const pos = defaultPositions[count % defaultPositions.length];

    const newSticker: PlacedSticker = {
      id: `stk_${Date.now()}_${Math.random()}`,
      type: item.type,
      content: item.content,
      label: item.label,
      x: pos.x,
      y: pos.y,
      scale: item.type === 'badge' ? 1.0 : 1.2,
      rotation: pos.rot,
    };
    setStickers((prev) => [...prev, newSticker]);
  };

  const handleRemoveSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRotateSticker = (id: string) => {
    setStickers((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newRot = s.rotation >= 30 ? -30 : s.rotation + 15;
        return { ...s, rotation: newRot };
      })
    );
  };

  // Draw procedural pattern onto canvas background
  const drawBackgroundPattern = (
    ctx: CanvasRenderingContext2D,
    pat: PatternType,
    w: number,
    h: number,
    solidColor: string
  ) => {
    if (pat === 'solid') {
      ctx.fillStyle = solidColor;
      ctx.fillRect(0, 0, w, h);
      return;
    }

    if (pat === 'checkerboard') {
      ctx.fillStyle = '#FFFDF0';
      ctx.fillRect(0, 0, w, h);
      const size = 24;
      ctx.fillStyle = '#FBCFE8';
      for (let y = 0; y < h; y += size) {
        for (let x = 0; x < w; x += size) {
          if ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 0) {
            ctx.fillRect(x, y, size, size);
          }
        }
      }
      return;
    }

    if (pat === 'coquette-polka') {
      ctx.fillStyle = '#FDF2F8';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#F472B6';
      const gap = 24;
      for (let y = 12; y < h; y += gap) {
        for (let x = 12; x < w; x += gap) {
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }

    if (pat === 'blueprint-grid') {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      const step = 16;
      for (let x = 0; x <= w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // Major grid line accents
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= w; x += step * 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += step * 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      return;
    }

    if (pat === 'clouds-stars') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#C084FC');
      grad.addColorStop(0.5, '#818CF8');
      grad.addColorStop(1, '#93C5FD');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Draw procedural cute sparkle stars
      ctx.fillStyle = '#FEF08A';
      const drawSparkle = (cx: number, cy: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.quadraticCurveTo(cx, cy, cx + r, cy);
        ctx.quadraticCurveTo(cx, cy, cx, cy + r);
        ctx.quadraticCurveTo(cx, cy, cx - r, cy);
        ctx.quadraticCurveTo(cx, cy, cx, cy - r);
        ctx.fill();
      };

      const stars = [
        { x: 30, y: 25, r: 12 },
        { x: 440, y: 35, r: 10 },
        { x: 25, y: 400, r: 8 },
        { x: 450, y: 560, r: 12 },
        { x: 35, y: 880, r: 10 },
        { x: 445, y: 1100, r: 14 },
      ];
      stars.forEach((s) => drawSparkle(s.x, s.y, s.r));

      // Draw soft cloud puffs in header and footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const drawCloud = (cx: number, cy: number) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.arc(cx + 18, cy - 6, 26, 0, Math.PI * 2);
        ctx.arc(cx + 38, cy, 20, 0, Math.PI * 2);
        ctx.fill();
      };
      drawCloud(10, 80);
      drawCloud(400, 850);
      return;
    }

    if (pat === 'retro-film') {
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, w, h);

      // Sprocket holes along left (x=6) and right (x=w-26)
      ctx.fillStyle = '#27272A';
      const holeW = 14;
      const holeH = 20;
      const holeGap = 32;
      for (let y = 14; y < h - 14; y += holeGap) {
        // Left hole
        ctx.beginPath();
        ctx.roundRect(8, y, holeW, holeH, 3);
        ctx.fill();
        // Right hole
        ctx.beginPath();
        ctx.roundRect(w - 22, y, holeW, holeH, 3);
        ctx.fill();
      }

      // Vintage film text indicators
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#F59E0B';
      ctx.textAlign = 'left';
      ctx.fillText('KODAK 400', 8, 8);
      ctx.fillText('SAFETY FILM', w - 75, 8);
      ctx.fillText('▲ 12A', 8, h - 6);
      ctx.fillText('▲ 13A', w - 40, h - 6);
      return;
    }

    if (pat === 'cow-spots') {
      ctx.fillStyle = '#FAFAF9';
      ctx.fillRect(0, 0, w, h);

      // Cute organic cow / dalmatian spot blobs
      ctx.fillStyle = '#18181B';
      const spots = [
        { x: 18, y: 15, r: 16 },
        { x: 26, y: 22, r: 12 },
        { x: 440, y: 40, r: 18 },
        { x: 450, y: 55, r: 14 },
        { x: 15, y: 350, r: 14 },
        { x: 445, y: 600, r: 20 },
        { x: 435, y: 615, r: 16 },
        { x: 20, y: 880, r: 18 },
        { x: 440, y: 1050, r: 22 },
        { x: 450, y: 1070, r: 15 },
        { x: 30, y: h - 30, r: 20 },
      ];
      spots.forEach((sp) => {
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fill();
      });
      return;
    }

    if (pat === 'aura-gradient') {
      // Y2K Soft multi-aura gradient
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, w, h);

      const rad1 = ctx.createRadialGradient(80, 120, 10, 80, 120, 220);
      rad1.addColorStop(0, 'rgba(244, 63, 94, 0.7)');
      rad1.addColorStop(1, 'transparent');
      ctx.fillStyle = rad1;
      ctx.fillRect(0, 0, w, h);

      const rad2 = ctx.createRadialGradient(380, h / 2, 20, 380, h / 2, 260);
      rad2.addColorStop(0, 'rgba(139, 92, 246, 0.7)');
      rad2.addColorStop(1, 'transparent');
      ctx.fillStyle = rad2;
      ctx.fillRect(0, 0, w, h);

      const rad3 = ctx.createRadialGradient(120, h - 150, 20, 120, h - 150, 250);
      rad3.addColorStop(0, 'rgba(56, 189, 248, 0.65)');
      rad3.addColorStop(1, 'transparent');
      ctx.fillStyle = rad3;
      ctx.fillRect(0, 0, w, h);
      return;
    }

    if (pat === 'comic-halftone') {
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#000000';
      const dotGap = 16;
      for (let y = 8; y < h; y += dotGap) {
        for (let x = 8; x < w; x += dotGap) {
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }
  };

  // Draw placed cute stickers and badges
  const drawStickers = (
    ctx: CanvasRenderingContext2D,
    activeStickers: PlacedSticker[],
    w: number,
    h: number
  ) => {
    activeStickers.forEach((stk) => {
      const px = (stk.x / 100) * w;
      const py = (stk.y / 100) * h;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((stk.rotation * Math.PI) / 180);

      if (stk.type === 'emoji') {
        const fontSize = Math.round(stk.scale * 34);
        ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Soft drop shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 6;
        ctx.fillText(stk.content, 0, 0);
      } else if (stk.type === 'badge') {
        const fontSize = Math.round(stk.scale * 12);
        ctx.font = `900 ${fontSize}px sans-serif`;
        const textWidth = ctx.measureText(stk.content).width;
        const padX = 10 * stk.scale;
        const padY = 5 * stk.scale;
        const boxW = textWidth + padX * 2;
        const boxH = fontSize + padY * 2;

        // Neo-Brutalist badge background with shadow
        ctx.shadowColor = '#000000';
        ctx.shadowOffsetX = 2.5;
        ctx.shadowOffsetY = 2.5;
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 8);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stk.content, 0, 1);
      }

      ctx.restore();
    });
  };

  // Redraw strip whenever frames, styles, or stickers change
  const renderPhotoboothStrip = useCallback(() => {
    const canvas = canvasStripRef.current;
    if (!canvas || frames.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Standard Korean 4-Cut Strip Dimensions
    const w = 480;
    const frameCount = Math.max(1, frames.length);
    const photoH = 260;
    const photoW = 400;
    const margin = 40;
    const gap = 20;
    const bottomH = 140;
    const totalH = margin * 2 + frameCount * photoH + (frameCount - 1) * gap + bottomH;

    canvas.width = w;
    canvas.height = totalH;

    // 1. Draw procedural background pattern
    drawBackgroundPattern(ctx, pattern, w, totalH, frameColor);

    // Frame border
    ctx.strokeStyle = pattern === 'retro-film' ? '#27272A' : '#121212';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, totalH - 4);

    // 2. Load and draw photos
    let loadedCount = 0;
    frames.forEach((src, idx) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const x = (w - photoW) / 2;
        const y = margin + idx * (photoH + gap);

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, photoW, photoH);
        ctx.clip();

        // Apply visual filter
        if (activeFilter === 'bw') {
          ctx.filter = 'grayscale(100%) contrast(125%)';
        } else if (activeFilter === 'vintage') {
          ctx.filter = 'sepia(35%) contrast(110%) brightness(105%)';
        } else if (activeFilter === 'warm') {
          ctx.filter = 'saturate(130%) sepia(15%) brightness(105%)';
        } else if (activeFilter === 'cool') {
          ctx.filter = 'hue-rotate(185deg) saturate(90%) brightness(105%)';
        }

        // 4:3 Aspect ratio crop
        const imgRatio = img.width / img.height;
        const targetRatio = photoW / photoH;
        let sW = img.width;
        let sH = img.height;
        let sX = 0;
        let sY = 0;

        if (imgRatio > targetRatio) {
          sW = img.height * targetRatio;
          sX = (img.width - sW) / 2;
        } else {
          sH = img.width / targetRatio;
          sY = (img.height - sH) / 2;
        }

        ctx.drawImage(img, sX, sY, sW, sH, x, y, photoW, photoH);
        ctx.restore();

        // Photo border
        ctx.strokeStyle = '#121212';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, photoW, photoH);

        loadedCount++;
        if (loadedCount === frames.length) {
          // 3. Draw bottom branding & date
          const footerY = totalH - bottomH + 40;
          const isDarkBg =
            pattern === 'retro-film' ||
            pattern === 'blueprint-grid' ||
            (pattern === 'solid' && frameColor === '#121212');

          ctx.fillStyle = isDarkBg ? '#FFFFFF' : '#121212';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(caption, w / 2, footerY);

          ctx.font = '14px monospace';
          ctx.fillStyle = isDarkBg ? '#A1A1AA' : '#52525B';
          ctx.fillText(`• ${dateStr} • PHOTOBOOTH •`, w / 2, footerY + 30);

          // 4. Draw placed cute stickers & badges directly on canvas
          drawStickers(ctx, stickers, w, totalH);
        }
      };
      img.src = src;
    });
  }, [frames, activeFilter, pattern, frameColor, caption, dateStr, stickers]);

  useEffect(() => {
    renderPhotoboothStrip();
  }, [renderPhotoboothStrip]);

  const handleDownloadStrip = () => {
    const canvas = canvasStripRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Korean_Life4Cuts_Strip_${dateStr}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    addHistoryItem({
      type: 'image',
      title: `Korean Photobooth: ${caption}`,
      subtitle: `${frames.length} Pose · ${pattern} frame`,
      downloadUrl: dataUrl,
    });
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Top Action Bar: Webcam, Upload & Demo */}
      <div className="neo-card p-5 rounded-2xl bg-[var(--neo-surface)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="neo-btn neo-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Buka Kamera HP / Webcam</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="neo-btn px-3.5 py-2 rounded-xl text-xs font-bold text-rose-500 bg-[var(--neo-surface)] hover:bg-rose-500/10"
              >
                Tutup Kamera
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="neo-btn neo-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Foto ({frames.length}/4)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />

            {frames.length === 0 && (
              <button
                type="button"
                onClick={handleLoadDemo}
                className="neo-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-dashed border-[var(--neo-border)] text-[var(--neo-text)]"
              >
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <span>Pakai Contoh Foto</span>
              </button>
            )}
          </div>

          {frames.length > 0 && (
            <button
              type="button"
              onClick={() => setFrames([])}
              className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Pose</span>
            </button>
          )}
        </div>

        {/* Live Webcam Viewfinder */}
        {isCameraActive && (
          <div className="relative max-w-md mx-auto aspect-video rounded-2xl border-4 border-[var(--neo-border)] overflow-hidden bg-black shadow-neo">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${isMirror ? 'scale-x-[-1]' : ''}`}
            />

            {countdown !== null && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-7xl font-bold font-mono text-white animate-ping">
                  {countdown}
                </span>
              </div>
            )}

            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-3">
              <button
                type="button"
                disabled={countdown !== null || frames.length >= 4}
                onClick={handleCountdownSnap}
                className="neo-btn neo-btn-primary px-5 py-2.5 rounded-full text-xs font-bold shadow-lg"
              >
                {frames.length >= 4 ? 'Maksimal 4 Pose Terpenuhi' : 'Ambil Foto (Hitung Mundur 3 Detik)'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Frame Styling, Filter & Cute Stickers Studio */}
      {frames.length > 0 && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          {/* 1. 8 Procedural Pattern Presets */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[var(--neo-accent-text)]" />
              <span className="text-xs font-bold text-[var(--neo-text)] uppercase tracking-wider">
                Motif Frame Hiasan Prosedural (8 Preset Estetik):
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {PATTERN_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPattern(opt.id)}
                  className={`p-2 rounded-xl border-2 text-left transition-all ${pattern === opt.id
                      ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)] shadow-neo scale-[1.02]'
                      : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:bg-[var(--neo-surface)]'
                    }`}
                >
                  <div className="text-xs font-black truncate">{opt.name}</div>
                  <div className="text-[10px] opacity-75 font-mono">{opt.tag}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Filter & Solid Frame Color (if solid chosen) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-[var(--neo-border)]">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[var(--neo-text)]">Filter Warna Foto:</span>
              <div className="grid grid-cols-5 gap-1.5">
                {(['vintage', 'bw', 'warm', 'cool', 'normal'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setActiveFilter(f)}
                    className={`py-1.5 px-2 rounded-xl border-2 text-[11px] font-bold capitalize transition-all ${activeFilter === f
                        ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)]'
                        : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)]'
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {pattern === 'solid' && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[var(--neo-text)]">Pilihan Warna Solid:</span>
                <div className="flex flex-wrap gap-2">
                  {SOLID_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setFrameColor(c.hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${frameColor === c.hex ? 'border-amber-400 scale-125 shadow-sm' : 'border-[var(--neo-border)]'
                        }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Cute Stickers & Badges Selection Tray */}
          <div className="space-y-2 pt-2 border-t border-[var(--neo-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sticker className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-bold text-[var(--neo-text)] uppercase tracking-wider">
                  Koleksi Stiker & Bubble Text Lucu:
                </span>
              </div>
              <span className="text-[11px] text-[var(--neo-text-muted)] font-mono">
                {stickers.length} Stiker Terpasang
              </span>
            </div>

            <div className="flex flex-wrap gap-2 p-2.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)]">
              {STICKER_CATALOG.map((stk, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddSticker(stk)}
                  className="neo-btn px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 bg-[var(--neo-surface)] hover:scale-105 transition-transform"
                  title={`Tambah ${stk.label}`}
                >
                  <span className="text-base">{stk.content}</span>
                  <span className="text-[11px] font-semibold">{stk.label}</span>
                  <Plus className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>

            {/* Placed Stickers Management Pills */}
            {stickers.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-[var(--neo-text-muted)]">Atur Stiker:</span>
                {stickers.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[var(--neo-border)] bg-[var(--neo-surface)] text-[10px] font-mono"
                  >
                    <span>{s.content}</span>
                    <button
                      type="button"
                      onClick={() => handleRotateSticker(s.id)}
                      className="hover:text-amber-500"
                      title="Putar Stiker"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSticker(s.id)}
                      className="hover:text-rose-500 font-bold ml-0.5"
                      title="Hapus Stiker"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setStickers([])}
                  className="text-[10px] text-rose-500 underline ml-1"
                >
                  Hapus Semua
                </button>
              </div>
            )}
          </div>

          {/* Caption & Date Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--neo-border)]">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[var(--neo-text)]">Teks Judul Frame:</span>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="neo-input w-full px-3 py-1.5 rounded-lg text-xs"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-[var(--neo-text)]">Tanggal Cetak:</span>
              <input
                type="text"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="neo-input w-full px-3 py-1.5 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          {/* Live Strip Canvas Preview */}
          <div className="flex flex-col items-center space-y-3 pt-3">
            <span className="text-[11px] font-mono text-[var(--neo-text-muted)]">
              Preview Strip Cetak Korean Photobooth ({frames.length} Frame · 100% Canvas Render)
            </span>

            <div className="p-2.5 rounded-2xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] shadow-neo inline-block max-w-full overflow-hidden">
              <canvas
                ref={canvasStripRef}
                className="max-h-[540px] w-auto object-contain rounded-xl block mx-auto shadow-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleDownloadStrip}
              className="neo-btn neo-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-neo hover:scale-[1.02] transition-transform"
            >
              <Download className="w-4 h-4" />
              <span>Download Strip Korean Photobooth (.PNG)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
