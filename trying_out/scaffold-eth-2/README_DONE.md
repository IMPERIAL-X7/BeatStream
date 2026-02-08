# 🎵 BeatStream — What's Been Built# 🎵 BeatStream — What's Been Built



> **Pay-per-second music streaming on Web3**, built on Scaffold-ETH 2.> **Pay-per-second music streaming on Web3**, built on Scaffold-ETH 2.

> Targeting **Yellow Network** ($15k), **Circle Arc** ($10k), and **ENS** ($5k) hackathon bounties.> Targeting **Yellow Network** ($15k), **Circle Arc** ($10k), and **ENS** ($5k) hackathon bounties.



------



## Architecture Overview## Architecture Overview



``````

scaffold-eth-2/scaffold-eth-2/

├── packages/├── packages/

│   ├── hardhat/          ← Smart contracts + deploy scripts│   ├── hardhat/          ← Smart contracts + deploy scripts

│   ├── nextjs/           ← Frontend (SE2 — separate branch)│   ├── nextjs/           ← Frontend (SE2 default + BeatStream placeholders)

│   └── server/           ← Express + WebSocket backend│   └── server/           ← Express + WebSocket backend (NEW)

``````



| Layer | Tech | Status |BeatStream is a **three-layer stack**:

|-------|------|--------|

| **Contracts** | Solidity on Hardhat (localhost) | ✅ Complete & deployed || Layer | Tech | Status |

| **Backend** | Express + WS + Supabase | ✅ Complete — 0 TS errors ||-------|------|--------|

| **Yellow Network** | `@erc7824/nitrolite` v0.5.3 | ✅ Real SDK — connected to ClearNode || **Contracts** | Solidity on Hardhat (Sepolia) | ✅ Complete |

| **Circle Arc** | `@circle-fin/smart-contract-platform` + `developer-controlled-wallets` | ✅ Real SDK — API key + entity secret registered || **Backend** | Express + WS + Supabase | ✅ Complete |

| **ENS** | Server-side subdomain logic | ✅ Complete || **Frontend** | Next.js (SE2) | 🔲 Placeholder pages only |

| **API Keys** | Yellow, Circle, Alchemy, Supabase | ✅ All configured |

| **Frontend** | Next.js (SE2) | 🔲 Separate branch (in progress by teammate) |---



---## 🔗 Smart Contracts (`packages/hardhat/`)



## 🔗 Smart Contracts (`packages/hardhat/`)### `BeatStreamVault.sol`

The core on-chain vault that holds USDC and manages the deposit → stream → settle → withdraw lifecycle.

### `BeatStreamVault.sol`

Core on-chain vault — deposit → stream → settle → withdraw lifecycle.- **`deposit(uint256 amount)`** — User deposits USDC, gets off-chain Beats (1000 Beats = 1 USDC)

- **`settle(address artist, uint256 beatsUsed, address user)`** — Owner-only; converts streamed Beats to USDC and pays the artist

- **`deposit(uint256 amount)`** — User deposits USDC, gets off-chain Beats (1000 Beats = 1 USDC)- **`withdraw()`** — User reclaims unspent USDC from the vault

- **`settle(address artist, uint256 beatsUsed, address user)`** — Owner-only; pays artist from user's deposit- **`registerArtist(address artist)`** — Registers a wallet as a valid artist

- **`withdraw()`** — User reclaims unspent USDC- Events: `Deposited`, `Settled`, `Withdrawn`, `ArtistRegistered`

- **`registerArtist(address artist)`** — Registers a valid artist- Constants: `BEATS_PER_USDC = 1000`, `USDC_PER_BEAT = 1e3` (in 6-decimal base units)

- **`getDeposit(address)`** / **`getArtistEarnings(address)`** / **`vaultBalance()`** — Read-only queries

- Events: `Deposited`, `Settled`, `Withdrawn`, `ArtistRegistered`### `MockUSDC.sol`

