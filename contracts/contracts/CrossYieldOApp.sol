// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { OApp, Origin, MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { OAppOptionsType3 } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OAppOptionsType3.sol";
import { OptionsBuilder } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/libs/OptionsBuilder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./YieldVault.sol";

/// @title CrossYieldOApp
/// @notice LayerZero V2 OApp for cross-chain yield optimization.
///         Sends rebalancing instructions and bridged funds between chains.
///
/// Message types:
///   MSG_REBALANCE  (0x01) — Instruct remote vault to switch protocols
///   MSG_BRIDGE_IN  (0x02) — Move user funds from this chain to a remote vault
///   MSG_YIELD_SYNC (0x03) — Broadcast latest APY data for off-chain comparison
contract CrossYieldOApp is OApp, OAppOptionsType3 {
    using SafeERC20 for IERC20;
    using OptionsBuilder for bytes;

    // ─── Constants ──────────────────────────────────────────────────────────

    uint8 public constant MSG_REBALANCE  = 0x01;
    uint8 public constant MSG_BRIDGE_IN  = 0x02;
    uint8 public constant MSG_YIELD_SYNC = 0x03;

    uint128 public constant DEFAULT_GAS_LIMIT = 300_000;

    // ─── State ──────────────────────────────────────────────────────────────

    YieldVault public immutable vault;
    IERC20     public immutable usdc;

    // Remote endpoint ID → remote OApp address
    mapping(uint32 => bytes32) public remoteOApps;

    // Latest APY snapshot per chain (eid → protocolId → apy in bps)
    mapping(uint32 => mapping(uint256 => uint256)) public remoteAPYs;

    // ─── Events ─────────────────────────────────────────────────────────────

    event RebalanceMessageSent(uint32 indexed dstEid, uint256 toProtocolId, uint256 fee);
    event BridgeOutSent(uint32 indexed dstEid, address indexed user, uint256 amount, uint256 fee);
    event BridgeInReceived(address indexed user, uint256 amount);
    event RebalanceReceived(uint256 toProtocolId, string aiReason);
    event YieldSyncReceived(uint32 indexed srcEid, uint256 protocolId, uint256 apy);
    event RemoteOAppSet(uint32 indexed eid, bytes32 remote);

    // ─── Errors ─────────────────────────────────────────────────────────────

    error InsufficientFee();
    error UnknownMessageType(uint8 msgType);
    error RemoteNotConfigured(uint32 eid);

    // ─── Constructor ────────────────────────────────────────────────────────

    constructor(
        address _endpoint,
        address _owner,
        address _vault,
        address _usdc
    ) OApp(_endpoint, _owner) {
        vault = YieldVault(_vault);
        usdc  = IERC20(_usdc);
    }

    // ─── Admin ──────────────────────────────────────────────────────────────

    function setRemoteOApp(uint32 eid, bytes32 remoteAddress) external onlyOwner {
        remoteOApps[eid] = remoteAddress;
        // Also set the peer for LayerZero security checks
        setPeer(eid, remoteAddress);
        emit RemoteOAppSet(eid, remoteAddress);
    }

    // ─── Send: Rebalance instruction ────────────────────────────────────────

    /// @notice Tell the remote vault to switch to a higher-yield protocol
    /// @param dstEid Destination chain endpoint ID
    /// @param toProtocolId Protocol index on the remote vault
    /// @param aiReason Claude's explanation
    function sendRebalance(
        uint32 dstEid,
        uint256 toProtocolId,
        string calldata aiReason
    ) external payable onlyOwner {
        if (remoteOApps[dstEid] == bytes32(0)) revert RemoteNotConfigured(dstEid);

        bytes memory payload = abi.encode(MSG_REBALANCE, toProtocolId, aiReason);
        bytes memory options = OptionsBuilder.newOptions()
            .addExecutorLzReceiveOption(DEFAULT_GAS_LIMIT, 0);

        MessagingFee memory fee = _quote(dstEid, payload, options, false);
        if (msg.value < fee.nativeFee) revert InsufficientFee();

        _lzSend(dstEid, payload, options, fee, payable(msg.sender));
        emit RebalanceMessageSent(dstEid, toProtocolId, fee.nativeFee);
    }

    /// @notice Quote the fee for a rebalance message
    function quoteRebalance(
        uint32 dstEid,
        uint256 toProtocolId,
        string calldata aiReason
    ) external view returns (MessagingFee memory) {
        bytes memory payload = abi.encode(MSG_REBALANCE, toProtocolId, aiReason);
        bytes memory options = OptionsBuilder.newOptions()
            .addExecutorLzReceiveOption(DEFAULT_GAS_LIMIT, 0);
        return _quote(dstEid, payload, options, false);
    }

    // ─── Send: Bridge funds to another chain ────────────────────────────────

    /// @notice Bridge USDC from this chain to a remote vault for a user
    /// @param dstEid Destination chain endpoint ID
    /// @param user The user whose position is being moved
    /// @param amount USDC amount (6 decimals)
    function bridgeOut(
        uint32 dstEid,
        address user,
        uint256 amount
    ) external payable {
        if (remoteOApps[dstEid] == bytes32(0)) revert RemoteNotConfigured(dstEid);

        // Pull USDC from vault (vault must approve this contract)
        usdc.safeTransferFrom(address(vault), address(this), amount);

        bytes memory payload = abi.encode(MSG_BRIDGE_IN, user, amount);
        bytes memory options = OptionsBuilder.newOptions()
            .addExecutorLzReceiveOption(DEFAULT_GAS_LIMIT + 100_000, 0)
            .addExecutorNativeDropOption(uint128(amount), bytes32(uint256(uint160(address(vault)))));

        MessagingFee memory fee = _quote(dstEid, payload, options, false);
        if (msg.value < fee.nativeFee) revert InsufficientFee();

        _lzSend(dstEid, payload, options, fee, payable(msg.sender));
        emit BridgeOutSent(dstEid, user, amount, fee.nativeFee);
    }

    // ─── Send: Yield sync ───────────────────────────────────────────────────

    /// @notice Broadcast current APY data to a remote chain
    function syncYield(
        uint32 dstEid,
        uint256 protocolId,
        uint256 apy
    ) external payable onlyOwner {
        bytes memory payload = abi.encode(MSG_YIELD_SYNC, protocolId, apy);
        bytes memory options = OptionsBuilder.newOptions()
            .addExecutorLzReceiveOption(100_000, 0);

        MessagingFee memory fee = _quote(dstEid, payload, options, false);
        if (msg.value < fee.nativeFee) revert InsufficientFee();

        _lzSend(dstEid, payload, options, fee, payable(msg.sender));
    }

    // ─── Receive ────────────────────────────────────────────────────────────

    /// @inheritdoc OApp
    function _lzReceive(
        Origin calldata origin,
        bytes32 /*guid*/,
        bytes calldata message,
        address /*executor*/,
        bytes calldata /*extraData*/
    ) internal override {
        uint8 msgType = uint8(message[0]);

        if (msgType == MSG_REBALANCE) {
            (, uint256 toProtocolId, string memory aiReason) =
                abi.decode(message, (uint8, uint256, string));
            vault.rebalance(toProtocolId, aiReason);
            emit RebalanceReceived(toProtocolId, aiReason);

        } else if (msgType == MSG_BRIDGE_IN) {
            (, address user, uint256 amount) =
                abi.decode(message, (uint8, address, uint256));
            // USDC arrives via native drop; approve vault and call receiveFromChain
            usdc.forceApprove(address(vault), amount);
            vault.receiveFromChain(user, amount);
            emit BridgeInReceived(user, amount);

        } else if (msgType == MSG_YIELD_SYNC) {
            (, uint256 protocolId, uint256 apy) =
                abi.decode(message, (uint8, uint256, uint256));
            remoteAPYs[origin.srcEid][protocolId] = apy;
            emit YieldSyncReceived(origin.srcEid, protocolId, apy);

        } else {
            revert UnknownMessageType(msgType);
        }
    }

    // ─── Fee helpers ────────────────────────────────────────────────────────

    receive() external payable {}

    function withdrawNative() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
