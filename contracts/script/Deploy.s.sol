// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../FlashMobV2.sol";
import "../MockMON.sol";
import "../APToken.sol";
import "../GameRewards.sol";

/**
 * @title Deploy Flash.Mob Contracts
 * @notice Deploys full Flash.Mob ecosystem to Monad testnet
 * 
 * Contracts deployed:
 * 1. MockMON - Testnet MON token
 * 2. FlashMobV2 - Location-based drop claiming
 * 3. APToken - Activity Points for playing games
 * 4. GameRewards - Game session management & rewards
 * 
 * Run with:
 * forge script script/Deploy.s.sol:DeployScript --rpc-url monad_testnet --broadcast -vvvv
 */
contract DeployScript is Script {
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy MockMON token
        MockMON token = new MockMON();
        console.log("MockMON deployed at:", address(token));
        
        // 2. Deploy FlashMobV2 with deployer as trusted signer
        //    In production, use a separate backend signer address
        FlashMobV2 flashMob = new FlashMobV2(
            address(token),
            deployer,  // Trusted signer (replace with backend wallet in prod)
            24         // 24 hour default expiry
        );
        console.log("FlashMobV2 deployed at:", address(flashMob));
        
        // 3. Deploy APToken (Activity Points)
        APToken apToken = new APToken(
            address(token),  // MON token for purchases
            deployer         // Treasury (where purchased MON goes)
        );
        console.log("APToken deployed at:", address(apToken));
        
        // 4. Deploy GameRewards contract
        GameRewards gameRewards = new GameRewards(
            address(apToken),
            address(token),
            deployer,  // Trusted signer for reward verification
            deployer   // Treasury
        );
        console.log("GameRewards deployed at:", address(gameRewards));
        
        // 5. Configure contracts
        // Set GameRewards as authorized burner for APToken
        apToken.setGameRewardsContract(address(gameRewards));
        console.log("APToken: Set GameRewards as authorized burner");
        
        // 6. Fund contracts
        // FlashMob contract for drop claims
        uint256 flashMobAmount = 100_000 * 10**18; // 100k MON
        token.approve(address(flashMob), flashMobAmount);
        flashMob.deposit(flashMobAmount);
        console.log("Deposited", flashMobAmount / 10**18, "MON to FlashMob");
        
        // GameRewards contract for game rewards
        uint256 gameRewardsAmount = 50_000 * 10**18; // 50k MON
        token.transfer(address(gameRewards), gameRewardsAmount);
        console.log("Transferred", gameRewardsAmount / 10**18, "MON to GameRewards");
        
        // 7. Log summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Monad Testnet (Chain ID 10143)");
        console.log("\nCore Contracts:");
        console.log("- MockMON:", address(token));
        console.log("- FlashMobV2:", address(flashMob));
        console.log("\nGame Economy:");
        console.log("- APToken:", address(apToken));
        console.log("- GameRewards:", address(gameRewards));
        console.log("\nConfiguration:");
        console.log("- Trusted Signer:", deployer);
        console.log("- Treasury:", deployer);
        console.log("\nBalances:");
        console.log("- FlashMob Pool:", flashMob.getBalance() / 10**18, "MON");
        console.log("- GameRewards Pool:", gameRewardsAmount / 10**18, "MON");
        console.log("\nGame Costs:");
        console.log("- Easy:", apToken.easyGameCost() / 10**18, "AP");
        console.log("- Medium:", apToken.mediumGameCost() / 10**18, "AP");
        console.log("- Hard:", apToken.hardGameCost() / 10**18, "AP");
        console.log("\nAP Economics:");
        console.log("- Initial Airdrop:", apToken.INITIAL_AIRDROP() / 10**18, "AP");
        console.log("- Purchase Rate: 100 MON = 1000 AP");
        
        vm.stopBroadcast();
    }
}
