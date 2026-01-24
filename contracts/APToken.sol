// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title APToken - Activity Points Token
 * @notice ERC20 token used for playing games in Flash.Mob
 * @dev Users receive 1000 AP on first claim, can purchase more with MON testnet
 * 
 * Key Features:
 * - Initial airdrop: 1000 AP per user (one-time)
 * - Purchase: 3 MON testnet = 30 AP tokens
 * - Game costs: 10-100 AP depending on difficulty
 * - Burn mechanism: AP is burned when used for games
 */
contract APToken is ERC20, Ownable {
    
    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Initial airdrop amount per user (1000 AP)
    uint256 public constant INITIAL_AIRDROP = 1000 * 10**18;
    
    /// @dev Purchase rate: 3 MON = 30 AP (10 AP per MON)
    uint256 public constant PURCHASE_RATE = 30 * 10**18; // AP per 3 MON
    uint256 public constant PURCHASE_COST = 3 * 10**18; // MON cost (minimum 3 MON)
    
    /// @dev Game costs (can be updated by owner)
    uint256 public easyGameCost = 10 * 10**18;     // 10 AP
    uint256 public mediumGameCost = 25 * 10**18;   // 25 AP
    uint256 public hardGameCost = 50 * 10**18;     // 50 AP

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Address of the MON testnet token
    address public immutable monToken;
    
    /// @dev Address of the GameRewards contract (authorized to burn)
    address public gameRewardsContract;
    
    /// @dev Track users who have claimed initial airdrop
    mapping(address => bool) public hasClaimedInitialAirdrop;
    
    /// @dev Treasury address for collected MON tokens
    address public treasury;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event InitialAirdropClaimed(address indexed user, uint256 amount);
    event APPurchased(address indexed buyer, uint256 monSpent, uint256 apReceived);
    event APBurned(address indexed user, uint256 amount, string reason);
    event GameRewardsContractUpdated(address indexed newContract);
    event TreasuryUpdated(address indexed newTreasury);
    event GameCostsUpdated(uint256 easy, uint256 medium, uint256 hard);

    /*//////////////////////////////////////////////////////////////
                               ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error AlreadyClaimedAirdrop();
    error InsufficientMONBalance();
    error InsufficientAPBalance();
    error UnauthorizedBurner();
    error ZeroAddress();
    error TransferFailed();

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    constructor(
        address _monToken,
        address _treasury
    ) ERC20("Activity Points", "AP") Ownable(msg.sender) {
        if (_monToken == address(0) || _treasury == address(0)) revert ZeroAddress();
        
        monToken = _monToken;
        treasury = _treasury;
    }

    /*//////////////////////////////////////////////////////////////
                           AIRDROP FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Claim initial 1000 AP airdrop (one-time per address)
     * @dev Can only be claimed once per address
     */
    function claimInitialAirdrop() external {
        if (hasClaimedInitialAirdrop[msg.sender]) revert AlreadyClaimedAirdrop();
        
        hasClaimedInitialAirdrop[msg.sender] = true;
        _mint(msg.sender, INITIAL_AIRDROP);
        
        emit InitialAirdropClaimed(msg.sender, INITIAL_AIRDROP);
    }
    
    /**
     * @notice Check if user has claimed their initial airdrop
     */
    function canClaimAirdrop(address user) external view returns (bool) {
        return !hasClaimedInitialAirdrop[user];
    }

    /*//////////////////////////////////////////////////////////////
                          PURCHASE FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Purchase AP tokens with MON testnet
     * @dev Rate: 3 MON = 30 AP (10 AP per MON)
     * @param monAmount Amount of MON to spend (must be multiple of 3 MON)
     */
    function purchaseAP(uint256 monAmount) external {
        // Validate amount is multiple of purchase cost
        if (monAmount < PURCHASE_COST || monAmount % PURCHASE_COST != 0) {
            revert("Amount must be multiple of 3 MON");
        }
        
        // Calculate AP to mint
        uint256 apToMint = (monAmount / PURCHASE_COST) * PURCHASE_RATE;
        
        // Transfer MON from user to treasury
        (bool success, bytes memory data) = monToken.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender,
                treasury,
                monAmount
            )
        );
        
        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
            revert InsufficientMONBalance();
        }
        
        // Mint AP to user
        _mint(msg.sender, apToMint);
        
        emit APPurchased(msg.sender, monAmount, apToMint);
    }
    
    /**
     * @notice Calculate how much AP you get for a given MON amount
     */
    function calculateAPForMON(uint256 monAmount) external pure returns (uint256) {
        if (monAmount < PURCHASE_COST) return 0;
        return (monAmount / PURCHASE_COST) * PURCHASE_RATE;
    }
    
    /**
     * @notice Calculate how much MON needed for desired AP amount
     */
    function calculateMONForAP(uint256 apAmount) external pure returns (uint256) {
        return (apAmount * PURCHASE_COST) / PURCHASE_RATE;
    }

    /*//////////////////////////////////////////////////////////////
                           BURN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Burn AP tokens (called by GameRewards contract)
     * @dev Only callable by authorized GameRewards contract
     * @param user User whose AP to burn
     * @param amount Amount to burn
     */
    function burnFrom(address user, uint256 amount) external {
        if (msg.sender != gameRewardsContract) revert UnauthorizedBurner();
        if (balanceOf(user) < amount) revert InsufficientAPBalance();
        
        _burn(user, amount);
        emit APBurned(user, amount, "game_play");
    }
    
    /**
     * @notice User can burn their own AP
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit APBurned(msg.sender, amount, "self_burn");
    }

    /*//////////////////////////////////////////////////////////////
                           ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Set GameRewards contract address (only owner)
     */
    function setGameRewardsContract(address _gameRewards) external onlyOwner {
        if (_gameRewards == address(0)) revert ZeroAddress();
        gameRewardsContract = _gameRewards;
        emit GameRewardsContractUpdated(_gameRewards);
    }
    
    /**
     * @notice Update treasury address (only owner)
     */
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
    
    /**
     * @notice Update game costs (only owner)
     */
    function setGameCosts(
        uint256 _easy,
        uint256 _medium,
        uint256 _hard
    ) external onlyOwner {
        easyGameCost = _easy;
        mediumGameCost = _medium;
        hardGameCost = _hard;
        emit GameCostsUpdated(_easy, _medium, _hard);
    }
    
    /**
     * @notice Emergency mint (only owner, for airdrops/events)
     */
    function emergencyMint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