- Constants: `BEATS_PER_USDC = 1000`, `USDC_PER_BEAT = 1e3`A test ERC20 with open `mint()` for hackathon/testnet convenience. 6 decimals, mirrors real USDC interface.



### `MockUSDC.sol`### `01_deploy_beatstream.ts`

Test ERC20 with open `mint()`. 6 decimals, mirrors real USDC.Hardhat deploy script that:

1. Deploys `MockUSDC`

### Deploy Scripts2. Deploys `BeatStreamVault` with MockUSDC address

- `01_deploy_beatstream.ts` — Deploys MockUSDC → BeatStreamVault, mints 1000 USDC to deployer3. Mints 1,000 USDC to the deployer for testing

- **Status**: ✅ Deployed to local hardhat (`deployments/localhost/`)

---

---

## 🖥️ Backend Server (`packages/server/`)

## 🖥️ Backend Server (`packages/server/`)

A standalone Express + WebSocket server wired into the SE2 monorepo as a yarn workspace (`@beatstream/server`).

```bash

cd packages/server && npx tsx src/index.ts    # Starts on port 4000### Run it

``````bash

# From repo root

### Services — Real SDK Integrationsyarn server:dev     # tsx watch mode on port 4000



#### `services/yellow.ts` — Yellow Network ✅# Endpoints

Full `@erc7824/nitrolite` integration with ClearNode sandbox WebSocket:# REST:  http://localhost:4000

- **Auth**: EIP-712 challenge-response (`createAuthRequestMessage` → `createEIP712AuthMessageSigner` → `createAuthVerifyMessageFromChallenge`)# WS:    ws://localhost:4000/ws/stream

- **Session keys**: Ephemeral `createECDSAMessageSigner` per server restart# Health: GET /api/health

- **App sessions**: `createAppSessionMessage` — 2-party payment channels (user ↔ server)# Status: GET /api/status

- **State updates**: `createSubmitAppStateMessage` — shifts 1 beat/second user→server```

- **Close**: `createCloseAppSessionMessage` — finalizes with payout split

- **Channel mgmt**: `createGetChannelsMessage` + `createCloseChannelMessage`### File-by-file breakdown

- **Auto-reconnect**: WebSocket reconnects on disconnect (5s backoff)

#### Config Layer

#### `services/arc.ts` — Circle Arc ✅| File | What it does |

Full `@circle-fin/smart-contract-platform` + `@circle-fin/developer-controlled-wallets`:|------|-------------|

- **Wallets**: `createArcWallet()` — dev-controlled wallet on Arc Testnet| `src/config/constants.ts` | All shared constants — beat rates, Yellow Network contract addresses (custody `0x019B...`, adjudicator `0x7c7c...`), Circle Arc USDC address (`0x3600...`), ENS domain (`beatstream.eth`), fan subdomain threshold (100s) |

- **Deploy**: `deployVaultContract()` — deploy BeatStreamVault via Circle SDK| `src/config/types.ts` | TypeScript interfaces for `User`, `Artist`, `Track`, `Session`, all API request/response types, `StreamVoucher` |

- **Queries**: `queryVaultBalance()`, `queryUserDeposit()`, `queryArtistEarnings()` via `queryContract()`

- **Settlement**: `settlePayment()` — calls `vault.settle()` via `createContractExecutionTransaction()`#### Database Layer

- **Verification**: `verifyDeposit()` — checks tx status via Circle API| File | What it does |

- **Fallback**: Simulates when API keys aren't configured|------|-------------|

| `src/db/schema.sql` | Full Supabase SQL schema: `users` (with role), `artists`, `tracks` (with `is_private`), `sessions` tables. Includes 4 RPC functions (`credit_beats`, `debit_beat`, `increment_session_payment`, `credit_artist_earnings`) and seed data (3 demo artists, 5 demo tracks) |

#### `services/ens.ts` — ENS ✅| `src/db/supabase.ts` | Supabase client + every DB helper: `getUser`, `createUser`, `creditBeats`, `debitBeat`, `getArtists`, `createArtist`, `creditArtistEarnings`, `getTracks`, `createTrack`, `createSession`, `getSession`, `incrementSessionPayment`, `settleSession` |

