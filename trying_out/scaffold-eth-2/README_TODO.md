# 🔲 BeatStream — What Needs To Be Done

> Remaining work to go from "backend complete" to "hackathon-ready demo".

---

## 🔴 Critical Path (Must-Have)

### 1. Supabase Tables Setup ⏳
- [ ] Run `packages/server/src/db/schema.sql` in the Supabase SQL Editor
- [ ] Grab the **anon key** from Supabase → Settings → API → paste into `.env`
- [ ] Verify seed data appears (3 demo artists, 5 demo tracks)

### 2. Circle Wallet Creation ⏳
- [ ] Run one-time setup script to call `createArcWallet()` 
- [ ] Auto-populates `CIRCLE_WALLET_ID` and `CIRCLE_WALLET_ADDRESS` in `.env`
- [ ] Fund wallet with testnet tokens from Circle faucet if needed

### 3. End-to-End Smoke Test ⏳
- [ ] Hit `GET /api/health` and `GET /api/status` — verify all green
- [ ] Test `POST /api/users/register` with a wallet signature
- [ ] Test `POST /api/artists/register` → verify ENS name generated
- [ ] Test `POST /api/tracks` → upload a track
- [ ] Test `POST /api/sessions/start` → verify Yellow session opens
- [ ] Test WebSocket stream flow (connect → start_stream → beat_tick → stop)
- [ ] Test `POST /api/sessions/settle` → verify Arc settlement + ENS check

### 4. Frontend (Separate Branch — Teammate) 🔲
- [ ] Landing page with wallet connect
- [ ] Deposit USDC page
- [ ] Streaming player with WebSocket + live beat counter
- [ ] Artist profile + dashboard
- [ ] Merge into main when ready

---

## 🟡 ENS — Deeper Integration (For $5k Prize)

Currently ENS is server-side only (generates name strings). For the prize:

- [ ] Register `beatstream.eth` on ENS Sepolia testnet
- [ ] Set up NameWrapper for subdomain creation
- [ ] Add on-chain subdomain minting route (`POST /api/ens/mint-subdomain`)
- [ ] Artist registration → auto-mints `artist.beatstream.eth` on-chain
- [ ] Fan subdomain minting after 100 beats streamed
- [ ] Frontend: resolve + display ENS names via wagmi `useEnsName` / `useEnsAvatar`

---

## 🟡 Yellow Network — Deeper Integration (For $15k Prize)

ClearNode auth is connected. To strengthen:

- [ ] Verify full auth challenge-response completes (currently sends request, awaiting challenge)
- [ ] Test actual app session open → state update → close lifecycle with ClearNode
- [ ] Deposit `ytest.usd` tokens into Yellow Custody contract (`0x019B...`) on Sepolia
- [ ] Handle channel recovery on reconnection
- [ ] Add proper session key rotation

---

## 🟡 Circle Arc — Deeper Integration (For $10k Prize)

SDK is connected with real API key. To strengthen:

- [ ] Create developer wallet via `createArcWallet()`
- [ ] Deploy BeatStreamVault on Arc Testnet via Circle SDK
- [ ] Test real `settlePayment()` execution on-chain
- [ ] Set up webhook listener for deposit confirmations (instead of polling)
- [ ] Use Circle's Gas Station for gasless user transactions

---

## 🟢 Nice-to-Have (If Time Permits)

### Audio
- [ ] Add actual audio file storage (Supabase Storage or IPFS)
- [ ] Chunked audio delivery (5-second chunks gated by beat payment)
- [ ] `MediaSource` API for streaming playback

### Backend Hardening
- [ ] Rate limiting on API routes
- [ ] Request validation (zod schemas)
- [ ] Session timeout (auto-settle after inactivity)
- [ ] Structured logging (pino)

### Testing
- [ ] Hardhat unit tests for BeatStreamVault
- [ ] Server API integration tests (supertest)
- [ ] WebSocket flow tests

### DevOps
- [ ] Deploy contracts to Sepolia
- [ ] Deploy server to Railway/Fly.io
- [ ] Deploy frontend to Vercel
- [ ] Demo video + pitch deck

---

## 📋 Suggested Build Order

```
1. ✅ Supabase tables + anon key          (15 min)  ← NEXT
2. ⏳ Circle wallet creation              (5 min)
3. ⏳ Smoke test all endpoints            (30 min)
4. ⏳ ENS on-chain integration            (2-3 hours)
5. ⏳ Yellow deposit ytest.usd + test     (1-2 hours)
6. ⏳ Frontend merge + wiring             (teammate)
7. ⏳ End-to-end demo flow                (1 hour)
8. ⏳ Polish + demo recording             (1-2 hours)
```

---

## 🔑 Environment Variables Status

```bash
# ✅ CONFIGURED
YELLOW_PRIVATE_KEY=0xcd91...         # → wallet 0xBB2FB355...
ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...
YELLOW_WS_URL=wss://clearnet-sandbox.yellow.com/ws
CIRCLE_API_KEY=TEST_API_KEY:67940...
CIRCLE_ENTITY_SECRET=3696d6ca...     # registered with Circle ✅
SUPABASE_URL=https://rxsqzlylziilhtkjzeeb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
PORT=4000

# ⚠️ STILL NEEDED
SUPABASE_ANON_KEY=                   # Grab from Supabase → Settings → API
CIRCLE_WALLET_ID=                    # Auto-created by setup script
CIRCLE_WALLET_ADDRESS=               # Auto-created by setup script
CIRCLE_VAULT_CONTRACT_ID=            # After deploying vault via Circle
```
