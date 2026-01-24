# Flash.Mob Deployment Guide

## 🚀 Complete Deployment & Testing Checklist

This guide walks through building, deploying, and testing the Flash.Mob AP Token Economy.

---

## Prerequisites

### 1. Install Foundry (Required for building contracts)

#### On WSL/Linux:

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
forge --version
cast --version
```

#### On Windows (Git Bash or PowerShell with Admin):

```powershell
# Download foundryup installer from: https://book.getfoundry.sh/getting-started/installation
# Run installer and restart terminal
forge --version
```

### 2. Setup Environment Variables

Create/update `.env` file in project root:

```env
# Monad Testnet RPC
EXPO_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
EXPO_PUBLIC_CHAIN_ID=10143

# Deployer Private Key (⚠️ NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Contract Addresses (will be filled after deployment)
EXPO_PUBLIC_MOCK_MON_ADDRESS=
EXPO_PUBLIC_AP_TOKEN_ADDRESS=
EXPO_PUBLIC_GAME_REWARDS_ADDRESS=
EXPO_PUBLIC_FLASH_MOB_ADDRESS=

# Backend Signer for EIP-712 signatures
BACKEND_SIGNER_PRIVATE_KEY=your_backend_key_here
```

### 3. Get Monad Testnet Tokens

1. Visit Monad testnet faucet
2. Request testnet MON for deployer address
3. Confirm you have at least 1 MON for deployment gas

---

## 📦 Step 1: Build Smart Contracts

### Option A: Using WSL (Recommended)

```bash
cd /mnt/c/Users/LENOVO/Desktop/flash.mob/contracts
forge build
```

### Option B: Using Git Bash

```bash
cd c:/Users/LENOVO/Desktop/flash.mob/contracts
forge build
```

### Option C: Using PowerShell

```powershell
cd C:\Users\LENOVO\Desktop\flash.mob\contracts
forge build
```

### Expected Output:

```
[⠊] Compiling...
[⠒] Compiling 25 files with Solc 0.8.24
[⠢] Solc 0.8.24 finished in 3.21s
Compiler run successful!
```

### ✅ Verification:

- Check `contracts/out/` folder exists
- Verify `APToken.sol/APToken.json` exists
- Verify `GameRewards.sol/GameRewards.json` exists
- Verify `FlashMobV2.sol/FlashMobV2.json` exists
- Verify `MockMON.sol/MockMON.json` exists

---

## 🌐 Step 2: Deploy to Monad Testnet

### Using Forge Script:

```bash
cd contracts

# Deploy all contracts
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key YOUR_API_KEY \
  -vvvv
```

### Expected Output:

```
== Logs ==
Deploying contracts to Monad Testnet...
MockMON deployed at: 0x...
APToken deployed at: 0x...
GameRewards deployed at: 0x...
FlashMobV2 deployed at: 0x...

TOTAL: [Success] Hash: 0x...
```

### ⚠️ Important:

- **Save all contract addresses!**
- Copy addresses to `.env` file
- Keep deployment transaction hashes
- Verify contracts on block explorer

---

## 📝 Step 3: Update Environment Variables

Update `.env` with deployed addresses:

```env
EXPO_PUBLIC_MOCK_MON_ADDRESS=0xYourMockMONAddress
EXPO_PUBLIC_AP_TOKEN_ADDRESS=0xYourAPTokenAddress
EXPO_PUBLIC_GAME_REWARDS_ADDRESS=0xYourGameRewardsAddress
EXPO_PUBLIC_FLASH_MOB_ADDRESS=0xYourFlashMobAddress
```

**Also update**: `src/services/blockchain/config.ts`

```typescript
export const CONTRACTS = {
  mockMON: "0xYourMockMONAddress",
  apToken: "0xYourAPTokenAddress",
  gameRewards: "0xYourGameRewardsAddress",
  flashMob: "0xYourFlashMobAddress",
};
```

---

## 🧪 Step 4: Test Contracts (On-Chain)

### Test 1: Verify Deployments

```bash
# Check APToken
cast call $AP_TOKEN_ADDRESS "name()" --rpc-url https://testnet-rpc.monad.xyz
# Expected: "Flash Mob Activity Points"

# Check GameRewards
cast call $GAME_REWARDS_ADDRESS "apToken()" --rpc-url https://testnet-rpc.monad.xyz
# Expected: Your AP Token address

# Check MockMON
cast call $MOCK_MON_ADDRESS "symbol()" --rpc-url https://testnet-rpc.monad.xyz
# Expected: "MON"
```

### Test 2: Claim Initial Airdrop

```bash
# Claim 1000 AP
cast send $AP_TOKEN_ADDRESS \
  "claimInitialAirdrop()" \
  --private-key $PRIVATE_KEY \
  --rpc-url https://testnet-rpc.monad.xyz

# Check balance
cast call $AP_TOKEN_ADDRESS \
  "balanceOf(address)(uint256)" \
  YOUR_ADDRESS \
  --rpc-url https://testnet-rpc.monad.xyz
