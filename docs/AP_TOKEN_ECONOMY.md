# 🎮 AP Token Economy & Smart Contract Integration

## Overview

Flash.Mob now features a complete **Activity Points (AP)** token economy integrated with Monad blockchain smart contracts. This system enables:

- **Play-to-Earn**: Users play games using AP tokens and win MON testnet tokens
- **Token Economics**: AP tokens can be purchased with MON or claimed as an initial airdrop
- **On-Chain Gaming**: All game plays and rewards are tracked on the Monad blockchain

---

## 🪙 AP Token System

### What are AP Tokens?

**Activity Points (AP)** are ERC20 tokens used to play games in Flash.Mob. Think of them as arcade tokens - you spend them to play games and win MON rewards!

### How to Get AP Tokens

#### 1. **Initial Airdrop** (One-time)

- **Amount**: 1000 AP tokens
- **Eligibility**: Every new user can claim once
- **How**: Automatic claim when first connecting wallet

#### 2. **Purchase with MON**

- **Exchange Rate**: 100 MON = 1000 AP
- **Minimum Purchase**: 100 MON
- **How**: Use the AP Purchase Modal in the app

### AP Token Contract Features

```solidity
// Contract: APToken.sol
- Standard ERC20 token
- 18 decimals
- Symbol: AP
- Name: Activity Points
```

**Key Functions:**

- `claimInitialAirdrop()` - Claim 1000 AP (one-time)
- `purchaseAP(uint256 monAmount)` - Buy AP with MON
- `burnFrom(address, uint256)` - Burn AP for game play (only GameRewards contract)

---

## 🎯 Game Economy

### Game Costs (AP Tokens)

All games have standardized costs based on difficulty:

| Difficulty | AP Cost | MON Reward Range |
| ---------- | ------- | ---------------- |
| **Easy**   | 10 AP   | 5-12 MON         |
| **Medium** | 25 AP   | 15-28 MON        |
| **Hard**   | 50 AP   | 32-60 MON        |

### Game Rewards (MON Testnet)

Rewards are distributed in MON testnet tokens:

| Game            | Easy   | Medium | Hard   |
| --------------- | ------ | ------ | ------ |
| Sudoku Master   | 10 MON | 25 MON | 50 MON |
| Memory Match    | 8 MON  | 20 MON | 40 MON |
| 2048 Challenge  | 12 MON | 28 MON | 60 MON |
| Tic-Tac-Toe     | 5 MON  | 15 MON | 35 MON |
| Color Memory    | 7 MON  | 18 MON | 38 MON |
| Word Scramble   | 6 MON  | 16 MON | 32 MON |
| Math Master     | 8 MON  | 20 MON | 45 MON |
| Pattern Lock    | 9 MON  | 22 MON | 48 MON |
| Simon Says      | 7 MON  | 19 MON | 42 MON |
| Spot Difference | 10 MON | 24 MON | 50 MON |

### ROI Analysis

| Difficulty | Cost            | Avg Reward | ROI          | Break-even |
| ---------- | --------------- | ---------- | ------------ | ---------- |
| Easy       | 10 AP (100 MON) | 8 MON      | -20% to +20% | ~13 wins   |
| Medium     | 25 AP (250 MON) | 20 MON     | -20% to +12% | ~13 wins   |
| Hard       | 50 AP (500 MON) | 45 MON     | -10% to +20% | ~12 wins   |

**Note**: Win consistently to profit! The system rewards skilled players.

---

## 📜 Smart Contracts

### Deployed Contracts (Monad Testnet)

```
Network: Monad Testnet
Chain ID: 10143
RPC: https://testnet-rpc.monad.xyz
```

#### 1. APToken

- **Purpose**: Activity Points ERC20 token
- **Address**: `TBD` (deploy with `npm run contracts:deploy:testnet`)
- **Features**:
  - Initial 1000 AP airdrop per user
  - Purchase at 100 MON = 1000 AP
  - Burn mechanism for game plays

#### 2. GameRewards

- **Purpose**: Manage game sessions and rewards
- **Address**: `TBD` (deploy with `npm run contracts:deploy:testnet`)
- **Features**:
  - Start game (burns AP from user)
  - Claim rewards (distributes MON)
  - Anti-cheat: Rate limiting (20 plays/hour)
  - Session tracking to prevent double claims

#### 3. MockMON

- **Purpose**: Testnet MON token for testing
- **Address**: `TBD`
- **Features**: Standard ERC20 with minting

#### 4. FlashMobV2

- **Purpose**: Location-based drop claiming
- **Address**: `TBD`
- **Features**: Signature-verified claims, Merkle batch claims

---

## 🔄 User Flow

### 1. New User Onboarding

```
1. Connect wallet → Auto-receive 1000 AP
2. Navigate to map → See game drops
3. Select game → Check AP balance
4. Play game → AP burned, score recorded
5. Win game → Receive MON reward
```

### 2. Purchasing More AP

```
1. Run out of AP → Click "Buy AP"
2. Choose amount (100, 500, 1000, 5000 MON)
3. Approve MON transfer
4. Receive AP tokens (instant)
```

### 3. Playing a Game

```
1. Select game drop on map
2. View game details (cost, reward, difficulty)
3. Click "Start Game"
   → Smart contract burns AP
   → Game starts
4. Complete game
   → Backend verifies score
   → Backend signs reward
5. Claim reward
   → Smart contract transfers MON
```

---

## 🛡️ Anti-Cheat Measures

### Rate Limiting

- **Max plays per hour**: 20 games
- **Enforced by**: GameRewards smart contract
- **Reset**: Every hour

### Signature Verification

- **Backend signs**: Session ID, score, reward amount
- **On-chain verification**: EIP-712 typed signatures
- **Prevents**: Score manipulation, fake rewards

