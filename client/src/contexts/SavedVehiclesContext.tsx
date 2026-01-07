import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const STORAGE_KEY = "saved-vehicles";

interface SavedVehiclesContextType {
  savedIds: string[];
  toggleSaved: (vehicleId: string) => void;
  isSaved: (vehicleId: string) => boolean;
  clearSaved: () => void;
  pruneSavedIds: (validIds: string[]) => void;
  savedCount: number;
}

const SavedVehiclesContext = createContext<SavedVehiclesContextType | null>(null);

export function SavedVehiclesProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSavedIds(JSON.parse(stored));
        }
      } catch {}
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
      } catch {}
    }
  }, [savedIds, loaded]);

  const toggleSaved = useCallback((vehicleId: string) => {
    setSavedIds(prev => 
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
    
    // Sync with backend for analytics tracking (fire-and-forget)
    fetch(`/api/vehicles/${vehicleId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {
      // Silently fail - localStorage is the source of truth for user experience
    });
  }, []);

  const isSaved = useCallback((vehicleId: string) => {
    return savedIds.includes(vehicleId);
  }, [savedIds]);

  const clearSaved = useCallback(() => {
    setSavedIds([]);
  }, []);

  const pruneSavedIds = useCallback((validIds: string[]) => {
    setSavedIds(prev => {
      const validSet = new Set(validIds);
      const pruned = prev.filter(id => validSet.has(id));
      if (pruned.length !== prev.length) {
        return pruned;
      }
      return prev;
    });
  }, []);

  return (
    <SavedVehiclesContext.Provider value={{
      savedIds,
      toggleSaved,
      isSaved,
      clearSaved,
      pruneSavedIds,
      savedCount: savedIds.length,
    }}>
      {children}
    </SavedVehiclesContext.Provider>
  );
}

export function useSavedVehicles() {
  const context = useContext(SavedVehiclesContext);
  if (!context) {
    throw new Error("useSavedVehicles must be used within SavedVehiclesProvider");
  }
  return context;
}
