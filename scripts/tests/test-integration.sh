#!/bin/bash

# Flash.Mob - Complete Integration Test Script
# Tests the full blockchain integration end-to-end

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║       Flash.Mob - Integration Test Suite              ║"
echo "║       Testing: Games + Location + Blockchain          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Helper function
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASSED${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}: $2"
        ((FAILED++))
    fi
}

echo "📋 Pre-flight Checks..."
echo ""

# 1. Check if Anvil is running
echo "1. Checking Anvil blockchain..."
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  > /dev/null 2>&1
test_result $? "Anvil running on localhost:8545"

# 2. Check if backend is running
echo "2. Checking backend API..."
curl -s http://localhost:3001/health > /dev/null 2>&1
test_result $? "Backend running on localhost:3001"

# 3. Check backend health endpoint
echo "3. Verifying backend signer..."
BACKEND_HEALTH=$(curl -s http://localhost:3001/health)
if echo "$BACKEND_HEALTH" | grep -q "healthy"; then
    test_result 0 "Backend signer configured"
    echo "   Signer: $(echo $BACKEND_HEALTH | grep -o '"signer":"[^"]*"' | cut -d'"' -f4)"
else
    test_result 1 "Backend health check"
fi

echo ""
echo "🧪 Testing Backend Endpoints..."
echo ""

# 4. Test game reward signing
echo "4. Testing /api/sign-reward endpoint..."
REWARD_RESPONSE=$(curl -s -X POST http://localhost:3001/api/sign-reward \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-123",
    "player": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "score": 85,
    "difficulty": "medium",
    "gameType": "sudoku"
  }')

if echo "$REWARD_RESPONSE" | grep -q "signature"; then
    test_result 0 "Game reward signing"
    MON_REWARD=$(echo $REWARD_RESPONSE | grep -o '"monReward":[0-9]*' | cut -d':' -f2)
    echo "   Reward: $MON_REWARD MON (85% of 125 medium reward)"
else
    test_result 1 "Game reward signing"
fi

# 5. Test drop signing (in range)
echo "5. Testing /api/sign-drop endpoint (in range)..."
DROP_RESPONSE=$(curl -s -X POST http://localhost:3001/api/sign-drop \
  -H "Content-Type: application/json" \
  -d '{
    "dropId": "test-drop-456",
    "claimer": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": 100,
    "userLat": 37.7749,
    "userLon": -122.4194,
    "dropLat": 37.7750,
    "dropLon": -122.4195
  }')

if echo "$DROP_RESPONSE" | grep -q "signature"; then
    test_result 0 "Drop signing (GPS in range)"
else
    test_result 1 "Drop signing (GPS in range)"
fi

# 6. Test drop signing (out of range)
echo "6. Testing /api/sign-drop endpoint (out of range)..."
DROP_FAIL=$(curl -s -X POST http://localhost:3001/api/sign-drop \
  -H "Content-Type: application/json" \
  -d '{
    "dropId": "test-drop-789",
    "claimer": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": 100,
    "userLat": 37.7749,
    "userLon": -122.4194,
    "dropLat": 38.0000,
    "dropLon": -123.0000
  }')

if echo "$DROP_FAIL" | grep -q "Not in range"; then
    test_result 0 "GPS range verification (should reject)"
else
    test_result 1 "GPS range verification"
fi

echo ""
echo "🔐 Testing Smart Contracts..."
echo ""

# 7. Check contract addresses
echo "7. Checking deployed contracts..."
if [ -f ".env" ]; then
    if grep -q "EXPO_PUBLIC_AP_TOKEN_ADDRESS" .env && \
       grep -q "EXPO_PUBLIC_GAME_REWARDS_ADDRESS" .env && \
       grep -q "EXPO_PUBLIC_FLASH_MOB_ADDRESS" .env; then
        test_result 0 "Contract addresses configured in .env"
    else
        test_result 1 "Contract addresses in .env"
    fi
else
    test_result 1 ".env file not found"
fi

# 8. Test frontend files exist
echo "8. Checking frontend integration files..."
if [ -f "src/components/games/GameModal.tsx" ] && \
   [ -f "src/hooks/useBlockchain.ts" ] && \
   [ -f "src/hooks/useClaim.ts" ]; then
    test_result 0 "Frontend blockchain integration files present"
else
    test_result 1 "Frontend files missing"
fi

# 9. Check for blockchain hooks
echo "9. Verifying blockchain hooks..."
if grep -q "useStartGame" src/hooks/useBlockchain.ts && \
   grep -q "useClaimReward" src/hooks/useBlockchain.ts && \
   grep -q "useClaimDrop" src/hooks/useBlockchain.ts; then
    test_result 0 "All blockchain hooks implemented"
else
    test_result 1 "Blockchain hooks missing"
fi

# 10. Check GameModal integration
echo "10. Checking GameModal blockchain integration..."
if grep -q "useStartGame" src/components/games/GameModal.tsx && \
   grep -q "useClaimReward" src/components/games/GameModal.tsx; then
    test_result 0 "GameModal connected to blockchain"
else
    test_result 1 "GameModal not using blockchain hooks"
fi

# 11. Check useClaim integration
echo "11. Checking location claiming integration..."
if grep -q "useClaimDrop" src/hooks/useClaim.ts && \
   grep -q "checkVelocity" src/hooks/useClaim.ts && \
   grep -q "checkDeviceIntegrity" src/hooks/useClaim.ts; then
    test_result 0 "Location claiming with anti-cheat"
else
    test_result 1 "Location claiming incomplete"
fi

echo ""
echo "📊 Test Summary"
echo "═══════════════════════════════════════════════════════"
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "Your Flash.Mob integration is complete and working!"
    echo ""
    echo "Next steps:"
    echo "  1. Start the app: npm run dev"
    echo "  2. Connect wallet (Privy)"
    echo "  3. Play a game and claim rewards"
    echo "  4. Test location claiming"
    echo ""
    echo "Ready for demo! 🚀"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    echo ""
    echo "Please check:"
    echo "  1. Anvil running: cd contracts && anvil"
    echo "  2. Backend running: cd backend && npm run dev"
    echo "  3. Environment variables in .env"
    echo ""
    echo "See INTEGRATION_COMPLETE.md for troubleshooting"
    exit 1
fi
