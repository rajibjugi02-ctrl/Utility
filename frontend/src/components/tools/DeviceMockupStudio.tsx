'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Smartphone, Laptop, Globe } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

type DeviceType = 'iphone' | 'macbook' | 'browser';

interface BgPreset {
  id: string;
  name: string;
  gradient: string[];
}

const BG_PRESETS: BgPreset[] = [
  { id: 'neo-dark', name: 'Neo Dark', gradient: ['#121212', '#18181B'] },
  { id: 'mesh-purple', name: 'Purple Neon', gradient: ['#312E81', '#4F46E5'] },
  { id: 'sunset', name: 'Sunset Amber', gradient: ['#881337', '#BE185D'] },
  { id: 'emerald', name: 'Emerald Clean', gradient: ['#064E3B', '#059669'] },
  { id: 'paper', name: 'Paper White', gradient: ['#F4F4F0', '#FFFFFF'] },
];

export const DeviceMockupStudio: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceType>('iphone');
  const [selectedBg, setSelectedBg] = useState<string>('mesh-purple');
  const [padding, setPadding] = useState<number>(60);
  const [hasShadow, setHasShadow] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addHistoryItem } = useAppStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    renderMockup();
  }, [imageSrc, device, selectedBg, padding, hasShadow]);

  const renderMockup = () => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Determine screen dimensions based on device
      let screenW = 600;
      let screenH = 900;
      if (device === 'iphone') {
        screenW = 420;
        screenH = 880;
      } else if (device === 'macbook') {
        screenW = 800;
        screenH = 500;
      } else if (device === 'browser') {
        screenW = 750;
        screenH = 520;
      }

      const totalW = screenW + padding * 2;
      const totalH = screenH + padding * 2;
      canvas.width = totalW;
      canvas.height = totalH;

      // Draw background gradient
      const bg = BG_PRESETS.find((b) => b.id === selectedBg) || BG_PRESETS[0];
      const grad = ctx.createLinearGradient(0, 0, totalW, totalH);
      grad.addColorStop(0, bg.gradient[0]);
      grad.addColorStop(1, bg.gradient[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, totalW, totalH);

      const x = padding;
      const y = padding;

      // Draw Shadow if enabled
      if (hasShadow) {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 20;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.roundRect(x, y, screenW, screenH, device === 'iphone' ? 44 : 16);
        ctx.fill();
        ctx.restore();
      }

      // ================= DRAW DEVICE 1: IPHONE 16 PRO =================
      if (device === 'iphone') {
        const radius = 48;
        // Outer chassis
        ctx.fillStyle = '#1C1917';
        ctx.beginPath();
        ctx.roundRect(x - 10, y - 10, screenW + 20, screenH + 20, radius);
        ctx.fill();
        ctx.strokeStyle = '#44403C';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Screen bezel
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, screenW, screenH, radius - 6);
        ctx.clip();

        // Draw screenshot inside screen
        ctx.drawImage(img, x, y, screenW, screenH);

        // Dynamic Island
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.roundRect(x + (screenW - 110) / 2, y + 15, 110, 32, 16);
        ctx.fill();

        // Speaker camera dot
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.arc(x + screenW / 2 + 35, y + 31, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ================= DRAW DEVICE 2: MACBOOK PRO =================
      else if (device === 'macbook') {
        const radius = 16;
        // Screen chassis
        ctx.fillStyle = '#18181B';
        ctx.beginPath();
        ctx.roundRect(x, y, screenW, screenH - 24, radius);
        ctx.fill();
        ctx.strokeStyle = '#27272A';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Screen content
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x + 10, y + 10, screenW - 20, screenH - 44, 8);
        ctx.clip();
        ctx.drawImage(img, x + 10, y + 10, screenW - 20, screenH - 44);

        // MacBook Notch
        ctx.fillStyle = '#18181B';
        ctx.beginPath();
        ctx.roundRect(x + (screenW - 120) / 2, y + 10, 120, 18, [0, 0, 8, 8]);
        ctx.fill();
        ctx.restore();

        // Keyboard Base Lip
        const baseH = 20;
        const baseY = y + screenH - 24;
        ctx.fillStyle = '#27272A';
        ctx.beginPath();
        ctx.roundRect(x - 30, baseY, screenW + 60, baseH, [0, 0, 10, 10]);
        ctx.fill();

        // Trackpad notch lip
        ctx.fillStyle = '#09090B';
        ctx.beginPath();
        ctx.roundRect(x + (screenW - 100) / 2, baseY, 100, 5, [0, 0, 4, 4]);
        ctx.fill();
      }

      // ================= DRAW DEVICE 3: BROWSER WINDOW =================
      else if (device === 'browser') {
        const radius = 16;
        const headerH = 44;

        // Window background
        ctx.fillStyle = '#18181B';
        ctx.beginPath();
        ctx.roundRect(x, y, screenW, screenH, radius);
        ctx.fill();
        ctx.strokeStyle = '#27272A';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Header Traffic Lights
        const lightY = y + 22;
        ctx.fillStyle = '#EF4444'; // Red
        ctx.beginPath();
        ctx.arc(x + 22, lightY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#F59E0B'; // Yellow
        ctx.beginPath();
        ctx.arc(x + 40, lightY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10B981'; // Green
        ctx.beginPath();
        ctx.arc(x + 58, lightY, 6, 0, Math.PI * 2);
        ctx.fill();

        // URL Search Bar
        ctx.fillStyle = '#27272A';
        ctx.beginPath();
        ctx.roundRect(x + 90, y + 11, screenW - 140, 22, 6);
        ctx.fill();

        ctx.fillStyle = '#A1A1AA';
        ctx.font = '11px monospace';
        ctx.fillText('https://utilityhub.app', x + 105, y + 26);

        // Webpage Content
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y + headerH, screenW, screenH - headerH, [0, 0, radius, radius]);
        ctx.clip();
        ctx.drawImage(img, x, y + headerH, screenW, screenH - headerH);
        ctx.restore();
      }
    };
    img.src = imageSrc;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Mockup_${device.toUpperCase()}_HD.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    addHistoryItem({
      toolId: 'device-mockup-studio',
      toolName: 'Device Mockup Frame Studio',
      title: `Mockup ${device.toUpperCase()} Frame`,
      type: 'image',
      downloadUrl: dataUrl,
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[var(--neo-border)] rounded-2xl p-6 text-center hover:border-[var(--neo-border-active)] transition-colors cursor-pointer bg-[var(--neo-bg)] space-y-2"
      >
        <div className="w-12 h-12 mx-auto rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-surface)] flex items-center justify-center text-blue-500 shadow-neo">
          <Smartphone className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-[var(--neo-text)]">
            {imageFile ? imageFile.name : 'Pilih atau Tarik Screenshot Desain / Aplikasi'}
          </p>
          <p className="text-[11px] text-[var(--neo-text-muted)] mt-0.5">
            Bungkus ke dalam bingkai realistis iPhone 16 Pro, MacBook Pro, atau Jendela Browser
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {imageSrc && (
        <div className="neo-card p-5 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5">
          {/* Controls: Device & Background Preset */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b-2 border-[var(--neo-border)]">
            {/* Device Choice */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[var(--neo-text)]">Pilih Bingkai Perangkat:</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'iphone', name: 'iPhone 16 Pro', icon: Smartphone },
                  { id: 'macbook', name: 'MacBook Pro', icon: Laptop },
                  { id: 'browser', name: 'Browser Window', icon: Globe },
                ].map((d) => {
                  const Icon = d.icon;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDevice(d.id as DeviceType)}
                      className={`p-2 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        device === d.id
                          ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)]'
                          : 'border-[var(--neo-border)] bg-[var(--neo-bg)] text-[var(--neo-text)] hover:border-[var(--neo-border-active)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{d.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background Preset */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[var(--neo-text)]">Latar Belakang Canvas:</span>
              <div className="flex flex-wrap gap-2">
                {BG_PRESETS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBg(b.id)}
                    className={`px-2.5 py-1.5 rounded-xl border-2 text-[10px] font-bold transition-all ${
                      selectedBg === b.id
                        ? 'border-amber-400 scale-105 shadow-sm text-white'
                        : 'border-[var(--neo-border)] text-[var(--neo-text)]'
                    }`}
                    style={{ background: `linear-gradient(135deg, ${b.gradient[0]}, ${b.gradient[1]})` }}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Padding & Shadow Slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)]">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span>Padding Canvas:</span>
                <span className="font-bold">{padding}px</span>
              </div>
              <input
                type="range"
                min="30"
                max="120"
                step="5"
                value={padding}
                onChange={(e) => setPadding(parseInt(e.target.value))}
                className="w-full accent-[var(--neo-text)] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold">
              <span>Bayangan 3D Realistis:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasShadow}
                  onChange={(e) => setHasShadow(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded"
                />
                <span>Aktifkan</span>
              </label>
            </div>
          </div>

          {/* Canvas Live Preview */}
          <div className="flex flex-col items-center space-y-3 pt-2">
            <span className="text-[11px] font-mono text-[var(--neo-text-muted)]">
              Preview Hasil Mockup HD
            </span>

            <div className="rounded-2xl border-2 border-[var(--neo-border)] overflow-hidden shadow-neo max-w-full">
              <canvas
                ref={canvasRef}
                className="max-h-[460px] w-auto object-contain block"
              />
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="neo-btn neo-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Mockup HD (.PNG)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
