# 🗺️ Flash.Mob Connection Map

## Current Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          MOBILE APP (React Native)                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
         ┌────────────────┐ ┌──────────────┐ ┌──────────────┐
         │  Wallet Hook   │ │  Game Store  │ │  Drop Store  │
         │  useWallet()   │ │              │ │              │
         │                │ │              │ │              │
         │ Status: ❌     │ │ Status: ⚠️   │ │ Status: ❌   │
         │ MOCK PRIVY     │ │ INCOMPLETE   │ │ MOCK DATA    │
         └────────┬───────┘ └──────┬───────┘ └──────┬───────┘
                  │                │                │
                  │                │                │
         ┌────────▼────────────────▼────────────────▼────────┐
         │              Services Layer                        │
         │                                                    │
         │  ┌─────────────────────────────────────────────┐  │
         │  │ apTokenService.ts           Status: ✅      │  │
         │  │ - getAPBalance()            Web3 Connected  │  │
         │  │ - claimAirdrop()                            │  │
         │  │ - purchaseAP()                              │  │
         │  └─────────────────────────────────────────────┘  │
         │                                                    │
         │  ┌─────────────────────────────────────────────┐  │
         │  │ mockApi.ts                  Status: ❌      │  │
         │  │ USE_MOCK_DATA = true        Not Real        │  │
         │  │ - getDrops()          → Fake drops          │  │
         │  │ - claimDrop()         → Fake tx hash        │  │
         │  │ - getLeaderboard()    → Hardcoded data      │  │
         │  └─────────────────────────────────────────────┘  │
         │                                                    │
         │  ┌─────────────────────────────────────────────┐  │
         │  │ API Client (client.ts)      Status: ⚠️     │  │
         │  │ API_BASE_URL: api.flashmob.io               │  │
         │  │ → Backend NOT IMPLEMENTED                   │  │
         │  └─────────────────────────────────────────────┘  │
         └────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌─────────────────┐ ┌─────────┐ ┌──────────────────┐
    │  🌐 BLOCKCHAIN  │ │    ?    │ │   ❌ BACKEND    │
    │   (Monad/Anvil) │ │         │ │  (Not Exist)     │
    │                 │ │  VOID   │ │                  │
    │  Status: ✅     │ │         │ │  Status: ❌      │
    │  Deployed       │ │         │ │  Needed          │
    └─────────────────┘ └─────────┘ └──────────────────┘
            │
            │ Smart Contracts:
            │
    ┌───────▼──────────────────────────────────────────┐
    │  MockMON          0x5FbDB...                      │
    │  APToken          0xCf7Ed3...    ✅ Connected     │
    │  GameRewards      0xDc64a1...    ⚠️ Incomplete   │
    │  FlashMobV2       0x9fE467...    ❌ Not Used      │
    └──────────────────────────────────────────────────┘
```

---

## Connection Flow Analysis

### 🟢 **WORKING FLOWS** (End-to-End Connected)

#### 1. AP Purchase Flow ✅

```
User                                           Blockchain
  │                                               │
  ├─ Click "Buy AP"                               │
  │                                               │
  ├─ apTokenService.purchaseAP(500 MON)          │
  │    │                                          │
  │    ├─ Approve MON spending                   │
  │    │  └─────────────────────────────────────→│
  │    │                                   [ERC20.approve]
  │    │                                          │
  │    ├─ Call APToken.purchaseAP()               │
  │    │  └─────────────────────────────────────→│
  │    │                                   [Burns MON]
  │    │                                   [Mints 5000 AP]
  │    │                                          │
  │    ├─ Transaction confirmed                   │
  │    │  ←─────────────────────────────────────┤
  │                                               │
  ├─ Update UI balance                            │
  └─ ✅ COMPLETE                                  │
```

#### 2. AP Balance Query ✅

```
User                                           Blockchain
  │                                               │
  ├─ Open Wallet Tab                              │
  │    │                                          │
  │    ├─ apTokenService.getAPBalance()           │
  │    │  └─────────────────────────────────────→│
  │    │                             [APToken.balanceOf]
  │    │                                          │
  │    ├─ Returns: 6000 AP                        │
  │    │  ←─────────────────────────────────────┤
  │                                               │
  ├─ Display balance                              │
  └─ ✅ COMPLETE                                  │
