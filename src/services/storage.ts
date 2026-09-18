import AsyncStorage from '@react-native-async-storage/async-storage';

export type AIProvider = 'Gemini' | 'Claude' | 'Perplexity' | 'OpenAI';

export interface UserPreferences {
  selectedInterests: string[];
  aiProvider: AIProvider | null;
  geminiApiKey?: string;
  whatsappNumber: string | null;
  autoDeliverWhatsApp?: boolean;
  digestTime: string; // HH:mm format
  isOnboarded: boolean;
}

export interface DigestItem {
  title: string;
  summary: string;
  link?: string;
  category: string;
}

export interface DigestRun {
  id: string; // date string YYYY-MM-DD
  date: string;
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
        digestTime: '07:00',
        isOnboarded: true,
      };
    }
    return JSON.parse(data);
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
      if (history.length > 30) history.pop(); // Keep last 30 days
    }
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
};
