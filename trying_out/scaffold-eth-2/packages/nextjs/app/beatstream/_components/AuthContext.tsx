"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAccount, useSignMessage } from "wagmi";
import {
  login as apiLogin,
  fetchArtistByWallet,
  type Artist,
  type User,
  type LoginResponse,
} from "./api";

interface AuthContextType {
  /** The logged-in user (null before login completes) */
  user: User | null;
  /** Non-null if the connected wallet is a registered artist */
  artist: Artist | null;
  /** "artist" | "user" | null (null = not logged in) */
  role: "artist" | "user" | null;
  /** The artist's ENS name (or user's ENS name) */
  ensName: string | null;
  /** True while the login handshake is in progress */
  isLoggingIn: boolean;
  /** True if wallet is connected */
  isWalletConnected: boolean;
  /** Force a re-login (e.g. after registering as artist) */
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Nonce counter persisted per-session so signatures don't collide
let nonceCounter = Math.floor(Date.now() / 1000);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [user, setUser] = useState<User | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [role, setRole] = useState<"artist" | "user" | null>(null);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState<string | null>(null);

  // Sign & call /api/auth/login whenever the wallet connects
  const doLogin = useCallback(
    async (wallet: string) => {
      setIsLoggingIn(true);
      try {
        const nonce = ++nonceCounter;
        const message = `Sign in to BeatStream\nWallet: ${wallet}\nNonce: ${nonce}`;
        const signature = await signMessageAsync({ message });

        const res: LoginResponse = await apiLogin(wallet, signature, nonce);

        setUser(res.user);
        setArtist(res.artist);
        setRole(res.role);
        setEnsName(res.ensName);
        setLoginAttempted(wallet.toLowerCase());

        console.log(
          `🔑 Logged in as ${res.role}${res.artist ? ` — "${res.artist.display_name}" (${res.ensName})` : ""}`
        );
      } catch (err) {
        // If signing was rejected or server is down, try read-only lookup
        console.warn("Login signature failed, trying read-only lookup:", err);
        try {
          const existingArtist = await fetchArtistByWallet(wallet);
          if (existingArtist) {
            setArtist(existingArtist);
            setRole("artist");
            setEnsName(existingArtist.ens_name);
          } else {
            setRole("user");
          }
          setLoginAttempted(wallet.toLowerCase());
        } catch {
          // Server completely down — we'll just be in "not logged in" state
          console.warn("Server unreachable, running in offline mode");
        }
      } finally {
        setIsLoggingIn(false);
      }
    },
    [signMessageAsync]
  );

  // Auto-login when wallet connects or changes
  useEffect(() => {
    if (isConnected && address && loginAttempted !== address.toLowerCase()) {
      doLogin(address);
    } else if (!isConnected) {
      // Wallet disconnected — clear state
      setUser(null);
      setArtist(null);
      setRole(null);
      setEnsName(null);
      setLoginAttempted(null);
    }
  }, [isConnected, address, loginAttempted, doLogin]);

  // Force re-login (after artist registration, etc.)
  const refreshAuth = useCallback(() => {
    if (address) {
      setLoginAttempted(null); // This will trigger the useEffect above
    }
  }, [address]);

  return (
    <AuthContext.Provider
      value={{
        user,
        artist,
        role,
        ensName,
        isLoggingIn,
        isWalletConnected: isConnected,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
