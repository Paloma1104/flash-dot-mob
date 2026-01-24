# 🔍 Flash.Mob Project Analysis: Mock vs Real Blockchain Connections

## Executive Summary

**Current Status**: The project is in **HYBRID STATE** - some components are blockchain-connected, some use mock data, and some have incomplete connections (open-ended).

---

## 📊 Component Analysis by Category

### ✅ **FULLY BLOCKCHAIN-CONNECTED** (Web3)

#### 1. **Smart Contracts**

- **Location**: `contracts/`
- **Status**: ✅ Deployed & Tested
- **Contracts**:
  - `MockMON.sol` - Testnet token (real blockchain, mock name)
  - `APToken.sol` - Activity Points ERC20
  - `GameRewards.sol` - Game session management
  - `FlashMobV2.sol` - Drop claiming
- **Connection**: Direct blockchain via Foundry/Forge
- **Verdict**: **100% Web3**

#### 2. **AP Token Service**

- **Location**: `src/services/blockchain/apTokenService.ts`
- **Functions**:
  - ✅ `getAPBalance()` - Reads from blockchain via viem
  - ✅ `claimAirdrop()` - Writes to blockchain
  - ✅ `purchaseAP()` - Writes to blockchain
  - ✅ `getGameCost()` - Reads from blockchain
- **Connection**: Uses `viem` public client with RPC
- **Verdict**: **100% Web3** ✅

#### 3. **User Store (AP Balance)**

- **Location**: `src/stores/userStore.ts`
- **AP Tracking**:
  - ✅ `apBalance` - Synced with blockchain via apTokenService
  - ✅ `deductAP()` - Optimistic update (needs blockchain confirmation)
- **Connection**: Indirect via apTokenService
- **Verdict**: **Web3 with optimistic UI** ✅

#### 4. **Wallet Integration (Privy)**

- **Location**: `src/hooks/useWallet.ts`
- **Current State**: ⚠️ **MOCK IMPLEMENTATION**
- **Needs Replacement**:

```typescript
// TODO: Replace with actual Privy SDK
const mockAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976f";
```

- **Verdict**: **Web2 Mock (needs Web3 integration)** ❌

---

### ⚠️ **HYBRID/INCOMPLETE** (Mixed Web2/Web3)

#### 5. **Drop Claiming System**

- **Location**: `src/hooks/useClaim.ts`
- **Current Flow**:
  1. ✅ Gets GPS location (Web2 sensor)
  2. ✅ Signs message with wallet (Web3 - mock)
  3. ❌ **Open-ended**: Submits to backend (not implemented)
  4. ❌ **Mock**: Generates fake transaction hash

```typescript
// Line 83: TODO: Replace with actual blockchain transaction
await new Promise((resolve) => setTimeout(resolve, 1500));
const txHash = `0x${Math.random().toString(16).slice(2)}`; // FAKE!
```

- **Verdict**: **Open-ended connection** ⚠️ **NEEDS BACKEND**

#### 6. **Game Store (Session Management)**

- **Location**: `src/stores/gameStore.ts`
- **Current State**:
  - ✅ Deducts AP optimistically (local)
  - ❌ **Open-ended**: Should call GameRewards.startGame()

```typescript
// Line 75: TODO: Call smart contract to burn AP tokens on-chain
// const apService = getAPTokenService();
// await apService.startGame(session.id, gameDrop.gameType, gameDrop.difficulty);
```

- **Verdict**: **Missing blockchain integration** ❌

---

### ❌ **FULLY MOCK** (Web2 Only)

#### 7. **Drop Discovery API**

- **Location**: `src/services/api/mockApi.ts`
- **Flag**: `const USE_MOCK_DATA = true;`
- **Mock Functions**:
  - `getDrops()` - Generates fake drops
  - `claimDrop()` - Fake claim submission
  - `getLeaderboard()` - Mock leaderboard data
- **Usage**:
  - `src/hooks/useDrops.ts` calls `generateMockDrops()`
  - `src/utils/geo.ts` has `generateMockDrops()`
- **Verdict**: **100% Mock** ❌ **NEEDS BACKEND**

#### 8. **Backend API Client**

