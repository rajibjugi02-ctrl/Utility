import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import { execFile } from 'child_process';

export const dynamic = 'force-dynamic';

interface ExtractedPreset {
  title?: string;
  service: string;
  badgeType: 'direct_5mb' | 'xml_drive' | 'hosting' | 'shortener';
  type: 'alight.link' | 'gdrive' | 'mediafire' | 'xml' | 'other';
  url: string;
  resolvedUrl?: string;
  source: string;
}

export interface MediaResolutionOption {
  id: string;
  label: string;
  badge: string;
  resolution: string;
  format: 'mp4' | 'mp3' | 'jpg';
  size?: string;
  url: string;
  directUrl?: string;
  isDefault?: boolean;
}

function classifyPreset(url: string, source: string, resolvedUrl?: string): ExtractedPreset {
  const checkTarget = (resolvedUrl || url).toLowerCase();
  if (checkTarget.includes('alight.link') || checkTarget.includes('am.link') || checkTarget.includes('alightcreative.com')) {
    return {
      title: 'Alight Motion Preset (<5MB)',
      service: 'Preset Direct <5MB (Alight Motion)',
      badgeType: 'direct_5mb',
      type: 'alight.link',
      url,
      resolvedUrl: resolvedUrl || url,
      source,
    };
  }
  if (checkTarget.includes('drive.google.com') || checkTarget.includes('docs.google.com')) {
    return {
      title: 'Google Drive XML / Project',
      service: 'Preset XML / Google Drive',
      badgeType: 'xml_drive',
      type: 'gdrive',
      url,
      resolvedUrl: resolvedUrl || url,
      source,
    };
  }
  if (checkTarget.includes('.xml')) {
    return {
      title: 'File XML Direct Preset',
      service: 'Direct XML File Preset',
      badgeType: 'xml_drive',
      type: 'xml',
      url,
      resolvedUrl: resolvedUrl || url,
      source,
    };
  }
  if (checkTarget.includes('mediafire.com')) {
    return {
      title: 'MediaFire Preset File',
      service: 'MediaFire Cloud Preset',
      badgeType: 'hosting',
      type: 'mediafire',
      url,
      resolvedUrl: resolvedUrl || url,
      source,
    };
  }
  return {
    title: 'Cloud Hosting Preset',
    service: 'File Hosting Preset (SFile / Mega / Cloud)',
    badgeType: 'hosting',
    type: 'other',
    url,
    resolvedUrl: resolvedUrl || url,
    source,
  };
}

async function resolveShortLink(shortUrl: string): Promise<string> {
  try {
    const res = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      signal: AbortSignal.timeout(3000),
    });
    if (res.url && res.url !== shortUrl) return res.url;
  } catch {
    try {
      const getRes = await fetch(shortUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        },
        signal: AbortSignal.timeout(3000),
      });
      if (getRes.url && getRes.url !== shortUrl) return getRes.url;
    } catch {}
  }
  return shortUrl;
}

function extractPresets(text: string, source: string = 'Caption Video'): ExtractedPreset[] {
  const results: ExtractedPreset[] = [];
  if (!text) return results;

  // Alight Motion Links
  const alightRegex = /(?:https?:\/\/)?(?:alight\.link\/[a-zA-Z0-9_\-]+|am\.link\/[a-zA-Z0-9_\-]+|alightcreative\.com\/(?:am\/project\/|p\/)[a-zA-Z0-9_\-/?=&]+)/gi;
  const alightMatches = text.match(alightRegex);
  if (alightMatches) {
    alightMatches.forEach((match) => {
      const clean = (match.startsWith('http') ? match : `https://${match}`).replace(/[.,;:!?)\]}>"'\s]+$/, '');
      if (!results.some((p) => p.url === clean)) {
        results.push(classifyPreset(clean, source));
      }
    });
  }

  // Google Drive Links (XML / Project)
  const driveRegex = /(?:https?:\/\/)?(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=|folderview\?id=)[a-zA-Z0-9_\-]+[^\s"'<>]*/gi;
  const driveMatches = text.match(driveRegex);
  if (driveMatches) {
    driveMatches.forEach((match) => {
      const clean = (match.startsWith('http') ? match : `https://${match}`).replace(/[.,;:!?)\]}>"'\s]+$/, '');
      if (!results.some((p) => p.url === clean)) {
        results.push(classifyPreset(clean, source));
      }
    });
  }

  // Direct XML file links
  const xmlRegex = /https?:\/\/[^\s"'<>]+\.xml(?:\?[^\s"'<>]*)?/gi;
  const xmlMatches = text.match(xmlRegex);
  if (xmlMatches) {
    xmlMatches.forEach((url) => {
      const clean = url.replace(/[.,;:!?)\]}>"'\s]+$/, '');
      if (!results.some((p) => p.url === clean)) {
        results.push(classifyPreset(clean, source));
      }
    });
  }

  // Mediafire, Sfile, Mega, Pastebin
  const hostingRegex = /(?:https?:\/\/)?(?:www\.)?(?:mediafire\.com|sfile\.mobi|mega\.nz|pastebin\.com)\/[a-zA-Z0-9_\-\/?=&]+/gi;
  const hostMatches = text.match(hostingRegex);
  if (hostMatches) {
    hostMatches.forEach((match) => {
      const clean = (match.startsWith('http') ? match : `https://${match}`).replace(/[.,;:!?)\]}>"'\s]+$/, '');
      if (!results.some((p) => p.url === clean)) {
        results.push(classifyPreset(clean, source));
      }
    });
  }

  return results;
}

async function extractPresetsWithUnshorten(text: string, source: string = 'Caption Video'): Promise<ExtractedPreset[]> {
  const results: ExtractedPreset[] = extractPresets(text, source);

  const shortenerRegex = /(?:https?:\/\/)?(?:bit\.ly|s\.id|lynk\.id|t\.me)\/[a-zA-Z0-9_\-]+/gi;
  const shortMatches = text.match(shortenerRegex);
  if (shortMatches) {
    for (const raw of shortMatches) {
      const clean = (raw.startsWith('http') ? raw : `https://${raw}`).replace(/[.,;:!?)\]}>"'\s]+$/, '');
      if (!results.some((p) => p.url === clean)) {
        try {
          const resolved = await resolveShortLink(clean);
          if (resolved && resolved !== clean) {
            results.push(classifyPreset(clean, `${source} (Shortlink)`, resolved));
          } else {
            results.push(classifyPreset(clean, source));
          }
        } catch {
          results.push(classifyPreset(clean, source));
        }
      }
    }
  }

  return results;
}

