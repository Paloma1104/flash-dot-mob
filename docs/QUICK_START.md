# 🚀 Quick Start Guide - Flash.Mob

## One-Command Startup

### Start Everything (Blockchain + Backend + Frontend)
```bash
npm run start:all
```
This will start:
- 🔗 **Anvil** (Local blockchain on port 8545)
- 🔧 **Backend** (Signing service on port 3001)
- 📱 **Frontend** (Expo dev server)

### Start Demo Mode (Backend + Frontend only)
```bash
npm run start:demo
```
Use this if you already have a blockchain running or want to use a remote RPC.

---

## Individual Services

### Start Blockchain Only
```bash
npm run blockchain
```
Starts Anvil local testnet on `http://localhost:8545`

### Start Backend Only
```bash
npm run backend
```
Starts backend signing service on `http://localhost:3001`

### Start Frontend Only
```bash
npm run dev
```
Starts Expo dev server (scan QR code with Expo Go app)

---

## First Time Setup

### 1. Install Dependencies
```bash
npm run setup:full
```
This installs:
- Root dependencies (React Native, Expo, etc.)
- Smart contract dependencies (Foundry)
- Backend dependencies (Express, ethers.js)

### 2. Configure Environment
Make sure `.env` file exists with:
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3001
EXPO_PUBLIC_GAME_REWARDS_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
EXPO_PUBLIC_FLASH_MOB_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
EXPO_PUBLIC_CHAIN_ID=31337
BACKEND_PRIVATE_KEY=0x[your-private-key]
```

### 3. Start Development
```bash
npm run start:all
```

---

## Testing

### Test Backend API
```bash
npm run test:backend
```
Runs comprehensive API tests for `/api/sign-reward` and `/api/sign-drop`

### Test Smart Contracts
```bash
npm run contracts:test
```
Runs Foundry test suite with verbose output

### Lint & Type Check
```bash
npm test
```
Runs TypeScript type checking and ESLint

---

## Build & Deploy

### Build Smart Contracts
```bash
npm run contracts:build
```

### Deploy to Monad Testnet
```bash
npm run contracts:deploy:testnet
```
Requires `PRIVATE_KEY` in contracts/.env

### Build Mobile Apps (EAS)
```bash
# Development build
npm run build:dev:ios
npm run build:dev:android

# Production build
npm run build:production
```

---

## Troubleshooting

### Backend won't start
```bash
# Kill any process using port 3001
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F

# Then restart
npm run backend
```

### Anvil won't start
```bash
# Make sure Foundry is installed
foundryup

# Check if port 8545 is free
netstat -ano | findstr :8545
```

### Frontend build errors
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

### Contract deployment fails
```bash
# Rebuild contracts
cd contracts
forge clean
forge build

# Check RPC connection
curl -X POST https://testnet-rpc.monad.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

## Development Workflow

### Recommended Terminal Setup
Open 3 terminals:

**Terminal 1 - Blockchain**:
```bash
npm run blockchain
```

**Terminal 2 - Backend**:
```bash
npm run backend
```

**Terminal 3 - Frontend**:
```bash
npm run dev
```

### Alternative: Use Concurrently
```bash
npm run start:all
```
All services in one terminal with color-coded output:
- 🔵 Cyan = Anvil (blockchain)
- 🟣 Magenta = Backend
- 🟢 Green = Frontend

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 8081 | http://localhost:8081 |
| Backend API | 3001 | http://localhost:3001 |
| Anvil RPC | 8545 | http://localhost:8545 |
| Health Check | 3001 | http://localhost:3001/health |

---

## Quick Commands Reference

```bash
# Development
npm run start:all          # Start everything
npm run start:demo         # Backend + Frontend only
npm run dev               # Frontend only

# Testing
npm run test:backend      # Backend API tests
npm run contracts:test    # Smart contract tests
npm test                  # Lint + type check

# Building
npm run contracts:build   # Compile contracts
npm run build:dev:ios    # Build iOS app
npm run build:production # Build production apps

# Deployment
npm run contracts:deploy:testnet  # Deploy to Monad testnet
npm run submit:ios                # Submit to App Store
npm run submit:android            # Submit to Play Store

# Utilities
npm run reset-project     # Reset to template
npm run prebuild:clean    # Clean native projects
npm run setup:full        # Full project setup
```

---

## Environment Variables

### Required for Development
```env
# Frontend
EXPO_PUBLIC_BACKEND_URL=http://localhost:3001
EXPO_PUBLIC_GAME_REWARDS_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
EXPO_PUBLIC_FLASH_MOB_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
EXPO_PUBLIC_CHAIN_ID=31337
EXPO_PUBLIC_PRIVY_APP_ID=your-privy-app-id

# Backend (in .env at root, loaded by backend)
BACKEND_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Required for Production
```env
# Replace with production values
EXPO_PUBLIC_BACKEND_URL=https://api.flashmob.app
EXPO_PUBLIC_CHAIN_ID=41454  # Monad mainnet
BACKEND_PRIVATE_KEY=[secure-key-from-vault]
```

---

## Architecture Overview

```
flash.mob/
├── app/              # Expo Router pages
├── src/              # React Native source
│   ├── components/   # UI components
│   ├── hooks/        # Custom hooks (useWallet, useBlockchain)
│   ├── services/     # API clients
│   ├── stores/       # Zustand state
│   └── types/        # TypeScript types
├── backend/          # Express.js signing service
│   ├── server.ts     # Main server file
│   ├── test-api.ps1  # API tests
│   └── package.json  # Backend dependencies
├── contracts/        # Foundry smart contracts
│   ├── src/          # Solidity contracts
│   ├── test/         # Contract tests
│   └── script/       # Deployment scripts
└── package.json      # Root dependencies
```

---

## Production Checklist

Before deploying to production:

- [ ] Update `EXPO_PUBLIC_BACKEND_URL` to production API
- [ ] Move `BACKEND_PRIVATE_KEY` to secure secret manager
- [ ] Deploy contracts to Monad mainnet
- [ ] Update contract addresses in .env
- [ ] Enable rate limiting on backend
- [ ] Add monitoring (Sentry, DataDog)
- [ ] Configure CORS for production domains
- [ ] Set up SSL certificates
- [ ] Test on real devices
- [ ] Submit to app stores

---

## Support

- 📚 Documentation: [README.md](./README.md)
- 🏆 Rating: [HACKATHON_RATING.md](./HACKATHON_RATING.md)
- ✅ Tests: [INTEGRATION_TEST_RESULTS.md](./INTEGRATION_TEST_RESULTS.md)
- 🐛 Issues: [GitHub Issues](https://github.com/AmrendraTheCoder/flash.mob/issues)

---

**🎉 Happy Hacking!**
