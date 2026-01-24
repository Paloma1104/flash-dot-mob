// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FlashMobV2 - Optimized for Monad Parallel EVM
 * @author Flash.Mob Team
 * @notice Highly gas-optimized drop claiming with hybrid on/off-chain verification
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                     HYBRID ARCHITECTURE                             │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  OFF-CHAIN (Backend/Relayer)          ON-CHAIN (This Contract)     │
 * │  ├─ GPS verification                  ├─ Signature verification    │
 * │  ├─ Rate limiting                     ├─ Token transfer            │
 * │  ├─ Drop generation                   ├─ Claim deduplication       │
 * │  ├─ Merkle tree building              ├─ Merkle proof verification │
 * │  └─ Signature generation              └─ Event emission            │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Parallel Execution Strategy:
 * - Uses mapping slots that don't conflict (user address + dropId hash)
 * - No loops or iterations in hot paths
 * - State changes are isolated per-user
 * - Batch claims use separate storage slots per drop
 * 
 * Gas Optimizations:
 * - Custom errors instead of require strings (-10-20% gas)
 * - Packed storage for configuration (1 slot vs 3)
 * - Bitmap for small-ID drops (-80% storage)
 * - Calldata for read-only params
 * - unchecked math where safe
 * - Minimal SLOAD/SSTORE
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract FlashMobV2 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Domain separator for EIP-712 signatures
    bytes32 private immutable DOMAIN_SEPARATOR;
    
    /// @dev EIP-712 typehash for claim
    bytes32 private constant CLAIM_TYPEHASH = keccak256(
        "Claim(bytes32 dropId,address claimer,uint256 amount,uint256 nonce,uint256 deadline)"
    );
    
    /// @dev Token being distributed (immutable for gas savings)
    IERC20 public immutable token;
    
    /// @dev Maximum drops that can be claimed in a single batch
    uint256 private constant MAX_BATCH_SIZE = 10;

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Packed config: owner (160) + signer (160) + paused (8) + expiry (24) = 352 bits (2 slots)
    struct Config {
        address owner;
        address trustedSigner;
        bool paused;
        uint24 defaultExpiryHours;
    }
    Config public config;
    
    /// @dev User nonces for replay protection (maps user => nonce)
    mapping(address => uint256) public nonces;
    
    /// @dev Claimed drops bitmap for small drop IDs (gas efficient for sequential IDs)
    /// dropIdBucket => bitmap (256 drops per bucket)
    mapping(uint256 => uint256) private claimedBitmap;
    
    /// @dev Claimed drops for large/non-sequential drop IDs
    mapping(bytes32 => bool) private claimedHash;
    
    /// @dev Merkle root for batch drops (epoch => root)
    mapping(uint256 => bytes32) public epochMerkleRoots;
    
    /// @dev Current epoch (increments on merkle root update)
    uint256 public currentEpoch;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event DropClaimed(
        bytes32 indexed dropId,
        address indexed claimer,
        uint256 amount,
        uint256 indexed epoch
    );
    
    event BatchClaimed(
        address indexed claimer,
        uint256 totalAmount,
        uint256 dropCount
    );
    
    event EpochUpdated(uint256 indexed epoch, bytes32 merkleRoot);
    event ConfigUpdated(address signer, uint24 expiryHours);
    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                               ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error Unauthorized();
    error InvalidSignature();
    error AlreadyClaimed();
    error Expired();
    error Paused();
    error InvalidProof();
    error BatchTooLarge();
    error InsufficientBalance();
    error ZeroAddress();
    error ZeroAmount();

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    constructor(
        address _token,
        address _trustedSigner,
        uint24 _defaultExpiryHours
    ) {
        if (_token == address(0) || _trustedSigner == address(0)) revert ZeroAddress();
        
        token = IERC20(_token);
        
        config = Config({
            owner: msg.sender,
            trustedSigner: _trustedSigner,
            paused: false,
            defaultExpiryHours: _defaultExpiryHours
        });
        
        // Build EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("FlashMob"),
            keccak256("2"),
            block.chainid,
            address(this)
        ));
    }

    /*//////////////////////////////////////////////////////////////
                           CLAIM FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Claim a single drop with signature verification
     * @dev Optimized for parallel execution - no shared state modified
     * @param dropIdSmall Small drop ID (0-2^32) for bitmap storage
     * @param amount Token amount to claim
     * @param deadline Signature expiry timestamp
     * @param signature Backend signature authorizing claim
     */
    function claimSingle(
        uint32 dropIdSmall,
        uint256 amount,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (config.paused) revert Paused();
        if (block.timestamp > deadline) revert Expired();
        if (amount == 0) revert ZeroAmount();
        
        // Check bitmap - O(1) gas regardless of # of claims
        _checkAndMarkBitmap(dropIdSmall);
        
        // Verify signature (EIP-712)
        bytes32 dropId = bytes32(uint256(dropIdSmall));
        _verifySignature(dropId, msg.sender, amount, deadline, signature);
        
        // Transfer tokens - single SSTORE
        unchecked {
            nonces[msg.sender]++;
        }
        
        token.safeTransfer(msg.sender, amount);
        
        emit DropClaimed(dropId, msg.sender, amount, currentEpoch);
    }
    
    /**
     * @notice Claim a drop with arbitrary bytes32 ID
     * @dev For non-sequential or external drop IDs
     */
    function claimWithHash(
        bytes32 dropId,
        uint256 amount,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (config.paused) revert Paused();
        if (block.timestamp > deadline) revert Expired();
        if (amount == 0) revert ZeroAmount();
        
        // Check hash map
        bytes32 claimKey = keccak256(abi.encodePacked(dropId, msg.sender));
        if (claimedHash[claimKey]) revert AlreadyClaimed();
        claimedHash[claimKey] = true;
        
        // Verify signature
        _verifySignature(dropId, msg.sender, amount, deadline, signature);
        
        unchecked {
            nonces[msg.sender]++;
        }
        
        token.safeTransfer(msg.sender, amount);
        
        emit DropClaimed(dropId, msg.sender, amount, currentEpoch);
    }
    
    /**
     * @notice Batch claim multiple drops with Merkle proof
     * @dev Uses Merkle tree for gas-efficient batch verification
     *      Off-chain: Build merkle tree of [dropId, claimer, amount]
     *      On-chain: Single root verification + N leaf verifications
     * 
     * @param epoch Merkle root epoch
     * @param dropIds Array of drop IDs
     * @param amounts Array of amounts per drop
     * @param proofs Array of Merkle proofs
     */
    function claimBatch(
        uint256 epoch,
        bytes32[] calldata dropIds,
        uint256[] calldata amounts,
        bytes32[][] calldata proofs
    ) external {
        if (config.paused) revert Paused();
        
        uint256 len = dropIds.length;
        if (len > MAX_BATCH_SIZE) revert BatchTooLarge();
        if (len != amounts.length || len != proofs.length) revert InvalidProof();
        
        bytes32 root = epochMerkleRoots[epoch];
        if (root == bytes32(0)) revert InvalidProof();
        
        uint256 totalAmount;
        
        // Process each drop - designed for parallel execution
        for (uint256 i; i < len;) {
            bytes32 dropId = dropIds[i];
            uint256 amount = amounts[i];
            
            // Verify not claimed
            bytes32 claimKey = keccak256(abi.encodePacked(dropId, msg.sender));
            if (claimedHash[claimKey]) revert AlreadyClaimed();
            
            // Verify Merkle proof
            bytes32 leaf = keccak256(abi.encodePacked(dropId, msg.sender, amount));
            if (!MerkleProof.verify(proofs[i], root, leaf)) revert InvalidProof();
            
            // Mark claimed
            claimedHash[claimKey] = true;
            
            unchecked {
                totalAmount += amount;
                ++i;
            }
            
            emit DropClaimed(dropId, msg.sender, amount, epoch);
        }
        
        // Single transfer for all drops (gas efficient)
        if (token.balanceOf(address(this)) < totalAmount) revert InsufficientBalance();
        token.safeTransfer(msg.sender, totalAmount);
        
        emit BatchClaimed(msg.sender, totalAmount, len);
    }
    
    /**
     * @notice Gasless claim via meta-transaction (relayer pays gas)
     * @dev For users without native tokens
     * @param claimer Actual recipient
     * @param dropId Drop to claim
     * @param amount Amount to claim
     * @param deadline Signature expiry
     * @param userNonce User's current nonce
     * @param signature User's signature authorizing claim
     * @param relayerSignature Backend signature authorizing this drop
     */
    function claimGasless(
        address claimer,
        bytes32 dropId,
        uint256 amount,
        uint256 deadline,
        uint256 userNonce,
        bytes calldata signature,
        bytes calldata relayerSignature
    ) external {
        if (config.paused) revert Paused();
        if (block.timestamp > deadline) revert Expired();
        if (nonces[claimer] != userNonce) revert InvalidSignature();
        
        // Check claimed
        bytes32 claimKey = keccak256(abi.encodePacked(dropId, claimer));
        if (claimedHash[claimKey]) revert AlreadyClaimed();
        claimedHash[claimKey] = true;
        
        // Verify user signature (authorizes relayer to claim on their behalf)
        bytes32 userHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(dropId, amount, deadline, userNonce, block.chainid))
        ));
        if (userHash.recover(signature) != claimer) revert InvalidSignature();
        
        // Verify relayer/backend signature (authorizes this drop exists)
        _verifySignature(dropId, claimer, amount, deadline, relayerSignature);
        
        unchecked {
            nonces[claimer]++;
        }
        
        token.safeTransfer(claimer, amount);
        
        emit DropClaimed(dropId, claimer, amount, currentEpoch);
    }

    /*//////////////////////////////////////////////////////////////
                         INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Verify EIP-712 signature from trusted signer
    function _verifySignature(
        bytes32 dropId,
        address claimer,
        uint256 amount,
        uint256 deadline,
        bytes calldata signature
    ) internal view {
        bytes32 structHash = keccak256(abi.encode(
            CLAIM_TYPEHASH,
            dropId,
            claimer,
            amount,
            nonces[claimer],
            deadline
        ));
        
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            structHash
        ));
        
        if (digest.recover(signature) != config.trustedSigner) {
            revert InvalidSignature();
        }
    }
    
    /// @dev Check and mark bitmap for small drop IDs
    function _checkAndMarkBitmap(uint32 dropId) internal {
        uint256 bucket = dropId >> 8; // dropId / 256
        uint256 bit = 1 << (dropId & 0xFF); // dropId % 256
        
        uint256 bitmap = claimedBitmap[bucket];
        if (bitmap & bit != 0) revert AlreadyClaimed();
        
        claimedBitmap[bucket] = bitmap | bit;
    }

    /*//////////////////////////////////////////////////////////////
                           VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Check if small drop ID is claimed
    function isClaimedSmall(uint32 dropId) external view returns (bool) {
        uint256 bucket = dropId >> 8;
        uint256 bit = 1 << (dropId & 0xFF);
        return (claimedBitmap[bucket] & bit) != 0;
    }
    
    /// @dev Check if hash-based drop is claimed by user
    function isClaimedHash(bytes32 dropId, address user) external view returns (bool) {
        return claimedHash[keccak256(abi.encodePacked(dropId, user))];
    }
    
    /// @dev Get contract token balance
    function getBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
    
    /// @dev Get domain separator for EIP-712
    function getDomainSeparator() external view returns (bytes32) {
        return DOMAIN_SEPARATOR;
    }

    /*//////////////////////////////////////////////////////////////
                           ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    modifier onlyOwner() {
        if (msg.sender != config.owner) revert Unauthorized();
        _;
    }
    
    /// @dev Update merkle root for new epoch of drops
    function setMerkleRoot(bytes32 root) external onlyOwner {
        unchecked {
            currentEpoch++;
        }
        epochMerkleRoots[currentEpoch] = root;
        emit EpochUpdated(currentEpoch, root);
    }
    
    /// @dev Update configuration
    function setConfig(address signer, uint24 expiryHours) external onlyOwner {
        if (signer == address(0)) revert ZeroAddress();
        config.trustedSigner = signer;
        config.defaultExpiryHours = expiryHours;
        emit ConfigUpdated(signer, expiryHours);
    }
    
    /// @dev Pause/unpause claiming
    function setPaused(bool _paused) external onlyOwner {
        config.paused = _paused;
    }
    
    /// @dev Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        config.owner = newOwner;
    }
    
    /// @dev Deposit tokens for distribution
    function deposit(uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }
    
    /// @dev Withdraw tokens (owner only)
    function withdraw(uint256 amount) external onlyOwner {
        token.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }
    
    /// @dev Emergency withdraw all (owner only)
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(msg.sender, balance);
        emit Withdrawn(msg.sender, balance);
    }
    
    /*//////////////////////////////////////////////////////////////
                        TESTING HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Simple drop creation for testing (bypasses signature verification)
    /// @notice This is for local testing only - should NOT be deployed to production
    function createDrop(uint256 difficulty, string calldata dropName) external onlyOwner returns (bytes32) {
        // Generate drop ID from name and timestamp
        bytes32 dropId = keccak256(abi.encodePacked(dropName, block.timestamp, msg.sender));
        
        // Calculate amount based on difficulty
        uint256 amount;
        if (difficulty == 0) {
            amount = 10 * 10**18;  // Easy: 10 tokens
        } else if (difficulty == 1) {
            amount = 25 * 10**18;  // Medium: 25 tokens
        } else if (difficulty == 2) {
            amount = 50 * 10**18;  // Hard: 50 tokens
        } else {
            amount = 100 * 10**18; // Expert: 100 tokens
        }
        
        // Emit event (actual claiming still requires signature in production)
        emit DropClaimed(dropId, address(this), amount, currentEpoch);
        
        return dropId;
    }
    
    /// @dev Allow simple claim for testing (bypasses signature verification)
    /// @notice This is for local testing only - should NOT be deployed to production
    function claimDropSimple(bytes32 dropId, uint256 amount) external {
        if (config.paused) revert Paused();
        if (amount == 0) revert ZeroAmount();
        
        // Check if already claimed
        bytes32 claimKey = keccak256(abi.encodePacked(dropId, msg.sender));
        if (claimedHash[claimKey]) revert AlreadyClaimed();
        claimedHash[claimKey] = true;
        
        // Transfer tokens
        token.safeTransfer(msg.sender, amount);
        
        emit DropClaimed(dropId, msg.sender, amount, currentEpoch);
    }
}
