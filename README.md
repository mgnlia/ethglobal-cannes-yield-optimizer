# 🌐 Cross-Chain Yield Optimizer — ETHGlobal Cannes 2026

> **AI-powered cross-chain yield optimization with LayerZero V2 + LLM reasoning**

[![ETHGlobal Cannes](https://img.shields.io/badge/ETHGlobal-Cannes%202026-%23FF6B35)](https://ethglobal.com/events/cannes)
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
                         │ REST API
┌────────────────────────▼────────────────────────────────────┐
│                  FastAPI Backend (Railway)                    │
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

## 🤖 AI Reasoning Layer

Each rebalancing decision includes Claude's explanation:
> *"Moving 40% of USDC from Ethereum Aave (3.2% APY) to Arbitrum Compound (5.8% APY). Expected gain: +$847/year. Gas cost: ~$12. Break-even: 5.2 days. Risk delta: minimal — both protocols are battle-tested with >$1B TVL."*

## 🚀 Quick Start

### Contracts
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
```

### Backend
```bash
cd backend
pip install -r requirements.txt
export ANTHROPIC_API_KEY=your_key
export ALCHEMY_API_KEY=your_key
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
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
├── backend/                    # FastAPI
│   ├── main.py                 # API entry point
│   ├── yield_aggregator.py     # Aave/Compound/Curve rates
│   ├── llm_reasoning.py        # Claude explanation layer
│   ├── rebalancer.py           # Rebalancing logic
│   └── requirements.txt
├── frontend/                   # Next.js 14
│   ├── app/
│   │   ├── page.tsx            # Dashboard
│   │   ├── portfolio/
│   │   └── history/
│   ├── components/
│   └── package.json
└── README.md
```

## 🌐 Live Demo

- **Dashboard**: https://ethglobal-cannes-yield-optimizer.vercel.app
- **API**: https://ethglobal-cannes-yield-optimizer-api.up.railway.app/docs

## 🏆 Hackathon

- **Event**: ETHGlobal Cannes 2026
- **Deadline**: April 5, 2026
- **Sponsors targeted**: LayerZero, Aave, Anthropic
- **Novel angle**: LLM reasoning for cross-chain yield decisions

## License
MIT
