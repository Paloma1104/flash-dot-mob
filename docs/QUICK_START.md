# 🚀 Flash.Mob - Quick Start Guide

## One-Command Startup

### Option 1: Full Stack (Blockchain + Backend + Frontend)

```bash
npm run start:all
```

Starts:

- 🔵 **ANVIL** - Local Monad blockchain (port 8545)
- 🟣 **BACKEND** - Express signing service (port 3001)
- 🟢 **FRONTEND** - Expo dev server (port 8081)

### Option 2: Demo Mode (Backend + Frontend Only)

```bash
npm run start:demo
```

Starts:

- 🟣 **BACKEND** - Express signing service (port 3001)
- 🟢 **FRONTEND** - Expo dev server (port 8081)

_Use this when connecting to deployed contracts on Monad testnet_

---

## First Time Setup

### 1. Install Dependencies

```bash
npm run setup:full
```

This installs:

- Root dependencies (React Native, Expo, etc.)
- Foundry contracts
- Backend dependencies (Express, ethers, etc.)
- Builds smart contracts

### 2. Configure Environment

Create `.env` in project root:

```env
# Wallet
EXPO_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Backend (for production)
EXPO_PUBLIC_BACKEND_URL=http://localhost:3001

# Contracts (deployed addresses)
EXPO_PUBLIC_FLASHMOB_CONTRACT=0x5FbDB2315678afecb367f032d93F642f64180aa3
EXPO_PUBLIC_AP_TOKEN_CONTRACT=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
EXPO_PUBLIC_GAME_REWARDS_CONTRACT=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Chain
EXPO_PUBLIC_CHAIN_ID=31337
EXPO_PUBLIC_CHAIN_NAME=Anvil
EXPO_PUBLIC_RPC_URL=http://127.0.0.1:8545
```

Create `backend/.env`:

```env
# Signer (for local development - DO NOT use in production)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Contracts
FLASHMOB_CONTRACT=0x5FbDB2315678afecb367f032d93F642f64180aa3
AP_TOKEN_CONTRACT=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
GAME_REWARDS_CONTRACT=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Chain
CHAIN_ID=31337

# Server
PORT=3001
```

### 3. Deploy Contracts (if needed)

```bash
npm run contracts:deploy:local
```

Copy the deployed addresses to your `.env` files.

---

## Testing the Stack

### Backend API Tests

```bash
npm run test:backend
```

Expected output:

```
✅ Test 1: Health Check
✅ Test 2: Sign Game Reward
✅ Test 3: Sign Drop (In Range)
✅ Test 4: Reject Drop (Out of Range)
```

### Smart Contract Tests

```bash
npm run contracts:test
```

### Type Checking

```bash
npm run typecheck
```

---

## Development Workflow

### Start Everything at Once

```bash
# Terminal 1 (everything)
npm run start:all
```

### Or Start Individually

```bash
# Terminal 1 - Blockchain
npm run blockchain

# Terminal 2 - Backend
npm run backend

# Terminal 3 - Frontend
npm run dev
```

### Run on Device

**iOS Simulator:**

```bash
npm run ios
```

**Android Emulator:**

```bash
npm run android
```

**Physical Device:**

```bash
npm run start
# Then scan QR code with Expo Go app
```

---

## Common Issues & Solutions

### ❌ "Port 3001 already in use"

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or change PORT in backend/.env
```

### ❌ "Port 8545 already in use"

```bash
# Kill existing Anvil instance
taskkill /IM anvil.exe /F
```

### ❌ "Contract addresses not found"

Make sure you:

1. Started Anvil blockchain
2. Deployed contracts
3. Updated addresses in `.env` files

### ❌ "Backend signing errors"

Check backend/.env has:

- Valid PRIVATE_KEY
- Correct contract addresses
- Correct CHAIN_ID

### ❌ "Expo Go not connecting"

Make sure:

- Phone and computer on same network
- Firewall allows port 8081
- Or use tunnel: `npm start -- --tunnel`

---

## Production Deployment

### Deploy to Monad Testnet

```bash
# Update contracts/Deploy.s.sol with your setup
npm run contracts:deploy:testnet
```

### Build Production App

```bash
# iOS
npm run build:production
npm run submit:ios

