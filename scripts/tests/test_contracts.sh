#!/bin/bash

# Flash.Mob Smart Contract Testing Script
# Tests all smart contracts for AP Token Economy

echo "========================================="
echo "🔨 Flash.Mob Smart Contract Testing"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Navigate to contracts directory
cd ../contracts || exit 1

echo "${BLUE}📁 Current directory: $(pwd)${NC}"
echo ""

# Check if Foundry is installed
echo "${YELLOW}🔍 Checking Foundry installation...${NC}"
if ! command -v forge &> /dev/null; then
    echo "${RED}❌ Foundry not installed!${NC}"
    echo "Install from: https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi
echo "${GREEN}✅ Foundry installed${NC}"
echo ""

# Clean previous builds
echo "${YELLOW}🧹 Cleaning previous builds...${NC}"
forge clean
echo "${GREEN}✅ Cleaned${NC}"
echo ""

# Install dependencies
echo "${YELLOW}📦 Installing dependencies...${NC}"
forge install
echo "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Build contracts
echo "${YELLOW}🔨 Building smart contracts...${NC}"
forge build

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Build successful!${NC}"
else
    echo "${RED}❌ Build failed!${NC}"
    exit 1
fi
echo ""

# Run tests
echo "${YELLOW}🧪 Running contract tests...${NC}"
echo ""

# Test APToken
echo "${BLUE}Testing APToken.sol...${NC}"
forge test --match-contract APTokenTest -vv

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ APToken tests passed${NC}"
else
    echo "${RED}❌ APToken tests failed${NC}"
fi
echo ""

# Test GameRewards
echo "${BLUE}Testing GameRewards.sol...${NC}"
forge test --match-contract GameRewardsTest -vv

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ GameRewards tests passed${NC}"
else
    echo "${RED}❌ GameRewards tests failed${NC}"
fi
echo ""

# Test FlashMobV2
echo "${BLUE}Testing FlashMobV2.sol...${NC}"
forge test --match-contract FlashMobTest -vv

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ FlashMobV2 tests passed${NC}"
else
    echo "${RED}❌ FlashMobV2 tests failed${NC}"
fi
echo ""

# Run all tests with gas report
echo "${YELLOW}📊 Generating gas report...${NC}"
forge test --gas-report

echo ""
echo "${GREEN}=========================================${NC}"
echo "${GREEN}✨ Testing Complete!${NC}"
echo "${GREEN}=========================================${NC}"
