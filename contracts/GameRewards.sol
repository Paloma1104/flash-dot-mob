// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./APToken.sol";

/**
 * @title GameRewards - Game Play & Rewards Management
 * @notice Manages game sessions, AP consumption, and MON testnet rewards
 * @dev Integrates with APToken for burning AP and distributing MON rewards
 * 
 * Flow:
 * 1. User starts game -> AP tokens burned based on difficulty
 * 2. User completes game -> Backend verifies score
 * 3. Backend signs reward -> User claims MON testnet
 * 
 * Anti-cheat:
 * - Backend signature required for rewards
 * - Game session tracking prevents double claims
 * - Rate limiting per user
 */
contract GameRewards is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/
    
    /// @dev EIP-712 domain separator
    bytes32 private immutable DOMAIN_SEPARATOR;
    
    /// @dev EIP-712 typehash for reward claim
    bytes32 private constant REWARD_TYPEHASH = keccak256(
        "GameReward(bytes32 sessionId,address player,uint256 monReward,uint256 score,uint256 nonce,uint256 deadline)"
    );
    
    /// @dev Maximum claims per hour per user
    uint256 public constant MAX_CLAIMS_PER_HOUR = 20;

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/
    
    /// @dev APToken contract
    APToken public immutable apToken;
    
    /// @dev MON testnet token
    address public immutable monToken;
    
    /// @dev Trusted backend signer
    address public trustedSigner;
    
    /// @dev Treasury for AP purchases
    address public treasury;
    
    /// @dev Contract paused state
    bool public paused;
    
    /// @dev User nonces for replay protection
    mapping(address => uint256) public nonces;
    
    /// @dev Game session tracking
    mapping(bytes32 => bool) public completedSessions;
    
    /// @dev Rate limiting: user => hourly claim count
    mapping(address => mapping(uint256 => uint256)) public hourlyClaims;
    
    /// @dev Game stats per user
    mapping(address => GameStats) public userStats;
    
    struct GameStats {
        uint256 gamesPlayed;
        uint256 gamesWon;
        uint256 totalAPSpent;
        uint256 totalMONEarned;
    }

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event GameStarted(
        bytes32 indexed sessionId,
        address indexed player,
        string gameType,
        string difficulty,
        uint256 apCost
    );
    
    event GameCompleted(
        bytes32 indexed sessionId,
        address indexed player,
        uint256 score,
        uint256 monReward
    );
    
    event RewardClaimed(
        bytes32 indexed sessionId,
        address indexed player,
        uint256 monAmount
    );
    
    event ConfigUpdated(address signer, address treasury);
    event ContractPaused(bool paused);

    /*//////////////////////////////////////////////////////////////
                               ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error Paused();
    error Unauthorized();
    error InvalidSignature();
    error SessionAlreadyCompleted();
    error Expired();
    error RateLimitExceeded();
    error InsufficientBalance();
    error ZeroAddress();

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    constructor(
        address _apToken,
        address _monToken,
        address _trustedSigner,
        address _treasury
    ) Ownable(msg.sender) {
        if (_apToken == address(0) || _monToken == address(0) || 
            _trustedSigner == address(0) || _treasury == address(0)) {
            revert ZeroAddress();
        }
        
        apToken = APToken(_apToken);
        monToken = _monToken;
        trustedSigner = _trustedSigner;
        treasury = _treasury;
        
        // Build EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("GameRewards"),
            keccak256("1"),
            block.chainid,
            address(this)
        ));
    }

    /*//////////////////////////////////////////////////////////////
                           GAME FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Start a game session (burns AP)
     * @param sessionId Unique session identifier
     * @param gameType Type of game (SUDOKU, MEMORY_MATCH, etc.)
     * @param difficulty Game difficulty (easy/medium/hard)
     */
    function startGame(
        bytes32 sessionId,
        string calldata gameType,
        string calldata difficulty
    ) external {
        if (paused) revert Paused();
        
        // Determine AP cost based on difficulty
        uint256 apCost;
        if (keccak256(bytes(difficulty)) == keccak256("easy")) {
            apCost = apToken.easyGameCost();
        } else if (keccak256(bytes(difficulty)) == keccak256("medium")) {
            apCost = apToken.mediumGameCost();
        } else {
            apCost = apToken.hardGameCost();
        }
        
        // Burn AP from user
        apToken.burnFrom(msg.sender, apCost);
        
        // Update stats
        userStats[msg.sender].gamesPlayed++;
        userStats[msg.sender].totalAPSpent += apCost;
        
        emit GameStarted(sessionId, msg.sender, gameType, difficulty, apCost);
    }
    
    /**
     * @notice Claim MON reward after completing game
     * @dev Requires backend signature verifying score
     * @param sessionId Game session ID
     * @param monReward MON tokens to receive
     * @param score Game score (verified by backend)
     * @param deadline Signature expiry
     * @param signature Backend signature
     */
    function claimReward(
        bytes32 sessionId,
        uint256 monReward,
        uint256 score,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (paused) revert Paused();
        if (block.timestamp > deadline) revert Expired();
        if (completedSessions[sessionId]) revert SessionAlreadyCompleted();
        
        // Rate limiting check
        uint256 currentHour = block.timestamp / 1 hours;
        if (hourlyClaims[msg.sender][currentHour] >= MAX_CLAIMS_PER_HOUR) {
            revert RateLimitExceeded();
        }
        
        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            REWARD_TYPEHASH,
            sessionId,
            msg.sender,
            monReward,
            score,
            nonces[msg.sender],
            deadline
        ));
        
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            structHash
        ));
        
        address signer = digest.recover(signature);
        if (signer != trustedSigner) revert InvalidSignature();
        
        // Mark session as completed
        completedSessions[sessionId] = true;
        nonces[msg.sender]++;
        hourlyClaims[msg.sender][currentHour]++;
        
        // Update stats
        if (score > 0) {
            userStats[msg.sender].gamesWon++;
        }
        userStats[msg.sender].totalMONEarned += monReward;
        
        // Transfer MON reward
        if (monReward > 0) {
            (bool success, bytes memory data) = monToken.call(
                abi.encodeWithSignature(
                    "transfer(address,uint256)",
                    msg.sender,
                    monReward
                )
            );
            
            if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
                revert InsufficientBalance();
            }
        }
        
        emit GameCompleted(sessionId, msg.sender, score, monReward);
        emit RewardClaimed(sessionId, msg.sender, monReward);
    }

    /*//////////////////////////////////////////////////////////////
                           VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Get user's game statistics
     */
    function getUserStats(address user) external view returns (
        uint256 gamesPlayed,
        uint256 gamesWon,
        uint256 totalAPSpent,
        uint256 totalMONEarned
    ) {
        GameStats memory stats = userStats[user];
        return (
            stats.gamesPlayed,
            stats.gamesWon,
            stats.totalAPSpent,
            stats.totalMONEarned
        );
    }
    
    /**
     * @notice Check if user can play (rate limit)
     */
    function canPlay(address user) external view returns (bool) {
        uint256 currentHour = block.timestamp / 1 hours;
        return hourlyClaims[user][currentHour] < MAX_CLAIMS_PER_HOUR;
    }
    
    /**
     * @notice Get remaining plays for current hour
     */
    function getRemainingPlays(address user) external view returns (uint256) {
        uint256 currentHour = block.timestamp / 1 hours;
        uint256 used = hourlyClaims[user][currentHour];
        if (used >= MAX_CLAIMS_PER_HOUR) return 0;
        return MAX_CLAIMS_PER_HOUR - used;
    }

    /*//////////////////////////////////////////////////////////////
                           ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Update trusted signer (only owner)
     */
    function setTrustedSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert ZeroAddress();
        trustedSigner = _signer;
        emit ConfigUpdated(_signer, treasury);
    }
    
    /**
     * @notice Update treasury (only owner)
     */
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit ConfigUpdated(trustedSigner, _treasury);
    }
    
    /**
     * @notice Get the EIP-712 domain separator
     */
    function getDomainSeparator() external view returns (bytes32) {
        return DOMAIN_SEPARATOR;
    }
    
    /**
     * @notice Debug function to verify signature components (testing only)
     */
    function debugVerifySignature(
        bytes32 sessionId,
        address player,
        uint256 monReward,
        uint256 score,
        uint256 deadline,
        bytes memory signature
    ) external view returns (
        bytes32 computedStructHash,
        bytes32 computedDigest,
        address recoveredSigner
    ) {
        bytes32 structHash = keccak256(abi.encode(
            REWARD_TYPEHASH,
            sessionId,
            player,
            monReward,
            score,
            nonces[player],
            deadline
        ));
        
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            structHash
        ));
        
        address signer = digest.recover(signature);
        
        return (structHash, digest, signer);
    }
    
    /**
     * @notice Pause/unpause contract (only owner)
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit ContractPaused(_paused);
    }
    
    /**
     * @notice Emergency withdraw MON (only owner)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        (bool success, bytes memory data) = monToken.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                owner(),
                amount
            )
        );
        
        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
            revert InsufficientBalance();
        }
    }
}