# Android
npm run build:production
npm run submit:android
```

### Deploy Backend

```bash
cd backend
# Deploy to your cloud provider (Railway, Render, etc.)
# Set environment variables
# Update EXPO_PUBLIC_BACKEND_URL in frontend .env
```

---

## Project Structure

```
flash.mob/
├── app/                    # Expo Router pages
├── src/
│   ├── components/        # React Native components
│   ├── hooks/            # Custom hooks
│   ├── services/         # Business logic
│   └── stores/           # Zustand state
├── contracts/            # Solidity smart contracts
├── backend/              # Express.js signing service
└── assets/              # Images, fonts, etc.
```

---

## Key Files

**Frontend:**

- [app/\_layout.tsx](app/_layout.tsx) - App entry point
- [src/hooks/useBlockchain.ts](src/hooks/useBlockchain.ts) - Blockchain hooks
- [src/hooks/useClaim.ts](src/hooks/useClaim.ts) - Location claiming

**Backend:**

- [backend/server.ts](backend/server.ts) - Express API server
- [backend/test-api.ps1](backend/test-api.ps1) - API test suite

**Contracts:**

- [contracts/FlashMobV2.sol](contracts/FlashMobV2.sol) - Main claiming contract
- [contracts/FlashMobDropClaimer.sol](contracts/FlashMobDropClaimer.sol) - Drop management

---

## Environment Variables Reference

### Frontend (.env)

| Variable                            | Description         | Example                 |
| ----------------------------------- | ------------------- | ----------------------- |
| `EXPO_PUBLIC_PRIVY_APP_ID`          | Privy wallet app ID | `clxxx...`              |
| `EXPO_PUBLIC_BACKEND_URL`           | Backend API URL     | `http://localhost:3001` |
| `EXPO_PUBLIC_FLASHMOB_CONTRACT`     | FlashMobV2 address  | `0x5FbDB...`            |
| `EXPO_PUBLIC_AP_TOKEN_CONTRACT`     | APToken address     | `0xe7f17...`            |
| `EXPO_PUBLIC_GAME_REWARDS_CONTRACT` | GameRewards address | `0x9fE46...`            |
| `EXPO_PUBLIC_CHAIN_ID`              | Blockchain chain ID | `31337`                 |
| `EXPO_PUBLIC_RPC_URL`               | RPC endpoint        | `http://127.0.0.1:8545` |

### Backend (backend/.env)

| Variable                | Description         | Example      |
| ----------------------- | ------------------- | ------------ |
| `PRIVATE_KEY`           | Signer private key  | `0xac097...` |
| `FLASHMOB_CONTRACT`     | FlashMobV2 address  | `0x5FbDB...` |
| `AP_TOKEN_CONTRACT`     | APToken address     | `0xe7f17...` |
| `GAME_REWARDS_CONTRACT` | GameRewards address | `0x9fE46...` |
| `CHAIN_ID`              | Blockchain chain ID | `31337`      |
| `PORT`                  | Server port         | `3001`       |

---

## Useful Commands

```bash
# Development
npm run dev                    # Start frontend only
npm run backend               # Start backend only
npm run blockchain            # Start Anvil blockchain

# Testing
npm run test                  # Type check + lint
npm run test:backend          # Backend API tests
npm run contracts:test        # Smart contract tests

# Building
npm run contracts:build       # Build Solidity contracts
npm run build:dev:ios         # Build iOS dev app
npm run build:dev:android     # Build Android dev app

# Cleanup
npm run reset-project         # Reset Expo project
npm run prebuild:clean        # Clean native builds
```

---

## 📱 Demo Checklist

Before demoing to judges:

- [ ] All services started (`npm run start:all`)
- [ ] Backend health check passes (visit http://localhost:3001/health)
- [ ] Contracts deployed and addresses updated
- [ ] Test claim works in app
- [ ] Test game rewards work
- [ ] GPS location enabled on device
- [ ] Backup demo video ready
- [ ] Pitch deck prepared
- [ ] Questions prepared for judges

---

## 🆘 Need Help?

**Check logs:**

- Frontend: Expo terminal output
- Backend: Backend terminal output (colored magenta)
- Blockchain: Anvil terminal output (colored cyan)

**Common log locations:**

- Expo: Terminal running `npm run dev`
- Backend: Terminal running `npm run backend`
- Smart contracts: `contracts/broadcast/` folder

**Documentation:**

- [README.md](../README.md) - Project overview
- [PITCH_DECK.md](../PITCH_DECK.md) - Hackathon pitch
- [HACKATHON_RATING.md](HACKATHON_RATING.md) - Project rating (9.2/10!)
- [backend/README.md](../backend/README.md) - API documentation

---

**Good luck with your hackathon! 🚀**

You've built something truly impressive. The rating speaks for itself: **9.2/10** ⭐⭐⭐⭐⭐
