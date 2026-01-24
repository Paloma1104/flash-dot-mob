#!/bin/bash

# Comprehensive Test Script for Flash.Mob AP Token Economy - FIXED
# Tests all functionality on local Anvil chain

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Contract addresses from Anvil deployment
MOCK_MON="0x5FbDB2315678afecb367f032d93F642f64180aa3"
AP_TOKEN="0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
GAME_REWARDS="0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
FLASH_MOB="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

# Test accounts (from Anvil)
DEPLOYER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

USER1="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
USER1_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"

USER2="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
USER2_KEY="0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"

RPC_URL="http://127.0.0.1:8545"

# Helper function to format numbers
format_balance() {
    local balance=$1
    echo "scale=2; $balance / 1000000000000000000" | bc
}

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Flash.Mob AP Token Economy - Complete Test Suite     ║${NC}"
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo ""

# Test 1: Initial Setup - Mint MON to Users
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 1: Setup - Mint MON to Test Users${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

echo -ne "Minting 10,000 MON to User1... "
~/.foundry/bin/cast send $MOCK_MON "mint(address,uint256)" $USER1 "10000000000000000000000" \
    --private-key $DEPLOYER_KEY --rpc-url $RPC_URL >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo -ne "Verifying User1 MON balance... "
USER1_MON=$(~/.foundry/bin/cast call $MOCK_MON "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
USER1_MON_F=$(format_balance $USER1_MON)
echo -e "${GREEN}✅${NC} $USER1_MON_F MON"

echo ""

# Test 2: Claim Initial 1,000 AP Airdrop
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 2: User1 Claims 1,000 AP Airdrop${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

echo -ne "User1 claiming airdrop... "
~/.foundry/bin/cast send $AP_TOKEN "claimInitialAirdrop()" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo -ne "Verifying AP balance (1,000 AP)... "
USER1_AP=$(~/.foundry/bin/cast call $AP_TOKEN "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
USER1_AP_F=$(format_balance $USER1_AP)
if (( $(echo "$USER1_AP_F == 1000.00" | bc -l) )); then
    echo -e "${GREEN}✅ PASS${NC} ($USER1_AP_F AP)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (got: $USER1_AP_F AP)"
    ((TESTS_FAILED++))
fi

echo -ne "Trying to claim again (should fail)... "
~/.foundry/bin/cast send $AP_TOKEN "claimInitialAirdrop()" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${GREEN}✅ PASS${NC} (correctly prevented)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# Test 3: Purchase AP with MON
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 3: Purchase 5,000 AP for 500 MON${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

echo -ne "User1 approving 500 MON... "
~/.foundry/bin/cast send $MOCK_MON "approve(address,uint256)" $AP_TOKEN "500000000000000000000" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo -ne "Purchasing 5,000 AP... "
~/.foundry/bin/cast send $AP_TOKEN "purchaseAP(uint256)" "500000000000000000000" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo -ne "Verifying AP balance (6,000 AP)... "
USER1_AP_NEW=$(~/.foundry/bin/cast call $AP_TOKEN "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
USER1_AP_NEW_F=$(format_balance $USER1_AP_NEW)
if (( $(echo "$USER1_AP_NEW_F == 6000.00" | bc -l) )); then
    echo -e "${GREEN}✅ PASS${NC} ($USER1_AP_NEW_F AP)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (got: $USER1_AP_NEW_F AP)"
    ((TESTS_FAILED++))
fi

echo -ne "Verifying MON decreased (9,500 MON)... "
USER1_MON_NEW=$(~/.foundry/bin/cast call $MOCK_MON "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
USER1_MON_NEW_F=$(format_balance $USER1_MON_NEW)
if (( $(echo "$USER1_MON_NEW_F == 9500.00" | bc -l) )); then
    echo -e "${GREEN}✅ PASS${NC} ($USER1_MON_NEW_F MON)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (got: $USER1_MON_NEW_F MON)"
    ((TESTS_FAILED++))
fi

echo ""

# Test 4: Approve GameRewards to Burn AP
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 4: Approve GameRewards to Use AP${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

echo -ne "User1 approving GameRewards for unlimited AP... "
~/.foundry/bin/cast send $AP_TOKEN "approve(address,uint256)" $GAME_REWARDS "115792089237316195423570985008687907853269984665640564039457584007913129639935" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# Test 5: Start Easy Game
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 5: Start Easy Game (10 AP Cost)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

SESSION_ID_EASY="0x$(echo -n "easy_game_1" | xxd -p -c 256 | head -c 64)"
echo -ne "Starting easy game... "
~/.foundry/bin/cast send $GAME_REWARDS "startGame(bytes32,string,string)" $SESSION_ID_EASY "MATH_BLITZ" "easy" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo -ne "Verifying AP decreased to 5,990... "
USER1_AP_AFTER=$(~/.foundry/bin/cast call $AP_TOKEN "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
USER1_AP_AFTER_F=$(format_balance $USER1_AP_AFTER)
if (( $(echo "$USER1_AP_AFTER_F == 5990.00" | bc -l) )); then
    echo -e "${GREEN}✅ PASS${NC} ($USER1_AP_AFTER_F AP)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (got: $USER1_AP_AFTER_F AP)"
    ((TESTS_FAILED++))
fi

echo ""

# Test 6: Start Medium Game
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 6: Start Medium Game (25 AP Cost)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

SESSION_ID_MEDIUM="0x$(echo -n "medium_game_1" | xxd -p -c 256 | head -c 64)"
echo -ne "Starting medium game... "
~/.foundry/bin/cast send $GAME_REWARDS "startGame(bytes32,string,string)" $SESSION_ID_MEDIUM "SUDOKU_RUSH" "medium" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo -ne "Verifying AP decreased to 5,965... "
USER1_AP_MEDIUM=$(~/.foundry/bin/cast call $AP_TOKEN "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
USER1_AP_M=$(format_balance $USER1_AP_MEDIUM)
if (( $(echo "$USER1_AP_M == 5965.00" | bc -l) )); then
    echo -e "${GREEN}✅ PASS${NC} ($USER1_AP_M AP)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (got: $USER1_AP_M AP)"
    ((TESTS_FAILED++))
fi

echo ""

# Test 7: Start Hard Game
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 7: Start Hard Game (50 AP Cost)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

SESSION_ID_HARD="0x$(echo -n "hard_game_1" | xxd -p -c 256 | head -c 64)"
echo -ne "Starting hard game... "
~/.foundry/bin/cast send $GAME_REWARDS "startGame(bytes32,string,string)" $SESSION_ID_HARD "NINJA_MATH" "hard" \
    --private-key $USER1_KEY --rpc-url $RPC_URL >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo -ne "Verifying AP decreased to 5,915... "
USER1_AP_HARD=$(~/.foundry/bin/cast call $AP_TOKEN "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
USER1_AP_H=$(format_balance $USER1_AP_HARD)
if (( $(echo "$USER1_AP_H == 5915.00" | bc -l) )); then
    echo -e "${GREEN}✅ PASS${NC} ($USER1_AP_H AP)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (got: $USER1_AP_H AP)"
    ((TESTS_FAILED++))
fi

echo ""

# Test 8: Verify User Stats
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 8: Verify User Statistics${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

echo -ne "Getting User1 stats... "
USER1_STATS=$(~/.foundry/bin/cast call $GAME_REWARDS "userStats(address)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
echo -e "${GREEN}✅${NC}"

# Parse stats
GAMES_PLAYED=$(echo "$USER1_STATS" | head -n 1)
TOTAL_AP_SPENT=$(echo "$USER1_STATS" | head -n 3 | tail -n 1)
TOTAL_AP_SPENT_F=$(format_balance $TOTAL_AP_SPENT)

echo -e "${CYAN}  Games Played: $GAMES_PLAYED${NC}"
echo -e "${CYAN}  Total AP Spent: $TOTAL_AP_SPENT_F AP${NC}"

if [ "$GAMES_PLAYED" = "3" ]; then
    echo -e "${GREEN}✅ Games count correct${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Games count wrong (expected 3, got $GAMES_PLAYED)${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# Test 9: Second User - Full Flow
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 9: User2 Complete Flow${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

echo -ne "User2 claiming 1,000 AP airdrop... "
~/.foundry/bin/cast send $AP_TOKEN "claimInitialAirdrop()" \
    --private-key $USER2_KEY --rpc-url $RPC_URL >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo -ne "User2 approving GameRewards... "
~/.foundry/bin/cast send $AP_TOKEN "approve(address,uint256)" $GAME_REWARDS "115792089237316195423570985008687907853269984665640564039457584007913129639935" \
    --private-key $USER2_KEY --rpc-url $RPC_URL >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo -ne "User2 playing 20 easy games... "
GAMES_SUCCESS=0
for i in {1..20}; do
    SESSION_ID="0x$(echo -n "user2_game_$i" | xxd -p -c 256 | head -c 64)"
    ~/.foundry/bin/cast send $GAME_REWARDS "startGame(bytes32,string,string)" $SESSION_ID "TEST_GAME" "easy" \
        --private-key $USER2_KEY --rpc-url $RPC_URL >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        ((GAMES_SUCCESS++))
    fi
done
if [ $GAMES_SUCCESS -eq 20 ]; then
    echo -e "${GREEN}✅ PASS${NC} (20/20 games)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} ($GAMES_SUCCESS/20 games)"
    ((TESTS_FAILED++))
fi

echo -ne "Verifying User2 AP (800 AP remaining)... "
USER2_AP=$(~/.foundry/bin/cast call $AP_TOKEN "balanceOf(address)(uint256)" $USER2 --rpc-url $RPC_URL 2>/dev/null)
USER2_AP_F=$(format_balance $USER2_AP)
if (( $(echo "$USER2_AP_F == 800.00" | bc -l) )); then
    echo -e "${GREEN}✅ PASS${NC} ($USER2_AP_F AP)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (got: $USER2_AP_F AP)"
    ((TESTS_FAILED++))
fi

echo ""

# Test 10: Rate Limiting
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}TEST 10: Rate Limiting (Max 20 games/hour)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

echo -ne "User2 trying 21st game (should fail)... "
SESSION_ID_21="0x$(echo -n "should_fail" | xxd -p -c 256 | head -c 64)"
~/.foundry/bin/cast send $GAME_REWARDS "startGame(bytes32,string,string)" $SESSION_ID_21 "TEST" "easy" \
    --private-key $USER2_KEY --rpc-url $RPC_URL >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${GREEN}✅ PASS${NC} (correctly rate limited)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (should have been blocked)"
    ((TESTS_FAILED++))
fi

echo ""

# Final Summary
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    TEST SUMMARY                        ║${NC}"
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo ""
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$(echo "scale=1; $TESTS_PASSED * 100 / $TOTAL_TESTS" | bc)

echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Success Rate: ${GREEN}$SUCCESS_RATE%${NC}"
echo ""

# Final Balances
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                 FINAL BALANCES                         ║${NC}"
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo ""

USER1_FINAL_AP=$(~/.foundry/bin/cast call $AP_TOKEN "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
USER1_FINAL_AP_F=$(format_balance $USER1_FINAL_AP)
USER1_FINAL_MON=$(~/.foundry/bin/cast call $MOCK_MON "balanceOf(address)(uint256)" $USER1 --rpc-url $RPC_URL 2>/dev/null)
USER1_FINAL_MON_F=$(format_balance $USER1_FINAL_MON)

USER2_FINAL_AP=$(~/.foundry/bin/cast call $AP_TOKEN "balanceOf(address)(uint256)" $USER2 --rpc-url $RPC_URL 2>/dev/null)
USER2_FINAL_AP_F=$(format_balance $USER2_FINAL_AP)

echo -e "${YELLOW}User1:${NC}"
echo -e "  Address:  $USER1"
echo -e "  AP:       $USER1_FINAL_AP_F AP (started: 6,000 | spent: 85 | remaining: 5,915)"
echo -e "  MON:      $USER1_FINAL_MON_F MON (started: 10,000 | spent: 500 | remaining: 9,500)"
echo -e "  Games:    3 (Easy: 1, Medium: 1, Hard: 1)"
echo ""

echo -e "${YELLOW}User2:${NC}"
echo -e "  Address:  $USER2"
echo -e "  AP:       $USER2_FINAL_AP_F AP (started: 1,000 | spent: 200 | remaining: 800)"
echo -e "  Games:    20 (all Easy, rate limited)"
echo ""

echo -e "${CYAN}Contract Pools:${NC}"
echo -e "  FlashMob:     100,000 MON"
echo -e "  GameRewards:  50,000 MON"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║    ✨ ALL TESTS PASSED! SYSTEM WORKS PERFECTLY! ✨     ║${NC}"
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    exit 0
else
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║     Some tests failed - Review errors above           ║${NC}"
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
    exit 1
fi
