#!/bin/bash

# Flash.Mob - Comprehensive Test Runner
# Tests all blockchain integrations end-to-end

set -e

echo "================================================"
echo "   FLASH.MOB BLOCKCHAIN INTEGRATION TESTS"
echo "================================================"
echo ""

# Check if Anvil is running
echo "📋 Checking Anvil status..."
if ! curl -s -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     http://localhost:8545 > /dev/null 2>&1; then
    echo "❌ Anvil is not running!"
    echo "Start Anvil with: cd contracts && ~/.foundry/bin/anvil"
    exit 1
fi
echo "✅ Anvil is running"
echo ""

# Navigate to contracts directory
cd contracts

# Run Forge tests
echo "🧪 Running Forge integration tests..."
echo "----------------------------------------"

# Test 1: Initial Airdrop
echo "Test 1: Initial Airdrop (1000 AP)..."
~/.foundry/bin/forge test --match-test test_01_InitialAirdrop -vv

# Test 2: AP Purchase
echo ""
echo "Test 2: AP Purchase with MON..."
~/.foundry/bin/forge test --match-test test_02_PurchaseAP -vv

# Test 3: Game Start
echo ""
echo "Test 3: Game Start (AP Burning)..."
~/.foundry/bin/forge test --match-test test_03_StartGame -vv

# Test 4: Multiple Games
echo ""
echo "Test 4: Multiple Games Different Difficulties..."
~/.foundry/bin/forge test --match-test test_04_MultipleGames -vv

# Test 5: Reward Claiming
echo ""
echo "Test 5: Game Reward Claiming..."
~/.foundry/bin/forge test --match-test test_05_ClaimReward -vv

# Test 6: Drop Claiming
echo ""
echo "Test 6: Drop Claiming..."
~/.foundry/bin/forge test --match-test test_06_DropClaim -vv

# Test 7: Complete Journey
echo ""
echo "Test 7: Complete User Journey..."
~/.foundry/bin/forge test --match-test test_07_CompleteUserJourney -vv

# Test 8: Error Cases
echo ""
echo "Test 8: Error Handling..."
~/.foundry/bin/forge test --match-test test_08_ErrorCases -vv

echo ""
echo "================================================"
echo "   ✅ ALL BLOCKCHAIN TESTS COMPLETED!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Frontend integration tests"
echo "2. E2E flow with Privy wallet"
echo "3. Backend API development"