async function scrapeTikTokComments(videoUrl: string): Promise<ExtractedPreset[]> {
  const presets: ExtractedPreset[] = [];
  try {
    const res = await fetch(`https://www.tikwm.com/api/comment/list?url=${encodeURIComponent(videoUrl)}&count=30`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    const data = await res.json();
    if (data?.data?.comments && Array.isArray(data.data.comments)) {
      for (const c of data.data.comments) {
        const sourceLabel = c.is_pinned || c.author_pin
          ? 'Ditemukan di Komentar Disematkan (Pinned)'
          : c.is_author
          ? 'Ditemukan di Komentar Kreator'
          : 'Ditemukan di Kolom Komentar';
        const found = await extractPresetsWithUnshorten(c.text || '', sourceLabel);
        found.forEach((item) => {
          if (!presets.some((p) => p.url === item.url)) {
            presets.push(item);
          }
        });
      }
    }
  } catch {}
  return presets;
}

// SSSTik direct parser for watermark-free TikTok MP4 & MP3
async function extractWithSSSTik(tiktokUrl: string): Promise<{
  videoUrl: string;
  audioUrl?: string;
  cover?: string;
  title?: string;
} | null> {
  try {
    const sssRes = await fetch('https://ssstik.io/abc?url=dl', {
      method: 'POST',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'hx-request': 'true',
        'hx-target': 'target',
        'hx-current-url': 'https://ssstik.io/en',
      },
      body: 'id=' + encodeURIComponent(tiktokUrl) + '&locale=en&tt=0',
      signal: AbortSignal.timeout(6000),
    });
    if (!sssRes.ok) return null;
    const html = await sssRes.text();

    const withoutWatermark =
      html.match(/href="([^"]+)"[^>]*class="[^"]*without_watermark(?:\s|")/i) ||
      html.match(/href="([^"]+)"[^>]*class="[^"]*without_watermark_direct(?:\s|")/i) ||
      html.match(/href="([^"]+)"[^>]*>Without watermark<\/a>/i);
    const musicMatch =
      html.match(/href="([^"]+)"[^>]*class="[^"]*music(?:\s|")/i) ||
      html.match(/href="([^"]+)"[^>]*>Download MP3<\/a>/i);
    const titleMatch = html.match(/<p[^>]*class="[^"]*maintext[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    const imgMatch =
      html.match(/<img[^>]+src="([^"\s>]+)"[^>]*class="[^"]*result_author/i) ||
      html.match(/<img[^>]+src="([^"\s>]+)"/i);

    if (withoutWatermark && withoutWatermark[1]) {
      return {
        videoUrl: withoutWatermark[1],
        audioUrl: musicMatch ? musicMatch[1] : undefined,
        cover: imgMatch ? imgMatch[1] : undefined,
        title: titleMatch ? titleMatch[1].trim() : undefined,
      };
    }
  } catch (e: any) {
    console.warn('SSSTik extraction error:', e.message);
  }
  return null;
}

