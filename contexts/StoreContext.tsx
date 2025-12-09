import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings, FlashcardSet, Flashcard } from '../types';

interface StoreContextType {
  sets: FlashcardSet[];
  settings: AppSettings;
  createSet: (set: FlashcardSet) => void;
  updateSet: (id: string, updatedSet: Partial<FlashcardSet>) => void;
  deleteSet: (id: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  getSet: (id: string) => FlashcardSet | undefined;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  fontSize: 'medium',
  language: 'pt-BR'
};

const STORAGE_KEY_SETS = 'flashcards_sets_v1';
const STORAGE_KEY_SETTINGS = 'flashcards_settings_v1';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    try {
      const storedSets = localStorage.getItem(STORAGE_KEY_SETS);
      const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);

      if (storedSets) setSets(JSON.parse(storedSets));
      if (storedSettings) setSettings(JSON.parse(storedSettings));
    } catch (e) {
      console.error("Failed to load from storage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets));
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
      
      // Apply theme
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('bg-dark-bg', 'text-dark-text');
        document.body.classList.remove('bg-background', 'text-text');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('bg-dark-bg', 'text-dark-text');
        document.body.classList.add('bg-background', 'text-text');
      }
    }
  }, [sets, settings, isLoaded]);

  const createSet = (newSet: FlashcardSet) => {
    setSets(prev => [newSet, ...prev]);
  };

  const updateSet = (id: string, updatedFields: Partial<FlashcardSet>) => {
    setSets(prev => prev.map(s => s.id === id ? { ...s, ...updatedFields } : s));
  };

  const deleteSet = (id: string) => {
    setSets(prev => prev.filter(s => s.id !== id));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const getSet = (id: string) => sets.find(s => s.id === id);

  return (
    <StoreContext.Provider value={{ sets, settings, createSet, updateSet, deleteSet, updateSettings, getSet }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};