- **Location**: `src/services/api/client.ts` & `endpoints.ts`
- **Status**: Structure exists but NOT USED
- **API Base URL**: `https://api.flashmob.io` (not implemented)
- **Endpoints Defined**:
  - `/drops` - Get drops near location
  - `/claims` - Submit drop claim
  - `/leaderboard` - Get rankings
  - `/users/:address/claims` - Claim history
- **Current State**:

```typescript
// Line 35: TODO: Get from secure storage or auth provider
function getAuthToken(): string | null {
  return null;
}
```

- **Verdict**: **Backend not implemented** ❌

#### 9. **Game Drops on Map**

- **Location**: `src/utils/gameDropGenerator.ts`
- **Function**: `generateMockGameDrops()`
- **What it does**: Creates fake game locations around user
- **Verdict**: **100% Mock** ❌

#### 10. **Leaderboard**

- **Location**: `src/services/api/mockApi.ts` (lines 55-80)
- **Function**: `initLeaderboard()`
- **Data**: Hardcoded fake addresses

```typescript
const addresses = [
  "0x1234...abcd",
  "0x5678...efgh", // FAKE!
];
```

- **Verdict**: **100% Mock** ❌ **NEEDS BLOCKCHAIN INDEXER**

---

## 🔴 **CRITICAL OPEN-ENDED CONNECTIONS**

### 1. **Drop Claiming Flow** ⚠️ HIGH PRIORITY

**Problem**: Claims are not being written to blockchain

```typescript
// src/hooks/useClaim.ts:83
// TODO: Replace with actual blockchain transaction
await new Promise((resolve) => setTimeout(resolve, 1500)); // FAKE DELAY
const txHash = `0x${Math.random().toString(16).slice(2)}`; // FAKE HASH
```

**What's missing**:

- Backend service to verify GPS + signature
- Call to `FlashMobV2.claimDrop()` smart contract
- EIP-712 signature from trusted backend signer

**Impact**: Users can "claim" drops but nothing happens on-chain

---

### 2. **Game Session Start** ⚠️ HIGH PRIORITY

**Problem**: Games don't burn AP on blockchain

```typescript
// src/stores/gameStore.ts:75
// TODO: Call smart contract to burn AP tokens on-chain
// Missing: await apService.startGame(...)
```

**What's missing**:

- Call to `GameRewards.startGame()`
- Approval for GameRewards to burn AP tokens
- Session ID tracking on-chain

**Impact**: AP deducted locally but not on blockchain

---

### 3. **Game Reward Claiming** ⚠️ MEDIUM PRIORITY

**Problem**: No way to claim MON rewards after winning

```typescript
// GameRewards.claimReward() exists but not integrated
```

**What's missing**:

- Backend to generate EIP-712 signature for rewards
- Frontend integration to call `claimReward()`
- Reward calculation based on game score

**Impact**: Users can play games but can't get MON rewards

---

### 4. **Wallet Authentication** ⚠️ MEDIUM PRIORITY

**Problem**: Using hardcoded mock wallet

```typescript
// src/hooks/useWallet.ts:35
const mockAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976f";
```

**What's missing**:

- Privy SDK integration
- Real wallet connection
- Signature verification

**Impact**: All users share same wallet address

---

## 📋 **WHERE "MOCK" IS USED**

| File                             | Purpose                | Status                   |
| -------------------------------- | ---------------------- | ------------------------ |
| `contracts/MockMON.sol`          | Testnet token          | ✅ Acceptable (testnet)  |
| `src/services/api/mockApi.ts`    | Mock backend responses | ❌ Replace with real API |
| `src/utils/geo.ts`               | Mock drop generation   | ❌ Replace with backend  |
| `src/utils/gameDropGenerator.ts` | Mock game drops        | ❌ Replace with backend  |
| `src/hooks/useWallet.ts`         | Mock wallet (Privy)    | ❌ Integrate Privy SDK   |
| `src/hooks/useClaim.ts`          | Mock transaction       | ❌ Call smart contract   |
| `src/hooks/useDrops.ts`          | Mock drop fetching     | ❌ Call backend API      |

---

## 🎯 **ACTION PLAN TO CLOSE ALL CONNECTIONS**

### Phase 1: Fix Game Economy (Highest Priority)

