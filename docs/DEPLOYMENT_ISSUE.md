# 🚨 Deployment Status - WSL Networking Issue

## What Happened

✅ **Good News:**

- Contracts compiled successfully
- Simulation worked (addresses generated)
- Your deployer wallet has 10 MON (enough!)

❌ **Bad News:**

- WSL can't connect to Monad testnet RPC
- Error: "Connection timed out"
- Contracts simulated but NOT deployed on-chain

## Simulated Contract Addresses

```
MockMON:      0x42E754A17f2820A5b79BF1bA3e60C10aBd892d6f
APToken:      0x881ec9Bc557E94865746621aAd6DB7A157bd08f6
GameRewards:  0x11A052Fd405f604Db85aF9C3F2232d7c4f2f58Dc
FlashMobV2:   0xDE6ea7ED09E444eB7b79EE95BEbc1da255609016
```

**⚠️ These addresses are NOT on-chain yet!**

---

## Option 1: Fix WSL Networking (Quick Try)

```powershell
# Try with DNS workaround
$cmd = "cd /mnt/c/Users/LENOVO/Desktop/flash.mob/contracts; PRIVATE_KEY=$env:PRIVATE_KEY ~/.foundry/bin/forge script script/Deploy.s.sol:DeployScript --rpc-url http://testnet-rpc.monad.xyz --broadcast --legacy --slow -vvv"

wsl bash -c $cmd
```

If that fails, try:

```powershell
# Restart WSL networking
wsl --shutdown
wsl

# Then run deploy again
.\deploy-simple.ps1
```

---

## Option 2: Deploy from Windows PowerShell (Recommended)

**Install Foundry on Windows:**

```powershell
# Download foundryup
curl -L https://foundry.paradigm.xyz | bash

# Run foundryup (install forge)
foundryup
```

Then deploy:

```powershell
cd contracts
forge script script/Deploy.s.sol:DeployScript `
  --rpc-url https://testnet-rpc.monad.xyz `
  --private-key $env:PRIVATE_KEY `
  --broadcast `
  --legacy `
  -vvv
```

---

## Option 3: Use Remix IDE (Easiest)

1. **Go to Remix:** https://remix.ethereum.org/
2. **Upload contracts:**
   - MockMON.sol
   - FlashMobV2.sol
   - APToken.sol
   - GameRewards.sol
3. **Connect MetaMask:**
   - Make sure you're on Monad Testnet
4. **Deploy manually:**
   - Deploy MockMON first
   - Deploy FlashMobV2 (pass MockMON address, your address, 24)
   - Deploy APToken (pass MockMON address, your address)
   - Deploy GameRewards (pass APToken, MockMON, your address, your address)
5. **Configure:**
   - Call `apToken.setGameRewardsContract(gameRewardsAddress)`
   - Call `token.approve(flashMobAddress, 100000000000000000000000)`
   - Call `flashMob.deposit(100000000000000000000000)`
6. **Copy addresses** to .env

---

## Option 4: Deploy via VPS/Cloud

If you have access to a Linux server:

```bash
# SSH into server
ssh your-server

# Install forge
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Upload your project
scp -r flash.mob your-server:~/

# Deploy
cd flash.mob/contracts
PRIVATE_KEY=0x... forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast \
  --legacy \
  -vvv
```

---

## Temporary Workaround: Use Local Anvil

If you just want to test the app now:

```powershell
# Terminal 1: Start Anvil local blockchain
wsl bash -c "cd /mnt/c/Users/LENOVO/Desktop/flash.mob/contracts && ~/.foundry/bin/anvil"

# Terminal 2: Deploy to local
wsl bash -c "cd /mnt/c/Users/LENOVO/Desktop/flash.mob/contracts && PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 ~/.foundry/bin/forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast -vvv"
```

Then update .env:

```
EXPO_PUBLIC_CHAIN_ID=31337
EXPO_PUBLIC_RPC_URL=http://localhost:8545
# Use the deployed addresses from output
```

---

## What I Recommend

**For Testing:** Use Anvil local (Option 5)
**For Hackathon Demo:** Use Remix IDE (Option 3) - easiest and reliable

---

## Once Deployed (Any Method)

Update both .env files:

**.env (frontend):**

```bash
EXPO_PUBLIC_MOCK_MON_ADDRESS=0x...
EXPO_PUBLIC_AP_TOKEN_ADDRESS=0x...
EXPO_PUBLIC_GAME_REWARDS_ADDRESS=0x...
EXPO_PUBLIC_FLASH_MOB_ADDRESS=0x...
```

**backend/.env:**

```bash
FLASHMOB_CONTRACT=0x...
AP_TOKEN_CONTRACT=0x...
GAME_REWARDS_CONTRACT=0x...
```

Then restart:

```powershell
# Terminal 1
cd backend
npm run dev

# Terminal 2
npm run dev
```

---

## Verification

Once deployed, verify on explorer:
https://explorer.testnet.monad.xyz/address/YOUR_CONTRACT_ADDRESS

Should show:

- Contract creation transaction
- Balance (150k MON for FlashMob + GameRewards)
- Contract code
