# 🌊 CrossYield — Cross-Chain Yield Optimizer

> **ETHGlobal Cannes 2026** · April 3–5, 2026 · Palais des Festivals, Cannes, France · $275K prize pool  
> Event: https://ethglobal.com/events/cannes2026

CrossYield is an AI-powered cross-chain yield optimizer that identifies the highest-yield DeFi opportunities across Ethereum and Arbitrum and explains every rebalancing decision in plain English using **Claude AI**. Cross-chain messaging is powered by **LayerZero V2 OApp**.

---

## 🔗 Live Demo

**Frontend:** https://frontend-4d12g3vw7-mgnlias-projects.vercel.app

| Endpoint | Method | Live URL |
|----------|--------|----------|
| Yield rates | GET | https://frontend-4d12g3vw7-mgnlias-projects.vercel.app/api/yields |
| AI recommendation | POST | https://frontend-4d12g3vw7-mgnlias-projects.vercel.app/api/recommend |
| Rebalance history | GET | https://frontend-4d12g3vw7-mgnlias-projects.vercel.app/api/history |

### Verify right now

```bash
# Yield rates (Aave, Compound, Curve) — returns JSON immediately
curl https://frontend-4d12g3vw7-mgnlias-projects.vercel.app/api/yields

# AI rebalancing recommendation
curl -X POST https://frontend-4d12g3vw7-mgnlias-projects.vercel.app/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"wallet":"0xYourAddress","amount":10000}'

# Rebalancing history with on-chain reasoning hashes
curl https://frontend-4d12g3vw7-mgnlias-projects.vercel.app/api/history
```

**Verified live 2026-02-25T17:42 UTC:**

```
GET  /api/yields    → 200  {"best_protocol":"compound","best_chain":"arbitrum","best_apy":6.23,"data_source":"mock"}
POST /api/recommend → 200  {"should_rebalance":true,"from_protocol":"aave","to_protocol":"compound","apy_delta":3.02}
GET  /api/history   → 200  [3 entries, each with reasoning_hash]
```

> **Yield data:** Attempts live fetch from Aave V3 subgraph on every request. Falls back to representative rates when the subgraph is unreachable — response is labeled `"data_source":"mock"` and the UI shows an amber banner. Live data shows a green banner.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│              Vercel — Next.js 14 App (frontend + API)            │
│   https://frontend-4d12g3vw7-mgnlias-projects.vercel.app        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            Next.js Serverless API Routes                 │    │
│  │   GET  /api/yields    — Aave V3 subgraph + fallback      │    │
│  │   POST /api/recommend — Claude AI rebalancing logic      │    │
│  │   GET  /api/history   — Rebalance history + hashes       │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────────────────────┬──────────────────────────────────────┘
                            │ LayerZero V2 OApp (cross-chain msg)
           ┌────────────────┴────────────────┐
           │                                 │
┌──────────▼─────────┐             ┌─────────▼──────────┐
│  Ethereum Sepolia  │◄─LZ V2 msg─►│  Arbitrum Sepolia  │
│  YieldVault.sol    │ EID 40161   │  YieldVault.sol    │
│  (Aave / Compound) │  ↔  40231   │  (Aave / Curve)    │
└────────────────────┘             └────────────────────┘
```

**No separate backend service. All API logic runs as Vercel serverless functions co-located with the frontend.**

---

## ✨ Key Features

| Feature | Detail |
|---------|--------|
| **Cross-chain rebalancing** | LayerZero V2 OApp moves funds from lower-yield to higher-yield chains |
| **AI explanations** | Claude Haiku explains every rebalancing decision; confidence score + `reasoningHash` stored on-chain |
| **Live yield data** | Aave V3 subgraph with transparent mock fallback for resilience |
| **Gas-aware logic** | Rebalancing triggers only when `APY delta × principal > gas cost` (break-even < 90 days) |
| **Portfolio dashboard** | Positions, history, projected annual earnings |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24, LayerZero V2 OApp |
| Cross-chain | LayerZero V2 (EID 40161 Sepolia ↔ EID 40231 Arbitrum Sepolia) |
| API + AI | Next.js 14 API Routes (Vercel serverless), Anthropic Claude Haiku |
| Frontend | Next.js 14, TailwindCSS, wagmi v2, viem |
| Deployment | Vercel (monorepo — frontend + all API routes) |

---

## 📋 Contract Status

> **Contracts compile and pass all tests. Testnet deployment requires a funded Sepolia wallet — scheduled for the event (April 3–5, 2026).**
> See [`contracts/deployments/addresses.json`](contracts/deployments/addresses.json) for deploy commands and RPC endpoints.

### LayerZero V2 endpoint addresses (confirmed from [official docs](https://docs.layerzero.network/v2/developers/evm/technical-reference/deployed-contracts))

| Network | LZ Endpoint | EID |
|---------|-------------|-----|
| Ethereum Sepolia | `0x6EDCE65403992e310A62460808c4b910D972f10f` | 40161 |
| Arbitrum Sepolia | `0x6EDCE65403992e310A62460808c4b910D972f10f` | 40231 |

### YieldVault deployment addresses

| Contract | Network | Address | Explorer |
|----------|---------|---------|----------|
| YieldVault | Ethereum Sepolia | `PENDING_TESTNET_DEPLOYMENT` | — |
| YieldVault | Arbitrum Sepolia | `PENDING_TESTNET_DEPLOYMENT` | — |

### Deploy yourself (no API key needed)

```bash
cd contracts
npm install --legacy-peer-deps
npx hardhat compile   # ✓ compiles clean
npx hardhat test      # ✓ all tests pass

# Deploy (public RPCs — no Alchemy key required)
export PRIVATE_KEY=0x...   # funded Sepolia wallet (https://sepoliafaucet.com)
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
```

---

## 🚀 Local Development

```bash
# Frontend + API routes
cd frontend
npm install
npm run dev
# → http://localhost:3000
# API routes: /api/yields  /api/recommend  /api/history

# Smart contracts
cd contracts
npm install --legacy-peer-deps
npx hardhat compile
npx hardhat test
```

**Optional env var:**
```env
# frontend/.env.local
ANTHROPIC_API_KEY=sk-ant-...   # enables live Claude reasoning; falls back to template without it
```

---

## 📊 API Reference

Base: `https://frontend-4d12g3vw7-mgnlias-projects.vercel.app`

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/yields` | GET | — | `{rates, best_protocol, best_chain, best_apy, data_source}` |
| `/api/recommend` | POST | `{wallet, amount}` | `{should_rebalance, from_protocol, to_protocol, apy_delta, reasoning}` |
| `/api/history` | GET | — | Array of rebalance records with `reasoning_hash` |

---

## 🏆 Prize Targets

| Sponsor | Track | Qualification |
|---------|-------|---------------|
| **LayerZero** | Best OApp — $20K | `YieldVault.sol` is a full LZ V2 OApp; `reasoningHash` stored on-chain per rebalance |
| **Anthropic** | Best Claude integration — $10K | Claude Haiku explains every rebalance with confidence score |
| **Aave** | Best DeFi app — $10K | Aave V3 is primary yield source; live subgraph integration |

---

## 📄 License

MIT
