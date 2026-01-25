// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title FlashMob
 * @notice Game Registry for Flash.Mob
 * @dev Records game actions and handles basic state
 */
contract FlashMob is Ownable {
    
    // Events for indexing game activity
    event GameStarted(address indexed player, string gameType, uint256 timestamp);
    event GameCompleted(address indexed player, uint256 score, uint256 timestamp);
    event CreditsPurchased(address indexed player, uint256 amount, uint256 cost);

    IERC20 public paymentToken;
    uint256 public gameCost = 5 * 10**18; // Default cost if using tokens (optional)

    constructor(address _paymentToken) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
    }

    /**
     * @notice Record a game start
     * @dev Called by backend signer or user
     */
    function startGame(address player, string calldata gameType) external onlyOwner {
        emit GameStarted(player, gameType, block.timestamp);
    }

    /**
     * @notice Record game completion
     * @dev Called by backend signer
     */
    function completeGame(address player, uint256 score) external onlyOwner {
        emit GameCompleted(player, score, block.timestamp);
    }

    /**
     * @notice Record credit purchase
     * @dev Called by backend signer
     */
    function recordPurchase(address player, uint256 amount, uint256 cost) external onlyOwner {
        emit CreditsPurchased(player, amount, cost);
    }

    function setGameCost(uint256 _cost) external onlyOwner {
        gameCost = _cost;
    }
}
