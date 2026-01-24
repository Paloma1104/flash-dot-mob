#!/bin/bash

# Flash.Mob - Run Only Failing Tests (5-8)
# Saves time by skipping passing tests (1-4)

set -e

echo "🧪 Running Tests 5-8 Only (Skipping 1-4)"
echo "=========================================="
echo ""

cd contracts

# Test 5: Reward Claiming
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
echo "✅ Tests 5-8 Complete!"
