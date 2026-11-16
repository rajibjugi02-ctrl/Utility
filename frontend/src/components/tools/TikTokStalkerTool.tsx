'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, CheckCircle2, Globe, ExternalLink, Download, Copy, Check, Share2, Heart, Users, Video, UserPlus, Flame, X, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';

const QUICK_CHIPS = ['@iyoiniripyan', '@mrbeast', '@khaby.lame', '@tiktok', '@zachking', '@zaestraa'];

function formatBigNumber(val: number): string {
  if (!val || isNaN(val)) return '0';
  if (val >= 1000000000) return (val / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (val >= 1000000) return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return val.toLocaleString('id-ID');
}

interface StalkResult {
  user: {
    id: string;
    uniqueId: string;
    nickname: string;
    avatarUrl: string;
    rawAvatarUrl: string;
    signature: string;
    verified: boolean;
    privateAccount: boolean;
    region: string;
    joinedDate: string | null;
    bioLink: string | null;
    tiktokUrl: string;
  };
  stats: {
    followerCount: number;
    followingCount: number;
    heartCount: number;
    videoCount: number;
    friendCount: number;
    diggCount: number;
    avgLikesPerVideo: number;
    engagementRatio: string;
  };
}

export const TikTokStalkerTool: React.FC = () => {
  const { prefilledUrl, setPrefilledUrl, addHistoryItem } = useAppStore();
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [sourceEngine, setSourceEngine] = useState<string | null>(null);
  const [result, setResult] = useState<StalkResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefilledUrl) {
      setInputVal(prefilledUrl);
      setPrefilledUrl('');
      handleStalk(prefilledUrl);
    }
  }, [prefilledUrl, setPrefilledUrl]);

  const handleStalk = async (targetUser?: string) => {
    const raw = (targetUser !== undefined ? targetUser : inputVal).trim();
    if (!raw) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setSourceEngine(null);
    setProgress(30);
    setStage(`Mengekstrak data profil TikTok @${raw.replace(/^@/, '')} secara real-time...`);

    try {
      const res = await fetch(`/api/stalk/tiktok?username=${encodeURIComponent(raw)}`);
      setProgress(85);
      const data = await res.json();
      setProgress(100);

      if (data.success && data.data) {
        const userObj = data.data.user || data.data;
        const statsObj = data.data.stats || userObj.stats;
        setResult({ user: userObj, stats: statsObj });
        setSourceEngine(data.sourceEngine || null);
        setStage('Profil berhasil diekstrak!');
        addHistoryItem({
          type: 'tiktok',
          title: `TikTok Stalk: @${userObj.uniqueId}`,
          subtitle: `${formatBigNumber(statsObj.followerCount)} Followers · ${formatBigNumber(
            statsObj.heartCount
          )} Likes`,
          downloadUrl: userObj.tiktokUrl,
        });
      } else {
        setErrorMsg(data.message || 'Username TikTok tidak ditemukan.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi gangguan jaringan saat menghubungi server stalk.');
    } finally {
      setLoading(false);
    }
  };

  const copyProfileSummary = () => {
    if (!result) return;
    const text = `📌 Profil TikTok @${result.user.uniqueId} (${result.user.nickname})
• Followers: ${result.stats.followerCount.toLocaleString('id-ID')}
• Total Likes: ${result.stats.heartCount.toLocaleString('id-ID')}
• Following: ${result.stats.followingCount.toLocaleString('id-ID')}
• Total Video: ${result.stats.videoCount.toLocaleString('id-ID')}
• Rata-rata Likes/Video: ${result.stats.avgLikesPerVideo.toLocaleString('id-ID')}
• Bio: ${result.user.signature || '-'}
🔗 Tautan: ${result.user.tiktokUrl}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Export card as PNG using HTML5 Canvas
  const exportCardAsPng = () => {
    if (!result) return;
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 750;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 800, 750);

    // Draw Card Box
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(30, 30, 740, 690, 24);
    ctx.fill();
    ctx.stroke();

    // Draw Top Brand Pill
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(50, 50, 240, 40, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('TIKTOK PROFILE STALK', 70, 75);

    // Profile Info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(result.user.nickname, 50, 140);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`@${result.user.uniqueId} • Wilayah: ${result.user.region}`, 50, 175);

    // Bio
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px sans-serif';
    const bioText = result.user.signature ? result.user.signature.slice(0, 80) : 'Tidak ada bio';
    ctx.fillText(`Bio: "${bioText}"`, 50, 215);

    // 6 Stats Boxes
    const statsData = [
      { label: 'Followers', val: formatBigNumber(result.stats.followerCount) },
      { label: 'Total Likes', val: formatBigNumber(result.stats.heartCount) },
      { label: 'Following', val: formatBigNumber(result.stats.followingCount) },
      { label: 'Total Videos', val: formatBigNumber(result.stats.videoCount) },
      { label: 'Friends', val: formatBigNumber(result.stats.friendCount) },
      { label: 'Avg Likes/Video', val: formatBigNumber(result.stats.avgLikesPerVideo) },
    ];

    const boxW = 215;
    const boxH = 110;
    const startX = 50;
    const startY = 260;

    statsData.forEach((st, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = startX + col * (boxW + 25);
      const y = startY + row * (boxH + 25);

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, boxW, boxH, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(st.label.toUpperCase(), x + 16, y + 35);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(st.val, x + 16, y + 75);
    });

    // Footer Watermark
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.fillText('Diekstrak secara Real-Time oleh UtilityHub (utilityhub.app)', 50, 680);

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `tiktok-stalk-${result.user.uniqueId}.png`;
    a.click();
  };

  return (
    <div className="space-y-4 pb-16 sm:pb-8">
      {/* Search Bar & Quick Chips */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleStalk();
        }}
        className="space-y-2.5"
      >
        <div className="space-y-1">
          <label className="text-[11px] font-black uppercase tracking-wider text-[var(--neo-text)] block">
            USERNAME AKUN ATAU LINK PROFIL TIKTOK
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-[var(--neo-text-muted)] pointer-events-none">
              <Search className="w-4 h-4" />
            </div>

            <input
              type="text"
              placeholder="Ketik username (contoh: mrbeast, zaestraa) atau link https://www.tiktok.com/@..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl neo-input text-xs sm:text-sm font-medium border-2 border-[var(--neo-border)] bg-[var(--neo-bg)]"
            />

            {inputVal && (
              <button
                type="button"
                onClick={() => setInputVal('')}
                className="absolute right-3 p-1 rounded-full text-[var(--neo-text-muted)] hover:text-[var(--neo-text)]"
                title="Hapus"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !inputVal.trim()}
          className="neo-btn neo-btn-primary w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-neo-sm disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? 'Mengekstrak Profil Real-Time...' : 'Stalk Profil Sekarang'}</span>
        </button>
      </form>

      {/* Quick Try Chips */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--neo-text-muted)]">
          AKUN POPULER CEPAT:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-0.5 px-0.5 whitespace-nowrap">
          {QUICK_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputVal(chip);
                handleStalk(chip);
              }}
              className="neo-btn px-2.5 py-1 rounded-lg text-[11px] sm:text-xs neo-btn-secondary shrink-0 whitespace-nowrap hover:neo-btn-primary transition-all font-mono"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Progress State */}
      {(loading || (progress > 0 && progress < 100)) && (
        <ProcessCard
          stage={stage}
          progress={progress}
          speed="48.2 KB/s"
          eta="00:01"
          isCompleted={progress === 100}
        />
      )}

      {/* Error Message */}
      {errorMsg && !loading && (
        <div className="p-4 rounded-xl border-2 border-rose-500/40 bg-rose-500/10 text-rose-500 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bento Neo-Brutalist Profile Result Card */}
      {result && !loading && (
        <div
          ref={cardRef}
          className="neo-card p-4 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-5 border-2 border-[var(--neo-border)] shadow-neo"
        >
          {/* Top Header Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* HD Avatar with Thick Neo Border & CORS Bypass */}
            <div className="relative shrink-0">
              <img
                src={result.user.avatarUrl || (result.user as any).avatar || result.user.rawAvatarUrl}
                alt={result.user.nickname}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-3 border-[var(--neo-border)] shadow-neo-sm bg-neutral-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${result.user.uniqueId}`;
                }}
              />
              {result.user.verified && (
                <div
                  className="absolute -bottom-1.5 -right-1.5 bg-sky-500 text-white p-1 rounded-full border-2 border-[var(--neo-border)] shadow-sm"
                  title="Akun Terverifikasi (Centang Biru)"
                >
                  <CheckCircle2 className="w-4 h-4 fill-white text-sky-500" />
                </div>
              )}
            </div>

            {/* Profile Identity Details */}
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-base sm:text-xl font-black text-[var(--neo-text)] tracking-tight">
                  {result.user.nickname}
                </h2>

                {result.user.verified && (
                  <span className="neo-badge bg-sky-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full border border-black shadow-sm">
                    Verified
                  </span>
                )}

                <span
                  className={`neo-badge text-[10px] px-2 py-0.5 rounded-full font-bold border border-[var(--neo-border)] ${
                    result.user.privateAccount
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'bg-emerald-500/20 text-emerald-500'
                  }`}
                >
                  {result.user.privateAccount ? '🔒 Privat' : '🌐 Publik'}
                </span>

                <span className="neo-badge bg-[var(--neo-bg)] text-[var(--neo-text-muted)] text-[10px] font-mono border border-[var(--neo-border)]">
                  {result.user.region}
                </span>

                {sourceEngine && (
                  <span className="neo-badge bg-[var(--neo-bg)] text-amber-500 text-[10px] font-mono border border-[var(--neo-border)]">
                    ⚡ {sourceEngine}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm font-mono font-bold text-[var(--neo-accent-text)]">
                @{result.user.uniqueId}
              </p>

              {result.user.id && (
                <p className="text-[10px] font-mono text-[var(--neo-text-muted)]">
                  ID: {result.user.id} {result.user.joinedDate ? `• Gabung: ${result.user.joinedDate}` : ''}
                </p>
              )}

              {/* Bio Box */}
              <div className="p-3 rounded-xl border border-[var(--neo-border)] bg-[var(--neo-bg)] text-xs text-[var(--neo-text)] leading-relaxed whitespace-pre-wrap text-left">
                {result.user.signature ? result.user.signature : <span className="text-[var(--neo-text-muted)] italic">Tidak ada bio.</span>}
              </div>

              {/* External Bio Link if present */}
              {result.user.bioLink && (
                <div className="pt-1">
                  <a
                    href={result.user.bioLink.startsWith('http') ? result.user.bioLink : `https://${result.user.bioLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-500 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="truncate max-w-xs">{result.user.bioLink}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 6 Real-Time Metric Cards (Bento Grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5 pt-1">
            {/* Metric 1: Followers */}
            <div className="p-3 sm:p-4 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] shadow-neo-sm space-y-1">
              <div className="flex items-center gap-1.5 text-rose-500 text-[11px] font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>FOLLOWERS</span>
              </div>
              <div className="text-lg sm:text-2xl font-black font-mono text-[var(--neo-text)]">
                {formatBigNumber(result.stats.followerCount)}
              </div>
              <p className="text-[10px] font-mono text-[var(--neo-text-muted)]">
                {result.stats.followerCount.toLocaleString('id-ID')} akun
              </p>
            </div>

            {/* Metric 2: Total Likes */}
            <div className="p-3 sm:p-4 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] shadow-neo-sm space-y-1">
              <div className="flex items-center gap-1.5 text-red-500 text-[11px] font-bold">
                <Heart className="w-3.5 h-3.5 fill-red-500" />
                <span>TOTAL LIKES</span>
              </div>
              <div className="text-lg sm:text-2xl font-black font-mono text-[var(--neo-text)]">
                {formatBigNumber(result.stats.heartCount)}
              </div>
              <p className="text-[10px] font-mono text-[var(--neo-text-muted)]">
                {result.stats.heartCount.toLocaleString('id-ID')} suka
              </p>
            </div>

            {/* Metric 3: Following */}
            <div className="p-3 sm:p-4 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] shadow-neo-sm space-y-1">
              <div className="flex items-center gap-1.5 text-blue-500 text-[11px] font-bold">
                <UserPlus className="w-3.5 h-3.5" />
                <span>FOLLOWING</span>
              </div>
              <div className="text-lg sm:text-2xl font-black font-mono text-[var(--neo-text)]">
                {formatBigNumber(result.stats.followingCount)}
              </div>
              <p className="text-[10px] font-mono text-[var(--neo-text-muted)]">
                {result.stats.followingCount.toLocaleString('id-ID')} diikuti
              </p>
            </div>

            {/* Metric 4: Total Videos */}
            <div className="p-3 sm:p-4 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] shadow-neo-sm space-y-1">
              <div className="flex items-center gap-1.5 text-purple-500 text-[11px] font-bold">
                <Video className="w-3.5 h-3.5" />
                <span>TOTAL VIDEO</span>
              </div>
              <div className="text-lg sm:text-2xl font-black font-mono text-[var(--neo-text)]">
                {formatBigNumber(result.stats.videoCount)}
              </div>
              <p className="text-[10px] font-mono text-[var(--neo-text-muted)]">
                {result.stats.videoCount.toLocaleString('id-ID')} video post
              </p>
            </div>

            {/* Metric 5: Friends Count */}
            <div className="p-3 sm:p-4 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] shadow-neo-sm space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-500 text-[11px] font-bold">
                <UserCheck className="w-3.5 h-3.5" />
                <span>TEMAN</span>
              </div>
              <div className="text-lg sm:text-2xl font-black font-mono text-[var(--neo-text)]">
                {formatBigNumber(result.stats.friendCount)}
              </div>
              <p className="text-[10px] font-mono text-[var(--neo-text-muted)]">
                {result.stats.friendCount.toLocaleString('id-ID')} mutual
              </p>
            </div>

            {/* Metric 6: Avg Likes / Video */}
            <div className="p-3 sm:p-4 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] shadow-neo-sm space-y-1">
              <div className="flex items-center gap-1.5 text-amber-500 text-[11px] font-bold">
                <Flame className="w-3.5 h-3.5" />
                <span>RATA-RATA LIKES</span>
              </div>
              <div className="text-lg sm:text-2xl font-black font-mono text-[var(--neo-text)]">
                {formatBigNumber(result.stats.avgLikesPerVideo)}
              </div>
              <p className="text-[10px] font-mono text-[var(--neo-text-muted)]">
                Likes per video post
              </p>
            </div>
          </div>

          {/* Real Action Buttons & Export */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            {/* Action 1: Download Avatar HD */}
            {result.user.rawAvatarUrl && (
              <a
                href={result.user.avatarUrl}
                download={`avatar-${result.user.uniqueId}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="neo-btn neo-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Avatar HD (.JPG)</span>
              </a>
            )}

            {/* Action 2: Open TikTok */}
            <a
              href={result.user.tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="neo-btn neo-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di TikTok ↗</span>
            </a>

            {/* Action 3: Copy Summary */}
            <button
              type="button"
              onClick={copyProfileSummary}
              className="neo-btn neo-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Ringkasan Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Ringkasan</span>
                </>
              )}
            </button>

            {/* Action 4: Export Card as PNG */}
            <button
              type="button"
              onClick={exportCardAsPng}
              className="neo-btn neo-btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Export Kartu (.PNG)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
