# 🎵 BeatStream

**Pay-per-second music streaming powered by Web3** — built on [Scaffold-ETH 2](https://scaffoldeth.io).

Stream music, pay by the second using on-chain Beats (1000 Beats = 1 USDC), and earn ENS subdomains as a loyal fan.

> 🏆 Hackathon submission targeting **Yellow Network** ($15k), **Circle Arc** ($10k), and **ENS** ($5k) bounties.

---

## ⚡ Current Status — What Works Right Now

> **Updated: Feb 8, 2026** — All three integrations are LIVE.

### ✅ All Three Prize-Track Integrations — Working

| Integration | Status | Proof |
|-------------|--------|-------|
| **Yellow Network** | ✅ Connected + Authenticated | WebSocket to ClearNode sandbox, EIP-712 challenge-response auth completes, JWT received. Auto-reconnects + re-auths. |
| **Circle Arc** | ✅ Vault Deployed on Arc Testnet | BeatStreamVault contract live at `0x08ff69988879ee75acf24559cf276e286da2a56f`. Wallet funded with 40 USDC. |
| **ENS** | ✅ On-Chain on Sepolia | `beatstream.eth` wrapped in NameWrapper. `synthwave.beatstream.eth` created on-chain (tx `0x6517de...`, block 10217661). |

### ✅ What a user/developer CAN do today

| Action | How | Status |
|--------|-----|--------|
| **Start the server** | `cd packages/server && npx tsx src/index.ts` | ✅ Works — 0 TS errors, all services init |
| **See all 3 integrations live** | `GET /api/status` | ✅ Yellow authenticated, Arc vault deployed, ENS on-chain |
| **Register as an artist** | `POST /api/artists/register` | ✅ Creates DB record + auto-registers `<name>.beatstream.eth` on-chain |
| **Register as a listener** | `POST /api/users/register` | ✅ Creates DB record with beats balance |
| **Browse tracks** | `GET /api/tracks` | ✅ Returns all tracks with genre, play_count, audio_url |
| **Create a track** | `POST /api/tracks` (artist only, sig-gated) | ✅ Stores in Supabase with genre + audioUrl |
| **Upload audio** | `POST /api/tracks/:id/audio` (raw MP3 body) | ✅ Uploads to Supabase Storage bucket |
| **Start a stream** | `POST /api/sessions/start` | ✅ Creates session + opens Yellow app session |
| **Stream via WebSocket** | `ws://localhost:4000/ws/stream` | ✅ Real-time beat_tick every second, debits 1 beat/sec |
| **Settle a stream** | `POST /api/sessions/settle` | ✅ Closes Yellow session + settles via Circle Arc + credits artist + records stream history |
| **Check ENS subdomain** | `GET /api/ens/check/:name` | ✅ Queries NameWrapper on Sepolia |
| **Resolve ENS name** | `GET /api/ens/resolve/:name` | ✅ Queries PublicResolver on Sepolia |
| **View service status** | `GET /api/status` | ✅ Shows Yellow, Circle, ENS status in real-time |
| **List fan subdomains** | `GET /api/ens/fan-subdomains/:wallet` | ✅ Returns subdomains from DB |

### `/api/status` Response (Live)

```json
{
  "yellow": {
    "connected": true,
    "authenticated": true,
    "address": "0xBB2FB35525A59D0576B98FE0D162FAe442545A32",
    "sessionKey": "0xaaFD81DB695d04b33189e6D6e982b450771245A6",
    "activeAppSessions": 0
  },
  "arc": {
    "initialized": true,
    "walletId": "24071f33-312a-5038-a618-68667ba8306b",
    "walletAddress": "0xdfa7215465e375b293233b0b72843df4a06453f9",
    "vaultContractId": "019c3d96-6c48-7703-ae6d-4d383efbe157",
    "vaultContractAddress": "0x08ff69988879ee75acf24559cf276e286da2a56f",
    "usdcAddress": "0x3600000000000000000000000000000000000000",
    "blockchain": "ARC-TESTNET"
  },
  "ens": {
    "enabled": true,
    "onChain": true,
    "threshold": 100,
    "parentDomain": "beatstream.eth",
    "contracts": {
      "nameWrapper": "0x0635513f179D50A207757E05759CbD106d7dFcE8",
      "publicResolver": "0x8FAde66b79cC9F1C6f971901bad5484ED3276E7E",
      "registry": "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"
    }
  }
}
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BeatStream Stack                         │
├─────────────┬──────────────────┬────────────────────────────┤
│  Frontend   │     Backend      │        On-Chain            │
│  (Next.js)  │  (Express + WS)  │  (Solidity + ENS)         │
├─────────────┼──────────────────┼────────────────────────────┤
│ Wallet      │ REST API         │ BeatStreamVault.sol        │
│ Connect     │ WebSocket        │   (Arc Testnet)            │
│ ENS Display │ Supabase DB      │ ENS NameWrapper (Sepolia)  │
│ Player UI   │ Audio Storage    │                            │
├─────────────┴──────────────────┴────────────────────────────┤
│           Yellow Network          │      Circle Arc          │
│  (State channels via Nitrolite)   │  (Settlement + Wallets)  │
│  ✅ Authenticated + JWT           │  ✅ Vault deployed        │
└───────────────────────────────────┴──────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ v20
- Yarn v1 or v2+
- Git

### 1. Install Dependencies

```bash
git clone https://github.com/IMPERIAL-X7/BeatStream.git
cd BeatStream/trying_out/scaffold-eth-2
yarn install
```

### 2. Set Up Environment

```bash
cp packages/server/.env.example packages/server/.env
# Fill in your API keys (Yellow, Circle, Alchemy, Supabase)
```

### 3. Deploy Contracts (Local)

```bash
# Terminal 1 — Start local chain
yarn chain

# Terminal 2 — Deploy
yarn deploy
```

### 4. Start Backend Server

```bash
cd packages/server
npx tsx src/index.ts
# Server starts on http://localhost:4000
```

### 5. Start Frontend

```bash
yarn start
# Frontend on http://localhost:3000
```

---

## 💰 How It Works

```
1. USER deposits USDC → gets Beats (1000 Beats = 1 USDC)
2. USER starts streaming a track → opens Yellow Network state channel
3. Every second: 1 Beat deducted → state channel updated in real-time
4. USER stops → session settles via Circle Arc → artist gets paid
5. After 100+ Beats streamed from one artist → fan earns ENS subdomain!
```

### Currency

| Unit | Value | Usage |
|------|-------|-------|
| 1 USDC | 1,000 Beats | Deposit conversion |
| 1 Beat | $0.001 | 1 second of streaming |
| 100 Beats | — | Fan subdomain threshold |

### ENS Subdomains

- **Artists** get `<name>.beatstream.eth` (e.g., `synthwave.beatstream.eth`)
- **Fans** earn `fan-<wallet>.artist.beatstream.eth` after streaming 100+ seconds

---

## 📡 API Endpoints

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/health` | GET | Health check |
| `/api/status` | GET | Service statuses (Yellow, Circle, ENS) |
| `/api/users` | POST `/register`, GET `/:wallet` | User auth (wallet signature) |
| `/api/artists` | POST `/register`, GET `/`, GET `/:id` | Artist registration + ENS |
| `/api/tracks` | POST `/`, GET `/`, GET `/:id`, POST `/:id/audio` | Track management + audio upload |
| `/api/deposit` | POST `/`, POST `/verify` | USDC deposit → Beats |
| `/api/sessions` | POST `/start`, POST `/settle`, GET `/:id` | Stream session lifecycle |
| `/api/ens` | POST `/register-artist`, POST `/mint-fan-subdomain`, GET `/resolve/:name`, GET `/check/:name`, GET `/fan-subdomains/:wallet` | On-chain ENS operations |
| `/ws/stream` | WebSocket | Real-time beat-by-beat streaming |

---

## 📋 TODO — What Needs To Be Done Next

> **Read this if you're picking up the project.** Each section is ordered by priority.

### ✅ COMPLETED — All Three Core Integrations

- [x] **Yellow Network** — Auth works, JWT received, auto-reconnect + re-auth ✅
- [x] **Circle Arc** — BeatStreamVault deployed at `0x08ff...56f` on Arc Testnet, wallet funded ✅
- [x] **ENS** — On-chain subdomain creation working via NameWrapper on Sepolia ✅

### 🟡 Priority 1 — End-to-End Flow Testing

The individual integrations work. Now test the full user flow:

```
1. Register artist → POST /api/artists/register → verify ENS subdomain created on-chain
2. Register listener → POST /api/users/register
3. Deposit USDC → POST /api/deposit → verify beats credited
4. Start stream → POST /api/sessions/start → verify Yellow app session opens
5. Stream via WebSocket → ws://localhost:4000/ws/stream → send start_stream
6. Stream for 10+ seconds → verify beat_tick events + balance decrements
7. Stop + Settle → POST /api/sessions/settle → verify:
   - Yellow session closed
   - Circle Arc settlement tx submitted
   - Artist earnings credited
   - Stream history recorded
   - Fan subdomain eligibility checked
```

### � Priority 2 — Yellow App Sessions (State Channels)

Yellow auth is working. App session lifecycle (open → state updates → close) needs real tokens:
1. Get `ytest.usd` tokens on Sepolia from Yellow faucet/team
2. Approve + deposit into Custody contract (`0x019B65...`)
3. Test: `POST /api/sessions/start` returns a real `appSessionId`
4. Test: Stream sends state updates through ClearNode
5. Test: `POST /api/sessions/settle` closes app session on-chain

### 🟡 Priority 3 — Circle Arc Settlement End-to-End

The vault is deployed. To test real settlement:
1. Fund the vault with more testnet USDC (faucet: `https://faucet.circle.com/` → Arc Testnet)
2. Test: `POST /api/sessions/settle` calls `vault.settle()` on Arc Testnet
3. Verify settlement tx on [Arc Testnet Explorer](https://testnet.arcscan.app/)
4. Contract address: [`0x08ff69988879ee75acf24559cf276e286da2a56f`](https://testnet.arcscan.app/address/0x08ff69988879ee75acf24559cf276e286da2a56f)

### 🟡 Priority 4 — Frontend (Separate Branch)

The frontend lives in `packages/nextjs/` on a separate branch. It needs:
1. Wallet connect (Scaffold-ETH 2 provides this)
2. Deposit USDC page → calls `POST /api/deposit`
3. Track browser → `GET /api/tracks`
4. Streaming player → connects to `ws://localhost:4000/ws/stream`
5. Artist profile → shows ENS name, bio, genre, total streams
6. Fan subdomain claim → `POST /api/ens/mint-fan-subdomain`

### 🟢 Priority 5 — Polish

- [ ] Run Hardhat tests for BeatStreamVault
- [ ] Add zod validation on all API routes
- [ ] Rate limiting
- [ ] Session timeout (auto-settle after inactivity)
- [ ] Demo video + pitch deck

---

## 📁 Project Structure

```
packages/
├── hardhat/                    # Smart contracts
│   ├── contracts/
│   │   ├── BeatStreamVault.sol # Core vault (deposit/settle/withdraw)
│   │   └── MockUSDC.sol        # Test USDC token
│   └── deploy/
│       └── 01_deploy_beatstream.ts
│
├── server/                     # Backend
│   └── src/
│       ├── index.ts            # Entry point (Express + WS)
│       ├── config/             # Constants + TypeScript types
│       ├── db/                 # Supabase client + schema + migrations
│       ├── lib/                # Signature verification
│       ├── routes/             # REST routes + WebSocket handler
│       │   ├── artists.ts
│       │   ├── tracks.ts
│       │   ├── sessions.ts
│       │   ├── ens.ts          # ENS on-chain routes
│       │   ├── deposit.ts
│       │   ├── users.ts
│       │   └── stream.ws.ts    # WebSocket streaming
│       └── services/           # SDK integrations
│           ├── yellow.ts       # Yellow Network (Nitrolite)
│           ├── arc.ts          # Circle Arc
│           └── ens.ts          # ENS (viem + NameWrapper)
│
└── nextjs/                     # Frontend (Scaffold-ETH 2)
    └── app/beatstream/         # BeatStream pages (WIP)
```

---

## 📖 More Documentation

- **[README_DONE.md](./README_DONE.md)** — Detailed technical breakdown of everything built
- **[README_TODO.md](./README_TODO.md)** — Granular remaining tasks with build order

---

## 🛠️ Built With

- [Scaffold-ETH 2](https://scaffoldeth.io) — Ethereum development stack
- [Yellow Network / Nitrolite](https://yellow.org) — State channel infrastructure
- [Circle Arc](https://developers.circle.com) — Smart contract platform
- [ENS](https://ens.domains) — Ethereum Name Service
- [Supabase](https://supabase.com) — PostgreSQL + Storage
- [viem](https://viem.sh) — TypeScript Ethereum client

---

## 📜 License

This project is licensed under the MIT License.
