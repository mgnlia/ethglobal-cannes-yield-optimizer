# 🌊 CrossYield — Cross-Chain Yield Optimizer

> ETHGlobal Cannes 2026 submission — $275K pool

CrossYield is an AI-powered cross-chain yield optimizer that automatically moves funds between DeFi protocols across Ethereum and Arbitrum to maximize yield. It uses **LayerZero V2** for trustless cross-chain messaging and **Claude AI** to explain every rebalancing decision in plain English.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                      │
│          Portfolio View │ Yield Compare │ Rebalance History  │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API
┌──────────────────────────────▼──────────────────────────────┐
│                      FastAPI Backend                         │
│   Yield Aggregator (Aave/Compound/Curve) │ Claude AI Engine  │
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
- **AI explanations**: Claude 3.5 Sonnet explains every rebalancing decision in plain English
- **Live yield data**: Real-time APY from Aave V3, Compound V3, Curve Finance
- **Gas-aware**: Rebalancing only triggers when yield delta > gas cost
- **Portfolio dashboard**: Track positions, history, and projected earnings

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.24, LayerZero V2 OApp |
| Cross-chain | LayerZero V2 (Sepolia ↔ Arbitrum Sepolia) |
| Backend | FastAPI, Python 3.11, Anthropic SDK |
| Frontend | Next.js 14, TailwindCSS, wagmi v2, viem |
| Deployment | Railway (backend) + Vercel (frontend) |

## 🚀 Quick Start

### Contracts
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat deploy --network sepolia
npx hardhat deploy --network arbitrumSepolia
```

### Backend
```bash
cd backend
pip install uv
uv sync
uv run uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📋 Contract Addresses (Testnet)

| Contract | Network | Address |
|----------|---------|---------|
| YieldVault | Sepolia | TBD |
| YieldVault | Arbitrum Sepolia | TBD |
| CrossYieldOApp | Sepolia | TBD |
| CrossYieldOApp | Arbitrum Sepolia | TBD |

## 🏆 ETHGlobal Cannes Prize Targets

- **LayerZero**: Best use of LayerZero V2 OApp
- **Anthropic**: Best Claude integration
- **Aave**: Best DeFi application
- **Overall**: Best DeFi project

## 📄 License

MIT