```

---

### 🟡 **BROKEN FLOWS** (Open-ended/Incomplete)

#### 3. Game Start Flow ⚠️ INCOMPLETE

```
User                          Game Store              Blockchain
  │                               │                       │
  ├─ Tap game drop                │                       │
  │                               │                       │
  ├─ gameStore.startGame() ──────→│                       │
  │                               │                       │
  │                               ├─ Deduct AP (local)    │
  │                               │   userStore.apBalance -= 10
  │                               │                       │
  │                               ├─ ❌ TODO: Call        │
  │                               │   blockchain!         │
  │                               │                       │
  │                               │   [MISSING]           │
  │                               │   apService.startGame()│
  │                               │   ─ ─ ─ ─ ─ ─ ─ ─ ─ → X
  │                               │                    [Should call]
  │                               │                 [GameRewards.startGame]
  │                               │                       │
  ├─ Game starts (locally)        │                       │
  └─ ⚠️ AP NOT BURNED ON-CHAIN    │                       │
```

**Problem**: AP deducted in userStore but never burned on blockchain!

---

#### 4. Drop Claiming Flow ❌ COMPLETELY BROKEN

```
User                   useClaim              Backend          Blockchain
  │                       │                     │                 │
  ├─ Walk near drop       │                     │                 │
  │                       │                     │                 │
  ├─ Tap "Claim" ────────→│                     │                 │
  │                       │                     │                 │
  │                       ├─ Get GPS location   │                 │
  │                       │                     │                 │
  │                       ├─ Sign message       │                 │
  │                       │   (mock wallet)     │                 │
  │                       │                     │                 │
  │                       ├─ ❌ TODO: Submit    │                 │
  │                       │   to backend        │                 │
  │                       │   ─ ─ ─ ─ ─ ─ ─ ─ →X                 │
  │                       │                [NOT EXIST]            │
  │                       │                                       │
  │                       ├─ ❌ Generate FAKE    │                 │
  │                       │   transaction hash   │                 │
  │                       │   txHash = random()  │                 │
  │                       │                     │                 │
  ├─ Shows "Claimed!" ←──┤                     │                 │
  │   (but nothing        │                     │                 │
  │    happened!)         │                     │                 │
  └─ ❌ FAKE CLAIM        │                     │                 │
```

**Problem**: Entire claim flow is fake! Should be:

```
[User] → [GPS + Sign] → [Backend verifies] → [Backend signs EIP-712]
       → [Frontend calls FlashMobV2.claimDrop()] → [Blockchain transfer]
```

---

#### 5. Drop Discovery Flow ❌ MOCK DATA

```
User                useDrops              mockApi           Blockchain
  │                    │                     │                  │
  ├─ Open Map ────────→│                     │                  │
  │                    │                     │                  │
  │                    ├─ fetchDrops() ──────→│                  │
  │                    │                     │                  │
  │                    │                     ├─ Generate FAKE   │
  │                    │                     │   drops around    │
  │                    │                     │   user location   │
  │                    │                     │                  │
  │                    │   ←── Fake drops ───┤                  │
  │                    │                     │                  │
  ├─ See 50 drops ←───┤                     │                  │
  │   (all fake!)      │                     │                  │
  └─ ❌ MOCK DATA      │                     │                  │
```

**Problem**: Drops generated by `generateMockDrops()`, not from backend/blockchain!

---

#### 6. Leaderboard Flow ❌ HARDCODED DATA

```
User              Leaderboard Tab         mockApi             Blockchain
  │                      │                    │                    │
  ├─ Open Leaderboard ──→│                    │                    │
  │                      │                    │                    │
  │                      ├─ getLeaderboard() ─→│                    │
  │                      │                    │                    │
  │                      │                    ├─ Return hardcoded  │
  │                      │                    │   addresses:        │
  │                      │                    │   '0x1234...abcd'   │
  │                      │                    │   '0x5678...efgh'   │
  │                      │                    │                    │
  │                      │   ←── Fake data ───┤                    │
  │                      │                    │                    │
  ├─ See fake rankings ←─┤                    │                    │
  └─ ❌ FAKE LEADERBOARD │                    │                    │
