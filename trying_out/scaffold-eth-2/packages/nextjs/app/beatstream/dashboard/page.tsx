"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { BeatStreamNav } from "../_components/BeatStreamNav";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import {
  fetchArtistByWallet,
  fetchTracks,
  registerArtist,
  uploadTrack,
  uploadTrackAudio,
  formatDuration,
  type Artist,
  type Track,
} from "../_components/api";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  // Artist state
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLoadingArtist, setIsLoadingArtist] = useState(true);
  const [artistTracks, setArtistTracks] = useState<Track[]>([]);
  
  // Registration form
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [genre, setGenre] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");
  
  // Track upload form
  const [trackTitle, setTrackTitle] = useState("");
  const [trackGenre, setTrackGenre] = useState("");
  const [trackDuration, setTrackDuration] = useState(180);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if wallet is registered as artist
  useEffect(() => {
    async function checkArtist() {
      if (!address) {
        setArtist(null);
        setIsLoadingArtist(false);
        return;
      }

      setIsLoadingArtist(true);
      try {
        const foundArtist = await fetchArtistByWallet(address);
        setArtist(foundArtist);
        
        // If artist exists, fetch their tracks
        if (foundArtist) {
          const tracks = await fetchTracks(foundArtist.id);
          setArtistTracks(tracks);
        }
      } catch (err) {
        console.error("Failed to check artist status:", err);
      } finally {
        setIsLoadingArtist(false);
      }
    }
    checkArtist();
  }, [address]);

  // Handle artist registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !displayName.trim()) return;

    setIsRegistering(true);
    setRegisterError("");

    try {
      const nonce = Date.now();
      const message = `Sign in to BeatStream\nWallet: ${address}\nNonce: ${nonce}`;
      const signature = await signMessageAsync({ message });

      const result = await registerArtist(
        address,
        displayName.trim(),
        signature,
        nonce,
        bio.trim() || undefined,
        genre.trim() || undefined
      );

      setArtist(result.artist);
      setArtistTracks([]);
      console.log(`✅ Registered as artist: ${result.ensName}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      setRegisterError(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle audio file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      // Try to extract duration from audio
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        setTrackDuration(Math.round(audio.duration));
        URL.revokeObjectURL(audio.src);
      };
    }
  };

  // Handle track upload
  const handleUploadTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !trackTitle.trim()) return;

    setIsUploading(true);
    setUploadError("");
    setUploadProgress("Creating track...");

    try {
      const nonce = Date.now();
      const message = `Sign in to BeatStream\nWallet: ${address}\nNonce: ${nonce}`;
      const signature = await signMessageAsync({ message });

      // Step 1: Create track record
      const track = await uploadTrack(
        address,
        trackTitle.trim(),
        trackDuration,
        signature,
        nonce,
        trackGenre.trim() || undefined,
        false
      );

      // Step 2: Upload audio file if provided
      if (audioFile) {
        setUploadProgress("Uploading audio file...");
        const audioNonce = Date.now();
        const audioMessage = `Sign in to BeatStream\nWallet: ${address}\nNonce: ${audioNonce}`;
        const audioSignature = await signMessageAsync({ message: audioMessage });

        await uploadTrackAudio(track.id, address, audioSignature, audioNonce, audioFile);
      }

      // Add to tracks list
      setArtistTracks(prev => [track, ...prev]);
      
      // Reset form
      setTrackTitle("");
      setTrackGenre("");
      setTrackDuration(180);
      setAudioFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      setUploadProgress("");
      console.log(`✅ Track uploaded: ${track.title}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setUploadError(errorMessage);
      setUploadProgress("");
    } finally {
      setIsUploading(false);
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen">
        <BeatStreamNav />
        <div className="flex flex-col items-center justify-center flex-1 p-8">
          <h1 className="text-4xl font-bold mb-4">📊 Artist Dashboard</h1>
          <p className="text-lg text-base-content/60 mb-8">Connect your wallet to access the artist dashboard</p>
          <RainbowKitCustomConnectButton />
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingArtist) {
    return (
      <div className="flex flex-col min-h-screen">
        <BeatStreamNav />
        <div className="flex items-center justify-center flex-1">
          <div className="text-xl">Loading artist profile...</div>
        </div>
      </div>
    );
  }

  // Not registered as artist - show registration form
  if (!artist) {
    return (
      <div className="flex flex-col min-h-screen">
        <BeatStreamNav />
        <div className="flex-1 p-8">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-center">🎤 Become an Artist</h1>
            <p className="text-base-content/60 mb-8 text-center">
              Register your wallet to start uploading tracks
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Display Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="Your artist name"
                  className="input input-bordered w-full"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Genre</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Electronic, Hip Hop, Rock"
                  className="input input-bordered w-full"
                  value={genre}
                  onChange={e => setGenre(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Bio</span>
                </label>
                <textarea
                  placeholder="Tell listeners about yourself..."
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
              </div>

              {registerError && (
                <div className="alert alert-error text-sm">
                  <span>{registerError}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isRegistering || !displayName.trim()}
              >
                {isRegistering ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Signing & Registering...
                  </>
                ) : (
                  "Register as Artist"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Artist dashboard - show tracks and upload form
  return (
    <div className="flex flex-col min-h-screen">
      <BeatStreamNav />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Artist Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="text-5xl">🎤</div>
            <div>
              <h1 className="text-3xl font-bold">{artist.display_name}</h1>
              <p className="text-base-content/60">{artist.ens_name}</p>
              <p className="text-sm text-success">
                💰 Earned: {(artist.usdc_earned || 0).toFixed(2)} USDC
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload New Track */}
            <div className="bg-base-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">🎵 Upload New Track</h2>
              
              <form onSubmit={handleUploadTrack} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Track Title *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Song title"
                    className="input input-bordered w-full"
                    value={trackTitle}
                    onChange={e => setTrackTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Genre</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. House, Techno, Pop"
                    className="input input-bordered w-full"
                    value={trackGenre}
                    onChange={e => setTrackGenre(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Audio File</span>
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    className="file-input file-input-bordered w-full"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  {audioFile && (
                    <label className="label">
                      <span className="label-text-alt">
                        {audioFile.name} ({formatDuration(trackDuration)})
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Duration (seconds)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="input input-bordered w-full"
                    value={trackDuration}
                    onChange={e => setTrackDuration(parseInt(e.target.value) || 180)}
                  />
                </div>

                {uploadError && (
                  <div className="alert alert-error text-sm">
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadProgress && (
                  <div className="alert alert-info text-sm">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span>{uploadProgress}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isUploading || !trackTitle.trim()}
                >
                  {isUploading ? "Uploading..." : "Upload Track"}
                </button>
              </form>
            </div>

            {/* Track List */}
            <div className="bg-base-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">📀 Your Tracks ({artistTracks.length})</h2>
              
              {artistTracks.length === 0 ? (
                <p className="text-base-content/60 text-center py-8">
                  No tracks uploaded yet. Upload your first track!
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {artistTracks.map(track => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-3 bg-base-300 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🎵</span>
                        <div>
                          <div className="font-medium">{track.title}</div>
                          <div className="text-xs text-base-content/60">
                            {formatDuration(track.duration_seconds)}
                            {track.is_private && " • 🔒 Private"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
