import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppLang } from '@/utils/i18n';

export type ToolCategory = 'all' | 'downloader' | 'creator' | 'audio' | 'docs' | 'images' | 'dev' | 'social';
export type SettingsSubPage = 'profile' | 'theme' | 'background' | 'font' | 'about' | 'help' | 'language' | 'storage' | null;
export type FontFamily = 'plus-jakarta' | 'space-grotesk' | 'outfit' | 'jetbrains-mono' | 'inter' | 'playfair';
export type ThemeMode =
  | 'light'
  | 'dark'
  | 'paper-white'
  | 'charcoal-matte'
  | 'matcha-sage'
  | 'warm-sand'
  | 'soft-lavender'
  | 'nordic-midnight';
export type TextSize = 'compact' | 'normal' | 'large';
export type BgStyle =
  | 'red-sakura'
  | 'pink-sakura'
  | 'grid'
  | 'dots'
  | 'solid'
  | 'shapes'
  | 'isometric';

export interface HistoryItem {
  id: string;
  type?: string;
  title: string;
  subtitle?: string;
  timestamp: number;
  downloadUrl?: string;
  presetUrls?: Array<{ url: string; service: string }>;
  toolId?: string;
  toolName?: string;
  category?: string;
  details?: string;
}

export interface ActiveJob {
  taskId: string;
  type: string;
  title?: string;
  progress: number;
  speed: string;
  eta: string;
  status: 'idle' | 'searching' | 'downloading' | 'processing' | 'completed' | 'error';
  message: string;
  downloadUrl?: string;
}

interface AppState {
  activeTab: 'beranda' | 'riwayat' | 'pengaturan';
  setActiveTab: (tab: 'beranda' | 'riwayat' | 'pengaturan') => void;

  activeToolSlug: string | null;
  setActiveToolSlug: (slug: string | null) => void;

  settingsSubPage: SettingsSubPage;
  setSettingsSubPage: (sub: SettingsSubPage) => void;

  selectedCategory: ToolCategory;
  setSelectedCategory: (cat: ToolCategory) => void;

  themeMode: ThemeMode;
  toggleThemeMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;

  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  bgStyle: BgStyle;
  setBgStyle: (bg: BgStyle) => void;

  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;

  userCustomName: string;
  setUserCustomName: (name: string) => void;

  username: string;
  setUsername: (name: string) => void;
  avatarSeed: string;
  regenerateAvatarSeed: () => void;
  bannerVersion: number;
  incrementBannerVersion: () => void;

  isAdmin: boolean;
  adminData: any | null;
  setIsAdmin: (isAdmin: boolean, data?: any) => void;

  history: HistoryItem[];
  addHistoryItem: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  addHistory: (item: any) => void;
  clearHistory: () => void;
  deleteHistoryItem: (id: string) => void;

  activeJob: ActiveJob | null;
  setActiveJob: (job: ActiveJob | null) => void;
  updateActiveJob: (patch: Partial<ActiveJob>) => void;

  language: AppLang;
  setLanguage: (lang: AppLang) => void;

  // Shared prefill for smart clipboard and cross-tool navigation
  prefilledUrl: string;
  setPrefilledUrl: (url: string) => void;

  // Content passed from OCR to PDF Studio
  pdfStudioContent: string | null;
  setPdfStudioContent: (content: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'beranda',
      setActiveTab: (activeTab) =>
        set({
          activeTab,
          activeToolSlug: null,
          settingsSubPage: null,
        }),

      activeToolSlug: null,
      setActiveToolSlug: (activeToolSlug) => set({ activeToolSlug }),

      settingsSubPage: null,
      setSettingsSubPage: (settingsSubPage) => set({ settingsSubPage }),

      selectedCategory: 'all',
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

      themeMode: 'dark',
      toggleThemeMode: () =>
        set((state) => ({ themeMode: state.themeMode === 'dark' ? 'light' : 'dark' })),
      setThemeMode: (themeMode) => set({ themeMode }),

      textSize: 'normal',
      setTextSize: (textSize) => set({ textSize }),
      bgStyle: 'red-sakura',
      setBgStyle: (bgStyle) => set({ bgStyle }),

      fontFamily: 'plus-jakarta',
      setFontFamily: (fontFamily) => set({ fontFamily }),

      userCustomName: '',
      setUserCustomName: (userCustomName) => set({ userCustomName }),

      username: 'Guest_7842',
      setUsername: (username) => set({ username }),
      avatarSeed: 'Kiyomi',
      regenerateAvatarSeed: () => {
        const animeNames = ['Kiyomi', 'Ren', 'Aoi', 'Haruto', 'Yuki', 'Sora', 'Kaede', 'Akira', 'Rin', 'Hina'];
        const randomName = animeNames[Math.floor(Math.random() * animeNames.length)] + '_' + Math.floor(100 + Math.random() * 900);
        set({ avatarSeed: randomName });
      },
      bannerVersion: 0,
      incrementBannerVersion: () =>
        set((state) => ({ bannerVersion: state.bannerVersion + 1 })),

      isAdmin: false,
      adminData: null,
      setIsAdmin: (isAdmin, adminData = null) => set({ isAdmin, adminData }),

      history: [],
      addHistoryItem: (item) =>
        set((state) => ({
          history: [
            {
              ...item,
              type: item.type || 'tool',
              id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              timestamp: Date.now(),
            },
            ...state.history.slice(0, 49),
          ],
        })),
      addHistory: (item) =>
        set((state) => ({
          history: [
            {
              ...item,
              type: item.type || 'tool',
              id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              timestamp: Date.now(),
            },
            ...state.history.slice(0, 49),
          ],
        })),
      clearHistory: () => set({ history: [] }),
      deleteHistoryItem: (id) =>
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        })),

      activeJob: null,
      setActiveJob: (activeJob) => set({ activeJob }),
      updateActiveJob: (patch) =>
        set((state) => ({
          activeJob: state.activeJob ? { ...state.activeJob, ...patch } : null,
        })),

      language: 'id',
      setLanguage: (language) => set({ language }),

      prefilledUrl: '',
      setPrefilledUrl: (prefilledUrl) => set({ prefilledUrl }),

      pdfStudioContent: null,
      setPdfStudioContent: (pdfStudioContent) => set({ pdfStudioContent }),
    }),
    {
      name: 'solid-utility-storage-v3',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        themeMode: state.themeMode,
        username: state.username,
        userCustomName: state.userCustomName,
        fontFamily: state.fontFamily,
        avatarSeed: state.avatarSeed,
        isAdmin: state.isAdmin,
        history: state.history,
        language: state.language,
        textSize: state.textSize,
        bgStyle: state.bgStyle,
      }),
    }
  )
);
