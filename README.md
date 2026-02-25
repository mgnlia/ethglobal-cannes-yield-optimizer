# 🌊 CrossYield — Cross-Chain Yield Optimizer

> **ETHGlobal Cannes 2026** submission — April 3–5, 2026 | $275K prize pool

CrossYield is an AI-powered cross-chain yield optimizer that automatically identifies the highest-yield DeFi opportunities across Ethereum and Arbitrum, and explains every rebalancing decision in plain English using **Claude AI**. Cross-chain messaging is powered by **LayerZero V2 OApp**.

## 🔗 Live Demo

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://frontend-self-ten-84.vercel.app | ✅ Live |
| **Backend API** | https://backend-zeta-vert-19.vercel.app | ✅ Live |
| **API Docs** | https://backend-zeta-vert-19.vercel.app/docs | ✅ Live |

> **Note on yield data:** The backend attempts to fetch live rates from Aave V3 (The Graph), Compound V3, and Curve Finance APIs. When those APIs are unreachable (rate limits, testnet context), it transparently falls back to representative mock rates and labels the response `"source": "mock"` in the `_meta` field. The `/yields` response always includes this flag so the UI can display it clearly.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│         Portfolio View │ Yield Compare │ Rebalance History   │
│         (Vercel — https://frontend-self-ten-84.vercel.app)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API
┌──────────────────────────────▼──────────────────────────────┐
│                     FastAPI Backend                          │
│   Yield Aggregator (Aave/Compound/Curve) │ Claude AI Engine  │
│   (Vercel — https://backend-zeta-vert-19.vercel.app)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │                                             │
┌───────▼──────────┐                      ┌──────────▼───────┐
│   Sepolia L1     │◄────LayerZero V2─────►│ Arbitrum Sepolia │
│  YieldVault.sol  │     OApp Messaging    │  YieldVault.sol  │
│  (Aave/Compound) │                       │  (Aave/Curve)    │
└──────────────────┘                       └──────────────────┘
```

## ✨ Key Features

- **Cross-chain rebalancing**: LayerZero V2 OApp sends funds from lower-yield to higher-yield chains
- **AI explanations**: Claude explains every rebalancing decision in plain English (with confidence score + hash)
- **Live yield data**: Real-time APY from Aave V3, Compound V3, Curve Finance (with transparent mock fallback)
- **Gas-aware**: Rebalancing only triggers when APY delta × principal > gas cost (break-even < 90 days)
- **Portfolio dashboard**: Track positions, history, and projected earnings

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24, LayerZero V2 OApp |
| Cross-chain | LayerZero V2 (Sepolia ↔ Arbitrum Sepolia, EID 40161/40231) |
| Backend | FastAPI, Python 3.11, Anthropic SDK (Claude Haiku) |
| Frontend | Next.js 14, TailwindCSS, wagmi v2, viem |
| Deployment | Vercel (both backend and frontend) |

## 📋 Contract Addresses (Testnet)

Contracts compile cleanly. Testnet deployment requires a funded Sepolia wallet.

See [`contracts/deployments/README.md`](contracts/deployments/README.md) for full deployment instructions.

| Contract | Network | Address |
|----------|---------|---------|
| YieldVault | Sepolia | *Deploy with `npx hardhat run scripts/deploy.ts --network sepolia`* |
| YieldVault | Arbitrum Sepolia | *Deploy with `npx hardhat run scripts/deploy.ts --network arbitrumSepolia`* |
| CrossYieldOApp | Sepolia | *Deploy with `npx hardhat run scripts/deploy.ts --network sepolia`* |

**LayerZero V2 Endpoints used:**
- Sepolia: `0x6EDCE65403992e310A62460808c4b910D972f10f` (EID 40161)
- Arbitrum Sepolia: `0x6EDCE65403992e310A62460808c4b910D972f10f` (EID 40231)

## 🚀 Quick Start

### Contracts
```bash
cd contracts
npm install --legacy-peer-deps
npx hardhat compile
# Requires funded wallet — see contracts/deployments/README.md
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
```

### Backend
```bash
cd backend
pip install uv
uv sync
# Optional: set ANTHROPIC_API_KEY for live Claude reasoning
export ANTHROPIC_API_KEY=sk-ant-...
uv run uvicorn main:app --reload
# API available at http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:3000
```

## 🌐 Environment Variables

### Backend (`backend/.env`)
```env
ANTHROPIC_API_KEY=sk-ant-...   # Required for live Claude reasoning
                                # Without it, falls back to template explanations
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://backend-zeta-vert-19.vercel.app
ANTHROPIC_API_KEY=sk-ant-...   # Used by Next.js API routes for Claude
```

## 📊 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/yields` | GET | Current APY rates across all protocols/chains |
| `/recommend` | POST | AI-powered rebalancing recommendation |
| `/rebalance` | POST | Queue a cross-chain rebalance job |
| `/rebalance/{id}` | GET | Poll job status |
| `/history` | GET | Rebalancing history with AI reasoning |
| `/portfolio/{wallet}` | GET | Portfolio summary |
| `/protocols` | GET | Supported protocols and chains |

## 🏆 ETHGlobal Cannes 2026 Prize Targets

- **LayerZero**: Best use of LayerZero V2 OApp (cross-chain yield routing)
- **Anthropic**: Best Claude integration (AI reasoning on every rebalance)
- **Aave**: Best DeFi application built on Aave
- **Overall**: Best DeFi / Cross-Chain project

## 📅 Event Details

- **Event**: ETHGlobal Cannes 2026
- **Dates**: April 3–5, 2026 — Palais des Festivals, Cannes, France
- **Submission deadline**: Sunday, April 5, 2026 at 09:00 AM CEST
- **Prize pool**: $275,000

## 📄 License

MIT
