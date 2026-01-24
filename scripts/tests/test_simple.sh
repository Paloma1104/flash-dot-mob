#!/bin/bash

# Simple Test - Flash.Mob AP Token Economy
# Tests complete flow: airdrop → approve → play games → verify balances

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Contract addresses from deployment
MOCK_MON="0x5FbDB2315678afecb367f032d93F642f64180aa3"
AP_TOKEN="0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
GAME_REWARDS="0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
FLASH_MOB="0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"

# Test accounts
DEPLOYER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

USER1="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
USER1_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

RPC_URL="http://127.0.0.1:8545"

format_balance() {
    local balance=$1
    echo "scale=2; $balance / 1000000000000000000" | bc
}

TESTS_PASSED=0
TESTS_FAILED=0

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        Flash.Mob AP Token Economy - Simple Test        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Contract Addresses:${NC}"
echo -e "  MockMON:      $MOCK_MON"
echo -e "  APToken:      $AP_TOKEN"
echo -e "  GameRewards:  $GAME_REWARDS"
echo -e "  FlashMobV2:   $FLASH_MOB"
echo ""

# Test 1: Mint MON to User1
echo -e "${BLUE}═══ Test 1: Mint 10,000 MON to User1 ═══${NC}"
~/.foundry/bin/cast send $MOCK_MON "mint(address,uint256)" $USER1 "10000000000000000000000" \
    --private-key $DEPLOYER_KEY --rpc-url $RPC_URL >/dev/null 2>&1

