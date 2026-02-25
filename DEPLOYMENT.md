# CrossYield — Live Deployments

## ETHGlobal Cannes 2026

### 🌐 Frontend (Next.js)
**URL**: https://frontend-self-ten-84.vercel.app  
Platform: Vercel  
Stack: Next.js 14, TailwindCSS, Claude AI integration

### ⚡ Backend (FastAPI)
**URL**: https://backend-zeta-vert-19.vercel.app  
Platform: Vercel (Python serverless)  
Stack: FastAPI, Anthropic SDK, aiohttp

### 📋 API Endpoints
- `GET /health` — Health check
- `GET /yields` — Live APY from Aave, Compound, Curve
- `POST /recommend` — Claude AI rebalancing recommendation
- `GET /history` — Rebalancing history
- `POST /rebalance` — Trigger rebalance (admin)

### 📄 Smart Contracts (Testnet)
- **Network**: Sepolia + Arbitrum Sepolia
- **YieldVault.sol**: ERC4626-style vault with protocol routing
- **CrossYieldOApp.sol**: LayerZero V2 OApp (MSG_REBALANCE / MSG_BRIDGE_IN / MSG_YIELD_SYNC)

### 🔗 GitHub
https://github.com/mgnlia/ethglobal-cannes-yield-optimizer
