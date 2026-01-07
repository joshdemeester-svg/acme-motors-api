import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const STORAGE_KEY = "saved-vehicles";

interface SavedVehiclesContextType {
  savedIds: string[];
  toggleSaved: (vehicleId: string) => void;
  isSaved: (vehicleId: string) => boolean;
  clearSaved: () => void;
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
  }, []);

  const isSaved = useCallback((vehicleId: string) => {
    return savedIds.includes(vehicleId);
  }, [savedIds]);

  const clearSaved = useCallback(() => {
    setSavedIds([]);
  }, []);

  return (
    <SavedVehiclesContext.Provider value={{
      savedIds,
      toggleSaved,
      isSaved,
      clearSaved,
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
