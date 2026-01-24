// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../FlashMobV2.sol";
import "../MockMON.sol";
import "../APToken.sol";
import "../GameRewards.sol";

/**
 * @title Deploy to Anvil
 * @notice Simple deployment script for Anvil local testing
 */
contract DeployAnvil is Script {
    function run() external {
        // Use first Anvil account if not passed via --private-key
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("================================");
        console.log("Deploying Flash.Mob to Anvil");
        console.log("================================");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy MockMON
        console.log("1. Deploying MockMON...");
        MockMON token = new MockMON();
        console.log("   MockMON:      ", address(token));
        
        // Mint 1,000,000 MON to deployer for testing
        token.mint(deployer, 1_000_000 * 10**18);
        console.log("   Minted 1M MON to deployer");
        
        // 2. Deploy FlashMobV2
        console.log("2. Deploying FlashMobV2...");
        FlashMobV2 flashMob = new FlashMobV2(
            address(token),  // MON token
            deployer,        // trusted signer (deployer for testing)
            24               // default expiry hours
        );
        console.log("   FlashMobV2:   ", address(flashMob));
        
        // 3. Deploy APToken
        console.log("3. Deploying APToken...");
        APToken apToken = new APToken(
            address(token),     // MON token for purchases
            deployer            // treasury
        );
        console.log("   APToken:      ", address(apToken));
        
        // 4. Deploy GameRewards
        console.log("4. Deploying GameRewards...");
        GameRewards gameRewards = new GameRewards(
            address(apToken),   // AP token (first parameter!)
            address(token),     // MON rewards token (second parameter!)
            deployer,           // trusted signer (deployer for testing)
            deployer            // treasury
        );
        console.log("   GameRewards:  ", address(gameRewards));
        
        // 5. Setup permissions
        console.log("");
        console.log("5. Setting up permissions...");
        apToken.setGameRewardsContract(address(gameRewards));
        console.log("   [OK] APToken authorized GameRewards");
        
        // 6. Fund contracts
        console.log("");
        console.log("6. Funding contracts...");
        token.transfer(address(flashMob), 100_000 * 10**18);
        console.log("   [OK] Sent 100k MON to FlashMobV2");
        
        token.transfer(address(gameRewards), 50_000 * 10**18);
        console.log("   [OK] Sent 50k MON to GameRewards");
        
        vm.stopBroadcast();
        
        // Summary
        console.log("");
        console.log("================================");
        console.log("DEPLOYMENT COMPLETE!");
        console.log("================================");
        console.log("MockMON:        ", address(token));
        console.log("FlashMobV2:     ", address(flashMob));
        console.log("APToken:        ", address(apToken));
        console.log("GameRewards:    ", address(gameRewards));
        console.log("================================");
        console.log("");
        console.log("Deployer has:");
        console.log("  - 850,000 MON (for testing)");
        console.log("");
        console.log("Ready for testing!");
    }
}
