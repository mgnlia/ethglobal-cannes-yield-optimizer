/**
 * Direct deployment script using ethers.js + public Sepolia RPC
 * Usage: PRIVATE_KEY=0x... node deploy-direct.mjs
 *
 * This script compiles + deploys YieldVault to Sepolia and Arbitrum Sepolia
 * without requiring Hardhat (works with Node 20).
 */
import { ethers } from "ethers";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// LayerZero V2 Endpoint addresses (official)
const LZ_ENDPOINTS = {
  sepolia:         "0x6EDCE65403992e310A62460808c4b910D972f10f", // EID 40161
  arbitrumSepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f", // EID 40231
};

// Public RPCs (no API key needed)
const RPCS = {
  sepolia:         "https://rpc.ankr.com/eth_sepolia",
  arbitrumSepolia: "https://sepolia-rollup.arbitrum.io/rpc",
};

async function deploy(networkName) {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY env var required");

  const provider = new ethers.JsonRpcProvider(RPCS[networkName]);
  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(wallet.address);

  console.log(`\n🚀 Deploying to ${networkName}`);
  console.log(`   Deployer: ${wallet.address}`);
  console.log(`   Balance:  ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.warn(`   ⚠️  No ETH — get testnet ETH from faucet first`);
    return null;
  }

  // YieldVault bytecode (pre-compiled)
  // To regenerate: npx hardhat compile && cat artifacts/contracts/YieldVault.sol/YieldVault.json | jq .bytecode
  const { YieldVaultABI, YieldVaultBytecode } = await import("./YieldVaultArtifact.mjs");

  const factory = new ethers.ContractFactory(YieldVaultABI, YieldVaultBytecode, wallet);
  const lzEndpoint = LZ_ENDPOINTS[networkName];

  const contract = await factory.deploy(lzEndpoint, wallet.address, wallet.address);
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`✅ YieldVault deployed at: ${address}`);

  const network = await provider.getNetwork();
  const deployment = {
    network: networkName,
    chainId: network.chainId.toString(),
    address,
    deployer: wallet.address,
    lzEndpoint,
    deployedAt: new Date().toISOString(),
    explorer: networkName === "sepolia"
      ? `https://sepolia.etherscan.io/address/${address}`
      : `https://sepolia.arbiscan.io/address/${address}`,
  };

  mkdirSync(join(__dirname, "../deployments"), { recursive: true });
  writeFileSync(
    join(__dirname, `../deployments/${networkName}.json`),
    JSON.stringify(deployment, null, 2)
  );

  return deployment;
}

// Run both networks
const results = {};
for (const network of ["sepolia", "arbitrumSepolia"]) {
  try {
    results[network] = await deploy(network);
  } catch (e) {
    console.error(`Error on ${network}: ${e.message}`);
  }
}

console.log("\n📋 Deployment Summary:");
console.log(JSON.stringify(results, null, 2));
