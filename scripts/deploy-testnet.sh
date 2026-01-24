#!/bin/bash
# Deploy Flash.Mob contracts to Monad Testnet
# Run with: ./scripts/deploy-testnet.sh

set -e

echo "🚀 Deploying Flash.Mob to Monad Testnet..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with PRIVATE_KEY"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env!"
    echo ""
    echo "Add to .env:"
    echo "PRIVATE_KEY=0x..."
    exit 1
fi

echo "📝 Configuration:"
echo "  Network: Monad Testnet"
echo "  RPC: https://testnet-rpc.monad.xyz"
echo "  Chain ID: 10143"
echo ""

# Check deployer balance
echo "💰 Checking deployer balance..."
cd contracts

# Run deployment
echo ""
echo "🔨 Deploying contracts..."
~/.foundry/bin/forge script script/Deploy.s.sol:DeployScript \
    --rpc-url https://testnet-rpc.monad.xyz \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --legacy \
    -vvv

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the deployed contract addresses from output above"
echo "2. Update .env file with the addresses"
echo "3. Update backend/.env with the addresses"
echo "4. Fund backend wallet with testnet MON"
echo ""