```

**Problem**: Should index `GameCompleted` and `DropClaimed` events from blockchain!

---

## 🔥 **CRITICAL GAPS**

### Gap 1: No Backend Service

```
┌─────────────────────────────────────────┐
│  Missing: Backend API                    │
│                                          │
│  Needs:                                  │
│  • Drop creation service                 │
│  • GPS proximity verification            │
│  • EIP-712 signature generation          │
│  • Event indexer for leaderboard         │
│  • Game score verification               │
│                                          │
│  Impact: Drop claiming completely fake   │
└─────────────────────────────────────────┘
```

### Gap 2: Game Not Connected to Blockchain

```
┌─────────────────────────────────────────┐
│  Missing: gameStore → GameRewards        │
│                                          │
│  Should call:                            │
│  • GameRewards.startGame()               │
│  • GameRewards.claimReward()             │
│                                          │
│  Impact: Games work locally but AP not   │
│          burned on-chain, can't claim    │
│          MON rewards                     │
└─────────────────────────────────────────┘
```

### Gap 3: Wallet is Mock

```
┌─────────────────────────────────────────┐
│  Missing: Real Wallet Connection         │
│                                          │
│  Currently: Hardcoded address            │
│  '0x71C7656EC7ab88b098defB751B7401B5...' │
│                                          │
│  Should be: Privy embedded wallet        │
│                                          │
│  Impact: All users share same address,   │
│          can't do real transactions      │
└─────────────────────────────────────────┘
```

---

## 📊 **Connection Status Matrix**

| Feature            | UI  | Service    | Backend        | Smart Contract | Status             |
| ------------------ | --- | ---------- | -------------- | -------------- | ------------------ |
| **AP Balance**     | ✅  | ✅         | -              | ✅ APToken     | 🟢 Working         |
| **AP Purchase**    | ✅  | ✅         | -              | ✅ APToken     | 🟢 Working         |
| **AP Airdrop**     | ✅  | ✅         | -              | ✅ APToken     | 🟢 Working         |
| **Wallet Connect** | ✅  | ❌ Mock    | -              | -              | 🔴 Mock            |
| **Game Start**     | ✅  | ⚠️ Partial | -              | ❌ Not Called  | 🟡 Incomplete      |
| **Game Rewards**   | ✅  | ❌ Missing | ❌ No Signer   | ❌ Not Called  | 🔴 Not Implemented |
| **Drop Discovery** | ✅  | ❌ Mock    | ❌ No DB       | ❌ Not Used    | 🔴 Mock            |
| **Drop Claiming**  | ✅  | ❌ Mock    | ❌ No Verifier | ❌ Not Used    | 🔴 Mock            |
| **Leaderboard**    | ✅  | ❌ Mock    | ❌ No Indexer  | ❌ Not Indexed | 🔴 Mock            |

---

## 🎯 **Priority Fixes**

### Priority 1: Close Open-Ended Connections 🔥

1. **gameStore.startGame() → GameRewards contract**
   - File: `src/stores/gameStore.ts` line 75
   - Add: `await apTokenService.startGame(...)`
2. **gameStore.completeGame() → GameRewards.claimReward()**
   - File: `src/stores/gameStore.ts`
   - Add: Backend signature + contract call

### Priority 2: Replace Wallet Mock 🟡

1. **useWallet() → Privy SDK**
   - File: `src/hooks/useWallet.ts`
   - Replace: Mock address with Privy integration

### Priority 3: Build Backend Services 🟢

1. **Drop Verification API**
   - Verify GPS proximity
   - Sign EIP-712 claims
2. **Event Indexer**
   - Index GameCompleted events
   - Index DropClaimed events
   - Build leaderboard from events

---

**Conclusion**: Most UI exists but core blockchain connections are **OPEN-ENDED** or **MOCK**. Priority is closing the game loop first (highest user value).
