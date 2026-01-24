# 🔄 MetaMask + Monad Testnet Setup Guide

**Updated:** January 23, 2026  
**Status:** ✅ Configured for MetaMask with real Monad testnet MON

---

## 🎯 What Changed

### Before (Old Setup)

- ❌ Privy embedded wallets
- ❌ Anvil local blockchain (mock MON tokens)
- ❌ Contract addresses that reset on restart

### After (New Setup) ✅

- ✅ MetaMask (or any Web3 wallet)
- ✅ Monad Testnet (real MON tokens from faucet)
- ✅ Persistent contract addresses on testnet
- ✅ WalletConnect support for mobile wallets

---

## 📋 Prerequisites

### 1. Install MetaMask Browser Extension

- Download: https://metamask.io/download/
- Create new wallet or import existing
- **Save your seed phrase securely!**

### 2. Add Monad Testnet to MetaMask

**Option A: Manual Configuration**

1. Open MetaMask → Networks → Add Network
2. Enter details:
   ```
   Network Name: Monad Testnet
   RPC URL: https://testnet-rpc.monad.xyz
   Chain ID: 10143
   Currency Symbol: MON
   Block Explorer: https://explorer.testnet.monad.xyz
   ```

**Option B: Automatic (coming soon)**
The app will prompt to add network when you connect.

### 3. Get Testnet MON Tokens

**Monad Faucet:**

1. Visit: https://faucet.monad.xyz (or check Discord for faucet link)
2. Connect your MetaMask wallet
3. Request testnet MON
4. Wait for transaction confirmation

**Note:** If faucet is down, ask in Monad Discord: https://discord.gg/monad

### 4. Get WalletConnect Project ID

1. Visit: https://cloud.walletconnect.com/
2. Sign up for free account
3. Create new project
4. Copy Project ID
5. Add to `.env`:
   ```bash
   EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```

---

## 🚀 Quick Start

### 1. Update Environment Variables

Edit `.env` file:

```bash
# WalletConnect (required for mobile wallets)
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Monad Testnet Configuration (already set)
EXPO_PUBLIC_CHAIN_ID=10143
EXPO_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
EXPO_PUBLIC_CHAIN_NAME=Monad Testnet

# Contract Addresses (deploy first, then update)
EXPO_PUBLIC_MOCK_MON_ADDRESS=0x...  # Your deployed MockMON
EXPO_PUBLIC_AP_TOKEN_ADDRESS=0x...   # Your deployed APToken
EXPO_PUBLIC_GAME_REWARDS_ADDRESS=0x... # Your deployed GameRewards
EXPO_PUBLIC_FLASH_MOB_ADDRESS=0x...  # Your deployed FlashMobV2
```

### 2. Deploy Contracts to Monad Testnet

**Important:** You need testnet MON in your deployer wallet!

```bash
# In contracts/ directory
# Update foundry.toml with your private key or use --private-key flag

npm run contracts:deploy:testnet
```

Copy the deployed addresses to your `.env` file.

### 3. Configure Backend

Edit `backend/.env`:

```bash
# Backend Signer (needs testnet MON for gas)
BACKEND_SIGNER_PRIVATE_KEY=your_backend_wallet_private_key

# Contract addresses (same as frontend)
FLASHMOB_CONTRACT=0x...
AP_TOKEN_CONTRACT=0x...
GAME_REWARDS_CONTRACT=0x...

# Chain
CHAIN_ID=10143

# Server
PORT=3001
```

**Important:** Fund your backend signer wallet with testnet MON!

### 4. Start the App

```bash
# Start backend (Terminal 1)
cd backend
npm run dev

# Start frontend (Terminal 2)
npm run dev
```

---

## 📱 Using the App with MetaMask

### Desktop/Simulator Flow

1. **Open App**
   - Navigate to Wallet tab
   - Tap "Connect Wallet"

2. **MetaMask Opens**
   - Browser extension pops up
   - Select account
   - Confirm connection

3. **Add Network (if prompted)**
   - MetaMask asks to add Monad Testnet
   - Click "Approve"
   - Switch to Monad Testnet

4. **Start Using**
   - Your wallet is connected!
   - Balance shows real testnet MON
   - All transactions use MetaMask

### Mobile Device Flow

1. **Install MetaMask Mobile**
   - iOS: App Store
   - Android: Play Store

2. **Connect via WalletConnect**
   - Tap "Connect Wallet" in app
   - Choose WalletConnect option
   - Scan QR code with MetaMask mobile
   - Approve connection

3. **Transactions**
   - Each action prompts MetaMask mobile
   - Review and confirm
   - Transactions on real Monad testnet

---

## 🎮 Testing Game Features

### 1. Get Free AP Tokens (Airdrop)

```tsx
// In app
1. Connect MetaMask
2. Go to Wallet tab
3. Tap "Claim 1000 AP"
4. MetaMask prompts → Confirm
5. Wait for confirmation
6. AP balance updates!
```

**Cost:** Gas fees paid in MON (very small)

### 2. Purchase More AP

```tsx
1. Tap "Buy AP"
2. Enter MON amount (minimum 100 MON)
3. MetaMask prompts → Confirm
4. Receive AP tokens
```

**Exchange Rate:** 10 AP per 1 MON

### 3. Play Games

