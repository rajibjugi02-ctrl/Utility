'use client';

import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface Petal {
  x: number;
  y: number;
  size: number;
  layer: number; // 0: background (small), 1: midground (sharp), 2: foreground (large, soft blur)
  color: string;
  speedY: number;
  speedX: number;
  rotation: number;
  rotSpeed: number;
  flipAngle: number;
  flipSpeed: number;
  swayFreq: number;
  swayAmp: number;
  swayOffset: number;
  opacity: number;
}

export const AnimatedBackground: React.FC = () => {
  const { bgStyle } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // If solid paper or without canvas, nothing to render
    if (bgStyle === 'solid') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // ==========================================
    // 1. SAKURA PETALS (RED SAKURA / PINK SAKURA)
    // ==========================================
    const isRedSakura = bgStyle === 'red-sakura';
    const isPinkSakura = bgStyle === 'pink-sakura';

    const RED_PALETTE = ['#FF1E42', '#E60026', '#B8001F', '#FF5C77', '#D90429'];
    const PINK_PALETTE = ['#FFB7C5', '#FF69B4', '#FFC0CB', '#FF85A2', '#F72585'];
    const palette = isRedSakura ? RED_PALETTE : PINK_PALETTE;

    const petals: Petal[] = [];
    if (isRedSakura || isPinkSakura) {
      const petalCount = 42;
      for (let i = 0; i < petalCount; i++) {
        // Randomly distribute across 3 layers (10 foreground, 22 midground, 10 background)
        const rand = Math.random();
        const layer = rand < 0.22 ? 2 : rand < 0.75 ? 1 : 0;

        let baseSize = 18;
        let baseSpeed = 2.0;
        let baseOpacity = 0.85;

        if (layer === 0) {
          // Far background
          baseSize = 9 + Math.random() * 6;
          baseSpeed = 1.0 + Math.random() * 0.8;
          baseOpacity = 0.45 + Math.random() * 0.2;
        } else if (layer === 1) {
          // Midground sharp
          baseSize = 16 + Math.random() * 8;
          baseSpeed = 1.8 + Math.random() * 1.0;
          baseOpacity = 0.8 + Math.random() * 0.18;
        } else {
          // Foreground large with depth of field
          baseSize = 28 + Math.random() * 14;
          baseSpeed = 2.8 + Math.random() * 1.2;
          baseOpacity = 0.4 + Math.random() * 0.2;
        }

        petals.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: baseSize,
          layer,
          color: palette[Math.floor(Math.random() * palette.length)],
          speedY: baseSpeed,
          speedX: 0.6 + Math.random() * 0.8, // Drift diagonally from left to right
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.025,
          flipAngle: Math.random() * Math.PI * 2,
          flipSpeed: 0.015 + Math.random() * 0.025,
          swayFreq: 0.015 + Math.random() * 0.02,
          swayAmp: 1.2 + Math.random() * 1.8,
          swayOffset: Math.random() * Math.PI * 2,
          opacity: baseOpacity,
        });
      }
    }

    // Helper: Draw organic Bezier sakura petal
    const drawPetal = (w: number, h: number) => {
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.bezierCurveTo(-w * 0.75, -h * 0.15, -w * 0.55, h * 0.45, 0, h / 2);
      ctx.bezierCurveTo(w * 0.55, h * 0.45, w * 0.75, -h * 0.15, 0, -h / 2);
      ctx.closePath();
    };

    // ==========================================
    // 2. GRID / DOTS / SHAPES FALLBACK DATA
    // ==========================================
    let gridOffset = 0;
    const shapes = Array.from({ length: 14 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 24 + Math.random() * 36,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      rotation: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 0.01,
      type: Math.floor(Math.random() * 3),
    }));

    let frameCount = 0;

    // ==========================================
    // 3. MAIN ANIMATION LOOP (60FPS)
    // ==========================================
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      frameCount++;

      // A. RENDER RED SAKURA / PINK SAKURA
      if (isRedSakura || isPinkSakura) {
        petals.forEach((p) => {
          // Sway with sine wave
          const sway = Math.sin(frameCount * p.swayFreq + p.swayOffset) * p.swayAmp;
          p.x += p.speedX + sway;
          p.y += p.speedY;
          p.rotation += p.rotSpeed;
          p.flipAngle += p.flipSpeed;

          // Wrap around edges seamlessly
          if (p.y > height + 40) {
            p.y = -30;
            p.x = Math.random() * (width + 100) - 50;
          }
          if (p.x > width + 40) {
            p.x = -30;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          // 3D Fluttering / Flip Scale
          const flipScale = Math.cos(p.flipAngle);
          ctx.scale(flipScale, 1);

          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;

          // Foreground depth-of-field soft glow
          if (p.layer === 2) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
          } else {
            ctx.shadowBlur = 0;
          }

          const petalWidth = p.size * 0.65;
          const petalHeight = p.size;
          drawPetal(petalWidth, petalHeight);
          ctx.fill();

          ctx.restore();
        });
      }

      // B. RENDER MOVING BLUEPRINT GRID
      else if (bgStyle === 'grid') {
        gridOffset = (gridOffset + 0.35) % 36;
        ctx.strokeStyle = 'currentColor';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.07;

        for (let x = gridOffset; x < width; x += 36) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = gridOffset; y < height; y += 36) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // C. RENDER INTERACTIVE DOT MATRIX
      else if (bgStyle === 'dots') {
        ctx.fillStyle = 'currentColor';
        ctx.globalAlpha = 0.08;
        const spacing = 28;
        for (let x = spacing / 2; x < width; x += spacing) {
          for (let y = spacing / 2; y < height; y += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // D. RENDER BRUTALIST FLOATING SHAPES
      else if (bgStyle === 'shapes' || bgStyle === 'isometric') {
        shapes.forEach((s) => {
          s.x += s.vx;
          s.y += s.vy;
          s.rotation += s.vRot;

          if (s.x < -50) s.x = width + 50;
          if (s.x > width + 50) s.x = -50;
          if (s.y < -50) s.y = height + 50;
          if (s.y > height + 50) s.y = -50;

          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.rotation);
          ctx.strokeStyle = 'currentColor';
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.08;

          if (s.type === 0) {
            ctx.strokeRect(-s.size / 2, -s.size / 2, s.size, s.size);
          } else if (s.type === 1) {
            ctx.beginPath();
            ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(-s.size / 2, 0);
            ctx.lineTo(s.size / 2, 0);
            ctx.moveTo(0, -s.size / 2);
            ctx.lineTo(0, s.size / 2);
            ctx.stroke();
          }

          ctx.restore();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [bgStyle]);

  if (bgStyle === 'solid') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] text-[var(--neo-text)] select-none"
    />
  );
};
