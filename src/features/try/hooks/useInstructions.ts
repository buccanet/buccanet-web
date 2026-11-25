import { useCallback, useState } from 'react';

/** The visitor's standing instructions to their agent, kept in this browser between visits. */
const STORAGE_KEY = 'buccanet-try-instructions';

const stored = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
};

export const useInstructions = (): [string, (text: string) => void] => {
  const [instructions, setInstructions] = useState(stored);
  const save = useCallback((text: string) => {
    setInstructions(text);
    try {
      localStorage.setItem(STORAGE_KEY, text);
    } catch {
      // A browser that refuses storage keeps the instructions for this visit only.
    }
  }, []);
  return [instructions, save];
};
