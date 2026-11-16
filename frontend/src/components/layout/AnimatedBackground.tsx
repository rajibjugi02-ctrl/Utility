'use client';

import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

export const AnimatedBackground: React.FC = () => {
  const { bgStyle } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (bgStyle !== 'shapes') return;

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

    // Floating subtle brutalist geometric shapes
    const shapes = Array.from({ length: 12 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 24 + Math.random() * 36,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      rotation: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 0.01,
      type: Math.floor(Math.random() * 3), // 0: square, 1: circle, 2: cross
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

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
          // Cross
          ctx.beginPath();
          ctx.moveTo(-s.size / 2, 0);
          ctx.lineTo(s.size / 2, 0);
          ctx.moveTo(0, -s.size / 2);
          ctx.lineTo(0, s.size / 2);
          ctx.stroke();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [bgStyle]);

  if (bgStyle !== 'shapes') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 text-[var(--neo-text)]"
    />
  );
};