### Session Tracking

- **Unique session ID** per game
- **One claim per session** enforced on-chain
- **Replay protection** via user nonces

---

## 🔧 Integration Guide

### Environment Variables

Add to your `.env` file:

```bash
# Contract Addresses (after deployment)
EXPO_PUBLIC_AP_TOKEN_ADDRESS=0x...
EXPO_PUBLIC_GAME_REWARDS_ADDRESS=0x...
EXPO_PUBLIC_MON_TOKEN_ADDRESS=0x...
EXPO_PUBLIC_DROP_CLAIMER_ADDRESS=0x...

# RPC
EXPO_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
```

### Deployment

```bash
# Build contracts
npm run contracts:build

# Deploy to Monad testnet
npm run contracts:deploy:testnet

# Update .env with deployed addresses
```

### Initialize Services

```typescript
import { initAPTokenService } from "@/services/blockchain/apTokenService";

// Initialize with deployed contract addresses
initAPTokenService(
  process.env.EXPO_PUBLIC_AP_TOKEN_ADDRESS as `0x${string}`,
  process.env.EXPO_PUBLIC_GAME_REWARDS_ADDRESS as `0x${string}`,
);
```

---

## 📊 Contract Interactions

### Check AP Balance

```typescript
import { getAPTokenService } from "@/services/blockchain/apTokenService";

const apService = getAPTokenService();
const balance = await apService.getAPBalance(userAddress);
console.log(`AP Balance: ${balance}`);
```

### Purchase AP Tokens

```typescript
// User must approve MON first
const monAmount = "500"; // 500 MON
const txData = await apService.purchaseAP(monAmount, userAddress);
// Send transaction via wallet
```

### Start Game

```typescript
const sessionId = `session-${Date.now()}`;
const gameType = "SUDOKU";
const difficulty = "medium";

const txData = await apService.startGame(
  sessionId,
  gameType,
  difficulty,
  userAddress,
);
// AP tokens are burned
```

### Check Game Stats

```typescript
const stats = await apService.getUserGameStats(userAddress);
console.log({
  gamesPlayed: stats.gamesPlayed,
  gamesWon: stats.gamesWon,
  totalAPSpent: stats.totalAPSpent,
  totalMONEarned: stats.totalMONEarned,
});
```

---

## 🎨 UI Components

### APPurchaseModal

Located at: `src/components/ui/APPurchaseModal.tsx`

**Features:**

- Display exchange rate (100 MON = 1000 AP)
- Show current MON and AP balances
- Quick amount buttons (100, 500, 1000, 5000)
- Preview purchase before confirming
- Handle transaction flow

**Usage:**

```tsx
import { APPurchaseModal } from "@/components/ui/APPurchaseModal";

<APPurchaseModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onPurchase={(monSpent, apReceived) => {
    console.log(`Purchased ${apReceived} AP for ${monSpent} MON`);
  }}
/>;
```

### GameModal Updates

- Displays AP cost before starting game
- Shows warning if insufficient AP balance
- Blocks game start if AP balance < cost
- Suggests purchasing AP if needed

---

## 🧪 Testing

### Local Testing

```bash
# Test contracts
cd contracts
forge test -vvv

# Specific test
forge test --match-test testPurchaseAP -vvv
```

### Testnet Testing

1. Get testnet MON from faucet
2. Connect wallet to Monad testnet
3. Claim initial 1000 AP
4. Play games to test economy
5. Purchase more AP to test exchange

---

## 📈 Economics Dashboard (Future)

Track your gaming economy:

- **Total AP Spent**: Lifetime AP burned
- **Total MON Earned**: Lifetime earnings
- **Win Rate**: % of games won
- **ROI**: (MON earned / MON spent on AP) \* 100
- **Favorite Game**: Most played game type

---

## 🚀 Deployment Checklist

- [ ] Deploy APToken contract
- [ ] Deploy GameRewards contract
- [ ] Deploy MockMON (testnet only)
- [ ] Deploy FlashMobV2
- [ ] Link APToken ↔ GameRewards (setGameRewardsContract)
- [ ] Fund GameRewards with MON for rewards
- [ ] Update environment variables
- [ ] Test airdrop claim
- [ ] Test AP purchase
- [ ] Test game flow end-to-end
- [ ] Verify on Monad Explorer

---

## 💡 Future Enhancements

1. **NFT Rewards**: Special NFTs for high scores
2. **Leaderboards**: On-chain leaderboard tracking
3. **Tournaments**: Scheduled competitions with prize pools
4. **Staking**: Stake AP to earn MON passively
5. **Governance**: Vote on game additions with AP
6. **Referrals**: Earn AP for inviting friends
7. **Daily Quests**: Bonus AP for completing challenges

---

## 🔗 Links

- [Monad Docs](https://docs.monad.xyz)
- [Monad Testnet Explorer](https://testnet.monadexplorer.com)
- [Contract Source Code](./contracts/)
- [API Documentation](../docs/)

---

## ❓ FAQ

**Q: What happens if I lose a game?**  
A: You lose the AP you spent but earn no MON reward. Choose your difficulty wisely!

**Q: Can I get a refund on AP?**  
A: No, AP is burned when starting a game. This is enforced by the smart contract.

**Q: How often can I play?**  
A: Up to 20 games per hour (rate limit to prevent abuse).

**Q: Can I transfer AP to friends?**  
A: Yes! AP is a standard ERC20 token, so you can transfer it to any address.

**Q: Will there be a mainnet version?**  
A: Yes! Once Monad mainnet launches, we'll migrate to real MON tokens.

---

Built with ⚡ on Monad - The fastest EVM blockchain

