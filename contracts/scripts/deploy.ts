import { ethers, network } from "hardhat";
import { writeFileSync } from "fs";

// LayerZero V2 Endpoint addresses
const LZ_ENDPOINTS: Record<string, string> = {
  sepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",        // EID: 40161
  arbitrumSepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f", // EID: 40231
  hardhat: "0x0000000000000000000000000000000000000001",
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log(`\n🚀 Deploying YieldVault to ${networkName}`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  const lzEndpoint = LZ_ENDPOINTS[networkName];
  if (!lzEndpoint) throw new Error(`No LZ endpoint for network: ${networkName}`);

  const YieldVault = await ethers.getContractFactory("YieldVault");
  const vault = await YieldVault.deploy(
    lzEndpoint,
    deployer.address,   // owner
    deployer.address    // orchestrator (update to backend wallet in prod)
  );

  await vault.waitForDeployment();
  const address = await vault.getAddress();

  console.log(`✅ YieldVault deployed at: ${address}`);
  console.log(`   Network: ${networkName}`);
  console.log(`   LZ Endpoint: ${lzEndpoint}`);

  // Save deployment info
  const deployment = {
    network: networkName,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    address,
    deployer: deployer.address,
    lzEndpoint,
    deployedAt: new Date().toISOString(),
  };

  writeFileSync(
    `deployments/${networkName}.json`,
    JSON.stringify(deployment, null, 2)
  );

  console.log(`\n📄 Deployment saved to deployments/${networkName}.json`);

  // Verify instructions
  console.log(`\n🔍 To verify on Etherscan:`);
  console.log(`npx hardhat verify --network ${networkName} ${address} "${lzEndpoint}" "${deployer.address}" "${deployer.address}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
