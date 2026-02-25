// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { OApp, Origin, MessagingFee } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title YieldVault
 * @notice Cross-chain yield optimizer using LayerZero V2 OApp pattern.
 *         Receives rebalancing instructions from the orchestrator and
 *         moves funds to the highest-yielding protocol on each chain.
 * @dev Deployed on Sepolia (EID: 40161) and Arbitrum Sepolia (EID: 40231)
 */
contract YieldVault is OApp {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    enum Protocol { NONE, AAVE, COMPOUND, CURVE }

    struct Position {
        address token;
        uint256 amount;
        Protocol protocol;
        uint256 depositedAt;
        uint256 lastYieldRate; // basis points (1 bp = 0.01%)
    }

    struct RebalanceMessage {
        address token;
        uint256 amount;
        Protocol targetProtocol;
        uint256 expectedApy;       // basis points
        bytes32 reasoningHash;     // keccak256 of LLM reasoning string
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice User address => token => Position
    mapping(address => mapping(address => Position)) public positions;

    /// @notice Protocol => yield rate in basis points (updated by oracle)
    mapping(Protocol => uint256) public protocolYieldRates;

    /// @notice Total value locked per token
    mapping(address => uint256) public tvl;

    /// @notice Orchestrator address allowed to trigger rebalances
    address public orchestrator;

    /// @notice Rebalance history
    RebalanceEvent[] public rebalanceHistory;

    struct RebalanceEvent {
        uint256 timestamp;
        address token;
        uint256 amount;
        Protocol fromProtocol;
        Protocol toProtocol;
        uint256 fromApy;
        uint256 toApy;
        bytes32 reasoningHash;
        uint32 sourceChainEid; // 0 if local
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event Deposited(address indexed user, address indexed token, uint256 amount, Protocol protocol);
    event Withdrawn(address indexed user, address indexed token, uint256 amount);
    event Rebalanced(address indexed token, uint256 amount, Protocol from, Protocol to, uint256 fromApy, uint256 toApy);
    event CrossChainRebalanceReceived(uint32 srcEid, address token, uint256 amount, Protocol targetProtocol);
    event YieldRateUpdated(Protocol protocol, uint256 newRate);
    event OrchestratorUpdated(address newOrchestrator);

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────

    error NotOrchestrator();
    error InsufficientBalance();
    error InvalidProtocol();
    error ZeroAmount();

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(
        address _endpoint,
        address _owner,
        address _orchestrator
    ) OApp(_endpoint, _owner) Ownable(_owner) {
        orchestrator = _orchestrator;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyOrchestrator() {
        if (msg.sender != orchestrator) revert NotOrchestrator();
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // User Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Deposit tokens into the vault for yield optimization
     * @param token ERC-20 token address
     * @param amount Amount to deposit
     * @param initialProtocol Starting protocol (can be rebalanced later)
     */
    function deposit(address token, uint256 amount, Protocol initialProtocol) external {
        if (amount == 0) revert ZeroAmount();
        if (initialProtocol == Protocol.NONE) revert InvalidProtocol();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        Position storage pos = positions[msg.sender][token];
        pos.token = token;
        pos.amount += amount;
        pos.protocol = initialProtocol;
        pos.depositedAt = block.timestamp;
        pos.lastYieldRate = protocolYieldRates[initialProtocol];

        tvl[token] += amount;

        emit Deposited(msg.sender, token, amount, initialProtocol);
    }

    /**
     * @notice Withdraw tokens from the vault
     * @param token ERC-20 token address
     * @param amount Amount to withdraw
     */
    function withdraw(address token, uint256 amount) external {
        Position storage pos = positions[msg.sender][token];
        if (pos.amount < amount) revert InsufficientBalance();

        pos.amount -= amount;
        tvl[token] -= amount;

        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, token, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Orchestrator Functions (local rebalance)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Rebalance a user's position to a new protocol
     * @param user User whose position to rebalance
     * @param token Token to rebalance
     * @param targetProtocol New protocol
     * @param reasoningHash Hash of LLM reasoning string
     */
    function rebalancePosition(
        address user,
        address token,
        Protocol targetProtocol,
        bytes32 reasoningHash
    ) external onlyOrchestrator {
        if (targetProtocol == Protocol.NONE) revert InvalidProtocol();

        Position storage pos = positions[user][token];
        if (pos.amount == 0) revert InsufficientBalance();

        Protocol fromProtocol = pos.protocol;
        uint256 fromApy = protocolYieldRates[fromProtocol];
        uint256 toApy = protocolYieldRates[targetProtocol];

        pos.protocol = targetProtocol;
        pos.lastYieldRate = toApy;

        rebalanceHistory.push(RebalanceEvent({
            timestamp: block.timestamp,
            token: token,
            amount: pos.amount,
            fromProtocol: fromProtocol,
            toProtocol: targetProtocol,
            fromApy: fromApy,
            toApy: toApy,
            reasoningHash: reasoningHash,
            sourceChainEid: 0
        }));

        emit Rebalanced(token, pos.amount, fromProtocol, targetProtocol, fromApy, toApy);
    }

    /**
     * @notice Update yield rates for all protocols (called by oracle/backend)
     */
    function updateYieldRates(
        uint256 aaveRate,
        uint256 compoundRate,
        uint256 curveRate
    ) external onlyOrchestrator {
        protocolYieldRates[Protocol.AAVE] = aaveRate;
        protocolYieldRates[Protocol.COMPOUND] = compoundRate;
        protocolYieldRates[Protocol.CURVE] = curveRate;

        emit YieldRateUpdated(Protocol.AAVE, aaveRate);
        emit YieldRateUpdated(Protocol.COMPOUND, compoundRate);
        emit YieldRateUpdated(Protocol.CURVE, curveRate);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LayerZero V2 — Cross-Chain Rebalance
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Send a cross-chain rebalance instruction to another chain's YieldVault
     * @param dstEid Destination chain endpoint ID
     * @param message Encoded RebalanceMessage
     * @param options LayerZero messaging options (gas, value)
     */
    function sendCrossChainRebalance(
        uint32 dstEid,
        RebalanceMessage calldata message,
        bytes calldata options
    ) external payable onlyOrchestrator {
        bytes memory payload = abi.encode(message);

        _lzSend(
            dstEid,
            payload,
            options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
    }

    /**
     * @notice Quote the LayerZero fee for a cross-chain rebalance
     */
    function quoteCrossChainRebalance(
        uint32 dstEid,
        RebalanceMessage calldata message,
        bytes calldata options
    ) external view returns (MessagingFee memory fee) {
        bytes memory payload = abi.encode(message);
        return _quote(dstEid, payload, options, false);
    }

    /**
     * @notice Receive cross-chain rebalance message from LayerZero
     */
    function _lzReceive(
        Origin calldata origin,
        bytes32, // guid
        bytes calldata payload,
        address, // executor
        bytes calldata // extraData
    ) internal override {
        RebalanceMessage memory message = abi.decode(payload, (RebalanceMessage));

        // Update TVL tracking for cross-chain incoming funds
        tvl[message.token] += message.amount;

        rebalanceHistory.push(RebalanceEvent({
            timestamp: block.timestamp,
            token: message.token,
            amount: message.amount,
            fromProtocol: Protocol.NONE,
            toProtocol: message.targetProtocol,
            fromApy: 0,
            toApy: message.expectedApy,
            reasoningHash: message.reasoningHash,
            sourceChainEid: origin.srcEid
        }));

        emit CrossChainRebalanceReceived(origin.srcEid, message.token, message.amount, message.targetProtocol);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────────────────────

    function setOrchestrator(address _orchestrator) external onlyOwner {
        orchestrator = _orchestrator;
        emit OrchestratorUpdated(_orchestrator);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────────────────

    function getPosition(address user, address token) external view returns (Position memory) {
        return positions[user][token];
    }

    function getRebalanceHistory(uint256 limit) external view returns (RebalanceEvent[] memory) {
        uint256 len = rebalanceHistory.length;
        uint256 count = limit < len ? limit : len;
        RebalanceEvent[] memory result = new RebalanceEvent[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = rebalanceHistory[len - count + i];
        }
        return result;
    }

    function getBestProtocol() external view returns (Protocol best, uint256 bestRate) {
        uint256 aave = protocolYieldRates[Protocol.AAVE];
        uint256 compound = protocolYieldRates[Protocol.COMPOUND];
        uint256 curve = protocolYieldRates[Protocol.CURVE];

        if (aave >= compound && aave >= curve) return (Protocol.AAVE, aave);
        if (compound >= aave && compound >= curve) return (Protocol.COMPOUND, compound);
        return (Protocol.CURVE, curve);
    }
}