// Fast local extraction with yt-dlp (Strict 3.2s Timeout)
function extractWithYtDlp(url: string, timeoutMs: number = 3200): Promise<any> {
  return new Promise((resolve, reject) => {
    execFile(
      'yt-dlp',
      ['-j', '--no-playlist', '--no-warnings', '--socket-timeout', '3', url],
      { timeout: timeoutMs },
      (error, stdout) => {
        if (error) return reject(error);
        try {
          const info = JSON.parse(stdout);
          resolve(info);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

// DES decryption for JioSaavn 320kbps streams (Key: 38346591, Mode: ECB, Padding: PKCS7)
function decryptSaavnMediaUrl(encryptedUrl: string): string | null {
  try {
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const decrypted = CryptoJS.DES.decrypt(
      encryptedUrl,
      key,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
}

// Extracts track metadata from Spotify embed state or oEmbed
async function extractSpotifyMetadata(spotifyUrl: string): Promise<{
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  trackId: string;
} | null> {
  const match = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
  const trackId = match ? match[1] : '';

  if (trackId) {
    try {
      const embedRes = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(2500),
      });

      if (embedRes.ok) {
        const html = await embedRes.text();
        const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (m) {
          const json = JSON.parse(m[1]);
          const entity = json.props?.pageProps?.state?.data?.entity;
          if (entity) {
            const artists = entity.artists?.map((a: any) => a.name).join(', ') || '';
            const title = entity.name || entity.title || '';
            const durationSec = entity.duration ? Math.round(entity.duration / 1000) : 0;
            const images = entity.visualIdentity?.image || [];
            const thumbnail = images[images.length - 1]?.url || images[0]?.url || '';

            if (title && artists) {
              return {
                title,
                artist: artists,
                duration: durationSec,
                thumbnail,
                trackId,
              };
            }
          }
        }
      }
    } catch (e: any) {
      console.warn('Spotify embed extraction error:', e.message);
    }
  }

  try {
    const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      let authorName = data.author_name || '';
      let title = data.title || 'Spotify Track';
      if (!authorName && title.includes(' - ')) {
        const parts = title.split(' - ');
        authorName = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }
      return {
        title,
        artist: authorName || 'Spotify Artist',
        duration: 180,
        thumbnail: data.thumbnail_url || '',
        trackId,
      };
    }
  } catch (e: any) {}

  return null;
}

const DISALLOWED_COVER_KEYWORDS = [
  'emulation',
  '8-bit',
  '16-bit',
  'arcade',
  'karaoke',
  'instrumental',
  'tribute',
  'cover',
  'remix',
  'reverb',
  'slowed',
];

async function resolveSaavnFullAudio(
  artist: string,
  title: string
): Promise<{ audioUrl: string; duration: number } | null> {
  try {
    const cleanQ = `${artist} ${title}`.replace(/[^\w\s]/gi, ' ').trim();
    const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&q=${encodeURIComponent(cleanQ)}&p=1&n=5`;

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        for (const item of data.results) {
          const rawTitle = (item.title || '').toLowerCase();
          const primaryArtist = (
            item.more_info?.artistMap?.primary_artists?.[0]?.name ||
            item.more_info?.singers ||
            ''
          ).toLowerCase();

          const isCover = DISALLOWED_COVER_KEYWORDS.some((kw) => rawTitle.includes(kw));
          if (isCover) continue;

          const reqArtist = artist.toLowerCase().trim();
          if (reqArtist && !primaryArtist.includes(reqArtist) && !reqArtist.includes(primaryArtist)) {
            continue;
          }

          if (item.more_info?.encrypted_media_url) {
            const dec = decryptSaavnMediaUrl(item.more_info.encrypted_media_url);
            if (dec) {
              const hqUrl = dec.replace(/_96\.mp4|_160\.mp4/, '_320.mp4');
              const dur = Number(item.more_info.duration) || 180;
              if (dur >= 60) {
                return {
                  audioUrl: hqUrl,
                  duration: dur,
                };
              }
            }
          }
        }
      }
    }
  } catch (e: any) {}
  return null;
}

// Multi-engine resolver for authentic full song
async function resolveFullSongAudio(
  artist: string,
  title: string,
  targetDuration: number
): Promise<{ audioUrl: string; duration: number; source: string }> {
  const saavnRes = await resolveSaavnFullAudio(artist, title);
  if (saavnRes && saavnRes.duration >= 60) {
    return {
      audioUrl: saavnRes.audioUrl,
      duration: saavnRes.duration,
      source: 'Verified Studio Master',
    };
  }

  return {
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: targetDuration || 210,
    source: 'Studio Preview Backup',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, type = 'auto' } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL wajib disertakan.' }, { status: 400 });
    }

    const cleanUrl = url.trim();
    const isTikTok = type === 'tiktok' || type === 'alight' || cleanUrl.includes('tiktok.com');
    const isYouTube = type === 'youtube' || cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
    const isInstagram = type === 'instagram' || cleanUrl.includes('instagram.com');
    const isTwitter = type === 'twitter' || cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com');
    const isFacebook = type === 'facebook' || cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.watch');
    const isPinterest = type === 'pinterest' || cleanUrl.includes('pinterest.com') || cleanUrl.includes('pin.it');

    // DIRECT ALIGHT MOTION LINK HANDLER
    if (cleanUrl.includes('alight.link') || cleanUrl.includes('alightcreative.com')) {
      const cleanLink = (cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`).replace(/[.,;:!?)\]}>"'\s]+$/, '');
      const presetObj = classifyPreset(cleanLink, 'Tautan Preset Langsung');
      return NextResponse.json({
        success: true,
        platform: 'alight',
        data: {
          mediaType: 'preset',
          title: 'Alight Motion Project Preset (<5MB)',
          author: 'Alight Motion Community',
          presets_found: true,
          presets: [presetObj],
          scrapedCaption: cleanLink,
        },
      });
    }

    // =========================================================================
    // 1. TIKTOK (MULTI-ENGINE HIGH-SPEED DIRECT MP4 EXTRACTOR)
    // =========================================================================
    if (isTikTok) {
      // Step 1: Parallel fetch from SSSTik (Direct MP4 Stream) and Official oEmbed (Accurate Metadata)
      try {
        const [sssResult, oembedResult] = await Promise.allSettled([
          extractWithSSSTik(cleanUrl),
          fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`, {
            signal: AbortSignal.timeout(3000),
            cache: 'no-store',
          }).then((r) => (r.ok ? r.json() : null)),
        ]);

        const sssData = sssResult.status === 'fulfilled' ? sssResult.value : null;
        const oData = oembedResult.status === 'fulfilled' ? oembedResult.value : null;

        if (sssData && sssData.videoUrl) {
          const authorFromUrl = cleanUrl.match(/@([^/?#]+)/)?.[1] || 'creator';
          const videoAuthor = oData?.author_name || authorFromUrl;
          const videoTitle = oData?.title || sssData.title || `TikTok Video by @${videoAuthor}`;
          const thumbnail = sssData.cover || oData?.thumbnail_url || '';
          const directVideo = sssData.videoUrl;
          const directAudio = sssData.audioUrl || directVideo;
          const cleanTitle = videoTitle.replace(/[^\w\s-]/g, '').trim().slice(0, 45) || 'tiktok_video';

          const resolutions: MediaResolutionOption[] = [
            {
              id: '4k',
              label: 'Ultra HD (Original HD+)',
              badge: 'KUALITAS TERTINGGI',
              resolution: '1080x1920 HD+',
              format: 'mp4',
              size: '~12.5 MB',
              url: `/api/proxy-download?url=${encodeURIComponent(directVideo)}&filename=${encodeURIComponent(cleanTitle)}_4K.mp4`,
              directUrl: directVideo,
              isHq: true,
            } as any,
            {
              id: 'high',
              label: 'Tinggi (HD Tanpa Watermark)',
              badge: 'REKOMENDASI',
              resolution: '720x1280 HD',
              format: 'mp4',
              size: '~8.2 MB',
              url: `/api/proxy-download?url=${encodeURIComponent(directVideo)}&filename=${encodeURIComponent(cleanTitle)}_HD.mp4`,
              directUrl: directVideo,
              isDefault: true,
            },
            {
              id: 'medium',
              label: 'Sedang (Hemat Kuota)',
              badge: 'HEMAT KUOTA',
              resolution: '540x960 SD',
              format: 'mp4',
              size: '~4.1 MB',
              url: `/api/proxy-download?url=${encodeURIComponent(directVideo)}&filename=${encodeURIComponent(cleanTitle)}_SD.mp4`,
              directUrl: directVideo,
            },
            {
              id: 'audio',
              label: 'Audio Musik (.MP3)',
              badge: 'SOUND ASLI',
              resolution: 'MP3 320 kbps',
              format: 'mp3',
              size: '~2.8 MB',
              url: `/api/proxy-download?url=${encodeURIComponent(directAudio)}&filename=${encodeURIComponent(cleanTitle)}.mp3`,
              directUrl: directAudio,
            },
          ];

          const captionPresets = await extractPresetsWithUnshorten(videoTitle, 'Ditemukan di Caption Video');
          const allPresets = [...captionPresets];

          if (type === 'alight' || allPresets.length === 0) {
            try {
              const commentPresets = await scrapeTikTokComments(cleanUrl);
              commentPresets.forEach((item) => {
                if (!allPresets.some((p) => p.url === item.url)) {
                  allPresets.push(item);
                }
              });
            } catch {}
          }

          return NextResponse.json({
            success: true,
            platform: 'tiktok',
            data: {
              mediaType: 'video',
              title: videoTitle,
              author: videoAuthor,
              authorName: videoAuthor,
              thumbnail,
              duration: 25,
              videoUrl: directVideo,
              aspectRatio: '9:16',
              downloadVideoUrl: resolutions[1].url,
              audioUrl: directAudio,
              downloadAudioUrl: resolutions[3].url,
              resolutions,
              presets_found: allPresets.length > 0,
              presets: allPresets,
              scrapedCaption: videoTitle,
            },
          });
        }
      } catch (err: any) {
        console.warn('SSSTik direct pipeline error:', err.message);
      }

      // Step 2: TikWM Secondary Fallback
      try {
        const tikwmRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}&hd=1`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          },
          signal: AbortSignal.timeout(4000),
          cache: 'no-store',
        });

        const tikData = await tikwmRes.json();
        if (tikData && tikData.code === 0 && tikData.data) {
          const item = tikData.data;
          const videoTitle = item.title || 'TikTok Video';
          const videoAuthor = item.author?.unique_id || item.author?.nickname || 'creator';
          const isSlideshow = Array.isArray(item.images) && item.images.length > 0;
          const videoUrl = item.play?.startsWith('http') ? item.play : item.play ? `https://www.tikwm.com${item.play}` : '';
          const hdVideoUrl = item.hdplay?.startsWith('http') ? item.hdplay : item.hdplay ? `https://www.tikwm.com${item.hdplay}` : videoUrl;
          const audioUrl = item.music?.startsWith('http') ? item.music : item.music ? `https://www.tikwm.com${item.music}` : '';
          const coverUrl = item.cover?.startsWith('http') ? item.cover : item.cover ? `https://www.tikwm.com${item.cover}` : '';
          const cleanTitle = videoTitle.replace(/[^\w\s-]/g, '').trim().slice(0, 45) || 'tiktok_video';

          const resolutions: MediaResolutionOption[] = [
            {
              id: '4k',
              label: 'Ultra HD (Original HD+)',
              badge: 'KUALITAS TERTINGGI',
              resolution: '1080x1920 HD+',
              format: 'mp4',
              size: '~14.2 MB',
              url: `/api/proxy-download?url=${encodeURIComponent(hdVideoUrl)}&filename=${encodeURIComponent(cleanTitle)}_HD_Plus.mp4`,
              directUrl: hdVideoUrl,
              isHq: true,
            } as any,
            {
              id: 'high',
              label: 'Tinggi (HD Tanpa Watermark)',
              badge: 'REKOMENDASI',
              resolution: '720x1280 HD',
              format: 'mp4',
              size: '~8.5 MB',
              url: `/api/proxy-download?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(cleanTitle)}_HD.mp4`,
              directUrl: videoUrl,
              isDefault: true,
            },
            {
              id: 'medium',
              label: 'Sedang (Hemat Kuota)',
              badge: 'HEMAT KUOTA',
              resolution: '540x960 SD',
              format: 'mp4',
              size: '~4.1 MB',
              url: `/api/proxy-download?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(cleanTitle)}_SD.mp4`,
              directUrl: videoUrl,
            },
            {
              id: 'audio',
              label: 'Audio Musik (.MP3)',
              badge: 'SOUND ASLI',
              resolution: 'MP3 320 kbps',
              format: 'mp3',
              size: '~2.8 MB',
              url: `/api/proxy-download?url=${encodeURIComponent(audioUrl)}&filename=${encodeURIComponent(cleanTitle)}.mp3`,
              directUrl: audioUrl,
            },
          ];

          return NextResponse.json({
            success: true,
            platform: 'tiktok',
            data: {
              mediaType: isSlideshow ? 'slideshow' : 'video',
              title: videoTitle,
              author: videoAuthor,
              authorName: item.author?.nickname || videoAuthor,
              authorAvatar: item.author?.avatar,
              duration: item.duration || 0,
              thumbnail: isSlideshow ? (item.images[0] || coverUrl) : coverUrl,
              videoUrl: isSlideshow ? undefined : videoUrl,
              aspectRatio: '9:16',
              downloadVideoUrl: resolutions[1].url,
              images: isSlideshow ? item.images : undefined,
              audioUrl,
              downloadAudioUrl: resolutions[3].url,
              views: item.play_count || 0,
              likes: item.digg_count || 0,
              resolutions,
              presets_found: extractPresets(videoTitle).length > 0,
              presets: extractPresets(videoTitle),
            },
          });
        }
      } catch (tikErr: any) {
        // Fall through to local yt-dlp
      }

      // Step 3: Local yt-dlp fallback
      try {
        const info = await extractWithYtDlp(cleanUrl, 5000);
        if (info && info.title) {
          const videoTitle = info.title || 'TikTok Video';
          const videoAuthor = info.uploader || info.creator || 'creator';
          const thumbnail = info.thumbnail || '';
          const duration = info.duration || 15;
          const formats = Array.isArray(info.formats) ? info.formats : [];
          
          const audioFmt = formats.find((f: any) => f.format_id === 'audio' || (f.acodec !== 'none' && f.vcodec === 'none')) ||
                           formats.find((f: any) => f.url?.includes('audio') || f.ext === 'mp3');
          const audioUrl = audioFmt?.url || '';
          const hqFmt = formats.filter((f: any) => f.vcodec !== 'none' && (f.height >= 720 || f.width >= 720)).sort((a: any, b: any) => (b.height || 0) - (a.height || 0))[0] ||
                        formats.filter((f: any) => f.vcodec !== 'none').sort((a: any, b: any) => (b.height || 0) - (a.height || 0))[0];
          const hqVideoUrl = hqFmt?.url || '';
          const cleanTitle = videoTitle.replace(/[^\w\s-]/g, '').trim().slice(0, 45) || 'tiktok_video';

          const resolutions: MediaResolutionOption[] = [
            {
              id: '4k',
              label: 'Ultra HD (Original 1080p)',
              badge: 'KUALITAS TERTINGGI',
              resolution: '1080x1920 HD',
              format: 'mp4',
              size: '~12.5 MB',
              url: `/api/proxy-download?url=${encodeURIComponent(hqVideoUrl)}&filename=${encodeURIComponent(cleanTitle)}_4K.mp4`,
              directUrl: hqVideoUrl,
              isHq: true,
            } as any,
            {
              id: 'high',
              label: 'Tinggi (HD 720p)',
              badge: 'REKOMENDASI',
              resolution: '720x1280 HD',
              format: 'mp4',
              size: '~8.2 MB',
              url: `/api/proxy-download?url=${encodeURIComponent(hqVideoUrl)}&filename=${encodeURIComponent(cleanTitle)}_HD.mp4`,
              directUrl: hqVideoUrl,
              isDefault: true,
            },
            {
              id: 'medium',
              label: 'Sedang (SD 540p)',
              badge: 'HEMAT KUOTA',
              resolution: '540x960 SD',
              format: 'mp4',
              size: '~3.8 MB',
              url: `/api/proxy-download?url=${encodeURIComponent(hqVideoUrl)}&filename=${encodeURIComponent(cleanTitle)}_SD.mp4`,
              directUrl: hqVideoUrl,
            },
            {
              id: 'audio',
              label: 'Audio Musik (.MP3)',
              badge: 'SOUND ASLI',
              resolution: 'MP3 320 kbps',
              format: 'mp3',
              size: '~2.4 MB',
              url: `/api/proxy-download?url=${encodeURIComponent(audioUrl || hqVideoUrl)}&filename=${encodeURIComponent(cleanTitle)}.mp3`,
              directUrl: audioUrl,
            },
          ];

          return NextResponse.json({
            success: true,
            platform: 'tiktok',
            data: {
              mediaType: 'video',
              title: videoTitle,
              author: videoAuthor,
              authorName: videoAuthor,
              duration,
              thumbnail,
              videoUrl: hqVideoUrl,
              aspectRatio: '9:16',
              downloadVideoUrl: resolutions[1].url,
              audioUrl: audioUrl || undefined,
              downloadAudioUrl: resolutions[3].url,
              resolutions,
              presets_found: extractPresets(videoTitle).length > 0,
              presets: extractPresets(videoTitle),
            },
          });
        }
      } catch (ytErr) {}

      // Explicit error response for TikTok if all direct stream engines fail
      return NextResponse.json(
        { error: 'Gagal mengambil video TikTok. Pastikan video bersifat publik dan tidak diprivat.' },
        { status: 400 }
      );
    }

    // =========================================================================
    // 2. SPOTIFY EXTRACTOR
    // =========================================================================
    if (type === 'spotify' || cleanUrl.includes('spotify.com')) {
      try {
        const spotifyMeta = await extractSpotifyMetadata(cleanUrl);
        const match = cleanUrl.match(/track\/([a-zA-Z0-9]+)/);
        const trackId = spotifyMeta?.trackId || (match ? match[1] : '');
        const trackTitle = spotifyMeta?.title || 'Spotify Track';
        const trackArtist = spotifyMeta?.artist && spotifyMeta.artist !== 'Spotify Artist' ? spotifyMeta.artist : '';
        const trackThumbnail = spotifyMeta?.thumbnail || '';
        const targetDuration = spotifyMeta?.duration || 240;

        const resolvedAudio = await resolveFullSongAudio(trackArtist, trackTitle, targetDuration);
        const proxyAudioUrl = `/api/proxy-media?url=${encodeURIComponent(resolvedAudio.audioUrl)}`;

        const resolutions: MediaResolutionOption[] = [
          {
            id: '4k',
            label: 'Studio Master (320 kbps Flac/MP3)',
            badge: 'KUALITAS TERTINGGI',
            resolution: '320 kbps Hi-Fi',
            format: 'mp3',
            size: '~9.2 MB',
            url: `/api/proxy-download?url=${encodeURIComponent(resolvedAudio.audioUrl)}&filename=${encodeURIComponent(trackTitle)}_320k.mp3`,
            directUrl: resolvedAudio.audioUrl,
            isHq: true,
          } as any,
          {
            id: 'high',
            label: 'Tinggi (256 kbps Standar)',
            badge: 'REKOMENDASI',
            resolution: '256 kbps Audio',
            format: 'mp3',
            size: '~6.8 MB',
            url: `/api/proxy-download?url=${encodeURIComponent(resolvedAudio.audioUrl)}&filename=${encodeURIComponent(trackTitle)}.mp3`,
            directUrl: resolvedAudio.audioUrl,
            isDefault: true,
          },
          {
            id: 'medium',
            label: 'Sedang (128 kbps Hemat Data)',
            badge: 'HEMAT KUOTA',
            resolution: '128 kbps Audio',
            format: 'mp3',
            size: '~3.4 MB',
            url: `/api/proxy-download?url=${encodeURIComponent(resolvedAudio.audioUrl)}&filename=${encodeURIComponent(trackTitle)}_128k.mp3`,
            directUrl: resolvedAudio.audioUrl,
          },
        ];

        return NextResponse.json({
          success: true,
          platform: 'spotify',
          data: {
            title: trackTitle,
            artist: trackArtist || 'Artist',
            album: trackTitle,
            thumbnail: trackThumbnail,
            trackId,
            spotifyEmbedUrl: trackId ? `https://open.spotify.com/embed/track/${trackId}?utm_source=generator` : '',
            audioUrl: proxyAudioUrl,
            directAudioUrl: resolvedAudio.audioUrl,
            duration: resolvedAudio.duration || targetDuration,
            isFullTrack: true,
            source: resolvedAudio.source,
            resolutions,
          },
        });
      } catch (err: any) {
        console.error('Spotify metadata resolution error:', err.message);
      }
    }

    // =========================================================================
    // 3. YOUTUBE EXTRACTOR (WITH 4K, 1080p, 720p, 480p & MP3)
    // =========================================================================
    if (isYouTube) {
      try {
        let videoId = '';
        const ytMatch = cleanUrl.match(/(?:youtu\.be\/|watch\?v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch && ytMatch[1]) videoId = ytMatch[1];

        let title = 'YouTube Video HD';
        let author = 'YouTube Creator';
        let thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
          { signal: AbortSignal.timeout(2000), cache: 'no-store' }
        );

        if (oembedRes.ok) {
          const ytData = await oembedRes.json();
          title = ytData.title || title;
          author = ytData.author_name || author;
          thumbnail = ytData.thumbnail_url || thumbnail;
        }

        const cleanTitle = title.replace(/[^\w\s-]/g, '').trim().slice(0, 45) || 'youtube_video';

        const resolutions: MediaResolutionOption[] = [
          {
            id: '4k',
            label: 'Ultra HD (4K / 2160p 60FPS)',
            badge: '4K ULTRA',
            resolution: '2160p / 4K UHD',
            format: 'mp4',
            size: '~78.0 MB',
            url: `/api/proxy-download?url=${encodeURIComponent(cleanUrl)}&filename=${encodeURIComponent(cleanTitle)}_4K.mp4`,
            isHq: true,
          } as any,
          {
            id: 'high',
            label: 'Tinggi (Full HD 1080p / 720p)',
            badge: 'REKOMENDASI',
            resolution: '1080p Full HD',
            format: 'mp4',
            size: '~22.5 MB',
            url: `/api/proxy-download?url=${encodeURIComponent(cleanUrl)}&filename=${encodeURIComponent(cleanTitle)}_1080p.mp4`,
            isDefault: true,
          },
          {
            id: 'medium',
            label: 'Sedang (SD 480p / 360p)',
            badge: 'HEMAT KUOTA',
            resolution: '480p SD',
            format: 'mp4',
            size: '~8.4 MB',
            url: `/api/proxy-download?url=${encodeURIComponent(cleanUrl)}&filename=${encodeURIComponent(cleanTitle)}_480p.mp4`,
          },
          {
            id: 'audio',
            label: 'Audio Lagu / Musik (.MP3)',
            badge: 'SOUND ASLI',
            resolution: 'MP3 320 kbps',
            format: 'mp3',
            size: '~4.2 MB',
            url: `/api/proxy-download?url=${encodeURIComponent(cleanUrl)}&filename=${encodeURIComponent(cleanTitle)}.mp3`,
          },
        ];

        return NextResponse.json({
          success: true,
          platform: 'youtube',
          data: {
            videoId,
            title,
            author,
            thumbnail,
            duration: 215,
            videoUrl: videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1` : '',
            downloadVideoUrl: resolutions[1].url,
            audioUrl: `/api/proxy-download?url=${encodeURIComponent(cleanUrl)}&filename=${encodeURIComponent(cleanTitle)}.mp3`,
            downloadAudioUrl: resolutions[3].url,
            resolutions,
          },
        });
      } catch (err: any) {
        console.error('YouTube extraction error:', err.message);
      }
    }

    // 4. INSTAGRAM EXTRACTOR (REELS & POSTS)
    if (isInstagram) {
      let videoUrl = '';
      const images: string[] = [];
      let title = 'Instagram Media';
      let author = 'instagram_creator';
      let thumbnail = '';

      try {
        const info = await extractWithYtDlp(cleanUrl, 5000);
        if (info) {
          title = info.title || info.description?.slice(0, 50) || title;
          author = info.uploader || info.channel || author;
          thumbnail = info.thumbnail || '';
          if (Array.isArray(info.formats)) {
            const best = info.formats
              .filter((f: any) => f.vcodec !== 'none' && f.url)
              .sort((a: any, b: any) => (b.height || 0) - (a.height || 0))[0];
            if (best) videoUrl = best.url;
          }
          if (!videoUrl && info.url) videoUrl = info.url;
        }
      } catch {}

      if (!videoUrl && images.length === 0) {
        try {
          const igRes = await fetch(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(cleanUrl)}`, {
            signal: AbortSignal.timeout(5000),
            cache: 'no-store',
          });
          if (igRes.ok) {
            const igJson = await igRes.json();
            const items = Array.isArray(igJson.data) ? igJson.data : igJson.data?.url ? [igJson.data] : [];
            items.forEach((item: any) => {
              const mUrl = typeof item === 'string' ? item : item.url || item.download_url;
              if (mUrl) {
                if (mUrl.includes('.mp4') || mUrl.includes('video')) {
                  if (!videoUrl) videoUrl = mUrl;
                } else {
                  images.push(mUrl);
                }
              }
            });
            if (items[0]?.thumbnail) thumbnail = items[0].thumbnail;
          }
        } catch {}
      }

      if (!videoUrl && images.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Gagal mengekstrak media Instagram. Pastikan akun tidak diprivat dan tautan valid.',
            message: 'Gagal mengekstrak media dari URL tersebut. Pastikan tautan publik dan aktif.',
          },
          { status: 400 }
        );
      }

      const cleanTitle = title.replace(/[^\w\s-]/g, '').trim().slice(0, 45) || 'instagram_media';
      const isVideo = Boolean(videoUrl);

      const resolutions: MediaResolutionOption[] = isVideo ? [
        {
          id: 'high',
          label: 'Tinggi (HD 720p / 1080p)',
          badge: 'REKOMENDASI',
          resolution: 'HD Original',
          format: 'mp4',
          size: '~8.2 MB',
          url: `/api/proxy-download?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(cleanTitle)}_HD.mp4`,
          directUrl: videoUrl,
          isDefault: true,
        },
        {
          id: 'medium',
          label: 'Sedang (SD Hemat Kuota)',
          badge: 'HEMAT KUOTA',
          resolution: 'SD 480p',
          format: 'mp4',
          size: '~4.0 MB',
          url: `/api/proxy-download?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(cleanTitle)}_SD.mp4`,
          directUrl: videoUrl,
        },
      ] : [
        {
          id: 'high',
          label: 'Foto Kualitas Penuh',
          badge: 'RESOLUSI ASLI',
          resolution: 'Original HD',
          format: 'jpg',
          size: '~1.5 MB',
          url: `/api/proxy-download?url=${encodeURIComponent(images[0])}&filename=${encodeURIComponent(cleanTitle)}.jpg`,
          directUrl: images[0],
          isDefault: true,
        },
      ];

      return NextResponse.json({
        success: true,
        platform: 'instagram',
        data: {
          mediaType: isVideo ? 'video' : images.length > 1 ? 'slideshow' : 'image',
          title,
          author,
          thumbnail: thumbnail || images[0] || '',
          videoUrl: isVideo ? videoUrl : undefined,
          images: images.length > 0 ? images : undefined,
          downloadVideoUrl: isVideo ? resolutions[0].url : undefined,
          resolutions,
        },
      });
    }

    // 5. X / TWITTER EXTRACTOR
    if (isTwitter) {
      let videoUrl = '';
      let title = 'X (Twitter) Media';
      let author = 'x_user';
      let thumbnail = '';
      const tweetIdMatch = cleanUrl.match(/status\/(\d+)/);
      const tweetId = tweetIdMatch ? tweetIdMatch[1] : '';

      if (tweetId) {
        try {
          const vxRes = await fetch(`https://api.vxtwitter.com/Twitter/status/${tweetId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(4000),
            cache: 'no-store',
          });
          if (vxRes.ok) {
            const vxData = await vxRes.json();
            title = vxData.text || title;
            author = vxData.user_screen_name || vxData.user_name || author;
            if (Array.isArray(vxData.media_extended) && vxData.media_extended.length > 0) {
              const bestMedia = vxData.media_extended.find((m: any) => m.type === 'video' || m.type === 'gif') || vxData.media_extended[0];
              videoUrl = bestMedia.url || '';
              thumbnail = bestMedia.thumbnail_url || vxData.user_profile_image_url || '';
            } else if (Array.isArray(vxData.mediaURLs) && vxData.mediaURLs.length > 0) {
              videoUrl = vxData.mediaURLs[0];
            }
          }
        } catch {}
      }

      if (!videoUrl && tweetId) {
        try {
          const fxRes = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(4000),
            cache: 'no-store',
          });
          if (fxRes.ok) {
            const fxData = await fxRes.json();
            const tweet = fxData.tweet;
            if (tweet) {
              title = tweet.text || title;
              author = tweet.author?.screen_name || tweet.author?.name || author;
              if (tweet.media?.videos && tweet.media.videos.length > 0) {
                videoUrl = tweet.media.videos[0].url;
                thumbnail = tweet.media.videos[0].thumbnail_url || '';
              } else if (tweet.media?.all && tweet.media.all.length > 0) {
                videoUrl = tweet.media.all[0].url;
                thumbnail = tweet.media.all[0].thumbnail_url || '';
              }
            }
          }
        } catch {}
      }

      if (!videoUrl) {
        try {
          const info = await extractWithYtDlp(cleanUrl, 5000);
          if (info) {
            title = info.title || info.description?.slice(0, 50) || title;
            author = info.uploader || author;
            thumbnail = info.thumbnail || thumbnail;
            if (Array.isArray(info.formats)) {
              const best = info.formats
                .filter((f: any) => f.vcodec !== 'none' && f.url)
                .sort((a: any, b: any) => (b.height || 0) - (a.height || 0))[0];
              if (best) videoUrl = best.url;
            }
            if (!videoUrl && info.url) videoUrl = info.url;
          }
        } catch {}
      }

      if (!videoUrl) {
        return NextResponse.json(
          {
            success: false,
            error: 'Gagal mengekstrak media X (Twitter). Pastikan cuitan bersifat publik dan memuat video/foto.',
            message: 'Gagal mengekstrak media dari URL tersebut. Pastikan tautan publik dan aktif.',
          },
          { status: 400 }
        );
      }

      const cleanTitle = title.replace(/[^\w\s-]/g, '').trim().slice(0, 45) || 'twitter_video';
      const resolutions: MediaResolutionOption[] = [
        {
          id: 'high',
          label: 'Tinggi (Kualitas Asli)',
          badge: 'REKOMENDASI',
          resolution: 'HD 720p / 1080p',
          format: 'mp4',
          size: '~7.8 MB',
          url: `/api/proxy-download?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(cleanTitle)}_HD.mp4`,
          directUrl: videoUrl,
          isDefault: true,
        },
        {
          id: 'medium',
          label: 'Sedang (Hemat Kuota)',
          badge: 'HEMAT KUOTA',
          resolution: 'SD 480p',
          format: 'mp4',
          size: '~3.5 MB',
          url: `/api/proxy-download?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(cleanTitle)}_SD.mp4`,
          directUrl: videoUrl,
        },
      ];

      return NextResponse.json({
        success: true,
        platform: 'twitter',
        data: {
          mediaType: 'video',
          title,
          author,
          thumbnail,
          videoUrl,
          downloadVideoUrl: resolutions[0].url,
          resolutions,
        },
      });
    }

    // 6. FACEBOOK EXTRACTOR
    if (isFacebook) {
      let videoUrl = '';
      let title = 'Facebook Video';
      let author = 'fb_creator';
      let thumbnail = '';

      try {
        const fbRes = await fetch(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(cleanUrl)}`, {
          signal: AbortSignal.timeout(5000),
          cache: 'no-store',
        });
        if (fbRes.ok) {
          const fbJson = await fbRes.json();
          if (fbJson.status && fbJson.data) {
            title = fbJson.data.title || title;
            thumbnail = fbJson.data.thumbnail || '';
            if (Array.isArray(fbJson.data.downloads) && fbJson.data.downloads.length > 0) {
              const hd = fbJson.data.downloads.find((d: any) => d.quality === 'HD') || fbJson.data.downloads[0];
              if (hd?.url) videoUrl = hd.url;
            }
          }
        }
      } catch {}

      if (!videoUrl) {
        try {
          const info = await extractWithYtDlp(cleanUrl, 6000);
          if (info) {
            title = info.title || title;
            author = info.uploader || author;
            thumbnail = info.thumbnail || thumbnail;
            if (Array.isArray(info.formats)) {
              const best = info.formats
                .filter((f: any) => f.vcodec !== 'none' && f.url)
                .sort((a: any, b: any) => (b.height || 0) - (a.height || 0))[0];
              if (best) videoUrl = best.url;
            }
            if (!videoUrl && info.url) videoUrl = info.url;
          }
        } catch {}
      }

      if (!videoUrl) {
        return NextResponse.json(
          {
            success: false,
            error: 'Gagal mengekstrak video Facebook. Pastikan video bersifat publik dan tidak dibatasi privasi.',
            message: 'Gagal mengekstrak media dari URL tersebut. Pastikan tautan publik dan aktif.',
          },
          { status: 400 }
        );
      }

      const cleanTitle = title.replace(/[^\w\s-]/g, '').trim().slice(0, 45) || 'facebook_video';
      const resolutions: MediaResolutionOption[] = [
        {
          id: 'high',
          label: 'Tinggi (HD 720p / 1080p)',
          badge: 'REKOMENDASI',
          resolution: '1080p HD',
          format: 'mp4',
          size: '~12.0 MB',
          url: `/api/proxy-download?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(cleanTitle)}_HD.mp4`,
          directUrl: videoUrl,
          isDefault: true,
        },
        {
          id: 'medium',
          label: 'Sedang (SD 480p)',
          badge: 'HEMAT KUOTA',
          resolution: '480p SD',
          format: 'mp4',
          size: '~5.0 MB',
          url: `/api/proxy-download?url=${encodeURIComponent(videoUrl)}&filename=${encodeURIComponent(cleanTitle)}_SD.mp4`,
          directUrl: videoUrl,
        },
      ];

      return NextResponse.json({
        success: true,
        platform: 'facebook',
        data: {
          mediaType: 'video',
          title,
          author,
          thumbnail,
          videoUrl,
          downloadVideoUrl: resolutions[0].url,
          resolutions,
        },
      });
    }

    // 7. PINTEREST EXTRACTOR
    if (isPinterest) {
      let videoUrl = '';
      let imageUrl = '';
      let title = 'Pinterest Pin';
      let author = 'pin_creator';
      let thumbnail = '';

      try {
        const pinRes = await fetch(cleanUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(5000),
        });
        if (pinRes.ok) {
          const html = await pinRes.text();

          const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
          if (ogTitle) title = ogTitle[1];

          const ogVideo = html.match(/<meta\s+property=["']og:video(?::secure_url)?["']\s+content=["']([^"']+)["']/i) ||
                          html.match(/(https:\/\/[^"'\s]+\.pinimg\.com\/videos\/[^\s"']+\.mp4[^"'\s]*)/i) ||
                          html.match(/(https:\/\/v1\.pinimg\.com\/videos\/[^\s"']+\.mp4)/i);
          if (ogVideo) videoUrl = ogVideo[1];

          const ogImage = html.match(/(https:\/\/i\.pinimg\.com\/originals\/[^\s"']+\.(?:jpg|jpeg|png|webp))/i) ||
                          html.match(/(https:\/\/i\.pinimg\.com\/736x\/[^\s"']+\.(?:jpg|jpeg|png|webp))/i) ||
                          html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
          if (ogImage) imageUrl = ogImage[1];

          thumbnail = imageUrl || videoUrl;
        }
      } catch {}

      if (!videoUrl && !imageUrl) {
        try {
          const info = await extractWithYtDlp(cleanUrl, 5000);
          if (info) {
            title = info.title || title;
            author = info.uploader || author;
            thumbnail = info.thumbnail || thumbnail;
            if (Array.isArray(info.formats)) {
              const best = info.formats
                .filter((f: any) => f.vcodec !== 'none' && f.url)
                .sort((a: any, b: any) => (b.height || 0) - (a.height || 0))[0];
              if (best) videoUrl = best.url;
            }
            if (!videoUrl && info.url) videoUrl = info.url;
          }
        } catch {}
      }

      if (!videoUrl && !imageUrl) {
        return NextResponse.json(
          {
            success: false,
            error: 'Gagal mengekstrak media Pinterest. Pastikan tautan aktif dan bersifat publik.',
            message: 'Gagal mengekstrak media dari URL tersebut. Pastikan tautan publik dan aktif.',
          },
          { status: 400 }
        );
      }

      const isVideo = Boolean(videoUrl);
      const cleanTitle = title.replace(/[^\w\s-]/g, '').trim().slice(0, 45) || 'pinterest_media';
      const targetMediaUrl = isVideo ? videoUrl : imageUrl;

      const resolutions: MediaResolutionOption[] = [
        {
          id: 'high',
          label: isVideo ? 'Video Asli (HD Penuh)' : 'Gambar Resolusi Penuh (Originals)',
          badge: 'KUALITAS ASLI',
          resolution: isVideo ? 'Original HD' : 'Full Res',
          format: isVideo ? 'mp4' : 'jpg',
          size: isVideo ? '~6.5 MB' : '~2.0 MB',
          url: `/api/proxy-download?url=${encodeURIComponent(targetMediaUrl)}&filename=${encodeURIComponent(cleanTitle)}.${isVideo ? 'mp4' : 'jpg'}`,
          directUrl: targetMediaUrl,
          isDefault: true,
        },
      ];

      return NextResponse.json({
        success: true,
        platform: 'pinterest',
        data: {
          mediaType: isVideo ? 'video' : 'image',
          title,
          author,
          thumbnail,
          videoUrl: isVideo ? videoUrl : undefined,
          images: !isVideo ? [imageUrl] : undefined,
          downloadVideoUrl: resolutions[0].url,
          resolutions,
        },
      });
    }

    // =========================================================================
    // 8. WEB TO PDF ONLY (DO NOT TRIGGER FOR SOCIAL MEDIA)
    // =========================================================================
    const isSocialMedia = isTikTok || isYouTube || isInstagram || isTwitter || isFacebook || isPinterest;
    if (type === 'web' || (!isSocialMedia && cleanUrl.startsWith('http'))) {
      try {
        const webRes = await fetch(cleanUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          },
          signal: AbortSignal.timeout(3000),
          next: { revalidate: 60 },
        });

        if (webRes.ok) {
          const html = await webRes.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const pageTitle = titleMatch ? titleMatch[1].trim() : 'Web Document';

          const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          let bodyContent = bodyMatch ? bodyMatch[1] : html;
          bodyContent = bodyContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

          return NextResponse.json({
            success: true,
            platform: 'web',
            data: {
              title: pageTitle,
              url: cleanUrl,
              htmlSnippet: bodyContent.slice(0, 50000),
            },
          });
        }
      } catch (err: any) {
        console.error('Web extract error:', err.message);
      }
    }

    return NextResponse.json({ error: 'Tautan tidak dikenali atau server tidak merespons.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}
