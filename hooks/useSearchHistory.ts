import { useState, useEffect } from 'react';
import { useMMKV } from 'react-native-mmkv';
import { SearchHistoryItem } from '../types/common/SearchHistoryItem';

const HISTORY_KEY = 'user.search_history';
const MAX_HISTORY = 20;

export const useSearchHistory = () => {
  // 1. Move this inside the hook!
    const storage = useMMKV()
  
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // 2. Load on mount
  useEffect(() => {
    const raw = storage.getString(HISTORY_KEY);
    if (raw) {
      try {
        setHistory(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }
  }, [storage]);

  const addToHistory = (word: string) => {
    const trimmedWord = word.trim().toLowerCase();
    if (!trimmedWord) return;

    const newItem: SearchHistoryItem = { 
      word: trimmedWord, 
      timestamp: new Date().toISOString() 
    };
    
    const updated = [
      newItem,
      ...history.filter(item => item.word !== trimmedWord)
    ].slice(0, MAX_HISTORY);

    setHistory(updated);
    storage.set(HISTORY_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    // This is the correct method for the instance returned by useMMKV()
    storage.remove(HISTORY_KEY); 
  };

  return { history, addToHistory, clearHistory };
};