```tsx
1. Select a game
2. Choose difficulty (Easy: 10 AP, Medium: 25 AP, Hard: 50 AP)
3. MetaMask prompts to burn AP → Confirm
4. Play game
5. Win and claim rewards
6. MetaMask prompts → Confirm
7. Receive MON rewards!
```

### 4. Claim Location Drops

```tsx
1. Walk to a drop location (GPS verified)
2. Tap "Claim"
3. Backend signs transaction
4. MetaMask prompts → Confirm
5. Receive MON tokens!
```

---

## 🔧 Troubleshooting

### ❌ "Wrong Network" Error

**Solution:** Switch MetaMask to Monad Testnet

1. Open MetaMask
2. Click network dropdown (top left)
3. Select "Monad Testnet"

### ❌ "Insufficient Funds" Error

**Solution:** Get more testnet MON

1. Visit faucet: https://faucet.monad.xyz
2. Or ask in Discord

### ❌ "Transaction Failed"

**Possible Causes:**

- Not enough MON for gas
- Contract not deployed
- Backend signer not funded
- Wrong network

**Solution:**

1. Check MetaMask is on Monad Testnet
2. Verify contract addresses in `.env`
3. Check backend is running: http://localhost:3001/health
4. Ensure backend wallet has MON

### ❌ "WalletConnect Not Working"

**Solution:**

1. Verify `EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID` is set
2. Check project ID is valid on https://cloud.walletconnect.com/
3. Make sure MetaMask mobile is updated

### ❌ "Contract Call Failed"

**Solution:**

1. Verify contracts are deployed: Check explorer
2. Confirm contract addresses match `.env`
3. Check backend signer has MON for gas
4. Review backend logs for errors

---

## 📊 Contract Deployment Checklist

Before deploying to Monad testnet:

- [ ] Testnet MON in deployer wallet (get from faucet)
- [ ] Update `contracts/script/Deploy.s.sol` if needed
- [ ] Run: `npm run contracts:deploy:testnet`
- [ ] Copy all 4 deployed addresses
- [ ] Update frontend `.env` with addresses
- [ ] Update backend `.env` with addresses
- [ ] Restart both frontend and backend
- [ ] Test in app:
  - [ ] Connect MetaMask
  - [ ] Claim AP airdrop
  - [ ] Purchase AP
  - [ ] Play game
  - [ ] Claim rewards

---

## 🎯 Key Differences from Local Setup

| Feature          | Local (Anvil)    | Testnet (Monad)                    |
| ---------------- | ---------------- | ---------------------------------- |
| **Blockchain**   | Local (resets)   | Persistent                         |
| **MON Tokens**   | Unlimited (fake) | Limited (faucet)                   |
| **Wallet**       | Embedded (Privy) | MetaMask                           |
| **Contracts**    | Auto-deployed    | Manual deploy                      |
| **Gas Fees**     | Free             | Small (testnet)                    |
| **Transactions** | Instant          | ~1 second                          |
| **Explorer**     | None             | https://explorer.testnet.monad.xyz |

---

## 📱 User Experience Changes

### What Users See Now

**Before (Embedded Wallet):**

- Automatic wallet creation
- No setup required
- All transactions background

**After (MetaMask):**

- User installs MetaMask
- Connects wallet manually
- Confirms each transaction
- More secure and transparent

### Benefits

✅ **Real Money:** Users use their own MON  
✅ **Security:** Non-custodial, users control keys  
✅ **Trust:** Transparent transactions on explorer  
✅ **Standard:** Works like all Web3 apps  
✅ **Portable:** Same wallet across all dApps

---

## 🔐 Security Notes

### Private Keys

**Frontend:** Never has access to private keys (MetaMask handles)  
**Backend:** Needs private key for signing (keep secure!)

**Best Practices:**

- ✅ Use environment variables for keys
- ✅ Never commit keys to Git
- ✅ Use separate wallet for backend signer
- ✅ Fund backend wallet with minimal MON
- ✅ Rotate keys if compromised

### Smart Contract Security

- ✅ Signature verification (EIP-712)
- ✅ Nonce tracking (replay protection)
- ✅ Rate limiting (anti-spam)
- ✅ GPS verification (anti-cheat)

---

## 📚 Additional Resources

- **Monad Docs:** https://docs.monad.xyz
- **Monad Discord:** https://discord.gg/monad
- **Monad Faucet:** https://faucet.monad.xyz
- **Explorer:** https://explorer.testnet.monad.xyz
- **MetaMask Docs:** https://docs.metamask.io
- **WalletConnect:** https://docs.walletconnect.com
- **Wagmi Docs:** https://wagmi.sh

---

## ✅ Setup Verification

Run through this checklist to confirm everything works:

1. [ ] MetaMask installed and setup
2. [ ] Monad Testnet added to MetaMask
3. [ ] Testnet MON in wallet (from faucet)
4. [ ] WalletConnect Project ID obtained
5. [ ] Contracts deployed to testnet
6. [ ] Contract addresses updated in `.env`
7. [ ] Backend wallet funded with testnet MON
8. [ ] Backend running (test: http://localhost:3001/health)
9. [ ] Frontend running (test: npm run dev)
10. [ ] MetaMask connects successfully
11. [ ] Can claim AP airdrop
12. [ ] Can purchase AP
13. [ ] Can play games
14. [ ] Can claim rewards

---

**🎉 Once all checkboxes are complete, you're ready to use Flash.Mob with real Monad testnet tokens!**

Need help? Check the troubleshooting section above or ask in our Discord.