- `generateArtistENS("SynthWave")` → `synthwave.beatstream.eth`

- `checkFanSubdomainEligibility()` — ≥100 seconds streamed#### Utility

- `generateFanSubdomain()` → `fan-abc123.synthwave.beatstream.eth`| File | What it does |

- `buildArtistENSMetadata()` for API responses|------|-------------|

| `src/lib/verify.ts` | Wallet signature verification using viem's `verifyMessage`. Includes `buildStreamVoucherMessage()` and `buildAuthMessage()` for canonical message construction |

### API Routes

#### Services (Integration Layer)

| Route | Methods | Purpose || File | What it does |

|-------|---------|---------||------|-------------|

| `/api/artists` | `POST /register`, `GET /`, `GET /:id` | Artist registration with sig verification + ENS auto-gen || `src/services/yellow.ts` | **Yellow Network** integration via `@erc7824/nitrolite`. Connects to ClearNode sandbox WebSocket (`wss://clearnet-sandbox.yellow.com/ws`). Functions: `initYellow()`, `authenticateWithClearNode()` (EIP-712), `openChannel()`, `updateChannelState()` (shifts 1 beat user→server per second), `closeChannel()` |

| `/api/users` | `POST /register`, `GET /:wallet` | User registration/login with signature auth || `src/services/arc.ts` | **Circle Arc** integration. `settlePayment()` calls Circle's Smart Contract Platform API to execute `BeatStreamVault.settle()` on-chain. `verifyDeposit()` confirms USDC deposit transactions. Gracefully simulates when API keys aren't set |

| `/api/deposit` | `POST /`, `POST /verify` | USDC deposit verification → Beats credit || `src/services/ens.ts` | **ENS** subdomain management. `generateArtistENS("SynthWave")` → `synthwave.beatstream.eth`. `checkFanSubdomainEligibility()` (≥100 seconds streamed). `generateFanSubdomain()` → `fan-abc123.synthwave.beatstream.eth`. `buildArtistENSMetadata()` for API responses |

| `/api/tracks` | `POST /`, `GET /`, `GET /:id` | Track CRUD (artists only, sig-gated) |

| `/api/sessions` | `POST /start`, `POST /settle`, `GET /:id` | Start (opens Yellow session) → Settle (closes session + Arc settlement + ENS check) |#### API Routes

| `/ws/stream` | WebSocket | Real-time: `start_stream` → 1 beat/sec tick → `beat_tick` events → `stop_stream` || Route | Methods | What it does |

| `/api/health` | `GET` | Health check ||-------|---------|-------------|

| `/api/status` | `GET` | All service statuses (Yellow, Arc, ENS) || `src/routes/artists.ts` | `POST /api/artists/register`, `GET /api/artists`, `GET /api/artists/:id` | Artist registration with wallet signature verification, ENS subdomain auto-generation, role upgrade |

| `src/routes/users.ts` | `POST /api/users/register`, `GET /api/users/:wallet` | User registration/login with signature auth |

### Database Layer| `src/routes/deposit.ts` | `POST /api/deposit`, `POST /api/deposit/verify` | USDC deposit verification via Circle Arc → Beats credit (1 USDC = 1000 Beats) |

- `db/schema.sql` — Full schema: `users`, `artists`, `tracks`, `sessions` + 4 RPC functions + seed data| `src/routes/tracks.ts` | `POST /api/tracks`, `GET /api/tracks`, `GET /api/tracks/:id` | Track upload (artists only, signature-gated), listing with `?artist_id=` filter |

- `db/supabase.ts` — All CRUD helpers| `src/routes/sessions.ts` | `POST /api/sessions/start`, `POST /api/sessions/settle`, `GET /api/sessions/:id` | Start session (opens Yellow channel), settle session (closes channel → Arc settlement → artist earnings → fan subdomain check) |

