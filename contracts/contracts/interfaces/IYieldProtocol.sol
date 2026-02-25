// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IYieldProtocol
/// @notice Interface for any yield-bearing protocol (Aave, Compound, Curve)
interface IYieldProtocol {
    /// @notice Deposit assets to earn yield
    /// @param asset The token to deposit
    /// @param amount The amount to deposit
    /// @param onBehalfOf The address that receives the yield-bearing tokens
    function deposit(address asset, uint256 amount, address onBehalfOf) external;

    /// @notice Withdraw assets
    /// @param asset The token to withdraw
    /// @param amount The amount to withdraw (use type(uint256).max for full balance)
    /// @param to The recipient address
    /// @return The actual amount withdrawn
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);

    /// @notice Get the current APY in basis points (1 bps = 0.01%)
    /// @param asset The asset to query
    /// @return apy Annual percentage yield in basis points
    function getCurrentAPY(address asset) external view returns (uint256 apy);

    /// @notice Get the current balance of deposited assets
    /// @param asset The asset
    /// @param account The account
    /// @return balance Current balance including accrued yield
    function getBalance(address asset, address account) external view returns (uint256 balance);
}
