# 🎵 BeatStream — What's Been Built

> **Pay-per-second music streaming on Web3**, built on Scaffold-ETH 2.
> Targeting **Yellow Network** ($15k), **Circle Arc** ($10k), and **ENS** ($5k) hackathon bounties.
> **Updated: Feb 8, 2026** — All three integrations LIVE.

---

## Honest Integration Status

| Integration | SDK Imported | API Keys Set | Connects | Auth Works | Core Feature Works | On-Chain Tx Works |
|-------------|:-----------:|:------------:|:--------:|:----------:|:-----------------:|:-----------------:|
| **Yellow Network** | ✅ | ✅ | ✅ WS connects | ✅ JWT received | ✅ Auth + reconnect | ⏳ App sessions need deposit |
| **Circle Arc** | ✅ | ✅ | ✅ SDK inits | ✅ API key valid | ✅ Vault deployed | ✅ Contract on Arc Testnet |
| **ENS** | ✅ | ✅ (Alchemy RPC) | ✅ Reads work | N/A | ✅ On-chain mode | ✅ setSubnodeRecord works |

**Translation**: All three SDKs are imported, configured, connected, and performing real operations. Yellow authenticates with ClearNode and receives a JWT. Circle's BeatStreamVault is deployed and live on Arc Testnet. ENS subdomains are created on-chain on Sepolia via NameWrapper.

---

## Architecture Overview

```
scaffold-eth-2/
├── packages/
│   ├── hardhat/          ← Smart contracts + deploy scripts
│   ├── nextjs/           ← Frontend (SE2 — separate branch by teammate)
│   └── server/           ← Express + WebSocket backend
```

---

## 🔗 Smart Contracts (`packages/hardhat/`)

### `BeatStreamVault.sol`
Core on-chain vault — deposit → stream → settle → withdraw lifecycle.

- **`deposit(uint256 amount)`** — User deposits USDC, gets off-chain Beats (1000 Beats = 1 USDC)
- **`settle(address artist, uint256 beatsUsed, address user)`** — Owner-only; pays artist from user's deposit
- **`withdraw()`** — User reclaims unspent USDC
- **`registerArtist(address artist)`** — Registers a valid artist
- **`getDeposit(address)`** / **`getArtistEarnings(address)`** / **`vaultBalance()`** — Read-only queries
- Events: `Deposited`, `Settled`, `Withdrawn`, `ArtistRegistered`
- **Status**: ✅ Compiled + deployed to local Hardhat + **deployed on Circle Arc Testnet** at `0x08ff69988879ee75acf24559cf276e286da2a56f`.

### `MockUSDC.sol`
Test ERC20 with open `mint()`. 6 decimals, mirrors real USDC.

---

## 🖥️ Backend Server (`packages/server/`)

Express + WebSocket server. **Starts cleanly with 0 TS errors.**

```bash
cd packages/server && npx tsx src/index.ts    # Starts on port 4000
```

### Services — What Each One Actually Does

#### `services/yellow.ts` — Yellow Network
**What's coded**: Full `@erc7824/nitrolite` v0.5.3 integration:
- EIP-712 challenge-response auth flow (working end-to-end)
- Ephemeral session keys per server restart
- App session open/state update/close for streaming payments
- Auto-reconnect WebSocket (5s backoff) with automatic re-auth
- Pending request-response pattern with timeouts
- Uses `WalletStateSigner`, `parseAuthChallengeResponse`, `createAuthVerifyMessage`, `parseAnyRPCResponse`

**What actually happens at runtime**:
- ✅ WebSocket connects to `wss://clearnet-sandbox.yellow.com/ws`
- ✅ Auth request sent with correct v0.5.3 field names (`address`, `session_key`, `expires_at`, `scope`, `allowances`)
- ✅ ClearNode sends `auth_challenge` → server parses it → sends `auth_verify` → receives JWT
- ✅ `authenticated = true` after successful handshake
- ✅ Auto-reconnects when ClearNode drops connection (confirmed multiple re-auths in logs)
- ⏳ App sessions (`openStreamSession`, `updateStreamState`, `closeStreamSession`) need Custody deposit to work

#### `services/arc.ts` — Circle Arc
**What's coded**: Full `@circle-fin/smart-contract-platform` + `developer-controlled-wallets`:
- Wallet creation, vault deployment, contract queries
- `settlePayment()` → calls `vault.settle()` via Circle's `createContractExecutionTransaction()`
- Deposit verification via Circle API

