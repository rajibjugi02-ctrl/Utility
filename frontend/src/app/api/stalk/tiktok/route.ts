import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface NormalizedTikTokUser {
  id: string;
  uniqueId: string;
  nickname: string;
  avatar: string;
  avatarUrl: string;
  rawAvatarUrl: string;
  signature: string;
  verified: boolean;
  privateAccount: boolean;
  region: string;
  createTime: number | null;
  joinedDate: string | null;
  bioLink: string | null;
  tiktokUrl: string;
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

// Convert potential 32-bit signed overflow into unsigned integer (e.g. Khaby Lame's likes)
function normalizeCount(val: any): number {
  const num = Number(val || 0);
  if (isNaN(num)) return 0;
  if (num < 0) {
    return num >>> 0;
  }
  return num;
}

function normalizeTikTokData(userObj: any, statsObj: any, defaultUsername: string): NormalizedTikTokUser {
  const u = userObj || {};
  const s = statsObj || {};

  const cleanUniqueId = u.uniqueId || u.unique_id || defaultUsername;
  const nickname = u.nickname || cleanUniqueId;
  const id = String(u.id || '');

  const rawAvatar =
    u.avatarLarger ||
    u.avatar_larger ||
    u.avatarMedium ||
    u.avatar_medium ||
    u.avatarThumb ||
    u.avatar_thumb ||
    '';

  const proxiedAvatar = rawAvatar
    ? `/api/proxy-media?url=${encodeURIComponent(rawAvatar)}`
    : '';

  const followerCount = normalizeCount(s.followerCount ?? s.follower_count);
  const followingCount = normalizeCount(s.followingCount ?? s.following_count);
  const heartCount = normalizeCount(s.heartCount ?? s.heart_count ?? s.heart);
  const videoCount = normalizeCount(s.videoCount ?? s.video_count);
  const friendCount = normalizeCount(s.friendCount ?? s.friend_count);
  const diggCount = normalizeCount(s.diggCount ?? s.digg_count);

  const avgLikesPerVideo = Math.round(heartCount / Math.max(1, videoCount));
  const engagementRatio =
    followerCount > 0 ? ((heartCount / followerCount) * 100).toFixed(1) : '0';

  const bioLink =
    typeof u.bioLink === 'object' && u.bioLink?.link
      ? u.bioLink.link
      : typeof u.bioLink === 'string'
      ? u.bioLink
      : typeof u.bio_url === 'string'
      ? u.bio_url
      : null;

  const rawCreateTime = u.createTime || u.create_time;
  let createTime: number | null = null;
  let joinedDate: string | null = null;

  if (rawCreateTime) {
    const ts = Number(rawCreateTime);
    if (!isNaN(ts) && ts > 0) {
      createTime = ts;
      const dt = new Date(ts > 100000000000 ? ts : ts * 1000);
      joinedDate = dt.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  }

  const region = u.region || u.language?.toUpperCase() || 'ID';

  return {
    id,
    uniqueId: cleanUniqueId,
    nickname,
    avatar: proxiedAvatar || rawAvatar,
    avatarUrl: proxiedAvatar || rawAvatar,
    rawAvatarUrl: rawAvatar,
    signature: u.signature || '',
    verified: Boolean(u.verified || u.customVerify),
    privateAccount: Boolean(u.privateAccount || u.secret),
    region,
    createTime,
    joinedDate,
    bioLink,
    tiktokUrl: `https://www.tiktok.com/@${cleanUniqueId}`,
    stats: {
      followerCount,
      followingCount,
      heartCount,
      videoCount,
      friendCount,
      diggCount,
      avgLikesPerVideo,
      engagementRatio: `${engagementRatio}%`,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let rawUsername =
      searchParams.get('username') ||
      searchParams.get('user') ||
      searchParams.get('q') ||
      '';

    rawUsername = rawUsername.trim();

    if (!rawUsername) {
      return NextResponse.json(
        { success: false, message: 'Parameter username TikTok wajib disertakan.' },
        { status: 400 }
      );
    }

    // 1. Sanitasi Input Username
    let cleanUsername = rawUsername;
    const urlMatch = cleanUsername.match(/tiktok\.com\/@([a-zA-Z0-9_.-]+)/i);
    if (urlMatch) {
      cleanUsername = urlMatch[1];
    }
    if (cleanUsername.startsWith('@')) {
      cleanUsername = cleanUsername.slice(1);
    }
    cleanUsername = cleanUsername.split('?')[0].split('/')[0].trim();

    if (!cleanUsername) {
      return NextResponse.json(
        { success: false, message: 'Format username TikTok tidak valid.' },
        { status: 400 }
      );
    }

    // 2. ENGINE 1: Siputzx API dengan Adaptive JSON Parser
    try {
      const siputzxUrl = `https://api.siputzx.my.id/api/stalk/tiktok?username=${encodeURIComponent(cleanUsername)}`;
      const siputzxRes = await fetch(siputzxUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          Referer: 'https://app.siputzx.my.id/',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });

      if (siputzxRes.ok) {
        const json = await siputzxRes.json();
        const raw = json?.data || json?.result || json;
        const userObj = raw?.user || raw?.userInfo?.user || raw?.profile || raw;
        const statsObj = raw?.stats || raw?.statsV2 || raw?.userInfo?.stats || raw;

        if (userObj && (userObj.uniqueId || userObj.unique_id || userObj.nickname || userObj.id)) {
          const normalized = normalizeTikTokData(userObj, statsObj, cleanUsername);
          return NextResponse.json({
            success: true,
            sourceEngine: 'Engine 1: Siputzx Adaptive API',
            data: {
              ...normalized,
              user: normalized,
              stats: normalized.stats,
            },
          });
        }
      }
    } catch (e: any) {
      // Continue to next engine
    }

    // 3. ENGINE 2: Direct TikTok Web Universal Hydration Scraper
    try {
      const ttUrl = `https://www.tiktok.com/@${encodeURIComponent(cleanUsername)}`;
      const ttRes = await fetch(ttUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        redirect: 'follow',
        cache: 'no-store',
        signal: AbortSignal.timeout(7000),
      });

      if (ttRes.ok) {
        const html = await ttRes.text();
        const scriptMatch =
          html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/) ||
          html.match(/<script id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);

        if (scriptMatch) {
          const parsed = JSON.parse(scriptMatch[1]);
          const scope = parsed['__DEFAULT_SCOPE__'] || parsed;
          const userDetail = scope?.['webapp.user-detail'];
          const userObj = userDetail?.userInfo?.user;
          const statsObj = userDetail?.userInfo?.stats;

          if (userObj && (userObj.uniqueId || userObj.nickname)) {
            const normalized = normalizeTikTokData(userObj, statsObj, cleanUsername);
            return NextResponse.json({
              success: true,
              sourceEngine: 'Engine 2: TikTok Official Hydration DOM',
              data: {
                ...normalized,
                user: normalized,
                stats: normalized.stats,
              },
            });
          }
        }
      }
    } catch (e: any) {
      // Continue to next engine
    }

    // 4. ENGINE 3: TikWM User Info & Smart Search Fallback
    try {
      const tikwmUrl = `https://www.tikwm.com/api/user/info?unique_id=${encodeURIComponent(cleanUsername)}`;
      const tikwmRes = await fetch(tikwmUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });

      if (tikwmRes.ok) {
        const text = await tikwmRes.text();
        if (text.startsWith('{')) {
          const tikwmJson = JSON.parse(text);
          if (tikwmJson.code === 0 && tikwmJson.data) {
            const userObj = tikwmJson.data.user || tikwmJson.data;
            const statsObj = tikwmJson.data.stats || tikwmJson.data;
            const normalized = normalizeTikTokData(userObj, statsObj, cleanUsername);
            return NextResponse.json({
              success: true,
              sourceEngine: 'Engine 3: TikWM API',
              data: {
                ...normalized,
                user: normalized,
                stats: normalized.stats,
              },
            });
          }
        }
      }
    } catch (e: any) {
      // Continue to smart fallback
    }

    // 5. SMART USERNAME SEARCH FALLBACK
    // a. Cek variasi username bila ada huruf ganda di akhir (misal: zaestraa -> zaestra)
    if (/(.)\1+$/i.test(cleanUsername)) {
      const candidate = cleanUsername.replace(/(.)\1+$/i, '$1');
      try {
        const varRes = await fetch(`https://www.tiktok.com/@${encodeURIComponent(candidate)}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          redirect: 'follow',
          cache: 'no-store',
          signal: AbortSignal.timeout(6000),
        });

        if (varRes.ok) {
          const html = await varRes.text();
          const scriptMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
          if (scriptMatch) {
            const parsed = JSON.parse(scriptMatch[1]);
            const userDetail = parsed['__DEFAULT_SCOPE__']?.['webapp.user-detail'];
            const userObj = userDetail?.userInfo?.user;
            const statsObj = userDetail?.userInfo?.stats;

            if (userObj && (userObj.uniqueId || userObj.nickname)) {
              const normalized = normalizeTikTokData(userObj, statsObj, candidate);
              return NextResponse.json({
                success: true,
                sourceEngine: `Smart Fallback (Variasi @${candidate})`,
                data: {
                  ...normalized,
                  user: normalized,
                  stats: normalized.stats,
                },
              });
            }
          }
        }
      } catch (e: any) {}
    }

    // b. TikWM feed search fallback
    try {
      const searchRes = await fetch('https://www.tikwm.com/api/feed/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        },
        body: new URLSearchParams({ keywords: cleanUsername, count: '5' }),
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });

      if (searchRes.ok) {
        const text = await searchRes.text();
        if (text.startsWith('{')) {
          const sJson = JSON.parse(text);
          const firstVideo = sJson?.data?.videos?.[0];
          const author = firstVideo?.author;
          if (author?.unique_id) {
            const userObj = {
              id: String(author.id || ''),
              uniqueId: author.unique_id,
              nickname: author.nickname || author.unique_id,
              avatarLarger: author.avatar || '',
              signature: '',
            };
            const statsObj = {
              followerCount: 0,
              followingCount: 0,
              heartCount: 0,
              videoCount: 0,
            };
            const normalized = normalizeTikTokData(userObj, statsObj, author.unique_id);
            return NextResponse.json({
              success: true,
              sourceEngine: 'Smart Search Fallback (Feed Match)',
              data: normalized,
            });
          }
        }
      }
    } catch (e: any) {}

    // c. TikTok oEmbed Verification Fallback
    try {
      const oembedRes = await fetch(
        `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${encodeURIComponent(cleanUsername)}`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (oembedRes.ok) {
        const odata = await oembedRes.json();
        if (odata.author_name) {
          const userObj = {
            id: '',
            uniqueId: odata.embed_product_id || cleanUsername,
            nickname: odata.author_name,
            signature: odata.title || '',
            avatarLarger: '',
          };
          const normalized = normalizeTikTokData(userObj, {}, cleanUsername);
          return NextResponse.json({
            success: true,
            sourceEngine: 'TikTok Official oEmbed',
            data: normalized,
          });
        }
      }
    } catch (e: any) {}

    // 6. Jika semua engine tidak menemukan akun
    return NextResponse.json(
      {
        success: false,
        message: `Username TikTok @${cleanUsername} tidak ditemukan atau akun sedang tidak tersedia.`,
      },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Terjadi kesalahan sistem saat mengekstrak profil TikTok.',
      },
      { status: 500 }
    );
  }
}
