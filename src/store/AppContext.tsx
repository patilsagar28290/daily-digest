import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService, UserPreferences, DigestRun } from '../services/storage';

interface AppContextProps {
  preferences: UserPreferences | null;
  history: DigestRun[];
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  updateHistory: (run: DigestRun) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [history, setHistory] = useState<DigestRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const prefs = await StorageService.getPreferences();
      const hist = await StorageService.getDigestHistory();
      setPreferences(prefs);
      setHistory(hist);
    } catch(e) {
      console.error('Failed to load storage', e);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    const updated = await StorageService.savePreferences(prefs);
    setPreferences(updated);
  };

  const updateHistory = async (run: DigestRun) => {
    await StorageService.addDigestRun(run);
    const hist = await StorageService.getDigestHistory();
    setHistory(hist);
  };

  return (
    <AppContext.Provider value={{
      preferences,
      history,
      updatePreferences,
      updateHistory,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
