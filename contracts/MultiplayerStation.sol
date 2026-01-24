// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MultiplayerStation - LNMIIT Campus Gaming Arena
 * @notice Enables multiplayer gaming sessions where players stake AP tokens
 * @dev Players join stations, stake AP, compete in random games, winner takes pool
 * 
 * Key Features:
 * - Fixed and dynamic station creation
 * - 2-4 player support per station
 * - Random game selection from available game types
 * - Winner takes all prize pool
 * - Automatic refunds if game cancelled
 */
contract MultiplayerStation is Ownable, ReentrancyGuard {
    
    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/
    
    uint256 public constant MIN_PLAYERS = 2;
    uint256 public constant MAX_PLAYERS = 4;
    uint256 public constant DEFAULT_STAKE = 50 * 10**18; // 50 AP
    uint256 public constant GAME_TIMEOUT = 30 minutes;
    uint256 public constant LOBBY_TIMEOUT = 15 minutes;
    
    // Game types that can be selected for multiplayer
    uint8 public constant GAME_TIC_TAC_TOE = 0;
    uint8 public constant GAME_MEMORY_MATCH = 1;
    uint8 public constant GAME_MATH_CHALLENGE = 2;
    uint8 public constant GAME_COLOR_SEQUENCE = 3;
    uint8 public constant GAME_WORD_SCRAMBLE = 4;
    uint8 public constant GAME_PATTERN_LOCK = 5;
    uint8 public constant NUM_GAME_TYPES = 6;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/
    
    enum StationStatus {
        Inactive,       // Station not active
        WaitingPlayers, // Waiting for players to join
        GameStarting,   // Countdown before game
        InProgress,     // Game is being played
        Completed       // Game finished, rewards distributed
    }
    
    struct Station {
        string name;
        int256 latitude;      // Latitude * 10^6 for precision
        int256 longitude;     // Longitude * 10^6 for precision
        uint256 stakeAmount;  // AP tokens required to join
        uint256 minPlayers;
        uint256 maxPlayers;
        uint256 createdAt;
        address creator;
        bool isActive;
    }
    
    struct GameSession {
        bytes32 stationId;
        address[] players;
        mapping(address => uint256) stakes;
        mapping(address => uint256) scores;
        mapping(address => bool) hasSubmitted;
        uint8 selectedGame;
        uint256 totalPool;
        uint256 startedAt;
        uint256 completedAt;
        address winner;
        StationStatus status;
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/
    
    /// @dev AP Token contract for staking
    address public apToken;
    
    /// @dev Backend signer for result verification
    address public trustedSigner;
    
    /// @dev Station definitions
    mapping(bytes32 => Station) public stations;
    bytes32[] public stationIds;
    
    /// @dev Active game sessions per station
    mapping(bytes32 => GameSession) internal gameSessions;
    
    /// @dev Track which station a player is currently in
    mapping(address => bytes32) public playerCurrentStation;
    
    /// @dev Nonce for randomness
    uint256 private nonce;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event StationCreated(bytes32 indexed stationId, string name, int256 latitude, int256 longitude, uint256 stakeAmount);
    event PlayerJoined(bytes32 indexed stationId, address indexed player, uint256 stakedAmount);
    event PlayerLeft(bytes32 indexed stationId, address indexed player, uint256 refundAmount);
    event GameStarted(bytes32 indexed stationId, uint8 selectedGame, address[] players);
    event ScoreSubmitted(bytes32 indexed stationId, address indexed player, uint256 score);
    event GameCompleted(bytes32 indexed stationId, address indexed winner, uint256 prizeAmount);
    event GameCancelled(bytes32 indexed stationId, string reason);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error StationNotActive();
    error StationFull();
    error AlreadyInStation();
    error NotInStation();
    error GameAlreadyStarted();
    error GameNotStarted();
    error InsufficientStake();
    error InvalidSignature();
    error NotEnoughPlayers();
    error AlreadySubmitted();
    error TransferFailed();
    error StationDoesNotExist();
    error Unauthorized();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    constructor(
        address _apToken,
        address _trustedSigner
    ) Ownable(msg.sender) {
        apToken = _apToken;
        trustedSigner = _trustedSigner;
        
        // Create the LNMIIT main station
        _createStation(
            "LNMIIT Arena",
            26894700,   // 26.8947 * 10^6
            75813300,   // 75.8133 * 10^6
            DEFAULT_STAKE,
            MIN_PLAYERS,
            MAX_PLAYERS
        );
    }

    /*//////////////////////////////////////////////////////////////
                          STATION MANAGEMENT
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Create a new multiplayer station (owner only)
     */
    function createStation(
        string calldata name,
        int256 latitude,
        int256 longitude,
        uint256 stakeAmount,
        uint256 minPlayers,
        uint256 maxPlayers
    ) external onlyOwner returns (bytes32) {
        return _createStation(name, latitude, longitude, stakeAmount, minPlayers, maxPlayers);
    }
    
    function _createStation(
        string memory name,
        int256 latitude,
        int256 longitude,
        uint256 stakeAmount,
        uint256 minPlayers,
        uint256 maxPlayers
    ) internal returns (bytes32 stationId) {
        require(minPlayers >= MIN_PLAYERS && minPlayers <= MAX_PLAYERS, "Invalid min players");
        require(maxPlayers >= minPlayers && maxPlayers <= MAX_PLAYERS, "Invalid max players");
        require(stakeAmount > 0, "Stake must be positive");
        
        stationId = keccak256(abi.encodePacked(name, latitude, longitude, block.timestamp));
        
        stations[stationId] = Station({
            name: name,
            latitude: latitude,
            longitude: longitude,
            stakeAmount: stakeAmount,
            minPlayers: minPlayers,
            maxPlayers: maxPlayers,
            createdAt: block.timestamp,
            creator: msg.sender,
            isActive: true
        });
        
        stationIds.push(stationId);
        
        // Initialize game session
        gameSessions[stationId].stationId = stationId;
        gameSessions[stationId].status = StationStatus.WaitingPlayers;
        
        emit StationCreated(stationId, name, latitude, longitude, stakeAmount);
    }

    /*//////////////////////////////////////////////////////////////
                            PLAYER ACTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Join a multiplayer station by staking AP tokens
     * @param stationId The station to join
     */
    function joinStation(bytes32 stationId) external nonReentrant {
        Station storage station = stations[stationId];
        GameSession storage session = gameSessions[stationId];
        
        if (!station.isActive) revert StationNotActive();
        if (session.status != StationStatus.WaitingPlayers) revert GameAlreadyStarted();
        if (session.players.length >= station.maxPlayers) revert StationFull();
        if (playerCurrentStation[msg.sender] != bytes32(0)) revert AlreadyInStation();
        
        // Transfer AP tokens from player to this contract
        (bool success,) = apToken.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender,
                address(this),
                station.stakeAmount
            )
        );
        if (!success) revert TransferFailed();
        
        // Add player to session
        session.players.push(msg.sender);
        session.stakes[msg.sender] = station.stakeAmount;
        session.totalPool += station.stakeAmount;
        playerCurrentStation[msg.sender] = stationId;
        
        emit PlayerJoined(stationId, msg.sender, station.stakeAmount);
        
        // Auto-start if minimum players reached
        if (session.players.length >= station.minPlayers) {
            _startGame(stationId);
        }
    }
    
    /**
     * @notice Leave a station before the game starts (get refund)
     * @param stationId The station to leave
     */
    function leaveStation(bytes32 stationId) external nonReentrant {
        GameSession storage session = gameSessions[stationId];
        
        if (playerCurrentStation[msg.sender] != stationId) revert NotInStation();
        if (session.status != StationStatus.WaitingPlayers) revert GameAlreadyStarted();
        
        uint256 refundAmount = session.stakes[msg.sender];
        
        // Remove player from session
        _removePlayer(stationId, msg.sender);
        session.stakes[msg.sender] = 0;
        session.totalPool -= refundAmount;
        playerCurrentStation[msg.sender] = bytes32(0);
        
        // Refund AP tokens
        (bool success,) = apToken.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                msg.sender,
                refundAmount
            )
        );
        if (!success) revert TransferFailed();
        
        emit PlayerLeft(stationId, msg.sender, refundAmount);
    }

    /*//////////////////////////////////////////////////////////////
                            GAME LOGIC
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Start the game (internal, called when min players reached)
     */
    function _startGame(bytes32 stationId) internal {
        GameSession storage session = gameSessions[stationId];
        Station storage station = stations[stationId];
        
        require(session.players.length >= station.minPlayers, "Not enough players");
        
        // Select random game
        session.selectedGame = _selectRandomGame();
        session.status = StationStatus.InProgress;
        session.startedAt = block.timestamp;
        
        emit GameStarted(stationId, session.selectedGame, session.players);
    }
    
    /**
     * @notice Submit game score (called by backend with signature)
     * @param stationId The station
     * @param player The player submitting score
     * @param score The player's score
     * @param signature Backend signature verifying the score
     */
    function submitScore(
        bytes32 stationId,
        address player,
        uint256 score,
        bytes calldata signature
    ) external nonReentrant {
        GameSession storage session = gameSessions[stationId];
        
        if (session.status != StationStatus.InProgress) revert GameNotStarted();
        if (playerCurrentStation[player] != stationId) revert NotInStation();
        if (session.hasSubmitted[player]) revert AlreadySubmitted();
        
        // Verify signature from trusted backend
        bytes32 messageHash = keccak256(abi.encodePacked(stationId, player, score, block.chainid));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        address signer = _recoverSigner(ethSignedHash, signature);
        if (signer != trustedSigner) revert InvalidSignature();
        
        session.scores[player] = score;
        session.hasSubmitted[player] = true;
        
        emit ScoreSubmitted(stationId, player, score);
        
        // Check if all players have submitted
        bool allSubmitted = true;
        for (uint256 i = 0; i < session.players.length; i++) {
            if (!session.hasSubmitted[session.players[i]]) {
                allSubmitted = false;
                break;
            }
        }
        
        if (allSubmitted) {
            _completeGame(stationId);
        }
    }
    
    /**
     * @notice Complete the game and distribute rewards
     */
    function _completeGame(bytes32 stationId) internal {
        GameSession storage session = gameSessions[stationId];
        
        // Determine winner (highest score)
        address winner = session.players[0];
        uint256 highestScore = session.scores[winner];
        
        for (uint256 i = 1; i < session.players.length; i++) {
            if (session.scores[session.players[i]] > highestScore) {
                highestScore = session.scores[session.players[i]];
                winner = session.players[i];
            }
        }
        
        session.winner = winner;
        session.status = StationStatus.Completed;
        session.completedAt = block.timestamp;
        
        // Transfer entire pool to winner
        uint256 prizeAmount = session.totalPool;
        (bool success,) = apToken.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                winner,
                prizeAmount
            )
        );
        if (!success) revert TransferFailed();
        
        // Reset player states
        for (uint256 i = 0; i < session.players.length; i++) {
            playerCurrentStation[session.players[i]] = bytes32(0);
        }
        
        emit GameCompleted(stationId, winner, prizeAmount);
        
        // Reset session for next game
        _resetSession(stationId);
    }
    
    /**
     * @notice Force complete a game after timeout (backend can call)
     */
    function forceCompleteGame(bytes32 stationId) external {
        if (msg.sender != trustedSigner && msg.sender != owner()) revert Unauthorized();
        
        GameSession storage session = gameSessions[stationId];
        require(session.status == StationStatus.InProgress, "Game not in progress");
        require(block.timestamp >= session.startedAt + GAME_TIMEOUT, "Timeout not reached");
        
        _completeGame(stationId);
    }
    
    /**
     * @notice Cancel a game and refund all players
     */
    function cancelGame(bytes32 stationId, string calldata reason) external {
        if (msg.sender != trustedSigner && msg.sender != owner()) revert Unauthorized();
        
        GameSession storage session = gameSessions[stationId];
        
        // Refund all players
        for (uint256 i = 0; i < session.players.length; i++) {
            address player = session.players[i];
            uint256 refund = session.stakes[player];
            
            if (refund > 0) {
                (bool success,) = apToken.call(
                    abi.encodeWithSignature(
                        "transfer(address,uint256)",
                        player,
                        refund
                    )
                );
                // Continue even if transfer fails (emergency)
                
                playerCurrentStation[player] = bytes32(0);
            }
        }
        
        emit GameCancelled(stationId, reason);
        _resetSession(stationId);
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    function _selectRandomGame() internal returns (uint8) {
        nonce++;
        return uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, nonce))) % NUM_GAME_TYPES);
    }
    
    function _removePlayer(bytes32 stationId, address player) internal {
        GameSession storage session = gameSessions[stationId];
        
        for (uint256 i = 0; i < session.players.length; i++) {
            if (session.players[i] == player) {
                session.players[i] = session.players[session.players.length - 1];
                session.players.pop();
                break;
            }
        }
    }
    
    function _resetSession(bytes32 stationId) internal {
        GameSession storage session = gameSessions[stationId];
        
        // Clear mappings for all players
        for (uint256 i = 0; i < session.players.length; i++) {
            address player = session.players[i];
            session.stakes[player] = 0;
            session.scores[player] = 0;
            session.hasSubmitted[player] = false;
        }
        
        // Reset session state
        delete session.players;
        session.totalPool = 0;
        session.startedAt = 0;
        session.completedAt = 0;
        session.winner = address(0);
        session.status = StationStatus.WaitingPlayers;
    }
    
    function _recoverSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        if (v < 27) v += 27;
        
        return ecrecover(hash, v, r, s);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    function getStation(bytes32 stationId) external view returns (Station memory) {
        return stations[stationId];
    }
    
    function getSessionInfo(bytes32 stationId) external view returns (
        address[] memory players,
        uint8 selectedGame,
        uint256 totalPool,
        uint256 startedAt,
        StationStatus status
    ) {
        GameSession storage session = gameSessions[stationId];
        return (
            session.players,
            session.selectedGame,
            session.totalPool,
            session.startedAt,
            session.status
        );
    }
    
    function getPlayerScore(bytes32 stationId, address player) external view returns (uint256) {
        return gameSessions[stationId].scores[player];
    }
    
    function getAllStations() external view returns (bytes32[] memory) {
        return stationIds;
    }
    
    function getStationCount() external view returns (uint256) {
        return stationIds.length;
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    function setTrustedSigner(address _signer) external onlyOwner {
        trustedSigner = _signer;
    }
    
    function setAPToken(address _apToken) external onlyOwner {
        apToken = _apToken;
    }
    
    function toggleStation(bytes32 stationId, bool isActive) external onlyOwner {
        stations[stationId].isActive = isActive;
    }
}
