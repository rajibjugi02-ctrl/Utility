'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, Play, Pause, AlertCircle, HelpCircle, Sparkles, Disc, Clock, Calendar, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ProcessCard } from '../common/ProcessCard';
import { SpotifyTrackDetails } from '@/lib/spotifyClient';

const POPULAR_CHIPS = [
  'YOU - LANY',
  'Home - Michael Bublé',
  'Stay - The Kid LAROI',
  'Birds of a Feather - Billie Eilish',
  'Every Summertime - NIKI',
];

export const SpotifyDownloader: React.FC = () => {
  const { prefilledUrl, setPrefilledUrl, addHistoryItem } = useAppStore();
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrackDetails | null>(null);
  const [candidates, setCandidates] = useState<SpotifyTrackDetails[]>([]);
  const [confident, setConfident] = useState<boolean>(true);
  const [showCandidates, setShowCandidates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Audio preview state (30s official preview)
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (prefilledUrl) {
      setInputVal(prefilledUrl);
      setPrefilledUrl('');
      handleSearch(prefilledUrl);
    }
  }, [prefilledUrl, setPrefilledUrl]);

  useEffect(() => {
    return () => {
      if (audioObj) {
        audioObj.pause();
      }
    };
  }, [audioObj]);

  const handleSearch = async (queryToSearch?: string) => {
    const finalInput = (queryToSearch || inputVal).trim();
    if (!finalInput) return;

    if (audioObj) {
      audioObj.pause();
      setIsPlayingPreview(false);
    }

    setLoading(true);
    setError(null);
    setSelectedTrack(null);
    setCandidates([]);
    setShowCandidates(false);
    setProgress(30);
    setStage(`Memverifikasi metadata resmi Spotify untuk "${finalInput}"...`);

    try {
      const isUrlOrId =
        finalInput.includes('spotify.com') ||
        finalInput.startsWith('spotify:track:') ||
        /^[a-zA-Z0-9]{22}$/.test(finalInput);

      const endpoint = isUrlOrId ? '/api/spotify/track' : '/api/spotify/search';
      const body = isUrlOrId ? { url: finalInput } : { q: finalInput };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setProgress(85);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lagu tidak ditemukan pada Spotify API.');
      }

      const track: SpotifyTrackDetails = data.track;
      const candidateList: SpotifyTrackDetails[] = data.candidates || [track];

      setProgress(100);
      setStage('Lagu berhasil diverifikasi!');
      setSelectedTrack(track);
      setCandidates(candidateList);
      setConfident(data.confident ?? true);

      // Auto-open candidates list if system is not 100% confident
      if (data.confident === false && candidateList.length > 1) {
        setShowCandidates(true);
      }

      addHistoryItem({
        type: 'spotify',
        title: track.name,
        subtitle: `${track.artists.join(', ')} · ${track.durationFormatted}`,
        downloadUrl: track.spotifyUrl,
      });
    } catch (err: any) {
      setError(err.message || 'Lagu tidak ditemukan.');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!selectedTrack) return;
    navigator.clipboard.writeText(selectedTrack.spotifyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const togglePreview = () => {
    if (!selectedTrack?.previewUrl) return;

    if (isPlayingPreview && audioObj) {
      audioObj.pause();
      setIsPlayingPreview(false);
      return;
    }

    if (audioObj) {
      audioObj.pause();
    }

    const audio = new Audio(selectedTrack.previewUrl);
    audio.onended = () => setIsPlayingPreview(false);
    audio.onerror = () => setIsPlayingPreview(false);
    audio.play();
    setAudioObj(audio);
    setIsPlayingPreview(true);
  };

  const selectCandidate = (track: SpotifyTrackDetails) => {
    if (audioObj) {
      audioObj.pause();
      setIsPlayingPreview(false);
    }
    setSelectedTrack(track);
    setShowCandidates(false);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Search Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="space-y-2.5"
      >
        <label className="block text-xs font-bold text-[var(--neo-text)] uppercase tracking-wider">
          Link Spotify, URI, atau Judul Lagu & Artis:
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Contoh: YOU - LANY, open.spotify.com/track/..., atau judul lagu"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl neo-input text-xs sm:text-sm font-medium border-2 border-[var(--neo-border)] bg-[var(--neo-bg)]"
            required
          />
          <button
            type="submit"
            disabled={loading || !inputVal.trim()}
            className="neo-btn neo-btn-primary px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap flex items-center justify-center gap-2 shadow-neo-sm disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Memverifikasi...' : 'Cari Lagu'}</span>
          </button>
        </div>
      </form>

      {/* Popular Chips */}
      <div className="space-y-1.5">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--neo-text-muted)]">
          Contoh Pencarian Akurat:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-0.5 px-0.5 whitespace-nowrap">
          {POPULAR_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputVal(chip);
                handleSearch(chip);
              }}
              className="neo-btn px-2.5 py-1 rounded-lg text-[11px] sm:text-xs neo-btn-secondary shrink-0 whitespace-nowrap hover:neo-btn-primary transition-all"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Card */}
      {(loading || (progress > 0 && progress < 100)) && (
        <ProcessCard
          stage={stage}
          progress={progress}
          speed="32.0 KB/s"
          eta="00:01"
          isCompleted={progress === 100}
          error={error}
        />
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 rounded-xl border-2 border-red-500/40 bg-red-500/10 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-red-600 dark:text-red-400">Lagu Tidak Ditemukan</h4>
            <p className="text-[var(--neo-text-muted)] leading-relaxed">
              {error} Pastikan penulisan judul dan artis sudah benar, atau masukkan tautan langsung Spotify.
            </p>
          </div>
        </div>
      )}

      {/* Verification Card */}
      {selectedTrack && (
        <div className="neo-card p-4 sm:p-6 rounded-2xl bg-[var(--neo-surface)] space-y-4 border-2 border-[var(--neo-border)] shadow-neo">
          {/* Header Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[var(--neo-border)]">
            <span className="neo-badge bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 text-xs font-bold flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5" /> Metadata Terverifikasi Spotify API
            </span>
            <span className="neo-badge bg-[var(--neo-bg)] text-[var(--neo-text-muted)] text-[11px] font-mono">
              ISRC: {selectedTrack.isrc}
            </span>
          </div>

          {/* Main Track Detail Row */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {selectedTrack.album.coverUrl ? (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-2 border-[var(--neo-border)] shadow-neo shrink-0 bg-neutral-900">
                <img
                  src={selectedTrack.album.coverUrl}
                  alt={selectedTrack.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl border-2 border-[var(--neo-border)] bg-neutral-800 flex items-center justify-center text-[var(--neo-text-muted)]">
                Cover tidak tersedia
              </div>
            )}

            <div className="flex-1 text-center sm:text-left space-y-1.5 w-full">
              <h3 className="font-bold text-base sm:text-lg text-[var(--neo-text)] leading-snug">
                {selectedTrack.name}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-[var(--neo-text-muted)]">
                Artis: <span className="text-[var(--neo-text)] font-bold">{selectedTrack.artists.join(', ')}</span>
              </p>
              <p className="text-xs text-[var(--neo-text-muted)]">
                Album: <span className="font-medium text-[var(--neo-text)]">{selectedTrack.album.name}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="neo-badge bg-[var(--neo-bg)] text-[var(--neo-text-muted)] text-[11px]">
                  <Clock className="w-3 h-3 inline mr-1 text-emerald-500" />
                  {selectedTrack.durationFormatted}
                </span>
                <span className="neo-badge bg-[var(--neo-bg)] text-[var(--neo-text-muted)] text-[11px]">
                  <Calendar className="w-3 h-3 inline mr-1 text-amber-500" />
                  Rilis: {selectedTrack.album.releaseDate}
                </span>
              </div>
            </div>
          </div>

          {/* Official Actions */}
          <div className="pt-2 flex flex-wrap gap-2">
            <a
              href={selectedTrack.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="neo-btn neo-btn-primary px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka di Spotify</span>
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="neo-btn neo-btn-secondary px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500">Link Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Link</span>
                </>
              )}
            </button>

            {/* Official 30s preview action (hidden if null) */}
            {selectedTrack.previewUrl && (
              <button
                type="button"
                onClick={togglePreview}
                className="neo-btn neo-btn-secondary px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5"
              >
                {isPlayingPreview ? (
                  <>
                    <Pause className="w-4 h-4 text-amber-500" />
                    <span>Pause Preview (30s)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Preview 30 Detik</span>
                  </>
                )}
              </button>
            )}

            {/* Candidate Selector Toggle */}
            {candidates.length > 1 && (
              <button
                type="button"
                onClick={() => setShowCandidates(!showCandidates)}
                className="neo-btn neo-btn-secondary px-4 py-2 rounded-xl text-xs sm:text-sm font-bold ml-auto flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Bukan lagu ini? ({candidates.length} pilihan)</span>
                {showCandidates ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Candidates Dropdown Selector */}
          {showCandidates && candidates.length > 1 && (
            <div className="p-3.5 rounded-xl border-2 border-[var(--neo-border)] bg-[var(--neo-bg)] space-y-2 mt-3">
              <span className="text-xs font-bold text-[var(--neo-text)] block">
                Pilih lagu yang sesuai dari hasil pencarian Spotify:
              </span>
              <div className="space-y-1.5">
                {candidates.map((cand) => {
                  const isCurrent = cand.id === selectedTrack.id;
                  return (
                    <div
                      key={cand.id}
                      onClick={() => selectCandidate(cand)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        isCurrent
                          ? 'border-[var(--neo-border)] bg-[var(--neo-accent)] text-[var(--neo-accent-text)] font-bold shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-800 bg-[var(--neo-surface)] hover:border-[var(--neo-border)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        {cand.album.coverUrl ? (
                          <img
                            src={cand.album.coverUrl}
                            alt={cand.name}
                            className="w-8 h-8 rounded object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-neutral-700 shrink-0" />
                        )}
                        <div className="truncate text-xs">
                          <p className="font-bold truncate">{cand.name}</p>
                          <p className="text-[11px] opacity-75 truncate">{cand.artists.join(', ')} · {cand.album.name}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono shrink-0 ml-2">
                        {cand.durationFormatted}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legal and Rights Notice */}
          <div className="pt-2 border-t border-[var(--neo-border)]/40 text-[11px] text-[var(--neo-text-muted)] flex items-start gap-1.5 leading-relaxed">
            <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Catatan: Fitur konversi/unduh audio hanya untuk file audio yang Anda unggah sendiri atau file berlisensi bebas (Creative Commons / Public Domain). Gunakan hanya untuk konten yang kamu punya hak untuk mengunduhnya.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
