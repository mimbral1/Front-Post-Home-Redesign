import { useEffect, useState } from 'react';
import { loadJson } from '../lib/storage';

export function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => loadJson(key, fallback));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
