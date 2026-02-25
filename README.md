# 🌐 Cross-Chain Yield Optimizer — ETHGlobal Cannes 2026

> **AI-powered cross-chain yield optimization with LayerZero V2 + LLM reasoning**

[![ETHGlobal Cannes](https://img.shields.io/badge/ETHGlobal-Cannes%202026-%23FF6B35)](https://ethglobal.com/events/cannes2026)
[![Prize Pool](https://img.shields.io/badge/Prize%20Pool-%24275K-gold)]()
[![LayerZero V2](https://img.shields.io/badge/LayerZero-V2-blue)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()

## 🎯 What It Does

The first cross-chain yield optimizer that uses **LLM reasoning** to explain every rebalancing decision in plain English.

1. **Monitor** — Aggregates live yield rates across Aave, Compound, and Curve on 5+ chains
2. **Reason** — Claude AI explains *why* a rebalance is optimal (risk, gas, APY delta)
3. **Execute** — LayerZero V2 OApp sends cross-chain messages to move funds atomically
4. **Report** — Dashboard shows portfolio history, yield comparison, and AI explanations

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Dashboard (Vercel)                │
│         Portfolio View │ Yield Comparison │ AI Explanations  │
└────────────────────────┬────────────────────────────────────┘
                         │ Next.js API Routes (serverless)
┌────────────────────────▼────────────────────────────────────┐
│              /api/yields  /api/recommend  /api/history        │
│   Yield Aggregator │ Claude LLM │ Rebalance Orchestrator     │
└──────┬─────────────────────────────────────────┬────────────┘
       │                                         │
┌──────▼──────┐                        ┌─────────▼──────────┐
│  Aave API   │                        │  LayerZero V2 OApp  │
│  Compound   │                        │  YieldVault.sol     │
│  Curve API  │                        │  Sepolia + Arb Sep  │
└─────────────┘                        └────────────────────┘
```

## 🔗 LayerZero V2 Integration

- **OApp pattern** — YieldVault contract implements OApp on each chain
- **Cross-chain rebalance** — sends encoded `RebalanceMessage` via LayerZero endpoint
- **Testnet deployment** — Sepolia (EID: 40161) + Arbitrum Sepolia (EID: 40231)

> ⚠️ **Contract addresses**: Pending testnet deployment — see `contracts/deployments.json` once deployed.

## 🤖 AI Reasoning Layer

Each rebalancing decision includes Claude's explanation:
> *"Moving 40% of USDC from Ethereum Aave (3.2% APY) to Arbitrum Compound (5.8% APY). Expected gain: +$847/year. Gas cost: ~$12. Break-even: 5.2 days. Risk delta: minimal — both protocols are battle-tested with >$1B TVL."*

Every explanation is stored with a keccak256 hash for auditability.

## 📊 Data Sources

Yield data is aggregated from live protocol APIs (Aave V3 subgraph, Compound V3 API, Curve pools) **with a mock data fallback** for resilience when external APIs are unavailable. The dashboard clearly indicates live vs. fallback mode.

## 🚀 Quick Start

### Contracts
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
```

### Frontend (includes serverless API)
```bash
cd frontend
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY
npm run dev
```

## 📁 Project Structure

```
ethglobal-cannes-yield-optimizer/
├── contracts/                  # Solidity + Hardhat
│   ├── contracts/
│   │   ├── YieldVault.sol      # Main LayerZero OApp
│   │   └── interfaces/
│   ├── scripts/
│   │   └── deploy.ts
│   ├── test/
│   │   └── YieldVault.test.ts
│   └── hardhat.config.ts
├── frontend/                   # Next.js 14 + serverless API
│   ├── app/
│   │   ├── page.tsx            # Dashboard
│   │   ├── api/
│   │   │   ├── yields/         # GET /api/yields
│   │   │   ├── recommend/      # POST /api/recommend
│   │   │   └── history/        # GET /api/history
│   │   ├── portfolio/
│   │   └── history/
│   ├── components/
│   └── package.json
└── README.md
```

## 🌐 Live Demo

- **Dashboard**: https://frontend-self-ten-84.vercel.app
- **API — Yields**: https://frontend-self-ten-84.vercel.app/api/yields
- **API — Recommend**: https://frontend-self-ten-84.vercel.app/api/recommend (POST)
- **API — History**: https://frontend-self-ten-84.vercel.app/api/history

## 🏆 Hackathon

- **Event**: ETHGlobal Cannes 2026 — April 3–5, 2026, Palais des Festivals, Cannes
- **Submission deadline**: April 5, 2026 at 09:00 CEST
- **Sponsors targeted**: LayerZero ($20K track), Aave, Anthropic
- **Novel angle**: LLM reasoning with keccak256-hashed audit trail for every cross-chain yield decision

## License
MIT
