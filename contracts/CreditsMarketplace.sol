// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CreditsMarketplace
 * @notice Buy and sell game credits using MON testnet tokens
 * @dev Simple marketplace for credit trading with configurable rates
 * 
 * Features:
 * - Buy credits with MON tokens
 * - Sell credits back for MON tokens
 * - Configurable exchange rates
 * - Treasury management
 * - Emergency pause functionality
 */
contract CreditsMarketplace is Ownable, ReentrancyGuard {
    
    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/
    
    /// @notice MON token contract
    IERC20 public immutable monToken;
    
    /// @notice Treasury address for collected MON
    address public treasury;
    
    /// @notice Exchange rate: MON per credit (in wei)
    /// @dev Default: 0.1 MON per credit (100000000000000000 wei)
    uint256 public monPerCredit;
    
    /// @notice Sell-back rate: MON per credit when selling (in wei)
    /// @dev Default: 0.08 MON per credit (80% of buy price)
    uint256 public sellBackRate;
    
    /// @notice Contract paused state
    bool public paused;
    
    /// @notice User credit balances (off-chain tracking)
    mapping(address => uint256) public creditBalances;
    
    /// @notice Total credits in circulation
    uint256 public totalCredits;
    
    /// @notice Minimum purchase amount (credits)
    uint256 public minPurchase = 10;
    
    /// @notice Maximum purchase amount (credits)
    uint256 public maxPurchase = 1000;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event CreditsPurchased(
        address indexed buyer,
        uint256 creditsAmount,
        uint256 monPaid
    );
    
    event CreditsSold(
        address indexed seller,
        uint256 creditsAmount,
        uint256 monReceived
    );
    
    event RatesUpdated(
        uint256 newMonPerCredit,
        uint256 newSellBackRate
    );
    
    event TreasuryUpdated(address newTreasury);
    event PausedStateChanged(bool isPaused);
    event LimitsUpdated(uint256 minPurchase, uint256 maxPurchase);

    /*//////////////////////////////////////////////////////////////
                               ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error ContractPaused();
    error ZeroAmount();
    error InsufficientCredits();
    error InsufficientMON();
    error BelowMinimum();
    error AboveMaximum();
    error TransferFailed();
    error ZeroAddress();

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    constructor(
        address _monToken,
        address _treasury,
        uint256 _monPerCredit,
        uint256 _sellBackRate
    ) Ownable(msg.sender) {
        if (_monToken == address(0) || _treasury == address(0)) {
            revert ZeroAddress();
        }
        
        monToken = IERC20(_monToken);
        treasury = _treasury;
        monPerCredit = _monPerCredit;
        sellBackRate = _sellBackRate;
    }

    /*//////////////////////////////////////////////////////////////
                           MAIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Buy credits with MON tokens
     * @param creditsAmount Number of credits to purchase
     */
    function buyCredits(uint256 creditsAmount) external nonReentrant {
        if (paused) revert ContractPaused();
        if (creditsAmount == 0) revert ZeroAmount();
        if (creditsAmount < minPurchase) revert BelowMinimum();
        if (creditsAmount > maxPurchase) revert AboveMaximum();
        
        // Calculate MON cost
        uint256 monCost = (creditsAmount * monPerCredit) / 1e18;
        
        // Check user has enough MON
        if (monToken.balanceOf(msg.sender) < monCost) {
            revert InsufficientMON();
        }
        
        // Transfer MON from user to treasury
        bool success = monToken.transferFrom(msg.sender, treasury, monCost);
        if (!success) revert TransferFailed();
        
        // Add credits to user balance
        creditBalances[msg.sender] += creditsAmount;
        totalCredits += creditsAmount;
        
        emit CreditsPurchased(msg.sender, creditsAmount, monCost);
    }
    
    /**
     * @notice Sell credits back for MON tokens
     * @param creditsAmount Number of credits to sell
     */
    function sellCredits(uint256 creditsAmount) external nonReentrant {
        if (paused) revert ContractPaused();
        if (creditsAmount == 0) revert ZeroAmount();
        
        // Check user has enough credits
        if (creditBalances[msg.sender] < creditsAmount) {
            revert InsufficientCredits();
        }
        
        // Calculate MON to return (at sell-back rate)
        uint256 monReturn = (creditsAmount * sellBackRate) / 1e18;
        
        // Check contract has enough MON
        if (monToken.balanceOf(address(this)) < monReturn) {
            revert InsufficientMON();
        }
        
        // Deduct credits from user
        creditBalances[msg.sender] -= creditsAmount;
        totalCredits -= creditsAmount;
        
        // Transfer MON to user
        bool success = monToken.transfer(msg.sender, monReturn);
        if (!success) revert TransferFailed();
        
        emit CreditsSold(msg.sender, creditsAmount, monReturn);
    }
    
    /**
     * @notice Spend credits (called by game contracts)
     * @param user User spending credits
     * @param amount Amount of credits to spend
     */
    function spendCredits(address user, uint256 amount) external onlyOwner {
        if (creditBalances[user] < amount) {
            revert InsufficientCredits();
        }
        
        creditBalances[user] -= amount;
        totalCredits -= amount;
    }
    
    /**
     * @notice Award credits (called by game contracts)
     * @param user User receiving credits
     * @param amount Amount of credits to award
     */
    function awardCredits(address user, uint256 amount) external onlyOwner {
        creditBalances[user] += amount;
        totalCredits += amount;
    }

    /*//////////////////////////////////////////////////////////////
                           VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Get credit balance for a user
     */
    function getCredits(address user) external view returns (uint256) {
        return creditBalances[user];
    }
    
    /**
     * @notice Calculate MON cost for buying credits
     */
    function calculateBuyCost(uint256 creditsAmount) external view returns (uint256) {
        return (creditsAmount * monPerCredit) / 1e18;
    }
    
    /**
     * @notice Calculate MON return for selling credits
     */
    function calculateSellReturn(uint256 creditsAmount) external view returns (uint256) {
        return (creditsAmount * sellBackRate) / 1e18;
    }
    
    /**
     * @notice Get contract MON balance
     */
    function getContractBalance() external view returns (uint256) {
        return monToken.balanceOf(address(this));
    }

    /*//////////////////////////////////////////////////////////////
                           ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Update exchange rates
     * @param _monPerCredit New buy rate (MON per credit in wei)
     * @param _sellBackRate New sell rate (MON per credit in wei)
     */
    function setRates(
        uint256 _monPerCredit,
        uint256 _sellBackRate
    ) external onlyOwner {
        monPerCredit = _monPerCredit;
        sellBackRate = _sellBackRate;
        emit RatesUpdated(_monPerCredit, _sellBackRate);
    }
    
    /**
     * @notice Update treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
    
    /**
     * @notice Update purchase limits
     */
    function setLimits(uint256 _minPurchase, uint256 _maxPurchase) external onlyOwner {
        minPurchase = _minPurchase;
        maxPurchase = _maxPurchase;
        emit LimitsUpdated(_minPurchase, _maxPurchase);
    }
    
    /**
     * @notice Pause/unpause contract
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedStateChanged(_paused);
    }
    
    /**
     * @notice Deposit MON to contract (for sell-back liquidity)
     */
    function depositMON(uint256 amount) external {
        bool success = monToken.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();
    }
    
    /**
     * @notice Emergency withdraw MON (owner only)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        bool success = monToken.transfer(owner(), amount);
        if (!success) revert TransferFailed();
    }
    
    /**
     * @notice Batch credit operations (for migrations/airdrops)
     */
    function batchSetCredits(
        address[] calldata users,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(users.length == amounts.length, "Length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            uint256 oldBalance = creditBalances[users[i]];
            creditBalances[users[i]] = amounts[i];
            
            // Adjust total
            if (amounts[i] > oldBalance) {
                totalCredits += (amounts[i] - oldBalance);
            } else {
                totalCredits -= (oldBalance - amounts[i]);
            }
        }
    }
}
