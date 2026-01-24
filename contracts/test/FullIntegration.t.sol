// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {APToken} from "../APToken.sol";
import {GameRewards} from "../GameRewards.sol";
import {FlashMobV2} from "../FlashMobV2.sol";
import {MockMON} from "../MockMON.sol";

/**
 * @title FullIntegration Test
 * @notice Comprehensive end-to-end test of entire Flash.Mob ecosystem
 */
contract FullIntegrationTest is Test {
    APToken public apToken;
    GameRewards public gameRewards;
    FlashMobV2 public flashMob;
    MockMON public mockMON;

    address public admin = address(this);
    address public player1 = address(0x1);
    address public player2 = address(0x2);
    address public backend = address(0x999);

    uint256 private backendKey = 0x1234;

    function setUp() public {
        // Deploy MockMON
        mockMON = new MockMON();
        console.log("MockMON deployed at:", address(mockMON));

        // Deploy APToken: constructor(monToken, treasury)
        apToken = new APToken(address(mockMON), admin);
        console.log("APToken deployed at:", address(apToken));

        // Deploy GameRewards: constructor(apToken, monToken, trustedSigner, treasury)
        gameRewards = new GameRewards(
            address(apToken),
            address(mockMON),
            vm.addr(backendKey), // trustedSigner
            admin // treasury
        );
        console.log("GameRewards deployed at:", address(gameRewards));

        // Deploy FlashMobV2: constructor(token, trustedSigner, defaultExpiryHours)
        flashMob = new FlashMobV2(
            address(mockMON),
            vm.addr(backendKey), // trustedSigner
            24 // 24 hours expiry
        );
        console.log("FlashMobV2 deployed at:", address(flashMob));

        // Setup: APToken needs to authorize GameRewards to burn
        apToken.setGameRewardsContract(address(gameRewards));

        // Give players some MON tokens for testing
        mockMON.transfer(player1, 10000 ether);
        mockMON.transfer(player2, 5000 ether);

        // Give contracts MON for rewards
        mockMON.transfer(address(gameRewards), 100000 ether);
        mockMON.transfer(address(flashMob), 100000 ether);

        // Backend signer setup
        vm.label(backend, "Backend");
        vm.label(player1, "Player1");
        vm.label(player2, "Player2");
    }

    /**
     * TEST 1: Initial Airdrop Flow
     */
    function test_01_InitialAirdrop() public {
        console.log("\n=== TEST 1: Initial Airdrop ===");

        // Player1 claims initial 1000 AP
        vm.startPrank(player1);
        
        // Check eligibility
        assertTrue(apToken.canClaimAirdrop(player1), "Should be eligible for airdrop");
        
        // Claim airdrop
        apToken.claimInitialAirdrop();
        
        // Verify balance
        uint256 balance = apToken.balanceOf(player1);
        assertEq(balance, 1000 ether, "Should have 1000 AP after airdrop");
        
        // Cannot claim again
        assertFalse(apToken.canClaimAirdrop(player1), "Should not be eligible after claiming");
        
        vm.stopPrank();

        console.log("Player1 AP balance after airdrop:", balance / 1e18);
        console.log("\u2705 Airdrop test PASSED");
    }

    /**
     * TEST 2: AP Purchase Flow
     */
    function test_02_PurchaseAP() public {
        console.log("\n=== TEST 2: Purchase AP ===");

        vm.startPrank(player2);

        // Player2 purchases AP with 100 MON
        uint256 monAmount = 100 ether;
        uint256 expectedAP = apToken.calculateAPForMON(monAmount); // Should be 1000 AP

        console.log("Purchasing with MON:", monAmount / 1e18);
        console.log("Expected AP:", expectedAP / 1e18);

        // Approve MON spending
        mockMON.approve(address(apToken), monAmount);

        // Purchase AP
        apToken.purchaseAP(monAmount);

        // Verify AP balance
        uint256 apBalance = apToken.balanceOf(player2);
        assertEq(apBalance, expectedAP, "Should have 1000 AP after purchase");

        // Verify MON was spent
        uint256 monBalance = mockMON.balanceOf(player2);
        assertEq(monBalance, 5000 ether - monAmount, "MON should be spent");

        vm.stopPrank();

        console.log("Player2 AP balance:", apBalance / 1e18);
        console.log("Player2 MON remaining:", monBalance / 1e18);
        console.log("\u2705 Purchase test PASSED");
    }

    /**
     * TEST 3: Game Start Flow (AP Burning)
     */
    function test_03_StartGame() public {
        console.log("\n=== TEST 3: Start Game (AP Burning) ===");

        // Setup: Player1 has 1000 AP from airdrop
        vm.startPrank(player1);
        apToken.claimInitialAirdrop();

        uint256 initialAP = apToken.balanceOf(player1);
        console.log("Initial AP:", initialAP / 1e18);

        // Approve GameRewards to spend AP
        apToken.approve(address(gameRewards), 10 ether);

        // Start easy game (costs 10 AP)
        bytes32 sessionId = keccak256(abi.encodePacked("session-1", player1, block.timestamp));
        gameRewards.startGame(sessionId, "capture", "easy");

        // Verify AP was burned
        uint256 afterAP = apToken.balanceOf(player1);
        assertEq(afterAP, initialAP - 10 ether, "Should burn 10 AP for easy game");

        // Verify game stats
        (uint256 gamesPlayed, uint256 gamesWon, uint256 totalAPSpent, uint256 totalMONEarned) = 
            gameRewards.getUserStats(player1);
        
        assertEq(gamesPlayed, 1, "Should have 1 game played");
        assertEq(totalAPSpent, 10 ether, "Should have spent 10 AP");

        vm.stopPrank();

        console.log("AP after game start:", afterAP / 1e18);
        console.log("Games played:", gamesPlayed);
        console.log("Total AP spent:", totalAPSpent / 1e18);
        console.log("\u2705 Game start test PASSED");
    }

    /**
     * TEST 4: Multiple Games Different Difficulties
     */
    function test_04_MultipleGames() public {
        console.log("\n=== TEST 4: Multiple Games ===");

        // Setup: Player1 needs more AP
        vm.startPrank(player1);
        
        // Claim airdrop + purchase more
        apToken.claimInitialAirdrop(); // 1000 AP
        mockMON.approve(address(apToken), 100 ether);
        apToken.purchaseAP(100 ether); // +1000 AP = 2000 AP total

        uint256 initialAP = apToken.balanceOf(player1);
        console.log("Starting AP:", initialAP / 1e18);

        // Approve for multiple games
        apToken.approve(address(gameRewards), 200 ether);

        // Play easy game (10 AP)
        bytes32 session1 = keccak256(abi.encodePacked("session-1", player1));
        gameRewards.startGame(session1, "capture", "easy");

        // Play medium game (25 AP)
        bytes32 session2 = keccak256(abi.encodePacked("session-2", player1));
        gameRewards.startGame(session2, "puzzle", "medium");

        // Play hard game (50 AP)
        bytes32 session3 = keccak256(abi.encodePacked("session-3", player1));
        gameRewards.startGame(session3, "racing", "hard");

        uint256 finalAP = apToken.balanceOf(player1);
        uint256 totalSpent = 10 ether + 25 ether + 50 ether; // 85 AP

        assertEq(finalAP, initialAP - totalSpent, "Should spend 85 AP total");

        // Check stats
        (uint256 gamesPlayed,, uint256 totalAPSpent,) = gameRewards.getUserStats(player1);
        assertEq(gamesPlayed, 3, "Should have 3 games played");
        assertEq(totalAPSpent, totalSpent, "Should have spent 85 AP");

        vm.stopPrank();

        console.log("Games played:", gamesPlayed);
        console.log("Total AP spent:", totalAPSpent / 1e18);
        console.log("Remaining AP:", finalAP / 1e18);
        console.log("\u2705 Multiple games test PASSED");
    }

    /**
     * TEST 5: Game Reward Claiming
     */
    function test_05_ClaimReward() public {
        console.log("\n=== TEST 5: Claim Game Reward ===");

        // Setup: Player1 plays a game
        vm.startPrank(player1);
        apToken.claimInitialAirdrop();
        apToken.approve(address(gameRewards), 10 ether);

        bytes32 sessionId = keccak256(abi.encodePacked("session-reward", player1));
        gameRewards.startGame(sessionId, "capture", "easy");

        vm.stopPrank();

        // Backend signs reward claim
        uint256 monReward = 50 ether;
        uint256 score = 1000;
        uint256 nonce = gameRewards.nonces(player1);
        uint256 deadline = block.timestamp + 1 hours;
        
        address expectedSigner = vm.addr(backendKey);
        address contractSigner = gameRewards.trustedSigner();
        console.log("Expected signer:", expectedSigner);
        console.log("Contract trusted signer:", contractSigner);
        require(expectedSigner == contractSigner, "Signer mismatch!");
        
        // Get the DOMAIN_SEPARATOR from the contract instead of computing it
        bytes32 domainSep = gameRewards.getDomainSeparator();
        
        console.log("Chain ID:", block.chainid);
        console.log("GameRewards address:", address(gameRewards));
        console.logBytes32(domainSep);
        
        // Compute struct hash - must match contract exactly
        bytes32 rewardTypehash = keccak256("GameReward(bytes32 sessionId,address player,uint256 monReward,uint256 score,uint256 nonce,uint256 deadline)");
        bytes32 structHash = keccak256(abi.encode(
            rewardTypehash,
            sessionId,
            player1,
            monReward,
            score,
            nonce,
            deadline
        ));
        
        console.log("\n--- TEST PARAMETERS ---");
        console.log("Session ID:");
        console.logBytes32(sessionId);
        console.log("Player:", player1);
        console.log("MON Reward:", monReward);
        console.log("Score:", score);
        console.log("Nonce:", nonce);
        console.log("Deadline:", deadline);
        
        console.log("\n--- COMPUTED IN TEST ---");
        console.log("Domain Separator:");
        console.logBytes32(domainSep);
        console.log("Reward Typehash:");
        console.logBytes32(rewardTypehash);
        console.log("Struct Hash:");
        console.logBytes32(structHash);
        
        // Create digest
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSep, structHash));
        console.log("Test Digest:");
        console.logBytes32(digest);
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendKey, digest);
        
        // v should be 27 or 28, but vm.sign sometimes returns 0 or 1
        // Adjust if needed
        if (v < 27) v += 27;
        
        console.log("Signature v (adjusted):", v);
        console.logBytes32(r);
        console.logBytes32(s);

        // Player claims reward
        // OpenZeppelin ECDSA expects signature as abi.encodePacked(r, s, v) where v is a single byte
        bytes memory signature = abi.encodePacked(r, s, v);
        
        console.log("\n--- SIGNATURE ---");
        console.log("v (adjusted):", v);
        console.log("r:");
        console.logBytes32(r);
        console.log("s:");
        console.logBytes32(s);
        console.log("Signature length:", signature.length);
        
        // Debug: verify what the contract computes
        (bytes32 contractStructHash, bytes32 contractDigest, address contractRecoveredSigner) = 
            gameRewards.debugVerifySignature(sessionId, player1, monReward, score, deadline, signature);
        
        console.log("\n--- CONTRACT VERIFICATION ---");
        console.log("Contract Struct Hash:");
        console.logBytes32(contractStructHash);
        console.log("Contract Digest:");
        console.logBytes32(contractDigest);
        console.log("Contract Recovered Signer:", contractRecoveredSigner);
        console.log("Expected Signer:", expectedSigner);
        
        console.log("\n--- COMPARISON ---");
        console.log("Struct Hash Match:", structHash == contractStructHash);
        console.log("Digest Match:", digest == contractDigest);
        console.log("Signer Match:", contractRecoveredSigner == expectedSigner);
        
        // Get balance BEFORE prank
        uint256 monBefore = mockMON.balanceOf(player1);
        
        // Now prank and claim in one go
        vm.prank(player1);
        gameRewards.claimReward(sessionId, monReward, score, deadline, signature);
        
        assertEq(mockMON.balanceOf(player1) - monBefore, monReward, "Should receive 50 MON reward");

        console.log("MON reward claimed:", monReward / 1e18);
        console.log("\u2705 Reward claiming test PASSED");
    }

    /**
     * TEST 6: Drop Claiming Flow
     */
    function test_06_DropClaim() public {
        console.log("\n=== TEST 6: Drop Claiming ===");

        bytes32 dropId = keccak256(abi.encodePacked("drop-test-1"));
        uint256 monAmount = 100 ether;
        uint256 nonce = flashMob.nonces(player1);
        uint256 deadline = block.timestamp + 1 hours;

        // Compute domain separator
        bytes32 domainSep = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("FlashMob"),
            keccak256("2"),
            block.chainid,
            address(flashMob)
        ));
        
        // Compute struct hash
        bytes32 structHash = keccak256(abi.encode(
            keccak256("Claim(bytes32 dropId,address claimer,uint256 amount,uint256 nonce,uint256 deadline)"),
            dropId,
            player1,
            monAmount,
            nonce,
            deadline
        ));
        
        // Create digest
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSep, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(backendKey, digest);
        if (v < 27) v += 27;

        // Get balance before prank
        uint256 monBefore = mockMON.balanceOf(player1);
        
        // Player claims drop
        vm.prank(player1);
        flashMob.claimWithHash(dropId, monAmount, deadline, abi.encodePacked(r, s, v));
        
        assertEq(mockMON.balanceOf(player1) - monBefore, monAmount, "Should receive 100 MON from drop");

        console.log("MON claimed from drop:", monAmount / 1e18);
        console.log("\u2705 Drop claiming test PASSED");
    }

    /**
     * TEST 7: Complete User Journey
     */
    function test_07_CompleteUserJourney() public {
        console.log("\n=== TEST 7: Complete User Journey ===");

        address newPlayer = address(0x123);
        vm.deal(newPlayer, 1 ether); // Give some ETH for gas
        mockMON.transfer(newPlayer, 500 ether); // Give MON for purchases

        vm.startPrank(newPlayer);

        // Step 1: Claim initial airdrop
        console.log("Step 1: Claiming airdrop...");
        apToken.claimInitialAirdrop();
        assertEq(apToken.balanceOf(newPlayer), 1000 ether, "Should have 1000 AP");

        // Step 2: Purchase more AP
        console.log("Step 2: Purchasing AP...");
        mockMON.approve(address(apToken), 100 ether);
        apToken.purchaseAP(100 ether);  // Must be multiple of 100
        assertEq(apToken.balanceOf(newPlayer), 2000 ether, "Should have 2000 AP");

        // Step 3: Play games
        console.log("Step 3: Playing games...");
        apToken.approve(address(gameRewards), 100 ether);
        
        gameRewards.startGame(keccak256("game1"), "capture", "easy"); // -10 AP
        gameRewards.startGame(keccak256("game2"), "puzzle", "medium"); // -25 AP
        
        assertEq(apToken.balanceOf(newPlayer), 1965 ether, "Should have 1965 AP");

        // Step 4: Check stats
        (uint256 gamesPlayed,, uint256 totalAPSpent,) = gameRewards.getUserStats(newPlayer);
        assertEq(gamesPlayed, 2, "Should have played 2 games");
        assertEq(totalAPSpent, 35 ether, "Should have spent 35 AP");

        vm.stopPrank();

        console.log("Final AP balance:", apToken.balanceOf(newPlayer) / 1e18);
        console.log("Games played:", gamesPlayed);
        console.log("\u2705 Complete journey test PASSED");
    }

    /**
     * TEST 8: Error Cases
     */
    function test_08_ErrorCases() public {
        console.log("\n=== TEST 8: Error Cases ===");

        vm.startPrank(player1);

        // Cannot claim airdrop before waiting period (already claimed in setup wouldn't work, so try double claim)
        apToken.claimInitialAirdrop();
        
        // Cannot claim airdrop twice
        vm.expectRevert();
        apToken.claimInitialAirdrop();
        
        // Can start game WITH approval
        apToken.approve(address(gameRewards), 100 ether);
        gameRewards.startGame(keccak256("test"), "capture", "easy");

        vm.stopPrank();

        console.log("\u2705 Error handling test PASSED");
    }

    /**
     * Run all tests
     */
    function test_ALL_INTEGRATION() public {
        console.log("\n");
        console.log("==============================================");
        console.log("   FLASH.MOB FULL INTEGRATION TEST SUITE");
        console.log("==============================================");
        
        test_01_InitialAirdrop();
        test_02_PurchaseAP();
        test_03_StartGame();
        test_04_MultipleGames();
        test_05_ClaimReward();
        test_06_DropClaim();
        test_07_CompleteUserJourney();
        test_08_ErrorCases();

        console.log("\n");
        console.log("==============================================");
        console.log("   \u2705 ALL TESTS PASSED SUCCESSFULLY! \u2705");
        console.log("==============================================");
    }
}
