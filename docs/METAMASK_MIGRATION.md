# ✅ Migration Complete: MetaMask + Monad Testnet

**Date:** January 23, 2026  
**Status:** ✅ CONFIGURED - Ready for deployment testing

---

## 🎯 What Was Changed

### Configuration Updates

1. **[.env](.env)** - Updated to Monad Testnet
   - Chain ID: `31337` → `10143`
   - RPC URL: `http://localhost:8545` → `https://testnet-rpc.monad.xyz`
   - Removed Privy App ID
   - Added WalletConnect Project ID (needs your ID)
   - Contract addresses set to zero (deploy first)

2. **[app/\_layout.tsx](app/_layout.tsx)** - Switched to Wagmi
   - Removed: `<PrivyProvider>`
   - Added: `<WagmiProvider config={wagmiConfig}>`
   - No more embedded wallet

3. **[src/config/wagmi.ts](src/config/wagmi.ts)** - Created new file
   - Monad Testnet chain definition
   - MetaMask connector (injected)
   - WalletConnect connector
   - Transport configuration

4. **[src/hooks/useWallet.ts](src/hooks/useWallet.ts)** - Rewrote for Wagmi
   - Uses `useAccount`, `useConnect`, `useDisconnect`
   - Uses `useWalletClient` for transactions
   - MetaMask as primary wallet
   - Same interface, different implementation

5. **[backend/.env](backend/.env)** - Created for testnet
   - Chain ID: 10143
   - RPC: Monad testnet
   - Contract addresses (deploy first)
   - Signer needs funding

---

## 📋 Your Next Steps

### 1. Get WalletConnect Project ID (5 minutes)

```bash
# 1. Visit https://cloud.walletconnect.com/
# 2. Sign up (free)
# 3. Create new project
# 4. Copy Project ID
# 5. Add to .env:
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 2. Install & Setup MetaMask (10 minutes)

```bash
# Desktop:
# 1. Install MetaMask extension: https://metamask.io/download/
# 2. Create new wallet or import existing
# 3. SAVE YOUR SEED PHRASE!
# 4. Add Monad Testnet network (see METAMASK_SETUP.md)

# Mobile:
# 1. Install MetaMask app from App Store/Play Store
# 2. Setup wallet
# 3. Add Monad Testnet network
```

### 3. Get Testnet MON (5 minutes)

```bash
# 1. Visit: https://faucet.monad.xyz
# 2. Connect MetaMask
# 3. Request testnet MON
# 4. Wait for transaction

# If faucet is down:
# Ask in Monad Discord: https://discord.gg/monad
```

### 4. Deploy Contracts to Monad Testnet (15 minutes)

```bash
# Make sure you have testnet MON in deployer wallet!

cd contracts

# Deploy (will use PRIVATE_KEY from .env)
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast \
  --verify \
  -vvvv

# Or use npm script:
npm run contracts:deploy:testnet
```

**Expected Output:**

```
✅ MockMON deployed at: 0x...
✅ FlashMobV2 deployed at: 0x...
✅ APToken deployed at: 0x...
✅ GameRewards deployed at: 0x...
```

### 5. Update Environment Variables (2 minutes)

**Frontend .env:**

```bash
EXPO_PUBLIC_MOCK_MON_ADDRESS=0x...  # Copy from deploy output
EXPO_PUBLIC_AP_TOKEN_ADDRESS=0x...
EXPO_PUBLIC_GAME_REWARDS_ADDRESS=0x...
EXPO_PUBLIC_FLASH_MOB_ADDRESS=0x...
```

**Backend .env:**

```bash
FLASHMOB_CONTRACT=0x...  # Same addresses
AP_TOKEN_CONTRACT=0x...
GAME_REWARDS_CONTRACT=0x...

# Also add backend signer private key (needs MON!)
PRIVATE_KEY=your_backend_wallet_private_key
```

### 6. Fund Backend Wallet (5 minutes)

```bash
# Your backend wallet needs MON for signing transactions!

# 1. Get backend wallet address:
#    In backend/.env, the address derived from PRIVATE_KEY

# 2. Send testnet MON from MetaMask:
#    - Open MetaMask
#    - Send → Enter backend address
#    - Amount: 10 MON (should be enough for testing)
#    - Confirm

# 3. Verify:
#    Visit explorer: https://explorer.testnet.monad.xyz
#    Search for backend address
#    Check balance shows ~10 MON
```

### 7. Test Everything (20 minutes)

```bash
# Terminal 1: Start backend
cd backend
npm run dev
# Should see: ✅ Backend healthy at http://localhost:3001

# Terminal 2: Start frontend
npm run dev
# Should see: ✅ Expo server running