```typescript
// 1. Integrate GameRewards.startGame() in gameStore.ts
startGame: async (gameDrop: GameDrop) => {
  // ✅ Already deducts AP locally
  userStore.deductAP(gameDrop.apCost);

  // ❌ ADD: Call blockchain
  const apService = getAPTokenService();
  await apService.startGame(
    session.id,
    gameDrop.gameType,
    gameDrop.difficulty,
    userAddress,
  );
};

// 2. Add startGame() to apTokenService.ts
export async function startGame(
  sessionId: string,
  gameType: string,
  difficulty: string,
  userAddress: string,
): Promise<{ success: boolean; txHash?: string }> {
  // Approve GameRewards to burn AP
  // Call GameRewards.startGame()
}
```

### Phase 2: Implement Backend Services

```typescript
// Backend needed for:
// 1. Drop creation & verification
// 2. GPS proximity verification
// 3. EIP-712 signature generation
// 4. Leaderboard indexing

// Endpoints to create:
POST / api / drops / create; // Create drops based on activity
POST / api / claims / verify; // Verify GPS + sign claim
GET / api / drops / nearby; // Get drops from database
GET / api / leaderboard; // Index from blockchain events
POST / api / games / complete; // Verify score + sign reward
```

### Phase 3: Replace Mock Data

```typescript
// 1. Replace mockApi.ts with real API calls
// src/services/api/mockApi.ts → DELETE
// Use endpoints.ts instead

// 2. Replace generateMockDrops()
// src/utils/geo.ts → Use backend API

// 3. Replace mock wallet
// src/hooks/useWallet.ts → Integrate Privy SDK
```

### Phase 4: Connect Drop Claiming

```typescript
// src/hooks/useClaim.ts
// Replace line 83 TODO with:
const claimResult = await api.post("/claims/verify", {
  dropId,
  userAddress,
  latitude: location.latitude,
  longitude: location.longitude,
  signature,
});

// Backend signs EIP-712 claim
// Frontend calls FlashMobV2.claimDrop()
```

---

## 📊 **CONNECTION STATUS SUMMARY**

| Component        | Current          | Target             | Priority  |
| ---------------- | ---------------- | ------------------ | --------- |
| Smart Contracts  | ✅ Web3          | ✅ Web3            | -         |
| AP Token Service | ✅ Web3          | ✅ Web3            | -         |
| Wallet (Privy)   | ❌ Mock          | ✅ Web3            | 🔴 High   |
| Game Start       | ❌ Local Only    | ✅ Web3            | 🔴 High   |
| Game Rewards     | ❌ Not Connected | ✅ Web3            | 🟡 Medium |
| Drop Discovery   | ❌ Mock          | ✅ Backend + Web3  | 🔴 High   |
| Drop Claiming    | ❌ Open-ended    | ✅ Backend + Web3  | 🔴 High   |
| Leaderboard      | ❌ Mock          | ✅ Backend Indexer | 🟢 Low    |

---

## ✅ **VERDICT**

### Currently Working (Web3):

- ✅ Smart contracts deployed
- ✅ AP token balance reading
- ✅ AP purchase with MON

### Currently Mock (Web2):

- ❌ Wallet authentication (Privy)
- ❌ Drop discovery (fake drops)
- ❌ Leaderboard (fake data)

### Open-ended (Incomplete):

- ⚠️ Drop claiming (no backend signature)
- ⚠️ Game start (not calling smart contract)
- ⚠️ Game rewards (not implemented)

---

## 🚀 **NEXT STEPS**

1. **Immediate** (Close open-ended connections):
   - Add `apTokenService.startGame()` call in `gameStore.ts`
   - Add `apTokenService.claimReward()` for completed games
2. **Short-term** (Replace mocks):
   - Integrate Privy SDK in `useWallet.ts`
   - Build backend for drop verification
3. **Medium-term** (Full Web3):
   - Implement EIP-712 signing backend
   - Create blockchain event indexer for leaderboard
   - Connect all claim flows to FlashMobV2 contract

---

**Generated**: $(date)
**Status**: 🟡 Hybrid (Blockchain + Mock + Open-ended)
**Goal**: 🟢 Full Blockchain Integration