# Expected: 1000000000000000000000 (1000 AP with 18 decimals)
```

### Test 3: Get Mock MON

```bash
# Mint 1000 MON to yourself
cast send $MOCK_MON_ADDRESS \
  "mint(address,uint256)" \
  YOUR_ADDRESS \
  1000000000000000000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://testnet-rpc.monad.xyz

# Verify balance
cast call $MOCK_MON_ADDRESS \
  "balanceOf(address)(uint256)" \
  YOUR_ADDRESS \
  --rpc-url https://testnet-rpc.monad.xyz
```

### Test 4: Purchase AP

```bash
# 1. Approve GameRewards to spend MON
cast send $MOCK_MON_ADDRESS \
  "approve(address,uint256)" \
  $GAME_REWARDS_ADDRESS \
  100000000000000000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://testnet-rpc.monad.xyz

# 2. Purchase 1000 AP for 100 MON
cast send $AP_TOKEN_ADDRESS \
  "purchaseAP(uint256)" \
  100000000000000000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://testnet-rpc.monad.xyz

# 3. Verify new AP balance
cast call $AP_TOKEN_ADDRESS \
  "balanceOf(address)(uint256)" \
  YOUR_ADDRESS \
  --rpc-url https://testnet-rpc.monad.xyz
# Expected: 2000 AP (1000 airdrop + 1000 purchased)
```

### Test 5: Start Game (Burns AP)

```bash
# Start an easy game (costs 10 AP)
cast send $GAME_REWARDS_ADDRESS \
  "startGame(uint8,string)" \
  0 \
  "easy_game_drop_id" \
  --private-key $PRIVATE_KEY \
  --rpc-url https://testnet-rpc.monad.xyz

# Check AP balance decreased
cast call $AP_TOKEN_ADDRESS \
  "balanceOf(address)(uint256)" \
  YOUR_ADDRESS \
  --rpc-url https://testnet-rpc.monad.xyz
# Expected: 1990 AP (2000 - 10)

# Check game session created
cast call $GAME_REWARDS_ADDRESS \
  "userGameCount(address)(uint256)" \
  YOUR_ADDRESS \
  --rpc-url https://testnet-rpc.monad.xyz
