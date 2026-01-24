# Privy Wallet Integration Guide

## Overview

Flash.Mob now uses **Privy** for secure embedded wallet functionality. Users can connect their wallet, sign transactions, and interact with the blockchain directly from the mobile app.

## ✅ What's Integrated

### 1. **Privy Provider** ([app/\_layout.tsx](../app/_layout.tsx))

- Wraps entire app with `<PrivyProvider>`
- Configured for Anvil local testnet (Chain ID: 31337)
- Supports embedded wallet creation on login
- Theme adapts to user's color scheme

### 2. **useWallet Hook** ([src/hooks/useWallet.ts](../src/hooks/useWallet.ts))

- **connect()**: Opens Privy login flow
- **disconnect()**: Logs out and clears wallet
- **signMessage()**: Signs arbitrary messages
- **sendTransaction()**: Sends blockchain transactions
- **walletClient**: Viem wallet client for advanced usage
- **address**: User's connected wallet address

### 3. **Blockchain Transaction Hooks** ([src/hooks/useBlockchain.ts](../src/hooks/useBlockchain.ts))

- **useClaimAirdrop()**: Claim 1,000 AP airdrop
- **usePurchaseAP()**: Purchase AP with MON tokens
- **useStartGame()**: Start game session (burns AP)
- **useClaimReward()**: Claim game rewards with backend signature
- **useClaimDrop()**: Claim location drops with signature

### 4. **Smart Contract Integration**

All contracts deployed and tested ✅:

- APToken: `0x2e234DAe75C793f67A35089C9d99245E1C58470b`
- GameRewards: `0xF62849F9A0B5Bf2913b396098F7c7019b51A820a`
- FlashMobV2: `0x5991A2dF15A8F6A256D3Ec51E99254Cd3fb576A9`
- MockMON: `0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f`

---

## 🚀 Setup Instructions

### Step 1: Get Privy App ID

1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Create a new app or use existing one
3. Copy your **App ID** (looks like: `clxyz123456789abcdef`)
4. Add it to `.env`:
   ```bash
   EXPO_PUBLIC_PRIVY_APP_ID=your_app_id_here
   ```

### Step 2: Configure Allowed Domains (Privy Dashboard)

In your Privy app settings, add these origins:

- `exp://localhost:8081` (Expo development)
- `http://localhost:19006` (Web development)
- Your production app URL when deployed

### Step 3: Start Anvil Local Testnet

```bash
# In WSL terminal
cd /mnt/c/Users/LENOVO/Desktop/flash.mob/contracts
~/.foundry/bin/anvil
```

Keep this running in the background. It provides the blockchain at `http://localhost:8545`.

### Step 4: Verify Contract Addresses

The `.env` file has the deployed contract addresses from our successful test run:

```env
EXPO_PUBLIC_AP_TOKEN_ADDRESS=0x2e234DAe75C793f67A35089C9d99245E1C58470b
EXPO_PUBLIC_GAME_REWARDS_ADDRESS=0xF62849F9A0B5Bf2913b396098F7c7019b51A820a
EXPO_PUBLIC_FLASH_MOB_ADDRESS=0x5991A2dF15A8F6A256D3Ec51E99254Cd3fb576A9
```

These are from Anvil and will reset if you restart Anvil. For persistent addresses, deploy to Monad testnet.

### Step 5: Start the App

```bash
npm run dev
```

---

## 📱 Usage Examples

### Example 1: Connect Wallet (in any component)

```typescript
import { useWallet } from '@/src/hooks/useWallet';

function MyComponent() {
  const { connect, disconnect, address, isConnected } = useWallet();

  return (
    <View>
      {!isConnected ? (
        <Button title="Connect Wallet" onPress={connect} />
      ) : (
        <>
          <Text>Connected: {address}</Text>
          <Button title="Disconnect" onPress={disconnect} />
        </>
      )}
    </View>
  );
}
```

### Example 2: Claim Airdrop

```typescript
import { useClaimAirdrop } from '@/src/hooks/useBlockchain';

function AirdropButton() {
  const { claimAirdrop, isLoading, error, txHash } = useClaimAirdrop();

  const handleClaim = async () => {
    const hash = await claimAirdrop();
    if (hash) {
      console.log('Success! Transaction:', hash);
      // Update UI, show success message
    }
  };

  return (
    <Button
      title={isLoading ? "Claiming..." : "Claim 1,000 AP"}
      onPress={handleClaim}
      disabled={isLoading}
    />
  );
}
```

### Example 3: Start Game with Blockchain

