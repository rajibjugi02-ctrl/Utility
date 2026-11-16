import { NextRequest, NextResponse } from 'next/server';
import { CapCutTemplateMappedItem } from '@/lib/capcutMapper';

// In-memory cache for fast repeated queries (TTL 5 minutes)
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function handleCapCutSearch(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    let query = searchParams.get('q') || searchParams.get('query') || '';
    let creatorId = searchParams.get('creator_id') || searchParams.get('uid') || '';
    let tab = searchParams.get('tab') || 'all';

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        query = body.q || body.query || query;
        creatorId = body.creator_id || body.creatorId || body.uid || creatorId;
        tab = body.tab || tab;
      } catch {
        // Body is optional
      }
    }

    const trimmedQuery = (query || '').trim();
    const trimmedCreator = (creatorId || '').trim();
    const effectiveSearch = trimmedQuery || trimmedCreator;

    if (!effectiveSearch && tab !== 'my_templates') {
      return NextResponse.json({
        success: false,
        templates: [],
        message: 'Silakan masukkan kata kunci atau tautan template CapCut.',
      });
    }

    const cacheKey = `capcut_v3_${effectiveSearch}_${tab}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    // ========================================================
    // 1. LOGIKA URL LANGSUNG (Downloader Mode via Siputzx API)
    // ========================================================
    const isUrl = /^https?:\/\//i.test(effectiveSearch);
    const isCapCutUrl = /capcut\.(com|net)/i.test(effectiveSearch);
    const isTikTokUrl = /tiktok\.com/i.test(effectiveSearch);

    if (isUrl && (isCapCutUrl || isTikTokUrl)) {
      try {
        const siputzxUrl = `https://api.siputzx.my.id/api/d/capcut?url=${encodeURIComponent(effectiveSearch)}`;
        const siputzxRes = await fetch(siputzxUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'application/json, text/plain, */*',
          },
          signal: AbortSignal.timeout(12000),
          cache: 'no-store',
        });

        if (siputzxRes.ok) {
          const resJson = await siputzxRes.json();
          const itemData = resJson.data || resJson.result || resJson;

          if (resJson.status !== false && itemData && itemData.message !== 'Bad Request') {
            const rawVideo =
              itemData.video_url ||
              itemData.video ||
              itemData.original_video_url ||
              itemData.url ||
              itemData.play ||
              itemData.download_url ||
              '';

            const proxiedVideo = rawVideo ? `/api/proxy-media?url=${encodeURIComponent(rawVideo)}` : '';

            const mappedTemplate: CapCutTemplateMappedItem = {
              id: String(itemData.id || itemData.template_id || Date.now()),
              title: itemData.title || itemData.name || 'Template CapCut Asli',
              thumbnail:
                itemData.cover ||
                itemData.thumbnail ||
                itemData.cover_url ||
                itemData.image ||
                itemData.poster ||
                '',
              videoUrl: proxiedVideo || rawVideo,
              capcutUrl: effectiveSearch,
              author: {
                id: itemData.author?.id || itemData.author_id || '',
                name:
                  itemData.author?.name ||
                  itemData.author ||
                  itemData.creator ||
                  itemData.author_name ||
                  'Kreator CapCut',
                avatar: itemData.author?.avatar || itemData.avatar || itemData.author_avatar || '',
                uniqueId: itemData.author?.unique_id || '',
              },
              stats: {
                usages:
                  typeof itemData.usage === 'number'
                    ? itemData.usage
                    : typeof itemData.usages === 'number'
                    ? itemData.usages
                    : typeof itemData.play_count === 'number'
                    ? itemData.play_count
                    : 15200,
                likes: itemData.like_count || itemData.digg_count || 3200,
              },
              duration: typeof itemData.duration === 'number' ? itemData.duration : 15,
              clipsCount: typeof itemData.clips === 'number' ? itemData.clips : 1,
              aspectRatio: '9:16',
              isPro: Boolean(itemData.is_pro || itemData.pro),
            };

            const result = {
              success: true,
              templates: [mappedTemplate],
              count: 1,
              source: 'siputzx_capcut_url',
            };

            cache.set(cacheKey, { timestamp: Date.now(), data: result });
            return NextResponse.json(result);
          }
        }
      } catch (err: any) {
        console.warn('Siputzx URL extraction error:', err.message);
      }
    }

    // ========================================================
    // 2. LOGIKA KATA KUNCI (Search Engine Mode via Public Search API)
    // ========================================================
    // Endpoint 1: Coba TikWM Feed Search
    try {
      const searchKeyword = `CapCut Template ${effectiveSearch}`;
      const tikwmUrl = `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(
        searchKeyword
      )}&count=12`;

      const tikwmRes = await fetch(tikwmUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          Referer: 'https://www.tikwm.com/',
        },
        signal: AbortSignal.timeout(6000),
        cache: 'no-store',
      });

      if (tikwmRes.ok) {
        const text = await tikwmRes.text();
        if (text.startsWith('{')) {
          const data = JSON.parse(text);
          const videos = data.data?.videos || data.videos || [];

          if (Array.isArray(videos) && videos.length > 0) {
            const mappedList: CapCutTemplateMappedItem[] = videos.map((v: any, idx: number) => {
              const videoId = String(v.video_id || v.id || idx);
              const title = v.title || `CapCut Template ${idx + 1}`;
              const capcutMatch = title.match(/(https?:\/\/(?:www\.)?capcut\.(?:com|net)\/[^\s]+)/i);
              const capcutUrl = capcutMatch
                ? capcutMatch[0]
                : `https://www.capcut.com/template?query=${encodeURIComponent(title)}`;

              const rawPlay = v.play?.startsWith('http')
                ? v.play
                : v.play
                ? `https://www.tikwm.com${v.play}`
                : '';

              const proxiedPlay = rawPlay ? `/api/proxy-media?url=${encodeURIComponent(rawPlay)}` : '';
              const cover = v.cover?.startsWith('http')
                ? v.cover
                : v.cover
                ? `https://www.tikwm.com${v.cover}`
                : '';

              return {
                id: videoId,
                title,
                thumbnail: cover,
                videoUrl: proxiedPlay || rawPlay,
                capcutUrl,
                author: {
                  id: v.author?.id || v.author?.unique_id || '',
                  name: v.author?.nickname || v.author?.unique_id || 'Kreator',
                  avatar: v.author?.avatar?.startsWith('http')
                    ? v.author.avatar
                    : v.author?.avatar
                    ? `https://www.tikwm.com${v.author.avatar}`
                    : '',
                  uniqueId: v.author?.unique_id || '',
                },
                stats: {
                  usages: v.play_count || v.digg_count || 1000,
                  likes: v.digg_count || 0,
                },
                duration: typeof v.duration === 'number' ? v.duration : 15,
                clipsCount: 1,
                aspectRatio: '9:16',
                isPro: false,
              };
            });

            const result = {
              success: true,
              templates: mappedList,
              count: mappedList.length,
              source: 'tikwm_search',
            };

            cache.set(cacheKey, { timestamp: Date.now(), data: result });
            return NextResponse.json(result);
          }
        }
      }
    } catch (tikwmErr: any) {
      console.warn('TikWM search error:', tikwmErr.message);
    }

    // Endpoint 2: Siputzx Public Search Engine (Stabil & Menghasilkan Array Video Riil)
    try {
      const siputzxSearchUrl = `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(
        'CapCut Template ' + effectiveSearch
      )}`;

      const siputzxSearchRes = await fetch(siputzxSearchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
        },
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      });

      if (siputzxSearchRes.ok) {
        const searchJson = await siputzxSearchRes.json();
        const items = searchJson.data || searchJson.result || [];

        if (Array.isArray(items) && items.length > 0) {
          const videoItems = items.filter((item: any) => item.type === 'video' || item.videoId);

          if (videoItems.length > 0) {
            const mappedList: CapCutTemplateMappedItem[] = videoItems.map((item: any, idx: number) => {
              const videoId = String(item.videoId || item.id || idx);
              const title = item.title || `Template CapCut ${effectiveSearch} #${idx + 1}`;
              const thumbnail =
                item.thumbnail ||
                item.image ||
                `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;

              const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
              const capcutUrl = `https://www.capcut.com/template?query=${encodeURIComponent(title)}`;

              return {
                id: videoId,
                title,
                thumbnail,
                videoUrl: embedUrl,
                capcutUrl,
                author: {
                  name: item.author?.name || 'Kreator Template',
                  avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
                    item.author?.name || videoId
                  )}`,
                  uniqueId: item.author?.name || '',
                },
                stats: {
                  usages: typeof item.views === 'number' ? item.views : 14800,
                  likes: 2400,
                },
                duration: typeof item.seconds === 'number' ? item.seconds : 18,
                clipsCount: 1,
                aspectRatio: '9:16',
                isPro: false,
              };
            });

            const result = {
              success: true,
              templates: mappedList,
              count: mappedList.length,
              source: 'siputzx_search',
            };

            cache.set(cacheKey, { timestamp: Date.now(), data: result });
            return NextResponse.json(result);
          }
        }
      }
    } catch (siputzxSearchErr: any) {
      console.warn('Siputzx search API error:', siputzxSearchErr.message);
    }

    // Direct CapCut web search link
    const directCapcutUrl = `https://www.capcut.com/template?query=${encodeURIComponent(effectiveSearch)}`;

    // Fallback: Kembalikan 1 kartu langsung yang membuka pencarian template CapCut asli
    const fallbackTemplate: CapCutTemplateMappedItem = {
      id: `capcut_${Date.now()}`,
      title: `Template CapCut: ${effectiveSearch}`,
      thumbnail: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80`,
      videoUrl: '',
      capcutUrl: directCapcutUrl,
      author: {
        name: 'CapCut Community',
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=capcut`,
      },
      stats: {
        usages: 28400,
        likes: 5400,
      },
      duration: 15,
      clipsCount: 1,
      aspectRatio: '9:16',
      isPro: false,
    };

    return NextResponse.json({
      success: true,
      templates: [fallbackTemplate],
      count: 1,
      source: 'capcut_direct',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        templates: [],
        message: error.message || 'Terjadi kesalahan sistem saat memproses pencarian CapCut.',
      },
      { status: 500 }
    );
  }
}
