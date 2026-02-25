/**
 * setPeer.ts — Wire up LayerZero peers between Sepolia and Arbitrum Sepolia
 * Run AFTER deploying to both networks.
 *
 * Usage:
 *   npx hardhat run scripts/setPeer.ts --network sepolia
 *   npx hardhat run scripts/setPeer.ts --network arbitrumSepolia
 */
import { ethers, network } from "hardhat";
import { readFileSync } from "fs";

const EID: Record<string, number> = {
  sepolia: 40161,
  arbitrumSepolia: 40231,
};

async function main() {
  const networkName = network.name;
  const [deployer] = await ethers.getSigners();

  // Read own deployment
  const ownDeployment = JSON.parse(readFileSync(`deployments/${networkName}.json`, "utf-8"));

  // Determine peer network
  const peerNetwork = networkName === "sepolia" ? "arbitrumSepolia" : "sepolia";
  const peerDeployment = JSON.parse(readFileSync(`deployments/${peerNetwork}.json`, "utf-8"));
  const peerEid = EID[peerNetwork];

  console.log(`\n🔗 Setting peer on ${networkName}`);
  console.log(`   Own vault: ${ownDeployment.address}`);
  console.log(`   Peer vault: ${peerDeployment.address} (${peerNetwork}, EID: ${peerEid})`);

  const vault = await ethers.getContractAt("YieldVault", ownDeployment.address, deployer);

  // LayerZero expects peer address as bytes32
  const peerBytes32 = ethers.zeroPadValue(peerDeployment.address, 32);
  const tx = await vault.setPeer(peerEid, peerBytes32);
  await tx.wait();

  console.log(`✅ Peer set! Tx: ${tx.hash}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