# Expected: 1
```

---

## 📱 Step 5: Test Mobile App

### Start the App:

```bash
cd /mnt/c/Users/LENOVO/Desktop/flash.mob
npm start
```

### Test Scenarios:

#### 1. Wallet Screen

- [ ] Open Wallet tab
- [ ] See MON balance card
- [ ] See AP balance card (NEW!)
- [ ] AP balance shows 1990 (from contract test)
- [ ] "+ Buy AP" button visible
- [ ] Click "Buy AP" → Modal opens

#### 2. AP Purchase Modal

- [ ] Modal displays correctly
- [ ] Shows exchange rate: 100 MON = 1000 AP
- [ ] Current balances displayed
- [ ] Enter 100 in input
- [ ] Preview shows: Pay 100 MON, Get 1000 AP
- [ ] Click quick button (500) → input updates
- [ ] Click "Purchase AP"
- [ ] Loading spinner shows
- [ ] Transaction completes
- [ ] Success message
- [ ] Balances update (AP +1000, MON -100)

#### 3. Map & Game Selection

- [ ] Open Map tab
- [ ] See game drops with markers
- [ ] Click on a drop
- [ ] GameModal opens
- [ ] Shows game info
- [ ] Shows "🎟️ Cost to Play: X AP"
- [ ] Cost matches difficulty (10/25/50)
- [ ] Balance check passes
- [ ] "Start Game" button enabled

#### 4. Playing Game

- [ ] Click "Start Game"
- [ ] Loading indicator
- [ ] AP deducted from balance
- [ ] Game loads
- [ ] Play and complete game
- [ ] Receive score
- [ ] Claim reward
- [ ] MON balance increases

#### 5. Edge Cases

- [ ] Try to play with insufficient AP
- [ ] Alert shows "Insufficient AP"
- [ ] Suggests buying more
- [ ] "Buy AP" button in alert
- [ ] Try to purchase invalid amount (<100)
- [ ] Error shown
- [ ] Try to purchase non-multiple of 100
- [ ] Error shown
- [ ] Play 20 games in 1 hour
- [ ] 21st game fails (rate limit)

---

## 🔍 Step 6: Verify Everything

### Contract Verification Checklist:

- [ ] APToken deployed correctly
- [ ] GameRewards deployed correctly
- [ ] MockMON deployed correctly
- [ ] FlashMobV2 deployed correctly
- [ ] APToken.gameRewards = GameRewards address
- [ ] GameRewards.apToken = APToken address
- [ ] GameRewards.monToken = MockMON address
- [ ] Can claim 1000 AP airdrop
- [ ] Cannot claim airdrop twice
- [ ] Can purchase AP with MON (100 MON = 1000 AP)
- [ ] Can start game (AP burned)
- [ ] Can claim reward (MON distributed)
- [ ] Rate limiting works (20 games/hour)

### UI Verification Checklist:

- [ ] Wallet shows AP balance
- [ ] Wallet shows MON balance
- [ ] "+ Buy AP" button works
- [ ] APPurchaseModal displays correctly
- [ ] Exchange rate clear (100 MON = 1000 AP)
- [ ] Purchase validation works
- [ ] Purchase completes successfully
- [ ] Balances update in real-time
- [ ] GameModal shows AP cost
- [ ] Insufficient AP blocks game start
- [ ] AP deducted when game starts
- [ ] Game completion gives MON reward

### Economy Verification:

- [ ] Initial airdrop: 1000 AP
- [ ] Exchange rate: 100 MON → 1000 AP
- [ ] Easy game cost: 10 AP
- [ ] Medium game cost: 25 AP
- [ ] Hard game cost: 50 AP
- [ ] Easy game reward: ~50 MON
- [ ] Medium game reward: ~125 MON
- [ ] Hard game reward: ~250 MON

---

## 🐛 Troubleshooting

### Foundry Not Found

**Error**: `forge: command not found`
**Fix**: Install Foundry using instructions in Prerequisites

### Deployment Failed - Insufficient Gas

**Error**: `Transaction reverted: insufficient funds`
**Fix**: Get more testnet MON from faucet

### Contract Verification Failed

**Error**: `Contract not verified`
**Fix**: Wait 1-2 minutes, check block explorer manually

### App Can't Connect to Contracts

**Error**: `Contract call failed`
**Fix**:

1. Verify contract addresses in `.env`
2. Restart Metro bundler: `npm start -- --reset-cache`
3. Check RPC URL is correct
4. Ensure wallet connected to Monad testnet

### AP Balance Not Showing

**Fix**:

1. Check `wallet.tsx` includes AP card (lines 99-125)
2. Check `useUserStore` has `apBalance` field
3. Check `apTokenService.getAPBalance()` working
4. Verify contract address correct

### Purchase Button Disabled

**Fix**:

1. Check MON balance >= amount
2. Check amount is multiple of 100
3. Check amount >= 100
4. Clear app cache and restart

---

## 📊 Testing Dashboard

### Quick Status Check:

```bash
# Check all balances at once
echo "=== Contract Balances ==="
echo "Your Address: $YOUR_ADDRESS"
echo ""
echo "AP Balance:"
cast call $AP_TOKEN_ADDRESS "balanceOf(address)(uint256)" $YOUR_ADDRESS --rpc-url https://testnet-rpc.monad.xyz
echo ""
echo "MON Balance:"
cast call $MOCK_MON_ADDRESS "balanceOf(address)(uint256)" $YOUR_ADDRESS --rpc-url https://testnet-rpc.monad.xyz
echo ""
echo "Games Played:"
cast call $GAME_REWARDS_ADDRESS "userGameCount(address)(uint256)" $YOUR_ADDRESS --rpc-url https://testnet-rpc.monad.xyz
echo ""
echo "Has Claimed Airdrop:"
cast call $AP_TOKEN_ADDRESS "hasClaimedAirdrop(address)(bool)" $YOUR_ADDRESS --rpc-url https://testnet-rpc.monad.xyz
```

### Get User Stats:

```bash
cast call $GAME_REWARDS_ADDRESS \
  "getUserGameStats(address)(uint256,uint256,uint256)" \
  $YOUR_ADDRESS \
  --rpc-url https://testnet-rpc.monad.xyz
```

Returns:

- Total games played
- Games in current hour
- Last game timestamp

---

## ✅ Final Checklist

### Pre-Deployment:

- [ ] Foundry installed
- [ ] `.env` configured
- [ ] Private key secured
- [ ] Testnet MON obtained
- [ ] All contracts compile

### Post-Deployment:

- [ ] All contracts deployed
- [ ] Addresses saved
- [ ] `.env` updated
- [ ] `config.ts` updated
- [ ] Contracts verified on explorer

### Testing Complete:

- [ ] Airdrop claim works
- [ ] AP purchase works
- [ ] Game start works (AP burned)
- [ ] Game reward works (MON earned)
- [ ] Rate limiting works
- [ ] UI displays correctly
- [ ] All balances accurate
- [ ] Edge cases handled

### Ready for Users:

- [ ] All tests passed
- [ ] Documentation complete
- [ ] Known issues documented
- [ ] Monitoring setup
- [ ] Support channels ready

---

## 📞 Support

If you encounter issues:

1. Check troubleshooting section above
2. Review test scripts in `test_scripts/`
3. Check contract events on block explorer
4. Review app logs in Metro bundler
5. Test with fresh wallet/account

---

## 🎉 Success!

If all checklists pass, your Flash.Mob AP Token Economy is live! 🚀

Users can now:

- ✅ Claim 1000 free AP
- ✅ Purchase more AP with MON
- ✅ Play games using AP
- ✅ Earn MON rewards
- ✅ Compete on leaderboards

**Next Steps:**

- Monitor contract activity
- Gather user feedback
- Adjust economy parameters if needed
- Plan for mainnet deployment
