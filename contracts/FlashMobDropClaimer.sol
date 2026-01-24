// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title FlashMobDropClaimer
 * @notice Handles token drops that can be claimed by users within geographic zones
 * @dev Uses signed messages to verify claims, enabling gasless claiming via relayer
 */
contract FlashMobDropClaimer is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Token being distributed
    IERC20 public immutable token;
    
    // Trusted signer for claim verification (backend server)
    address public trustedSigner;
    
    // Nonce tracking to prevent replay attacks
    mapping(address => uint256) public nonces;
    
    // Claimed drops (dropId => claimed)
    mapping(bytes32 => bool) public claimedDrops;
    
    // Drop expiry duration (default: 24 hours)
    uint256 public dropExpiryDuration = 24 hours;

    // Events
    event DropClaimed(
        bytes32 indexed dropId,
        address indexed claimer,
        uint256 amount,
        int256 latitude,
        int256 longitude,
        uint256 timestamp
    );
    
    event TrustedSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event DropsDeposited(address indexed depositor, uint256 amount);
    event DropsWithdrawn(address indexed owner, uint256 amount);

    // Errors
    error InvalidSignature();
    error DropAlreadyClaimed();
    error DropExpired();
    error InvalidNonce();
    error InsufficientBalance();

    constructor(
        address _token,
        address _trustedSigner
    ) Ownable(msg.sender) {
        token = IERC20(_token);
        trustedSigner = _trustedSigner;
    }

    /**
     * @notice Claim a drop with a signed message from the backend
     * @param dropId Unique identifier for this drop
     * @param amount Amount of tokens to claim
     * @param latitude GPS latitude (multiplied by 1e6 for precision)
     * @param longitude GPS longitude (multiplied by 1e6 for precision)
     * @param timestamp When the claim was initiated
     * @param nonce User's nonce to prevent replay
     * @param signature Backend signature authorizing this claim
     */
    function claimDrop(
        bytes32 dropId,
        uint256 amount,
        int256 latitude,
        int256 longitude,
        uint256 timestamp,
        uint256 nonce,
        bytes calldata signature
    ) external nonReentrant {
        // Check drop hasn't been claimed
        if (claimedDrops[dropId]) revert DropAlreadyClaimed();
        
        // Check nonce
        if (nonce != nonces[msg.sender]) revert InvalidNonce();
        
        // Check timestamp (not expired)
        if (block.timestamp > timestamp + dropExpiryDuration) revert DropExpired();
        
        // Check contract has sufficient balance
        if (token.balanceOf(address(this)) < amount) revert InsufficientBalance();
        
        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            dropId,
            msg.sender,
            amount,
            latitude,
            longitude,
            timestamp,
            nonce,
            block.chainid
        ));
        
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);
        
        if (signer != trustedSigner) revert InvalidSignature();
        
        // Mark as claimed and increment nonce
        claimedDrops[dropId] = true;
        nonces[msg.sender]++;
        
        // Transfer tokens
        token.safeTransfer(msg.sender, amount);
        
        emit DropClaimed(dropId, msg.sender, amount, latitude, longitude, timestamp);
    }

    /**
     * @notice Check if a drop has been claimed
     */
    function isDropClaimed(bytes32 dropId) external view returns (bool) {
        return claimedDrops[dropId];
    }

    /**
     * @notice Get user's current nonce
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    /**
     * @notice Deposit tokens for distribution (admin or sponsors)
     */
    function depositDrops(uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit DropsDeposited(msg.sender, amount);
    }

    /**
     * @notice Withdraw remaining tokens (owner only)
     */
    function withdrawDrops(uint256 amount) external onlyOwner {
        token.safeTransfer(msg.sender, amount);
        emit DropsWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Update trusted signer (owner only)
     */
    function setTrustedSigner(address _trustedSigner) external onlyOwner {
        address oldSigner = trustedSigner;
        trustedSigner = _trustedSigner;
        emit TrustedSignerUpdated(oldSigner, _trustedSigner);
    }

    /**
     * @notice Update drop expiry duration (owner only)
     */
    function setDropExpiryDuration(uint256 _duration) external onlyOwner {
        dropExpiryDuration = _duration;
    }

    /**
     * @notice Get contract token balance
     */
    function getBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
