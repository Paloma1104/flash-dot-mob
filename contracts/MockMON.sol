// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockMON
 * @notice Mock token for testing Flash.Mob on testnet
 */
contract MockMON is ERC20, Ownable {
    constructor() ERC20("Mock Monad", "MON") Ownable(msg.sender) {
        // Mint 1 million tokens to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    /**
     * @notice Mint tokens (for testing only)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function for testnet
     */
    function faucet() external {
        _mint(msg.sender, 100 * 10**18); // 100 tokens per request
    }
}
