export interface CapCutTemplateMappedItem {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  capcutUrl: string;
  author: {
    id?: string;
    name: string;
    avatar?: string;
    uniqueId?: string;
  };
  stats: {
    usages: number | 'tidak tersedia';
    likes?: number | 'tidak tersedia';
  };
  duration: number | 'tidak tersedia';
  clipsCount: number | 'tidak tersedia';
  aspectRatio: string | 'tidak tersedia';
  isPro: boolean;
}

// Maps official CapCut raw response items into UI structure without mocks
export function mapCapCutOfficialResponse(raw: any): CapCutTemplateMappedItem[] {
  if (!raw) return [];
  const list = raw.data?.templates || raw.templates || raw.data?.item_list || raw.data || [];
  if (!Array.isArray(list)) return [];

  return list.map((item: any, idx: number) => {
    const templateId = String(item.id || item.template_id || idx);
    const title = item.title || item.name || 'Template CapCut';
    const coverUrl =
      item.cover_url ||
      item.thumbnail ||
      item.video?.cover_url ||
      item.video?.poster_url ||
      '';
    const previewVideo =
      item.video_url ||
      item.play_url ||
      item.video?.play_addr?.url_list?.[0] ||
      '';

    const authorName =
      item.author?.name ||
      item.author?.nickname ||
      item.creator?.name ||
      item.user_name ||
      'Kreator CapCut';

    const authorAvatar =
      item.author?.avatar_url ||
      item.author?.avatar ||
      item.creator?.avatar ||
      '';

    const authorId = item.author?.id || item.author?.uid || item.creator?.id;

    const capcutUrl =
      item.share_url ||
      item.template_url ||
      `https://www.capcut.com/template-detail/${templateId}`;

    return {
      id: templateId,
      title,
      thumbnail: coverUrl,
      videoUrl: previewVideo,
      capcutUrl,
      author: {
        id: authorId,
        name: authorName,
        avatar: authorAvatar,
        uniqueId: item.author?.unique_id || authorName,
      },
      stats: {
        usages:
          typeof item.usage_amount === 'number'
            ? item.usage_amount
            : typeof item.play_count === 'number'
            ? item.play_count
            : 'tidak tersedia',
        likes: typeof item.like_count === 'number' ? item.like_count : 'tidak tersedia',
      },
      duration: typeof item.duration === 'number' ? item.duration : 'tidak tersedia',
      clipsCount:
        typeof item.fragment_count === 'number'
          ? item.fragment_count
          : typeof item.clip_count === 'number'
          ? item.clip_count
          : 'tidak tersedia',
      aspectRatio: item.aspect_ratio || '9:16',
      isPro: Boolean(item.is_pro || item.vip_type === 1 || item.pay_type === 1),
    };
  });
}
