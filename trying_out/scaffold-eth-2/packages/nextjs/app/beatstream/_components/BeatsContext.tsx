"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface BeatsContextType {
  beatsBalance: number;
  setBeatsBalance: (balance: number) => void;
  decrementBeat: () => boolean; // Returns false if out of beats
  addBeats: (amount: number) => void;
  isLowOnBeats: boolean;
  isOutOfBeats: boolean;
  isLoading: boolean;
}

const LOW_BEATS_WARNING = 400;
const INITIAL_BEATS = 500; // Default for demo when no blockchain connection

const BeatsContext = createContext<BeatsContextType | null>(null);

export function BeatsProvider({ children }: { children: ReactNode }) {
  const [beatsBalance, setBeatsBalance] = useState(INITIAL_BEATS);
  const [isLoading, setIsLoading] = useState(false); // Start as false for seamless experience

  const isLowOnBeats = beatsBalance < LOW_BEATS_WARNING && beatsBalance > 0;
  const isOutOfBeats = beatsBalance <= 0;

  const decrementBeat = useCallback(() => {
    if (beatsBalance <= 0) return false;
    setBeatsBalance(prev => Math.max(0, prev - 1));
    return true;
  }, [beatsBalance]);

  const addBeats = useCallback((amount: number) => {
    setBeatsBalance(prev => prev + amount);
  }, []);

  return (
    <BeatsContext.Provider
      value={{
        beatsBalance,
        setBeatsBalance,
        decrementBeat,
        addBeats,
        isLowOnBeats,
        isOutOfBeats,
        isLoading,
      }}
    >
      {children}
    </BeatsContext.Provider>
  );
}

export function useBeats() {
  const context = useContext(BeatsContext);
  if (!context) {
    throw new Error("useBeats must be used within a BeatsProvider");
  }
  return context;
}
