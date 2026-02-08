"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { startSession, settleSession, type Session } from "./api";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000/ws/stream";

interface UseStreamingReturn {
  isStreaming: boolean;
  currentSession: Session | null;
  beatsStreamed: number;
  startStreaming: (trackId: string) => Promise<void>;
  stopStreaming: () => Promise<void>;
  error: string | null;
}

/**
 * Hook to manage streaming sessions with WebSocket beat streaming
 */
export function useStreaming(): UseStreamingReturn {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [beatsStreamed, setBeatsStreamed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const beatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Generate auth message for signing
  const buildAuthMessage = useCallback((wallet: string, nonce: number) => {
    return `BeatStream Auth\nWallet: ${wallet}\nNonce: ${nonce}`;
  }, []);

  // Start streaming session
  const startStreaming = useCallback(async (trackId: string) => {
    if (!address) {
      setError("Wallet not connected");
      return;
    }

    try {
      setError(null);
      
      // 1. Sign message to authenticate
      const nonce = Date.now();
      const message = buildAuthMessage(address, nonce);
      const signature = await signMessageAsync({ message });

      // 2. Start session via API
      console.log("🎵 Starting session for track", trackId);
      const session = await startSession(address, trackId, signature, nonce);
      setCurrentSession(session);
      setBeatsStreamed(0);
      setIsStreaming(true);

      // 3. Connect WebSocket (simulated - backend expects real WS)
      // For now, we'll just increment beats locally every second
      // and settle when stopped
      console.log("🔌 Starting beat counter...");
      beatIntervalRef.current = setInterval(() => {
        setBeatsStreamed(prev => prev + 1);
      }, 1000); // 1 beat per second

    } catch (err: any) {
      console.error("❌ Failed to start streaming:", err);
      setError(err.message || "Failed to start streaming");
      setIsStreaming(false);
    }
  }, [address, signMessageAsync, buildAuthMessage]);

  // Stop streaming and settle
  const stopStreaming = useCallback(async () => {
    if (!address || !currentSession) {
      return;
    }

    try {
      setError(null);
      
      // 1. Stop beat counter
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
        beatIntervalRef.current = null;
      }

      // 2. Close WebSocket if exists
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // 3. Sign and settle session
      const nonce = Date.now();
      const message = buildAuthMessage(address, nonce);
      const signature = await signMessageAsync({ message });

      console.log(`💰 Settling session ${currentSession.session_id} with ${beatsStreamed} beats`);
      const result = await settleSession(currentSession.session_id, address, signature, nonce);
      
      console.log("✅ Session settled:", result);
      
      // 4. Reset state
      setIsStreaming(false);
      setCurrentSession(null);
      setBeatsStreamed(0);

    } catch (err: any) {
      console.error("❌ Failed to settle session:", err);
      setError(err.message || "Failed to settle session");
    }
  }, [address, currentSession, beatsStreamed, signMessageAsync, buildAuthMessage]);

  return {
    isStreaming,
    currentSession,
    beatsStreamed,
    startStreaming,
    stopStreaming,
    error,
  };
}