USER1_MON=$(~/.foundry/bin/cast call $MOCK_MON "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
USER1_MON_F=$(format_balance $USER1_MON)
echo -e "${GREEN}✓${NC} User1 MON balance: $USER1_MON_F MON"
echo ""

# Test 2: Claim 1,000 AP Airdrop
echo -e "${BLUE}═══ Test 2: Claim 1,000 AP Airdrop ═══${NC}"
~/.foundry/bin/cast send $AP_TOKEN "claimInitialAirdrop()" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1

USER1_AP=$(~/.foundry/bin/cast call $AP_TOKEN "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
USER1_AP_F=$(format_balance $USER1_AP)

if (( $(echo "$USER1_AP_F == 1000.00" | bc -l) )); then
    echo -e "${GREEN}✓ PASS${NC} - User1 AP: $USER1_AP_F (expected: 1000.00)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - User1 AP: $USER1_AP_F (expected: 1000.00)"
    ((TESTS_FAILED++))
fi
echo ""

# Test 3: Purchase 5,000 more AP for 500 MON
echo -e "${BLUE}═══ Test 3: Purchase 5,000 AP for 500 MON ═══${NC}"

echo -ne "  Approving 500 MON... "
~/.foundry/bin/cast send $MOCK_MON "approve(address,uint256)" $AP_TOKEN "500000000000000000000" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1
echo -e "${GREEN}✓${NC}"

echo -ne "  Purchasing AP... "
~/.foundry/bin/cast send $AP_TOKEN "purchaseAP(uint256)" "500000000000000000000" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1
echo -e "${GREEN}✓${NC}"

USER1_AP=$(~/.foundry/bin/cast call $AP_TOKEN "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
USER1_AP_F=$(format_balance $USER1_AP)

if (( $(echo "$USER1_AP_F == 6000.00" | bc -l) )); then
    echo -e "${GREEN}✓ PASS${NC} - User1 AP: $USER1_AP_F (expected: 6000.00)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - User1 AP: $USER1_AP_F (expected: 6000.00)"
    ((TESTS_FAILED++))
fi

USER1_MON=$(~/.foundry/bin/cast call $MOCK_MON "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
USER1_MON_F=$(format_balance $USER1_MON)

if (( $(echo "$USER1_MON_F == 9500.00" | bc -l) )); then
    echo -e "${GREEN}✓ PASS${NC} - User1 MON: $USER1_MON_F (expected: 9500.00)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - User1 MON: $USER1_MON_F (expected: 9500.00)"
    ((TESTS_FAILED++))
fi
echo ""

# Test 4: Approve GameRewards
echo -e "${BLUE}═══ Test 4: Approve GameRewards to Use AP ═══${NC}"
~/.foundry/bin/cast send $AP_TOKEN "approve(address,uint256)" $GAME_REWARDS "115792089237316195423570985008687907853269984665640564039457584007913129639935" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1

ALLOWANCE=$(~/.foundry/bin/cast call $AP_TOKEN "allowance(address,address)(uint256)" $USER1 $GAME_REWARDS --rpc-url $RPC_URL 2>/dev/null)
echo -e "${GREEN}✓${NC} GameRewards approved (allowance: max uint256)"
echo ""

# Test 5: Play Easy Game (10 AP)
echo -e "${BLUE}═══ Test 5: Play Easy Game (10 AP cost) ═══${NC}"
SESSION_ID="0x0000000000000000000000000000000000000000000000000000000000000001"
~/.foundry/bin/cast send $GAME_REWARDS "startGame(bytes32,string,string)" $SESSION_ID "MATH_BLITZ" "easy" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Game started successfully"
    
    USER1_AP=$(~/.foundry/bin/cast call $AP_TOKEN "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
    USER1_AP_F=$(format_balance $USER1_AP)
    
    if (( $(echo "$USER1_AP_F == 5990.00" | bc -l) )); then
        echo -e "${GREEN}✓ PASS${NC} - AP decreased to: $USER1_AP_F (expected: 5990.00)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - AP is: $USER1_AP_F (expected: 5990.00)"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - Failed to start game"
    ((TESTS_FAILED++))
fi
echo ""

# Test 6: Play Medium Game (25 AP)
echo -e "${BLUE}═══ Test 6: Play Medium Game (25 AP cost) ═══${NC}"
SESSION_ID="0x0000000000000000000000000000000000000000000000000000000000000002"
~/.foundry/bin/cast send $GAME_REWARDS "startGame(bytes32,string,string)" $SESSION_ID "SUDOKU_RUSH" "medium" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Game started successfully"
    
    USER1_AP=$(~/.foundry/bin/cast call $AP_TOKEN "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
    USER1_AP_F=$(format_balance $USER1_AP)
    
    if (( $(echo "$USER1_AP_F == 5965.00" | bc -l) )); then
        echo -e "${GREEN}✓ PASS${NC} - AP decreased to: $USER1_AP_F (expected: 5965.00)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - AP is: $USER1_AP_F (expected: 5965.00)"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - Failed to start game"
    ((TESTS_FAILED++))
fi
echo ""

# Test 7: Play Hard Game (50 AP)
echo -e "${BLUE}═══ Test 7: Play Hard Game (50 AP cost) ═══${NC}"
SESSION_ID="0x0000000000000000000000000000000000000000000000000000000000000003"
~/.foundry/bin/cast send $GAME_REWARDS "startGame(bytes32,string,string)" $SESSION_ID "NINJA_MATH" "hard" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Game started successfully"
    
    USER1_AP=$(~/.foundry/bin/cast call $AP_TOKEN "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
    USER1_AP_F=$(format_balance $USER1_AP)
    
    if (( $(echo "$USER1_AP_F == 5915.00" | bc -l) )); then
        echo -e "${GREEN}✓ PASS${NC} - AP decreased to: $USER1_AP_F (expected: 5915.00)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} - AP is: $USER1_AP_F (expected: 5915.00)"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}✗ FAIL${NC} - Failed to start game"
    ((TESTS_FAILED++))
fi
echo ""

# Test 8: Verify User Statistics
echo -e "${BLUE}═══ Test 8: User Statistics ═══${NC}"
USER1_STATS=$(~/.foundry/bin/cast call $GAME_REWARDS "userStats(address)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
GAMES_PLAYED=$(echo "$USER1_STATS" | head -n 1)

if [ "$GAMES_PLAYED" = "3" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Games played: 3"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - Games played: $GAMES_PLAYED (expected: 3)"
    ((TESTS_FAILED++))
fi
echo ""

# Summary
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                     SUMMARY                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}✗ Tests Failed: $TESTS_FAILED${NC}"
echo ""

TOTAL=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$(echo "scale=1; $TESTS_PASSED * 100 / $TOTAL" | bc)
echo -e "Success Rate: ${GREEN}$SUCCESS_RATE%${NC}"
echo ""

echo -e "${YELLOW}Final Balances:${NC}"
echo -e "  User1 AP:  $USER1_AP_F (started: 6000, spent: 85)"
echo -e "  User1 MON: $USER1_MON_F (started: 10000, spent: 500)"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✨ ALL TESTS PASSED! TOKEN ECONOMY WORKS! ✨         ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${YELLOW}Some tests failed. Review errors above.${NC}"
    exit 1
fi
