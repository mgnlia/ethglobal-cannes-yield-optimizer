# 🌊 CrossYield — Cross-Chain Yield Optimizer

> **ETHGlobal Cannes 2026** submission — April 3–5, 2026 | $275K prize pool
>
> Event URL: https://ethglobal.com/events/cannes2026 · Submission deadline: **Sunday April 5, 2026 at 09:00 AM CEST**

CrossYield is an AI-powered cross-chain yield optimizer that automatically identifies the highest-yield DeFi opportunities across Ethereum and Arbitrum, and explains every rebalancing decision in plain English using **Claude AI**. Cross-chain messaging is powered by **LayerZero V2 OApp**.

## 🔗 Live Demo

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://frontend-self-ten-84.vercel.app | ✅ Live |
| **API: /yields** | https://frontend-self-ten-84.vercel.app/api/yields | ✅ 200 OK |
| **API: /recommend** | https://frontend-self-ten-84.vercel.app/api/recommend | ✅ 200 OK (POST) |
| **API: /history** | https://frontend-self-ten-84.vercel.app/api/history | ✅ 200 OK |

### Quick API Verification

```bash
# Yield rates
curl https://frontend-self-ten-84.vercel.app/api/yields

# AI recommendation (POST)
curl -X POST https://frontend-self-ten-84.vercel.app/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"wallet":"0xYourAddress","amount":10000}'

# Rebalance history
curl https://frontend-self-ten-84.vercel.app/api/history
```

> **Note on yield data:** The backend attempts to fetch live rates from the Aave V3 subgraph. When the subgraph is unreachable (rate limits, cold start), it falls back to representative rates and labels the response `"data_source": "mock"`. The frontend shows an amber banner when displaying mock data and a green banner for live data.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 14 Frontend                      │
│         Portfolio View │ Yield Compare │ Rebalance History   │
│         https://frontend-self-ten-84.vercel.app              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Next.js API Routes (serverless)            │   │
│  │  /api/yields · /api/recommend · /api/history         │   │
│  │  Claude AI (Haiku) · Aave V3 subgraph               │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │ LayerZero V2 OApp
        ┌──────────────────────┴──────────────────────┐
        │                                             │
┌───────▼──────────┐                      ┌──────────▼───────┐
│   Sepolia L1     │◄────LayerZero V2─────►│ Arbitrum Sepolia │
│  YieldVault.sol  │     OApp Messaging    │  YieldVault.sol  │
│  (Aave/Compound) │  EID 40161 ↔ 40231   │  (Aave/Curve)    │
└──────────────────┘                       └──────────────────┘
```

**All API logic runs as Vercel serverless functions inside the Next.js app — no separate backend service.**

## ✨ Key Features

- **Cross-chain rebalancing**: LayerZero V2 OApp sends funds from lower-yield to higher-yield chains
- **AI explanations**: Claude explains every rebalancing decision in plain English (with confidence score + reasoning hash)
- **Live yield data**: Real-time APY from Aave V3 subgraph (with transparent mock fallback)
- **Gas-aware**: Rebalancing only triggers when APY delta × principal > gas cost (break-even < 90 days)
- **Portfolio dashboard**: Track positions, history, and projected earnings

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24, LayerZero V2 OApp |
| Cross-chain | LayerZero V2 (Sepolia ↔ Arbitrum Sepolia, EID 40161/40231) |
| API / AI | Next.js API Routes (serverless), Anthropic Claude Haiku |
| Frontend | Next.js 14, TailwindCSS, wagmi v2, viem |
| Deployment | Vercel (frontend + API routes as serverless functions) |

## 📋 Contract Addresses (Testnet)

> **Pre-event status:** Contracts are written, compile cleanly, and are ready to deploy. Testnet deployment happens at the event (April 3–5, 2026) when a funded deployer wallet is available. See [`contracts/deployments/addresses.json`](contracts/deployments/addresses.json) for current status and LayerZero endpoint addresses.

**LayerZero V2 Endpoints (hardcoded in contracts):**

| Network | Endpoint Address | EID |
|---------|-----------------|-----|
| Sepolia | `0x6EDCE65403992e310A62460808c4b910D972f10f` | 40161 |
| Arbitrum Sepolia | `0x6EDCE65403992e310A62460808c4b910D972f10f` | 40231 |

**To deploy yourself:**
```bash
cd contracts
npm install --legacy-peer-deps
export PRIVATE_KEY=0x...          # Funded Sepolia wallet
export ALCHEMY_API_KEY=...        # Or use public RPCs in hardhat.config.ts
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
# Addresses saved to contracts/deployments/sepolia.json + arbitrumSepolia.json
```

## 🚀 Quick Start

### Frontend (local)
```bash
cd frontend
npm install
npm run dev
# App at http://localhost:3000 — API routes at http://localhost:3000/api/*
```

### Contracts
```bash
cd contracts
npm install --legacy-peer-deps
npx hardhat compile         # Verify contracts compile
npx hardhat test            # Run test suite
```

## 🌐 Environment Variables

### Frontend (`frontend/.env.local`)
```env
ANTHROPIC_API_KEY=sk-ant-...   # Enables live Claude reasoning in /api/recommend
                                # Without it, falls back to template explanations
```

## 📊 API Reference

All endpoints live at `https://frontend-self-ten-84.vercel.app/api/*`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/yields` | GET | Current APY rates (Aave V3 live or mock fallback) |
| `/api/recommend` | POST | AI-powered rebalancing recommendation via Claude |
| `/api/history` | GET | Rebalancing history with AI reasoning |

## 🏆 ETHGlobal Cannes 2026 Prize Targets

- **LayerZero** ($20K): Best use of LayerZero V2 OApp (cross-chain yield routing)
- **Anthropic** ($10K): Best Claude integration (AI reasoning on every rebalance)
- **Aave** ($10K): Best DeFi application built on Aave
- **Overall**: Best DeFi / Cross-Chain project

## 📅 Event Details

- **Event**: ETHGlobal Cannes 2026
- **URL**: https://ethglobal.com/events/cannes2026
- **Dates**: April 3–5, 2026 — Palais des Festivals et des Congrès, Cannes, France
- **Submission deadline**: Sunday, April 5, 2026 at 09:00 AM CEST
- **Prize pool**: $275,000

## 📄 License

MIT
