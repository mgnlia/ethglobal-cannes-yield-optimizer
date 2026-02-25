# Contract Deployments

## Status: Awaiting Funded Deployer Wallet

The contracts compile cleanly (`npx hardhat compile`). Testnet deployment requires a funded Sepolia/Arbitrum Sepolia wallet.

## How to Deploy

```bash
cd contracts

# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Set environment variables
export PRIVATE_KEY=0x...          # Your funded testnet private key
export ALCHEMY_API_KEY=...        # Alchemy API key (or use public RPCs below)

# 3. Get testnet ETH
# Sepolia faucet:         https://sepoliafaucet.com
# Arbitrum Sepolia:       https://faucet.triangleplatform.com/arbitrum/sepolia

# 4. Deploy
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
```

## Public RPC Endpoints (no API key)

| Network | RPC |
|---------|-----|
| Sepolia | `https://rpc.ankr.com/eth_sepolia` |
| Arbitrum Sepolia | `https://sepolia-rollup.arbitrum.io/rpc` |

## LayerZero V2 Endpoints

| Network | Endpoint Address | EID |
|---------|-----------------|-----|
| Sepolia | `0x6EDCE65403992e310A62460808c4b910D972f10f` | 40161 |
| Arbitrum Sepolia | `0x6EDCE65403992e310A62460808c4b910D972f10f` | 40231 |

## Expected Output

After deployment, `deployments/sepolia.json` and `deployments/arbitrumSepolia.json` will be created with:
```json
{
  "network": "sepolia",
  "chainId": "11155111",
  "address": "0x...",
  "deployer": "0x...",
  "lzEndpoint": "0x6EDCE65403992e310A62460808c4b910D972f10f",
  "deployedAt": "2026-...",
  "explorer": "https://sepolia.etherscan.io/address/0x..."
}
```
