import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("YieldVault", function () {
  async function deployFixture() {
    const [owner, orchestrator, user1, user2] = await ethers.getSigners();

    // Deploy mock LZ endpoint
    const MockEndpoint = await ethers.getContractFactory("MockEndpointV2");
    const endpoint = await MockEndpoint.deploy(40161, owner.address);

    // Deploy mock ERC-20 (USDC)
    const MockToken = await ethers.getContractFactory("MockERC20");
    const usdc = await MockToken.deploy("USD Coin", "USDC", 6);

    // Deploy YieldVault
    const YieldVault = await ethers.getContractFactory("YieldVault");
    const vault = await YieldVault.deploy(
      await endpoint.getAddress(),
      owner.address,
      orchestrator.address
    );

    // Mint USDC to user1
    await usdc.mint(user1.address, ethers.parseUnits("10000", 6));
    await usdc.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);

    return { vault, usdc, endpoint, owner, orchestrator, user1, user2 };
  }

  describe("Deployment", function () {
    it("sets owner and orchestrator", async function () {
      const { vault, owner, orchestrator } = await loadFixture(deployFixture);
      expect(await vault.owner()).to.equal(owner.address);
      expect(await vault.orchestrator()).to.equal(orchestrator.address);
    });
  });

  describe("Deposit", function () {
    it("accepts deposits and updates TVL", async function () {
      const { vault, usdc, user1 } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 6);

      await vault.connect(user1).deposit(await usdc.getAddress(), amount, 1 /* AAVE */);

      const pos = await vault.getPosition(user1.address, await usdc.getAddress());
      expect(pos.amount).to.equal(amount);
      expect(pos.protocol).to.equal(1);

      expect(await vault.tvl(await usdc.getAddress())).to.equal(amount);
    });

    it("reverts on zero amount", async function () {
      const { vault, usdc, user1 } = await loadFixture(deployFixture);
      await expect(
        vault.connect(user1).deposit(await usdc.getAddress(), 0, 1)
      ).to.be.revertedWithCustomError(vault, "ZeroAmount");
    });
  });

  describe("Withdraw", function () {
    it("allows partial withdrawal", async function () {
      const { vault, usdc, user1 } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 6);
      const withdrawAmount = ethers.parseUnits("400", 6);

      await vault.connect(user1).deposit(await usdc.getAddress(), amount, 1);
      await vault.connect(user1).withdraw(await usdc.getAddress(), withdrawAmount);

      const pos = await vault.getPosition(user1.address, await usdc.getAddress());
      expect(pos.amount).to.equal(amount - withdrawAmount);
    });

    it("reverts on insufficient balance", async function () {
      const { vault, usdc, user1 } = await loadFixture(deployFixture);
      await vault.connect(user1).deposit(await usdc.getAddress(), ethers.parseUnits("100", 6), 1);
      await expect(
        vault.connect(user1).withdraw(await usdc.getAddress(), ethers.parseUnits("200", 6))
      ).to.be.revertedWithCustomError(vault, "InsufficientBalance");
    });
  });

  describe("Rebalancing", function () {
    it("orchestrator can rebalance position", async function () {
      const { vault, usdc, user1, orchestrator } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("1000", 6);

      await vault.connect(user1).deposit(await usdc.getAddress(), amount, 1 /* AAVE */);

      // Update yield rates: Compound > Aave
      await vault.connect(orchestrator).updateYieldRates(320, 580, 410);

      const reasoningHash = ethers.keccak256(ethers.toUtf8Bytes("Move to Compound: higher APY"));
      await vault.connect(orchestrator).rebalancePosition(
        user1.address,
        await usdc.getAddress(),
        2, // COMPOUND
        reasoningHash
      );

      const pos = await vault.getPosition(user1.address, await usdc.getAddress());
      expect(pos.protocol).to.equal(2);
    });

    it("non-orchestrator cannot rebalance", async function () {
      const { vault, usdc, user1 } = await loadFixture(deployFixture);
      await vault.connect(user1).deposit(await usdc.getAddress(), ethers.parseUnits("100", 6), 1);
      await expect(
        vault.connect(user1).rebalancePosition(user1.address, await usdc.getAddress(), 2, ethers.ZeroHash)
      ).to.be.revertedWithCustomError(vault, "NotOrchestrator");
    });
  });

  describe("getBestProtocol", function () {
    it("returns highest yield protocol", async function () {
      const { vault, orchestrator } = await loadFixture(deployFixture);
      await vault.connect(orchestrator).updateYieldRates(300, 620, 410);

      const [best, rate] = await vault.getBestProtocol();
      expect(best).to.equal(2); // COMPOUND
      expect(rate).to.equal(620);
    });
  });
});
