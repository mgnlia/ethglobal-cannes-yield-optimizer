// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title YieldVault
/// @notice Manages user deposits and routes them to the highest-yield protocol on each chain.
///         Receives cross-chain rebalancing instructions from CrossYieldOApp.
/// @dev Supports USDC deposits, tracks shares per user, and integrates with Aave/Compound/Curve.
contract YieldVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ─── Structs ────────────────────────────────────────────────────────────

    struct Protocol {
        address adapter;      // Address of the protocol adapter
        string  name;         // Human-readable name (e.g. "Aave V3")
        bool    active;       // Whether this protocol is currently accepting deposits
        uint256 totalDeposited; // Total assets deposited into this protocol
    }

    struct UserPosition {
        uint256 shares;           // Vault shares held
        uint256 depositedAt;      // Block timestamp of last deposit
        uint256 totalDeposited;   // Cumulative USDC deposited (for PnL tracking)
    }

    struct RebalanceRecord {
        uint256 timestamp;
        uint256 fromProtocolId;
        uint256 toProtocolId;
        uint256 amount;
        string  aiReason;         // Claude's explanation
    }

    // ─── State ──────────────────────────────────────────────────────────────

    IERC20  public immutable asset;          // USDC
    address public           crossYieldOApp; // The LayerZero OApp (only caller for cross-chain rebalance)

    uint256 public totalShares;
    uint256 public totalAssets;
    uint256 public activeProtocolId;

    Protocol[]         public protocols;
    RebalanceRecord[]  public rebalanceHistory;

    mapping(address => UserPosition) public positions;

    // ─── Events ─────────────────────────────────────────────────────────────

    event Deposited(address indexed user, uint256 assets, uint256 shares);
    event Withdrawn(address indexed user, uint256 assets, uint256 shares);
    event Rebalanced(
        uint256 indexed fromProtocol,
        uint256 indexed toProtocol,
        uint256 amount,
        string  aiReason
    );
    event ProtocolAdded(uint256 indexed id, string name, address adapter);
    event ProtocolActivated(uint256 indexed id);
    event CrossYieldOAppSet(address indexed oapp);

    // ─── Errors ─────────────────────────────────────────────────────────────

    error ZeroAmount();
    error ZeroShares();
    error InsufficientShares();
    error UnauthorizedRebalancer();
    error InvalidProtocol();
    error NoProtocolsConfigured();
    error SameProtocol();

    // ─── Constructor ────────────────────────────────────────────────────────

    constructor(address _asset, address _owner) Ownable(_owner) {
        asset = IERC20(_asset);
    }

    // ─── Modifiers ──────────────────────────────────────────────────────────

    modifier onlyCrossYieldOApp() {
        if (msg.sender != crossYieldOApp && msg.sender != owner()) {
            revert UnauthorizedRebalancer();
        }
        _;
    }

    // ─── Admin ──────────────────────────────────────────────────────────────

    function setCrossYieldOApp(address _oapp) external onlyOwner {
        crossYieldOApp = _oapp;
        emit CrossYieldOAppSet(_oapp);
    }

    function addProtocol(string calldata name, address adapter) external onlyOwner {
        protocols.push(Protocol({
            adapter: adapter,
            name: name,
            active: false,
            totalDeposited: 0
        }));
        emit ProtocolAdded(protocols.length - 1, name, adapter);
    }

    function setActiveProtocol(uint256 protocolId) external onlyOwner {
        if (protocolId >= protocols.length) revert InvalidProtocol();
        activeProtocolId = protocolId;
        protocols[protocolId].active = true;
        emit ProtocolActivated(protocolId);
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─── User-facing ────────────────────────────────────────────────────────

    /// @notice Deposit USDC into the vault, receive shares
    function deposit(uint256 assets) external nonReentrant whenNotPaused returns (uint256 shares) {
        if (assets == 0) revert ZeroAmount();

        shares = _convertToShares(assets);
        if (shares == 0) revert ZeroShares();

        asset.safeTransferFrom(msg.sender, address(this), assets);

        totalShares += shares;
        totalAssets += assets;

        UserPosition storage pos = positions[msg.sender];
        pos.shares          += shares;
        pos.depositedAt      = block.timestamp;
        pos.totalDeposited  += assets;

        // Forward to active protocol if configured
        if (protocols.length > 0 && protocols[activeProtocolId].adapter != address(0)) {
            _depositToProtocol(activeProtocolId, assets);
        }

        emit Deposited(msg.sender, assets, shares);
    }

    /// @notice Withdraw USDC by burning shares
    function withdraw(uint256 shares) external nonReentrant whenNotPaused returns (uint256 assets) {
        UserPosition storage pos = positions[msg.sender];
        if (shares == 0) revert ZeroShares();
        if (pos.shares < shares) revert InsufficientShares();

        assets = _convertToAssets(shares);
        if (assets == 0) revert ZeroAmount();

        pos.shares  -= shares;
        totalShares -= shares;
        totalAssets -= assets;

        // Withdraw from active protocol if needed
        if (protocols.length > 0 && protocols[activeProtocolId].adapter != address(0)) {
            _withdrawFromProtocol(activeProtocolId, assets);
        }

        asset.safeTransfer(msg.sender, assets);
        emit Withdrawn(msg.sender, assets, shares);
    }

    // ─── Cross-chain rebalance (called by CrossYieldOApp) ───────────────────

    /// @notice Rebalance vault: move funds from current protocol to a better one
    /// @param toProtocolId Target protocol index
    /// @param aiReason Claude's explanation for this rebalance
    function rebalance(
        uint256 toProtocolId,
        string calldata aiReason
    ) external onlyCrossYieldOApp nonReentrant {
        if (toProtocolId >= protocols.length) revert InvalidProtocol();
        if (toProtocolId == activeProtocolId) revert SameProtocol();

        uint256 currentBalance = _getProtocolBalance(activeProtocolId);
        uint256 fromId = activeProtocolId;

        // Withdraw all from current protocol
        if (currentBalance > 0 && protocols[fromId].adapter != address(0)) {
            _withdrawFromProtocol(fromId, currentBalance);
        }

        // Deposit all into new protocol
        uint256 vaultBalance = asset.balanceOf(address(this));
        if (vaultBalance > 0 && protocols[toProtocolId].adapter != address(0)) {
            _depositToProtocol(toProtocolId, vaultBalance);
        }

        // Record history
        rebalanceHistory.push(RebalanceRecord({
            timestamp:     block.timestamp,
            fromProtocolId: fromId,
            toProtocolId:  toProtocolId,
            amount:        currentBalance,
            aiReason:      aiReason
        }));

        activeProtocolId = toProtocolId;

        emit Rebalanced(fromId, toProtocolId, currentBalance, aiReason);
    }

    /// @notice Receive bridged funds from another chain and deposit them
    function receiveFromChain(address user, uint256 amount) external onlyCrossYieldOApp {
        // Funds already transferred to this contract via bridge
        totalAssets += amount;

        uint256 shares = _convertToShares(amount);
        totalShares += shares;

        UserPosition storage pos = positions[user];
        pos.shares         += shares;
        pos.totalDeposited += amount;

        if (protocols.length > 0 && protocols[activeProtocolId].adapter != address(0)) {
            _depositToProtocol(activeProtocolId, amount);
        }

        emit Deposited(user, amount, shares);
    }

    // ─── Views ──────────────────────────────────────────────────────────────

    function getUserAssets(address user) external view returns (uint256) {
        return _convertToAssets(positions[user].shares);
    }

    function getProtocolCount() external view returns (uint256) {
        return protocols.length;
    }

    function getRebalanceHistoryLength() external view returns (uint256) {
        return rebalanceHistory.length;
    }

    function getRebalanceRecord(uint256 index) external view returns (RebalanceRecord memory) {
        return rebalanceHistory[index];
    }

    function previewDeposit(uint256 assets) external view returns (uint256) {
        return _convertToShares(assets);
    }

    function previewWithdraw(uint256 shares) external view returns (uint256) {
        return _convertToAssets(shares);
    }

    // ─── Internal ───────────────────────────────────────────────────────────

    function _convertToShares(uint256 assets) internal view returns (uint256) {
        if (totalShares == 0 || totalAssets == 0) {
            return assets; // 1:1 for first deposit
        }
        return (assets * totalShares) / totalAssets;
    }

    function _convertToAssets(uint256 shares) internal view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares * totalAssets) / totalShares;
    }

    function _depositToProtocol(uint256 protocolId, uint256 amount) internal {
        Protocol storage p = protocols[protocolId];
        asset.forceApprove(p.adapter, amount);
        // Low-level call to adapter's deposit function
        (bool ok,) = p.adapter.call(
            abi.encodeWithSignature("deposit(address,uint256,address)", address(asset), amount, address(this))
        );
        if (ok) {
            p.totalDeposited += amount;
        }
    }

    function _withdrawFromProtocol(uint256 protocolId, uint256 amount) internal {
        Protocol storage p = protocols[protocolId];
        (bool ok,) = p.adapter.call(
            abi.encodeWithSignature("withdraw(address,uint256,address)", address(asset), amount, address(this))
        );
        if (ok && p.totalDeposited >= amount) {
            p.totalDeposited -= amount;
        }
    }

    function _getProtocolBalance(uint256 protocolId) internal view returns (uint256) {
        Protocol storage p = protocols[protocolId];
        if (p.adapter == address(0)) return asset.balanceOf(address(this));
        (bool ok, bytes memory data) = p.adapter.staticcall(
            abi.encodeWithSignature("getBalance(address,address)", address(asset), address(this))
        );
        if (ok && data.length >= 32) {
            return abi.decode(data, (uint256));
        }
        return asset.balanceOf(address(this));
    }
}