| `src/routes/stream.ws.ts` | WebSocket `/ws/stream` | Real-time streaming: `start_stream` → 1 beat/second tick loop → `beat_tick` events → `pause`/`resume`/`stop`. Deducts beats from user balance, updates Yellow channel state, tracks voucher signatures |

### Utility

- `lib/verify.ts` — Wallet sig verification via viem#### Entry Point

- `config/constants.ts` — All constants (Yellow contracts, Circle config, ENS domain)| File | What it does |

- `config/types.ts` — All TypeScript interfaces|------|-------------|

| `src/index.ts` | Express app + HTTP server + CORS + JSON parsing. Mounts all routes, initializes all services (Supabase, Arc, ENS, Yellow), attaches WebSocket server, starts on port 4000 |

### Scripts

- `scripts/register-entity-secret.ts` — ✅ Already run. Registered Circle entity secret ciphertext.### Streaming Flow (end-to-end)



---```

Frontend                        Backend (REST)              Backend (WS)                Yellow Network

## Streaming Flow   │                                │                           │                           │

   │ POST /sessions/start ─────────▶│                           │                           │

```   │   {wallet, trackId, sig}       │                           │                           │

Frontend                        Server (REST)               Server (WS)                 Yellow ClearNode   │                                │── openChannel() ─────────────────────────────────────▶│

   │                                │                           │                           │   │                                │◀── channelId ────────────────────────────────────────│

   │ POST /sessions/start ─────────▶│                           │                           │   │◀── {session, channel} ────────│                           │                           │

   │                                │── openStreamSession() ───────────────────────────────▶│   │                                │                           │                           │

   │                                │   createAppSessionMessage()                           │   │ WS connect ───────────────────────────────────────────────▶│                           │

   │◀── {session, appSessionId} ───│                           │                           │   │ {type:"start_stream"} ────────────────────────────────────▶│                           │

   │                                │                           │                           │   │                                │                           │                           │

   │ WS: {type:"start_stream"} ───────────────────────────────▶│                           │   │                             Every 1 second:                │                           │

   │                              1s │◀── debitBeat(user) ──────│                           │   │◀── {type:"beat_tick"} ────────────────────────────────────│── debitBeat(user) ────────│

   │◀── {type:"beat_tick", 999} ───────────────────────────────│── updateStreamState() ───▶│   │    beatsRemaining: 999         │                           │── updateChannelState() ──▶│

   │◀── {type:"beat_tick", 998} ───────────────────────────────│── submitAppState() ──────▶│   │◀── {type:"beat_tick"} ────────────────────────────────────│                           │

   │        ...                     │                           │                           │   │    beatsRemaining: 998         │                           │                           │

   │ WS: {type:"stop_stream"} ────────────────────────────────▶│                           │   │        ...                     │                           │                           │

   │                                │                           │                           │   │                                │                           │                           │

   │ POST /sessions/settle ────────▶│── closeStreamSession() ──────────────────────────────▶│   │ {type:"stop_stream"} ─────────────────────────────────────▶│                           │

   │                                │── settlePayment() (Arc) ──│   closeAppSession()       │   │◀── {type:"stream_stopped"} ───────────────────────────────│                           │

   │                                │── creditArtistEarnings() ─│                           │   │                                │                           │                           │

   │◀── {settlement, fanSubdomain}─│                           │                           │   │ POST /sessions/settle ────────▶│                           │                           │

```   │   {wallet, sessionId, sig}     │── closeChannel() ───────────────────────────────────▶│

   │                                │── settlePayment() (Arc) ──│                           │

---   │                                │── creditArtistEarnings() ─│                           │

   │◀── {settlement, fanSubdomain}─│                           │                           │

## 🔑 API Keys — Status```



| Key | Status |---

|-----|--------|

| `YELLOW_PRIVATE_KEY` | ✅ Set — wallet `0xBB2FB355...` |## 🌐 Frontend Placeholders (`packages/nextjs/app/beatstream/`)

| `ALCHEMY_RPC_URL` | ✅ Set — Sepolia RPC |

