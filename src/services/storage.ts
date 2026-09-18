import AsyncStorage from '@react-native-async-storage/async-storage';

export type AIProvider = 'Gemini' | 'Claude' | 'Perplexity' | 'OpenAI';

export interface UserPreferences {
  selectedInterests: string[];
  aiProvider: AIProvider | null;
  geminiApiKey?: string;
  whatsappNumber: string | null;
  autoDeliverWhatsApp?: boolean;
  scheduleFrequency: 'twice_daily' | 'daily'; // twice_daily = 8 AM & 8 PM
  digestTime: string; // '08:00 & 20:00'
  isOnboarded: boolean;
}

export interface DigestItem {
  title: string;
  summary: string;
  link?: string;
  category: string;
}

export interface DigestRun {
  id: string; // e.g. YYYY-MM-DD-morning or YYYY-MM-DD-evening
  date: string;
  slot: 'morning' | 'evening';
  status: 'success' | 'partial' | 'failed' | 'pending';
  items: DigestItem[];
}

const PREFS_KEY = '@devdigest/prefs';
const HISTORY_KEY = '@devdigest/history';

export const StorageService = {
  async getPreferences(): Promise<UserPreferences> {
    const data = await AsyncStorage.getItem(PREFS_KEY);
    if (!data) {
      return {
        selectedInterests: ['AI trends in travel industry', 'AI trends in banking industry', 'AI trends in e-commerce', 'AI in software'],
        aiProvider: 'Gemini',
        geminiApiKey: '',
        whatsappNumber: null,
        autoDeliverWhatsApp: true,
        scheduleFrequency: 'twice_daily',
        digestTime: '08:00 & 20:00',
        isOnboarded: true,
      };
    }
    const parsed = JSON.parse(data);
    return {
      scheduleFrequency: 'twice_daily',
      digestTime: '08:00 & 20:00',
      ...parsed
    };
  },

  async savePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.getPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    return updated;
  },

  async getDigestHistory(): Promise<DigestRun[]> {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  },

  async addDigestRun(run: DigestRun): Promise<void> {
    const history = await this.getDigestHistory();
    const existingIndex = history.findIndex(h => h.id === run.id);
    if (existingIndex >= 0) {
      history[existingIndex] = run;
    } else {
      history.unshift(run);
      if (history.length > 60) history.pop(); // Keep last 60 runs (30 days of twice daily)
    }
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
};
