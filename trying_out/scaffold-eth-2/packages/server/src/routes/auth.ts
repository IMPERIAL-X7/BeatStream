// ──────────────────────────────────────────────
// Auth Routes
// POST /api/auth/login – wallet connect → auto-create user, detect artist
// ──────────────────────────────────────────────
import { Router, type Request, type Response } from "express";
import { getUser, createUser, getArtistByWallet } from "../db/supabase.js";
import { verifySig, buildAuthMessage } from "../lib/verify.js";

const router = Router();

/**
 * POST /api/auth/login
 * Body: { wallet, signature, nonce }
 *
 * Single endpoint for wallet connection:
 *   1. Verifies wallet signature
 *   2. Creates user if not exists (upsert)
 *   3. Detects if wallet is a registered artist
 *   4. Returns { user, artist? } so the frontend knows the role
 *
 * This is idempotent — calling it multiple times is safe.
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet, signature, nonce } = req.body;

    if (!wallet || !signature || nonce === undefined) {
      res.status(400).json({ error: "Missing required fields: wallet, signature, nonce" });
      return;
    }

    // Verify wallet ownership
    const message = buildAuthMessage(wallet, nonce);
    const valid = await verifySig(message, signature, wallet);
    if (!valid) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Check if user exists, detect role
    let user = await getUser(wallet);
    const artist = await getArtistByWallet(wallet);

    // Auto-create user if first time (upsert — preserves existing role)
    if (!user) {
      const role = artist ? "artist" : "user";
      user = await createUser(wallet, role, artist?.ens_name ?? undefined);
      console.log(`👤 New user auto-created on login: ${wallet} (${role})`);
    }

    console.log(`🔑 Login: ${wallet} → ${artist ? `artist "${artist.display_name}"` : "listener"}`);

    res.json({
      user,
      artist: artist ?? null,
      role: artist ? "artist" : "user",
      ensName: artist?.ens_name ?? user.ens_name ?? null,
    });
  } catch (err) {
    console.error("Auth login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
