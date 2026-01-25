// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../CreditsMarketplace.sol";

contract DeployCreditsMarketplace is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address monToken = vm.envAddress("EXPO_PUBLIC_MOCK_MON_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy CreditsMarketplace
        // Rate: 0.1 MON per credit (100000000000000000 wei = 0.1 * 10^18)
        // Sell-back: 0.08 MON per credit (80% of buy price)
        CreditsMarketplace marketplace = new CreditsMarketplace(
            monToken,                    // MON token address
            msg.sender,                  // Treasury (deployer)
            100000000000000000,          // 0.1 MON per credit
            80000000000000000            // 0.08 MON sell-back rate
        );
        
        console.log("CreditsMarketplace deployed to:", address(marketplace));
        console.log("MON Token:", monToken);
        console.log("Treasury:", msg.sender);
        console.log("Buy Rate: 0.1 MON per credit");
        console.log("Sell Rate: 0.08 MON per credit");
        
        vm.stopBroadcast();
    }
}