| `YELLOW_WS_URL` | ✅ Set — `wss://clearnet-sandbox.yellow.com/ws` |Minimal placeholder pages created for the Next.js app router:

| `CIRCLE_API_KEY` | ✅ Set — `TEST_API_KEY:67940...` |

| `CIRCLE_ENTITY_SECRET` | ✅ Set + registered with Circle || Route | File | Status |

| `SUPABASE_URL` | ✅ Set ||-------|------|--------|

| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set || `/beatstream` | `page.tsx` | Landing page with 3-card grid (Yellow, Arc, ENS) |

| `SUPABASE_ANON_KEY` | ⚠️ Needs to be grabbed from Supabase dashboard || `/beatstream/artist/[id]` | `artist/[id]/page.tsx` | Placeholder |

| `CIRCLE_WALLET_ID` | ⚠️ Pending — will auto-create via `createArcWallet()` || `/beatstream/stream/[trackId]` | `stream/[trackId]/page.tsx` | Placeholder |

| `/beatstream/deposit` | `deposit/page.tsx` | Placeholder |

---| `/beatstream/dashboard` | `dashboard/page.tsx` | Placeholder |



## 🚀 Server Startup---



```## 🔧 Monorepo Wiring

✅ Supabase connected

✅ Circle Arc initialized- Root `package.json` → `workspaces` updated to include `packages/server`

✅ ENS service initialized- Scripts added: `yarn server:dev`, `yarn server:build`, `yarn server:start`

🟡 Yellow: Server wallet = 0xBB2FB35525A59D0576B98FE0D162FAe442545A32- `yarn install` from root installs all three workspaces

🟡 Yellow: Session key = 0x147a79E22865411C6FaF813120668AD729b90F5d- Server package uses `tsx` for dev, `tsc` for build

🟡 Yellow: ClearNode WebSocket connected- **TypeScript: compiles with 0 errors** ✅

🟡 Yellow: Auth request sent, waiting for challenge...- **Server: starts and responds to `/api/health`** ✅

✅ WebSocket server initialized on /ws/stream

```---



**TypeScript: 0 errors** ✅ | **Server: starts cleanly** ✅## 📦 Key Dependencies



---| Package | Version | Purpose |

|---------|---------|---------|

## 📦 Key Dependencies| `@erc7824/nitrolite` | ^0.2.0 | Yellow Network state channel SDK |

| `@supabase/supabase-js` | ^2.49.0 | Supabase PostgreSQL client |

| Package | Version | Purpose || `viem` | ^2.21.0 | Ethereum interactions + signature verification |

|---------|---------|---------|| `express` | ^4.21.0 | REST API framework |

| `@erc7824/nitrolite` | ^0.5.3 | Yellow Network Nitrolite SDK || `ws` | ^8.18.0 | WebSocket server for real-time streaming |

| `@circle-fin/smart-contract-platform` | latest | Circle Contracts SDK || `dotenv` | ^16.4.0 | Environment variable loading |

| `@circle-fin/developer-controlled-wallets` | latest | Circle Wallets SDK || `cors` | ^2.8.5 | Cross-origin support |

| `@supabase/supabase-js` | ^2.49.0 | Database client |

| `viem` | ^2.21.0 | Ethereum + signature verification |---

| `express` | ^4.21.0 | REST API |

| `ws` | ^8.18.0 | WebSocket streaming |## 💰 Currency System



## 💰 Currency System| Unit | Value | Usage |

|------|-------|-------|

| Unit | Value | Usage || 1 USDC | 1,000 Beats | Deposit conversion rate |

|------|-------|-------|| 1 Beat | 0.001 USDC | 1 second of streaming |

| 1 USDC | 1,000 Beats | Deposit rate || 1 Chunk | 5 Beats | Audio delivery unit (5 seconds) |

| 1 Beat | 0.001 USDC | 1 second of streaming || 100 Beats | Fan subdomain threshold | Qualifies fan for ENS subdomain |

| 100 Beats | — | Fan subdomain threshold |
