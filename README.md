# 🌊 CrossYield — Cross-Chain Yield Optimizer

> **ETHGlobal Cannes 2026** · April 3–5, 2026 · Palais des Festivals, Cannes, France · $275K prize pool

CrossYield is an AI-powered cross-chain yield optimizer that identifies the highest-yield DeFi opportunities across Ethereum and Arbitrum and explains every rebalancing decision in plain English using **Claude AI**. Cross-chain messaging is powered by **LayerZero V2 OApp**.

## 🔗 Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | https://frontend-qknpgstds-mgnlias-projects.vercel.app |
| **GET /api/yields** | https://frontend-qknpgstds-mgnlias-projects.vercel.app/api/yields |
| **POST /api/recommend** | https://frontend-qknpgstds-mgnlias-projects.vercel.app/api/recommend |
| **GET /api/history** | https://frontend-qknpgstds-mgnlias-projects.vercel.app/api/history |

> **Alias (may have CDN cache):** https://frontend-self-ten-84.vercel.app — use the permanent URL above if you see a 404.

### Verify the API right now

```bash
# Yield rates across Aave, Compound, Curve
curl https://frontend-qknpgstds-mgnlias-projects.vercel.app/api/yields

# AI rebalancing recommendation (POST)
curl -X POST https://frontend-qknpgstds-mgnlias-projects.vercel.app/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"wallet":"0xYourAddress","amount":10000}'

# Rebalancing history with AI reasoning
curl https://frontend-qknpgstds-mgnlias-projects.vercel.app/api/history
```

**Verified live at 2026-02-25T17:36 UTC:**
- `GET /api/yields` → HTTP 200 · `{"best_protocol":"compound","best_chain":"arbitrum","best_apy":6.23,...}`
- `POST /api/recommend` → HTTP 200 · `{"should_rebalance":true,"to_protocol":"compound","apy_delta":3.02,...}`
- `GET /api/history` → HTTP 200 · 3 entries with reasoning hashes

> **Yield data:** Live rates fetched from Aave V3 subgraph. Falls back to representative rates when the subgraph is unreachable, labeled `"data_source":"mock"` in the response. The UI shows an amber banner for mock data and green for live data.

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Next.js 14 Frontend                        │
│        Portfolio View │ Yield Compare │ Rebalance History     │
│  https://frontend-qknpgstds-mgnlias-projects.vercel.app      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Next.js API Routes (Vercel serverless)       │   │
│  │   /api/yields · /api/recommend · /api/history         │   │
│  │   Aave V3 subgraph · Claude AI (Haiku)               │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────┘
                               │ LayerZero V2 OApp
        ┌──────────────────────┴──────────────────────┐
        │                                             │
┌───────▼──────────┐                      ┌──────────▼───────┐
│   Sepolia L1     │◄────LayerZero V2─────►│ Arbitrum Sepolia │
│  YieldVault.sol  │   EID 40161↔40231    │  YieldVault.sol  │
│  (Aave/Compound) │                       │  (Aave/Curve)    │
└──────────────────┘                       └──────────────────┘
```

**All API logic runs as Vercel serverless functions inside the Next.js app. There is no separate backend service.**

## ✨ Key Features

- **Cross-chain rebalancing** — LayerZero V2 OApp routes funds from lower-yield to higher-yield chains
- **AI explanations** — Claude explains every rebalancing decision with a confidence score and on-chain `reasoningHash`
- **Live yield data** — Real-time APY from Aave V3 subgraph with transparent mock fallback
- **Gas-aware logic** — Rebalancing only triggers when `APY delta × principal > gas cost` (break-even < 90 days)
- **Portfolio dashboard** — Track positions, history, and projected annual earnings

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24, LayerZero V2 OApp |
| Cross-chain | LayerZero V2 (Sepolia ↔ Arbitrum Sepolia, EID 40161/40231) |
| API / AI | Next.js 14 API Routes (Vercel serverless), Anthropic Claude Haiku |
| Frontend | Next.js 14, TailwindCSS, wagmi v2, viem |
| Deployment | Vercel (frontend + API routes) |

## 📋 Contract Addresses

> **Status: pending testnet deployment.** Contracts compile and pass tests. A funded Sepolia wallet is required to deploy — this happens at the event (April 3–5, 2026). See [`contracts/deployments/addresses.json`](contracts/deployments/addresses.json) for full instructions.

**LayerZero V2 endpoints hardcoded in contracts** ([source](https://docs.layerzero.network/v2/developers/evm/technical-reference/deployed-contracts)):

| Network | Endpoint | EID | Chain ID |
|---------|----------|-----|----------|
| Sepolia | `0x6EDCE65403992e310A62460808c4b910D972f10f` | 40161 | 11155111 |
| Arbitrum Sepolia | `0x6EDCE65403992e310A62460808c4b910D972f10f` | 40231 | 421614 |

**YieldVault contract addresses** (to be filled after event deployment):

| Contract | Network | Address |
|----------|---------|---------|
| YieldVault | Sepolia | `PENDING_TESTNET_DEPLOYMENT` |
| YieldVault | Arbitrum Sepolia | `PENDING_TESTNET_DEPLOYMENT` |

**To deploy yourself:**
```bash
cd contracts
npm install --legacy-peer-deps
export PRIVATE_KEY=0x...   # funded Sepolia wallet
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
# Addresses auto-saved to contracts/deployments/sepolia.json + arbitrumSepolia.json
```

Public RPCs (no API key needed): Sepolia `https://rpc.ankr.com/eth_sepolia` · Arbitrum Sepolia `https://sepolia-rollup.arbitrum.io/rpc`

## 🚀 Local Development

```bash
# Frontend + API routes
cd frontend && npm install && npm run dev
# → http://localhost:3000  (API routes at /api/yields, /api/recommend, /api/history)

# Contracts
cd contracts && npm install --legacy-peer-deps
npx hardhat compile && npx hardhat test
```

## 🌐 Environment Variables

```env
# frontend/.env.local
ANTHROPIC_API_KEY=sk-ant-...   # Enables live Claude reasoning in /api/recommend
                                # Falls back to template explanations without it
```

## 📊 API Reference

Base URL: `https://frontend-qknpgstds-mgnlias-projects.vercel.app`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/yields` | GET | APY rates across Aave, Compound, Curve (live + mock fallback) |
| `/api/recommend` | POST | AI rebalancing recommendation via Claude. Body: `{wallet, amount}` |
| `/api/history` | GET | Rebalancing history with AI reasoning and `reasoningHash` |

## 🏆 Prize Targets — ETHGlobal Cannes 2026

| Sponsor | Track | Why we qualify |
|---------|-------|---------------|
| **LayerZero** | Best OApp ($20K) | YieldVault.sol is a full LZ V2 OApp with cross-chain rebalancing; `reasoningHash` stored on-chain |
| **Anthropic** | Best Claude integration ($10K) | Claude Haiku explains every rebalance in plain English with confidence score |
| **Aave** | Best DeFi app ($10K) | Aave V3 is the primary yield source; live subgraph integration |

## 📄 License

MIT