**What actually happens at runtime**:
- ✅ SDK initializes with API key + entity secret
- ✅ Developer wallet exists (`24071f33...` / `0xdfa721...`) with 40 USDC on Arc Testnet
- ✅ BeatStreamVault deployed on Arc Testnet at `0x08ff69988879ee75acf24559cf276e286da2a56f`
- ✅ `CIRCLE_VAULT_CONTRACT_ID=019c3d96-6c48-7703-ae6d-4d383efbe157` configured in `.env`
- ✅ `CIRCLE_VAULT_CONTRACT_ADDRESS=0x08ff69988879ee75acf24559cf276e286da2a56f` configured
- ✅ Contract verified on [Arc Testnet Explorer](https://testnet.arcscan.app/address/0x08ff69988879ee75acf24559cf276e286da2a56f)

#### `services/ens.ts` — ENS (On-Chain via viem)
**What's coded**: Full on-chain integration via NameWrapper on Sepolia:
- Artist subdomains: `NameWrapper.setSubnodeRecord()` → creates `<artist>.beatstream.eth`
- Fan subdomains: Same mechanism for `fan-<wallet>.<artist>.beatstream.eth`
- Read ops: `isSubdomainRegistered()`, `resolveENS()`, `getENSText()`
- Write ops: `setENSTextRecord()` for avatar/url/description
- Name generation: `generateArtistENS("SynthWave")` → `synthwave.beatstream.eth`
- Eligibility: `checkFanSubdomainEligibility()` — ≥100 beats

**What actually happens at runtime**:
- ✅ viem PublicClient + WalletClient connect to Sepolia via Alchemy
- ✅ `beatstream.eth` registered on Sepolia (tx `0xc2413f...`) + wrapped in NameWrapper
- ✅ Read operations work: `isSubdomainRegistered()` queries NameWrapper, `resolveENS()` queries Resolver
- ✅ **On-chain subdomain creation works**: `synthwave.beatstream.eth` created (tx `0x6517de...`, block 10217661)
- ✅ `setSubnodeRecord()` succeeds — `simulated: false` in responses
- ✅ All ENS API routes (`/api/ens/*`) return real on-chain data

### API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/artists` | `POST /register`, `GET /`, `GET /:id` | Artist registration with sig verification + ENS auto-gen + bio/genre |
| `/api/users` | `POST /register`, `GET /:wallet` | User registration/login with signature auth |
| `/api/deposit` | `POST /`, `POST /verify` | USDC deposit verification → Beats credit |
| `/api/tracks` | `POST /`, `GET /`, `GET /:id`, `POST /:id/audio` | Track CRUD (artists only, sig-gated) + audio file upload |
| `/api/sessions` | `POST /start`, `POST /settle`, `GET /:id` | Start (opens Yellow session) → Settle (closes + Arc settlement + stream history + ENS check) |
| `/api/ens` | `POST /register-artist`, `POST /mint-fan-subdomain`, `GET /resolve/:name`, `GET /check/:name`, `GET /fan-subdomains/:wallet` | On-chain ENS operations |
| `/ws/stream` | WebSocket | Real-time: `start_stream` → 1 beat/sec tick → `beat_tick` events → `stop_stream` |
| `/api/health` | `GET` | Health check |
| `/api/status` | `GET` | All service statuses (Yellow, Arc, ENS) |

### Database Layer

#### Schema (`db/schema.sql`)
- **`users`** — wallet, role (listener/artist), beats_balance, ens_name
- **`artists`** — wallet, display_name, ens_name, avatar_url, earnings, bio, genre, total_streams, ens_registered
- **`tracks`** — artist_id, title, duration, is_private, audio_url, genre, play_count
- **`sessions`** — user ↔ artist ↔ track, status, total_beats_paid

#### Upgrade (`db/migration_v2.sql`)
- **`fan_subdomains`** — fan_wallet, artist_id, subdomain, total_beats_streamed, tx_hash
- **`stream_history`** — user_wallet, artist_id, track_id, session_id, beats_paid, duration_seconds
- RPC functions: `increment_play_count`, `increment_artist_streams`, `record_stream`, `get_fan_artist_beats`
- Supabase Storage bucket `audio` for MP3 uploads (public read)

#### Helpers (`db/supabase.ts`)
Full CRUD + business logic:
- User: `getUser`, `createUser`, `creditBeats`, `debitBeat`
- Artist: `getArtists`, `createArtist`, `updateArtist`, `getArtistByWallet`
- Track: `getTracks`, `createTrack` (with audioUrl + genre), `updateTrackAudio`, `uploadAudioFile`
- Session: `createSession`, `getSession`, `incrementSessionPayment`, `settleSession`
- Stream history: `recordStream`, `incrementPlayCount`, `incrementArtistStreams`, `getFanArtistBeats`
- Fan subdomains: `getFanSubdomain`, `createFanSubdomain`, `getFanSubdomains`

### Utility
- `lib/verify.ts` — Wallet sig verification via viem (`verifyMessage`)
- `config/constants.ts` — All constants (Yellow contracts, Circle config, ENS domain, beat rates)
- `config/types.ts` — All TypeScript interfaces (User, Artist, Track, Session, FanSubdomain, StreamHistory)

### Scripts
- `scripts/register-entity-secret.ts` — ✅ Already run. Registered Circle entity secret ciphertext.
- `scripts/setup-circle-wallet.ts` — ✅ Already run. Created wallet `24071f33...` / `0xdfa721...`
- `scripts/curl-test-deploy.ts` — ✅ Already run. Deployed BeatStreamVault to Arc Testnet via direct Circle API.
- `scripts/check-vault-status.ts` — ✅ Confirmed vault deployment: status `COMPLETE`, address `0x08ff...56f`.

---

## Streaming Flow

```
Frontend                        Server (REST)               Server (WS)                 Yellow ClearNode
   │                                │                           │                           │
   │ POST /sessions/start ─────────▶│                           │                           │
   │                                │── openStreamSession() ───────────────────────────────▶│
   │                                │   createAppSessionMessage()                           │
   │◀── {session, appSessionId} ───│                           │                           │
   │                                │                           │                           │
   │ WS: {type:"start_stream"} ───────────────────────────────▶│                           │
   │                              1s │◀── debitBeat(user) ──────│                           │
   │◀── {type:"beat_tick", 999} ───────────────────────────────│── updateStreamState() ───▶│
   │◀── {type:"beat_tick", 998} ───────────────────────────────│── submitAppState() ──────▶│
   │        ...                     │                           │                           │
   │ WS: {type:"stop_stream"} ────────────────────────────────▶│                           │
   │                                │                           │                           │
   │ POST /sessions/settle ────────▶│── closeStreamSession() ──────────────────────────────▶│
   │                                │── settlePayment() (Arc) ──│   closeAppSession()       │
   │                                │── creditArtistEarnings() ─│                           │
   │                                │── recordStream() ─────────│   (stream history)        │
   │                                │── incrementPlayCount() ───│                           │
   │                                │── incrementArtistStreams()─│                           │
   │◀── {settlement, fanSubdomain}─│                           │                           │
```

---

## 🔑 API Keys — All Configured ✅

| Key | Status |
|-----|--------|
| `YELLOW_PRIVATE_KEY` | ✅ Set — wallet `0xBB2FB355...` (also ENS signer on Sepolia) |
| `ALCHEMY_RPC_URL` | ✅ Set — Sepolia RPC |
| `YELLOW_WS_URL` | ✅ Set — `wss://clearnet-sandbox.yellow.com/ws` |
| `CIRCLE_API_KEY` | ✅ Set — `TEST_API_KEY:67940...` |
| `CIRCLE_ENTITY_SECRET` | ✅ Set + registered with Circle |
| `CIRCLE_WALLET_ID` | ✅ Set — `24071f33-312a-...` |
| `CIRCLE_WALLET_ADDRESS` | ✅ Set — `0xdfa721...` |
| `CIRCLE_VAULT_CONTRACT_ID` | ✅ Set — `019c3d96-6c48-7703-ae6d-4d383efbe157` |
| `CIRCLE_VAULT_CONTRACT_ADDRESS` | ✅ Set — `0x08ff69988879ee75acf24559cf276e286da2a56f` |
| `SUPABASE_URL` | ✅ Set |
| `SUPABASE_ANON_KEY` | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set |

---

## 🚀 Server Startup

```
🎵 BeatStream Server starting...

✅ Supabase connected
✅ Circle Arc initialized
   Wallet ID: 24071f33-312a-5038-a618-68667ba8306b
   Vault Contract ID: 019c3d96-6c48-7703-ae6d-4d383efbe157
   Vault Address: 0x08ff69988879ee75acf24559cf276e286da2a56f
   ENS server signer: 0xBB2FB35525A59D0576B98FE0D162FAe442545A32
✅ ENS service initialized (on-chain mode — Sepolia)
🟡 Yellow: Server wallet = 0xBB2FB35525A59D0576B98FE0D162FAe442545A32
🟡 Yellow: Session key = 0xaaFD81DB695d04b33189e6D6e982b450771245A6
🟡 Yellow: ClearNode WebSocket connected
🟡 Yellow: Auth request sent, waiting for challenge...
🟡 Yellow: Auth challenge received — parsing...
🟡 Yellow: Auth verify message sent
🟡 Yellow: ✅ Authenticated with ClearNode! JWT: eyJ...
✅ WebSocket server initialized on /ws/stream

╔═══════════════════════════════════════════╗
║  🎵  BeatStream Server                    ║
║  📡  REST API:  http://localhost:4000     ║
║  🔌  WS:       ws://localhost:4000/ws/stream ║
║  ❤️   Health:   http://localhost:4000/api/health ║
╚═══════════════════════════════════════════╝
```

**TypeScript: 0 errors** ✅ | **Server: starts cleanly** ✅ | **All 3 integrations: connected** ✅

---

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@erc7824/nitrolite` | ^0.5.3 | Yellow Network Nitrolite SDK |
| `@circle-fin/smart-contract-platform` | latest | Circle Contracts SDK |
| `@circle-fin/developer-controlled-wallets` | latest | Circle Wallets SDK |
| `@supabase/supabase-js` | ^2.49.0 | Database client + Storage |
| `viem` | ^2.21.0 | Ethereum + signature verification + ENS on-chain |
| `express` | ^4.21.0 | REST API |
| `ws` | ^8.18.0 | WebSocket streaming |

---

## 💰 Currency System

| Unit | Value | Usage |
|------|-------|-------|
| 1 USDC | 1,000 Beats | Deposit rate |
| 1 Beat | 0.001 USDC | 1 second of streaming |
| 1 Chunk | 5 Beats | Audio delivery unit (5 seconds) |
| 100 Beats | — | Fan subdomain threshold |
