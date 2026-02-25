// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title MockYieldProtocol
/// @notice Simulates a yield protocol (Aave/Compound) for testing
contract MockYieldProtocol {
    using SafeERC20 for IERC20;

    uint256 public mockAPY; // APY in basis points
    mapping(address => mapping(address => uint256)) public balances; // asset → account → balance

    constructor(uint256 _mockAPY) {
        mockAPY = _mockAPY;
    }

    function setAPY(uint256 _apy) external {
        mockAPY = _apy;
    }

    function deposit(address asset, uint256 amount, address onBehalfOf) external {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        balances[asset][onBehalfOf] += amount;
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        uint256 bal = balances[asset][msg.sender];
        uint256 actual = amount > bal ? bal : amount;
        balances[asset][msg.sender] -= actual;
        IERC20(asset).safeTransfer(to, actual);
        return actual;
    }

    function getCurrentAPY(address /*asset*/) external view returns (uint256) {
        return mockAPY;
    }

    function getBalance(address asset, address account) external view returns (uint256) {
        return balances[asset][account];
    }
}