```typescript
import { useStartGame } from '@/src/hooks/useBlockchain';

function GameStartButton({ sessionId, gameType, difficulty }) {
  const { startGame, isLoading } = useStartGame();

  const handleStart = async () => {
    const hash = await startGame(sessionId, gameType, difficulty);
    if (hash) {
      console.log('Game started on-chain:', hash);
      // Proceed with game
    }
  };

  return (
    <Button
      title={isLoading ? "Starting..." : "Start Game"}
      onPress={handleStart}
    />
  );
}
```

### Example 4: Purchase AP with MON

```typescript
import { usePurchaseAP } from '@/src/hooks/useBlockchain';
import { parseUnits } from 'viem';

function PurchaseButton() {
  const { purchaseAP, isLoading } = usePurchaseAP();

  const handlePurchase = async () => {
    // Purchase 100 MON worth of AP (gets 1,000 AP)
    const monAmount = parseUnits('100', 18); // 100 MON in wei
    const hash = await purchaseAP(monAmount);
    if (hash) {
      console.log('AP purchased:', hash);
    }
  };

  return (
    <Button
      title={isLoading ? "Purchasing..." : "Buy 1,000 AP (100 MON)"}
      onPress={handlePurchase}
    />
  );
}
```

---

## 🔐 Security Considerations

### Embedded Wallets

- Privy creates an embedded wallet for each user automatically
- Private keys are securely managed by Privy (not exposed to app)
- Users can optionally link external wallets later

### Backend Signatures

- Game rewards require backend signature verification (EIP-712)
- Backend private key: `0x1234` (for testing only!)
- **IMPORTANT**: Use a secure key in production and keep it secret
- Trusted signer address: `0xCf03Dd0a894Ef79CB5b601A43C4b25E3Ae4c67eD`

### Transaction Security

- All transactions signed by user's wallet
- No private keys stored in app
- Users approve each transaction via Privy UI

---

## 🧪 Testing

### Test Blockchain Features

1. **Start Anvil** (in WSL):

   ```bash
   cd /mnt/c/Users/LENOVO/Desktop/flash.mob/contracts
   ~/.foundry/bin/anvil
   ```

2. **Run App**:

   ```bash
   npm run dev
   ```

3. **Test Flow**:
   - Connect wallet in app
   - Claim airdrop (1,000 AP)
   - Purchase AP with MON
   - Start a game (burns AP)
   - Complete game and claim reward

### Run Smart Contract Tests

```bash
cd contracts
forge test -vv
```

All 8 tests should pass ✅.

---

## 🐛 Troubleshooting

### "Failed to connect wallet"

- Check Privy App ID in `.env`
- Verify allowed domains in Privy Dashboard
- Check internet connection

### "Transaction failed"

- Ensure Anvil is running on port 8545
- Check contract addresses in `.env`
- Verify wallet has enough ETH for gas

### "GameRewards service not initialized"

- Check `EXPO_PUBLIC_AP_TOKEN_ADDRESS` and `EXPO_PUBLIC_GAME_REWARDS_ADDRESS` in `.env`
- Restart app after changing `.env`

### Anvil Resets / Addresses Change

- Anvil resets state on restart
- Contract addresses change with each Anvil restart
- For persistent state, deploy to Monad testnet

---

## 📊 Transaction Flow Diagram

```
User Opens App
    ↓
[Connect Wallet via Privy]
    ↓
User sees wallet address & balance
    ↓
[Claim Airdrop Button] → Sign Transaction → 1,000 AP credited
    ↓
[Start Game Button] → Sign Transaction → 10-50 AP burned
    ↓
[Complete Game] → Backend signs reward → User claims
    ↓
[Claim Reward Button] → Sign Transaction → MON tokens received
```

---

## 🚢 Deployment to Production

### For Monad Testnet:

1. Update `.env`:

   ```env
   EXPO_PUBLIC_CHAIN_ID=10143
   EXPO_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
   ```

2. Deploy contracts:

   ```bash
   npm run contracts:deploy:testnet
   ```

3. Update contract addresses in `.env`

4. Update Privy chain config in `app/_layout.tsx`:

   ```typescript
   supportedChains: [
     {
       id: 10143,
       name: 'Monad Testnet',
       network: 'monad-testnet',
       // ... rest of config
     },
   ],
   ```

5. Test thoroughly before production!

---

## ✅ Integration Complete!

Your Flash.Mob app now has:

- ✅ Secure wallet connection via Privy
- ✅ Real blockchain transactions
- ✅ AP token economy (airdrop + purchase)
- ✅ Game session management on-chain
- ✅ Reward claiming with signatures
- ✅ Location drop claiming

**Next Steps:**

1. Get Privy App ID
2. Test wallet connection
3. Test transaction flows
4. Deploy to Monad testnet (optional)
5. Build and test on device

---

**Questions?** Check:

- [Privy Docs](https://docs.privy.io/)
- [Viem Docs](https://viem.sh/)
- [Flash.Mob Test Results](../contracts/TEST_RESULTS_FINAL.md)
