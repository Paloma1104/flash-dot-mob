#!/bin/bash

# Flash.Mob - Quick Setup Script
# Installs dependencies and prepares for deployment

echo "=================================="
echo "🚀 Flash.Mob Quick Setup"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running in WSL or Linux
if ! grep -qEi "(Microsoft|WSL)" /proc/version &> /dev/null ; then
    echo "${YELLOW}⚠️  Not running in WSL/Linux${NC}"
    echo "This script is optimized for WSL/Linux"
    echo "For Windows, please use Git Bash or see DEPLOYMENT_GUIDE.md"
    echo ""
fi

# Step 1: Check Node.js
echo "${BLUE}📦 Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
else
    echo "${RED}❌ Node.js not found!${NC}"
    echo "Install from: https://nodejs.org/"
    exit 1
fi
echo ""

# Step 2: Check npm
echo "${BLUE}📦 Checking npm...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "${GREEN}✅ npm installed: $NPM_VERSION${NC}"
else
    echo "${RED}❌ npm not found!${NC}"
    exit 1
fi
echo ""

# Step 3: Install Node modules (if needed)
if [ ! -d "node_modules" ]; then
    echo "${YELLOW}📦 Installing Node.js dependencies...${NC}"
    npm install
    echo "${GREEN}✅ Dependencies installed${NC}"
else
    echo "${GREEN}✅ Node modules already installed${NC}"
fi
echo ""

# Step 4: Check/Install Foundry
echo "${BLUE}🔨 Checking Foundry...${NC}"
if command -v forge &> /dev/null; then
    FORGE_VERSION=$(forge --version | head -n 1)
    echo "${GREEN}✅ Foundry installed: $FORGE_VERSION${NC}"
else
    echo "${YELLOW}⚠️  Foundry not found. Installing...${NC}"
    echo ""
    
    # Install Foundry
    curl -L https://foundry.paradigm.xyz | bash
    
    # Source the environment
    source ~/.bashrc 2>/dev/null || source ~/.profile 2>/dev/null
    
    # Run foundryup
    if command -v foundryup &> /dev/null; then
        foundryup
        echo "${GREEN}✅ Foundry installed successfully!${NC}"
    else
        echo "${RED}❌ Foundry installation failed${NC}"
        echo "Please install manually: https://book.getfoundry.sh/getting-started/installation"
        echo "Then run: source ~/.bashrc && foundryup"
        exit 1
    fi
fi
echo ""

# Step 5: Check Git
echo "${BLUE}📦 Checking Git...${NC}"
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "${GREEN}✅ Git installed: $GIT_VERSION${NC}"
else
    echo "${RED}❌ Git not found!${NC}"
    echo "Install with: sudo apt-get install git"
    exit 1
fi
echo ""

# Step 6: Install Forge dependencies
echo "${BLUE}🔨 Installing Forge dependencies...${NC}"
cd contracts
if [ -f "foundry.toml" ]; then
    forge install --no-commit 2>/dev/null || true
    echo "${GREEN}✅ Forge dependencies checked${NC}"
else
    echo "${RED}❌ foundry.toml not found${NC}"
    exit 1
fi
cd ..
echo ""

# Step 7: Build contracts
echo "${BLUE}🔨 Building smart contracts...${NC}"
cd contracts
forge build

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Contracts built successfully!${NC}"
else
    echo "${RED}❌ Contract build failed!${NC}"
    echo "Check errors above and fix them"
    exit 1
fi
cd ..
echo ""

# Step 8: Check .env file
echo "${BLUE}🔐 Checking environment configuration...${NC}"
if [ -f ".env" ]; then
    echo "${GREEN}✅ .env file exists${NC}"
    
    # Check for required variables
    if grep -q "PRIVATE_KEY" .env; then
        if grep "PRIVATE_KEY=your_private_key_here" .env > /dev/null; then
            echo "${YELLOW}⚠️  PRIVATE_KEY not configured in .env${NC}"
            echo "Please update .env with your private key before deploying"
        else
            echo "${GREEN}✅ PRIVATE_KEY configured${NC}"
        fi
    else
        echo "${YELLOW}⚠️  PRIVATE_KEY missing from .env${NC}"
    fi
    
    if grep -q "EXPO_PUBLIC_RPC_URL" .env; then
        echo "${GREEN}✅ RPC_URL configured${NC}"
    else
        echo "${YELLOW}⚠️  EXPO_PUBLIC_RPC_URL missing from .env${NC}"
    fi
else
    echo "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from template..."
    
    cat > .env << 'EOF'
# Monad Testnet Configuration
EXPO_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
EXPO_PUBLIC_CHAIN_ID=10143

# Deployment Private Key (⚠️ KEEP SECRET! NEVER COMMIT!)
PRIVATE_KEY=your_private_key_here

# Contract Addresses (will be filled after deployment)
EXPO_PUBLIC_MOCK_MON_ADDRESS=
EXPO_PUBLIC_AP_TOKEN_ADDRESS=
EXPO_PUBLIC_GAME_REWARDS_ADDRESS=
EXPO_PUBLIC_FLASH_MOB_ADDRESS=

# Backend Signer (for EIP-712 signatures)
BACKEND_SIGNER_PRIVATE_KEY=your_backend_key_here
EOF
    
    echo "${GREEN}✅ .env file created${NC}"
    echo "${YELLOW}⚠️  Please update .env with your private key${NC}"
fi
echo ""

# Step 9: Summary
echo "${GREEN}=================================="
echo "✨ Setup Complete!"
echo "==================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "${YELLOW}1. Configure .env file:${NC}"
echo "   - Add your PRIVATE_KEY"
echo "   - Get testnet MON from faucet"
echo ""
echo "${YELLOW}2. Deploy contracts:${NC}"
echo "   cd contracts"
echo "   forge script script/Deploy.s.sol:DeployScript \\"
echo "     --rpc-url https://testnet-rpc.monad.xyz \\"
echo "     --private-key \$PRIVATE_KEY \\"
echo "     --broadcast -vvvv"
echo ""
echo "${YELLOW}3. Update .env with deployed addresses${NC}"
echo ""
echo "${YELLOW}4. Start the app:${NC}"
echo "   npm start"
echo ""
echo "${YELLOW}5. Run tests:${NC}"
echo "   cd test_scripts"
echo "   ./test_contracts.sh"
echo ""
echo "${BLUE}📚 For detailed instructions, see:${NC}"
echo "   - DEPLOYMENT_GUIDE.md"
echo "   - docs/AP_TOKEN_ECONOMY.md"
echo "   - docs/AP_TOKEN_IMPLEMENTATION.md"
echo ""
echo "${GREEN}Happy building! 🚀${NC}"