# In app:
# 1. Navigate to Wallet tab
# 2. Tap "Connect Wallet"
# 3. MetaMask opens → Confirm connection
# 4. Add Monad Testnet (if prompted)
# 5. Your address appears ✅

# Test transactions:
# 1. Claim AP airdrop → MetaMask confirms → Check balance
# 2. Purchase AP → MetaMask confirms → Check balance
# 3. Start game → MetaMask confirms → Game loads
# 4. Win game → Claim reward → MetaMask confirms → MON balance increases
```

---

## 📊 Migration Checklist

### Configuration ✅

- [x] .env updated to Monad Testnet
- [x] app/\_layout.tsx uses WagmiProvider
- [x] wagmi.ts created with Monad config
- [x] useWallet.ts rewritten for Wagmi
- [x] backend/.env template created

### Your Tasks ⏳

- [ ] Get WalletConnect Project ID
- [ ] Install MetaMask
- [ ] Add Monad Testnet to MetaMask
- [ ] Get testnet MON from faucet
- [ ] Deploy contracts to testnet
- [ ] Update .env with contract addresses
- [ ] Fund backend wallet with MON
- [ ] Test wallet connection
- [ ] Test AP airdrop claim
- [ ] Test AP purchase
- [ ] Test game playing
- [ ] Test reward claiming

---

## 🔍 Verification Commands

### Check Backend Health

```bash
curl http://localhost:3001/health
# Expected:
# {
#   "status": "healthy",
#   "signer": "0x...",
#   "chainId": 10143,
#   "timestamp": 1706000000
# }
```

### Check Contract Deployment

```bash
# Visit Monad testnet explorer
https://explorer.testnet.monad.xyz/address/YOUR_CONTRACT_ADDRESS

# Should see:
# - Contract created transaction
# - Contract code (verified if you used --verify)
# - Balance (MON in contracts)
```

### Check Backend Wallet Balance

```bash
# In node or browser console with ethers:
const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
const balance = await provider.getBalance('YOUR_BACKEND_ADDRESS');
console.log(ethers.formatEther(balance), 'MON');
# Should show > 0 MON
```

---

## 🎯 Key Differences

| Aspect          | Before (Privy)       | After (MetaMask)        |
| --------------- | -------------------- | ----------------------- |
| **Wallet**      | Embedded (automatic) | External (user install) |
| **Network**     | Anvil local          | Monad testnet           |
| **MON**         | Unlimited fake       | Limited real            |
| **Setup**       | Zero config          | Requires MetaMask       |
| **UX**          | Background txs       | User confirms each      |
| **Security**    | Custodial            | Non-custodial           |
| **Persistence** | Resets on restart    | Permanent               |

---

## 🚨 Common Issues & Solutions

### Issue: "Wallet connection failed"

**Solution:**

- Make sure MetaMask is installed
- Check MetaMask is unlocked
- Verify you're on Monad Testnet network

### Issue: "Transaction failed"

**Solution:**

- Check you have testnet MON
- Verify correct network (Monad Testnet)
- Check contract addresses are correct
- Ensure backend is running

### Issue: "Contract not found"

**Solution:**

- Contracts not deployed yet
- Deploy with: `npm run contracts:deploy:testnet`
- Update .env with addresses

### Issue: "Backend signing error"

**Solution:**

- Backend wallet not funded
- Send MON to backend address
- Check backend/.env has correct PRIVATE_KEY

---

## 📚 Documentation

- **Setup Guide:** [METAMASK_SETUP.md](METAMASK_SETUP.md) - Complete instructions
- **Original Rating:** [HACKATHON_RATING.md](HACKATHON_RATING.md) - 9.2/10 score
- **Quick Start:** [QUICK_START.md](QUICK_START.md) - General startup guide
- **Privy Status:** [PRIVY_STATUS.md](PRIVY_STATUS.md) - Old Privy setup (now deprecated)

---

## ✅ Success Criteria

You'll know everything is working when:

1. ✅ MetaMask connects to app
2. ✅ Shows "Monad Testnet" in MetaMask
3. ✅ Real testnet MON balance visible
4. ✅ Can claim AP airdrop (MetaMask confirms)
5. ✅ Can purchase AP with MON
6. ✅ Can start games (AP gets burned)
7. ✅ Can claim rewards (MON balance increases)
8. ✅ Transactions visible on explorer
9. ✅ Backend signing works (check logs)
10. ✅ No errors in console

---

## 🎉 What You Get

**Before (Local):**

- Fake unlimited tokens
- Reset on restart
- No real value
- Demo only

**After (Testnet):**

- Real testnet tokens
- Persistent state
- Works like production
- Can showcase to users
- Hackathon-ready demo
- Explorer proof of transactions

---

**🚀 Ready to Deploy? Follow the checklist above!**

Questions? Check [METAMASK_SETUP.md](METAMASK_SETUP.md) for detailed guide.
