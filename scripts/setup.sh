#!/bin/bash

# Flash.Mob Setup Script
# This script sets up the entire project from scratch

set -e

echo "🚀 Flash.Mob Setup Script"
echo "========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${BLUE}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version OK: $(node -v)${NC}"

# Install dependencies
echo ""
echo -e "${BLUE}Installing npm dependencies...${NC}"
npm install
echo -e "${GREEN}✓ npm dependencies installed${NC}"

# Check if .env exists
echo ""
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please update .env with your API keys:${NC}"
    echo "   - EXPO_PUBLIC_MAPBOX_TOKEN"
    echo "   - EXPO_PUBLIC_PRIVY_APP_ID"
    echo "   - EXPO_PUBLIC_SENTRY_DSN"
    echo "   - EXPO_PUBLIC_DROP_CLAIMER_ADDRESS"
    echo "   - EXPO_PUBLIC_TOKEN_ADDRESS"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Check if Foundry is installed
echo ""
echo -e "${BLUE}Checking Foundry installation...${NC}"
if command -v forge &> /dev/null; then
    echo -e "${GREEN}✓ Foundry is installed: $(forge --version | head -n 1)${NC}"
    
    # Install Foundry dependencies
    echo ""
    echo -e "${BLUE}Installing Foundry dependencies...${NC}"
    cd contracts
    forge install
    cd ..
    echo -e "${GREEN}✓ Foundry dependencies installed${NC}"
    
    # Build contracts
    echo ""
    echo -e "${BLUE}Building smart contracts...${NC}"
    cd contracts
    forge build
    cd ..
    echo -e "${GREEN}✓ Smart contracts built${NC}"
else
    echo -e "${YELLOW}⚠️  Foundry not found. Install it with:${NC}"
    echo "   curl -L https://foundry.paradigm.xyz | bash"
    echo "   foundryup"
fi

# Check EAS CLI
echo ""
echo -e "${BLUE}Checking EAS CLI...${NC}"
if command -v eas &> /dev/null; then
    echo -e "${GREEN}✓ EAS CLI is installed${NC}"
else
    echo -e "${YELLOW}Installing EAS CLI...${NC}"
    npm install -g eas-cli
    echo -e "${GREEN}✓ EAS CLI installed${NC}"
fi

# Run TypeScript check
echo ""
echo -e "${BLUE}Running TypeScript check...${NC}"
npm run typecheck
echo -e "${GREEN}✓ TypeScript check passed${NC}"

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Update .env with your API keys"
echo "  2. Run 'eas login' to authenticate"
echo "  3. Run 'npm run dev' to start development"
echo "  4. Run 'npm run build:dev:ios' for iOS dev build"
echo ""
echo "Smart contract commands:"
echo "  npm run contracts:build   - Build contracts"
echo "  npm run contracts:test    - Run contract tests"
echo "  npm run contracts:deploy:testnet - Deploy to Monad testnet"
echo ""
