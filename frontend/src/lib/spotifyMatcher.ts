import { SpotifyTrackDetails } from './spotifyClient';

export interface ScoredCandidate {
  track: SpotifyTrackDetails;
  score: number;
  matchReasons: string[];
}

export interface MatchResult {
  bestMatch: SpotifyTrackDetails | null;
  candidates: SpotifyTrackDetails[];
  confident: boolean;
  queryInfo: {
    raw: string;
    parsedTitle: string;
    parsedArtist?: string;
    isDirectId: boolean;
    trackId?: string;
  };
}

const DISALLOWED_PENALTY_KEYWORDS = [
  'cover',
  'remix',
  'sped up',
  'speed up',
  'slowed',
  'reverb',
  'nightcore',
  'karaoke',
  'instrumental',
  'live',
  'acoustic',
  '8d',
  'tribute',
  'originally performed by',
];

// Clean text by stripping punctuation, emojis, and boilerplate version tags
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\((?:feat|ft)\.[^)]*\)/gi, '')
    .replace(/\[(?:feat|ft)\.[^\]]*\]/gi, '')
    .replace(/(?:feat|ft)\.[^,\-\s]+/gi, '')
    .replace(/-(?:\s*remaster(?:ed)?|\s*single version|\s*radio edit|\s*deluxe).*$/gi, '')
    .replace(/\((?:remaster(?:ed)?|deluxe|version|edit)[^)]*\)/gi, '')
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse user input into structured target
export function parseSpotifyInput(raw: string): {
  isDirectId: boolean;
  trackId?: string;
  title: string;
  artist?: string;
} {
  const clean = raw.trim();

  // Match Spotify URL
  const urlMatch = clean.match(/(?:open\.spotify\.com\/track\/|spotify:track:)([a-zA-Z0-9]{22})/);
  if (urlMatch && urlMatch[1]) {
    return { isDirectId: true, trackId: urlMatch[1], title: '' };
  }

  // Match 22-char base62 ID directly
  if (/^[a-zA-Z0-9]{22}$/.test(clean)) {
    return { isDirectId: true, trackId: clean, title: '' };
  }

  // Parse "Judul - Artis" or "Artis - Judul"
  if (clean.includes(' - ')) {
    const parts = clean.split(' - ').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return {
        isDirectId: false,
        title: parts[0],
        artist: parts[1],
      };
    }
  }

  // Parse "Judul by Artis"
  const byMatch = clean.match(/^(.+?)\s+by\s+(.+)$/i);
  if (byMatch) {
    return {
      isDirectId: false,
      title: byMatch[1].trim(),
      artist: byMatch[2].trim(),
    };
  }

  return {
    isDirectId: false,
    title: clean,
  };
}

// Calculates match score for a candidate
export function scoreCandidate(
  track: SpotifyTrackDetails,
  expectedTitle: string,
  expectedArtist?: string
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const normTargetTitle = normalizeText(expectedTitle);
  const normTrackTitle = normalizeText(track.name);
  const normTargetArtist = expectedArtist ? normalizeText(expectedArtist) : '';
  const trackArtistNames = track.artists.map(normalizeText);

  // 1. Mandatory Artist Check if specified
  if (normTargetArtist) {
    const artistMatches = trackArtistNames.some(
      (a) => a === normTargetArtist || a.includes(normTargetArtist) || normTargetArtist.includes(a)
    );

    if (!artistMatches) {
      // Discard candidate if artist was explicitly requested but does not match
      return { score: 0, reasons: ['Artis tidak cocok'] };
    }
    score += 50;
    reasons.push('Artis cocok persis (+50)');
  }

  // 2. Title Matching
  if (normTrackTitle === normTargetTitle) {
    score += 50;
    reasons.push('Judul persis (+50)');
  } else if (
    normTrackTitle.startsWith(normTargetTitle) ||
    normTargetTitle.startsWith(normTrackTitle)
  ) {
    score += 35;
    reasons.push('Judul awalan cocok (+35)');
  } else if (normTrackTitle.includes(normTargetTitle)) {
    score += 20;
    reasons.push('Judul sebagian cocok (+20)');
  }

  // 3. Penalty for Disallowed Words (cover, karaoke, remix, etc.)
  for (const kw of DISALLOWED_PENALTY_KEYWORDS) {
    const inTrack = normTrackTitle.includes(kw);
    const inTarget = normTargetTitle.includes(kw);

    if (inTrack && !inTarget) {
      score -= 40;
      reasons.push(`Penalti keyword ${kw} (-40)`);
    }
  }

  // 4. Bonus for Album / Single vs Compilation
  if (track.album.albumType === 'album' || track.album.albumType === 'single') {
    score += 10;
    reasons.push('Rilisan album/single resmi (+10)');
  }

  // 5. Popularity Bonus (0 - 10)
  const popBonus = Math.round((track.popularity || 0) / 10);
  score += popBonus;
  if (popBonus > 0) {
    reasons.push(`Bonus popularitas (+${popBonus})`);
  }

  return {
    score: Math.max(0, score),
    reasons,
  };
}

// Ranks candidates and evaluates confidence
export function rankSpotifyCandidates(
  candidates: SpotifyTrackDetails[],
  expectedTitle: string,
  expectedArtist?: string
): { bestMatch: SpotifyTrackDetails | null; sortedCandidates: SpotifyTrackDetails[]; confident: boolean } {
  if (!candidates || candidates.length === 0) {
    return { bestMatch: null, sortedCandidates: [], confident: false };
  }

  const scored: ScoredCandidate[] = candidates
    .map((track) => {
      const res = scoreCandidate(track, expectedTitle, expectedArtist);
      return {
        track,
        score: res.score,
        matchReasons: res.reasons,
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { bestMatch: null, sortedCandidates: [], confident: false };
  }

  const best = scored[0];
  const second = scored[1];

  // High confidence if score >= 75 and significant lead over second place
  const confident =
    best.score >= 75 && (!second || best.score - second.score >= 15);

  return {
    bestMatch: best.track,
    sortedCandidates: scored.map((s) => s.track),
    confident,
  };
}
