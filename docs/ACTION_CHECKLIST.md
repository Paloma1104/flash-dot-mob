# ✅ Action Checklist: Close All Open Connections

## 🔥 CRITICAL (Do First)

### [ ] 1. Connect Game Start to Blockchain

**File**: `src/stores/gameStore.ts` (line 75)

**Current**:

```typescript
// TODO: Call smart contract to burn AP tokens on-chain
```

**Fix Required**:

```typescript
// Add after line 74
try {
  const txHash = await apTokenService.startGame(
    session.id,
    gameDrop.gameType,
    gameDrop.difficulty,
    userStore.walletAddress!,
  );
  console.log("Game started on-chain:", txHash);
} catch (error) {
  // Revert local AP deduction if blockchain fails
  userStore.refundAP(gameDrop.apCost);
  set({ activeSession: null, isGameActive: false });
  throw error;
}
```

**Also Add**: `startGame()` function to `apTokenService.ts`

---

### [ ] 2. Implement Game Reward Claiming

**File**: `src/stores/gameStore.ts` (completeGame function)

**Current**: Only updates local stats

**Fix Required**:

```typescript
completeGame: (score: number, timeSpent: number) => {
  const session = get().activeSession;
  if (!session) return;

  // Calculate reward based on score
  const reward = calculateReward(session.gameType, score);

  // TODO: Call backend to get EIP-712 signature
  // const signature = await backendApi.signReward(session.id, reward, score);

  // TODO: Call GameRewards.claimReward() with signature
  // const txHash = await apTokenService.claimReward(
  //   session.id,
  //   reward,
  //   score,
  //   deadline,
  //   signature
  // );

  // For now: Mock
  console.warn("Reward claiming not implemented - using mock");

  // Update session
  const completedSession = {
    ...session,
    isCompleted: true,
    score,
    timeSpent,
    completedAt: new Date().toISOString(),
    rewardEarned: reward,
  };

  set({ activeSession: null, isGameActive: false });
  get().addRecentSession(completedSession);
};
```

---

### [ ] 3. Replace Mock Wallet with Privy

**File**: `src/hooks/useWallet.ts`

**Current**: Lines 35-46 use hardcoded mock address

**Fix Required**:

```typescript
import { usePrivy, useWallets } from "@privy-io/expo";

export function useWallet(): UseWalletReturn {
  const { login, logout: privyLogout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      await login();
      if (embeddedWallet) {
        setAuthenticated(true, embeddedWallet.address);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, [login, embeddedWallet]);

  // ... rest of implementation
}
```

---

## 🟡 HIGH PRIORITY (Do Next)

### [ ] 4. Remove Mock API Flag

**File**: `src/services/api/mockApi.ts` (line 5)

**Current**:

```typescript
const USE_MOCK_DATA = true;
```

**Fix**: Change to environment variable

```typescript
const USE_MOCK_DATA = __DEV__ && !process.env.EXPO_PUBLIC_USE_REAL_API;
```

---

### [ ] 5. Implement Drop Claiming Backend Call

**File**: `src/hooks/useClaim.ts` (line 83)

**Current**:

```typescript
// TODO: Replace with actual blockchain transaction
await new Promise((resolve) => setTimeout(resolve, 1500));
const txHash = `0x${Math.random().toString(16).slice(2)}`;
```

**Fix Required**:

```typescript
// 1. Submit to backend for verification + signature
const claimRequest = {
  dropId,
  userAddress: address,
  latitude: location.latitude,
  longitude: location.longitude,
  accuracy: location.accuracy,
  signature,
  timestamp: Date.now(),
};

const backendResponse = await api.post("/claims/verify", claimRequest);

if (!backendResponse.success) {
  throw new Error(backendResponse.error || "Claim verification failed");
}

// 2. Call FlashMobV2.claimDrop() with backend signature
const contractResult = await contractService.claimDrop({
  dropId: backendResponse.dropIdHash,
  amount: backendResponse.amount,
  latitude: Math.floor(location.latitude * 1e6),
  longitude: Math.floor(location.longitude * 1e6),
  timestamp: backendResponse.timestamp,
  nonce: backendResponse.nonce,
  signature: backendResponse.backendSignature,
});

const txHash = contractResult.txHash;
```

---

### [ ] 6. Add Missing Functions to apTokenService

**Add to**: `src/services/blockchain/apTokenService.ts`

```typescript
/**
 * Start a game session (burns AP)
 */
export async function startGame(
  sessionId: string,
  gameType: string,
  difficulty: string,
  userAddress: `0x${string}`,
): Promise<string> {
  const wallet = getWalletClient(); // You'll need to implement this

  // 1. Get AP cost
  const cost = await getGameCost(difficulty);

  // 2. Check allowance
  const allowance = await publicClient.readContract({
    address: contracts.apToken!,
    abi: AP_TOKEN_ABI,
    functionName: "allowance",
    args: [userAddress, contracts.gameRewards!],
  });

  // 3. Approve if needed
  if (allowance < cost) {
    const approveTx = await wallet.writeContract({
      address: contracts.apToken!,
      abi: AP_TOKEN_ABI,
      functionName: "approve",
      args: [contracts.gameRewards!, MAX_UINT256],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
  }

  // 4. Start game (burns AP)
  const sessionIdBytes = `0x${Buffer.from(sessionId).toString("hex").padEnd(64, "0")}`;

  const txHash = await wallet.writeContract({
    address: contracts.gameRewards!,
    abi: GAME_REWARDS_ABI,
    functionName: "startGame",
    args: [sessionIdBytes, gameType, difficulty],
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Claim game reward (requires backend signature)
 */
export async function claimReward(
  sessionId: string,
  monReward: bigint,
  score: number,
  deadline: number,
  signature: `0x${string}`,
): Promise<string> {
  const wallet = getWalletClient();
  const sessionIdBytes = `0x${Buffer.from(sessionId).toString("hex").padEnd(64, "0")}`;

  const txHash = await wallet.writeContract({
    address: contracts.gameRewards!,
    abi: GAME_REWARDS_ABI,
    functionName: "claimReward",
    args: [
      sessionIdBytes,
      monReward,
      BigInt(score),
      BigInt(deadline),
      signature,
    ],
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}
```

---

## 🟢 MEDIUM PRIORITY (Backend)

### [ ] 7. Build Backend Services

Create backend at `backend/` directory:

#### **7.1 Drop Creation Service**

```typescript
// POST /api/drops/create
// - Create drops based on real-world events, activity hotspots
// - Store in database with location + expiry
// - Sign drop creation on-chain if needed
```

#### **7.2 GPS Verification Service**

```typescript
// POST /api/claims/verify
// - Verify user is within 50m of drop
// - Check drop not already claimed
// - Generate EIP-712 signature for FlashMobV2.claimDrop()
// - Return signature + parameters
```

#### **7.3 Game Reward Signing Service**

```typescript
// POST /api/games/complete
// - Verify game session exists
// - Calculate reward based on score
// - Generate EIP-712 signature for GameRewards.claimReward()
// - Return signature + reward amount
```

#### **7.4 Event Indexer**

```typescript
// Background service
// - Listen to GameCompleted events
// - Listen to DropClaimed events
// - Build leaderboard from events
// - Cache in database for fast queries
```

---

### [ ] 8. Replace Mock Data Sources

#### **8.1 Drop Discovery**

**File**: `src/hooks/useDrops.ts` (line 23)

Replace:

```typescript
const geoJSON = generateMockDrops(latitude, longitude, 50, radiusKm);
```

With:

```typescript
const response = await api.get("/drops/nearby", {
  lat: latitude,
  lng: longitude,
  radius: radiusKm,
});
return response.drops;
```

#### **8.2 Leaderboard**

**File**: Create `src/hooks/useLeaderboard.ts`

```typescript
export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      // Call real backend indexer
      const response = await api.get("/leaderboard");
      return response.entries;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
```

---

## ⚪ LOW PRIORITY (Polish)

### [ ] 9. Add Loading States

- Show spinner during blockchain transactions
- Add transaction pending UI
- Show gas estimation

### [ ] 10. Add Error Handling

- Handle RPC errors gracefully
- Show user-friendly error messages
- Add retry logic for failed transactions

### [ ] 11. Add Transaction History

- Show past game sessions
- Show past drop claims
- Link to block explorer

---

## 📋 **FILE CHECKLIST**

Files that MUST be modified:

- [ ] `src/stores/gameStore.ts` - Connect game start to blockchain
- [ ] `src/hooks/useWallet.ts` - Replace mock with Privy
- [ ] `src/hooks/useClaim.ts` - Connect drop claiming
- [ ] `src/services/blockchain/apTokenService.ts` - Add missing functions
- [ ] `src/services/api/mockApi.ts` - Disable or remove mock flag
- [ ] `src/hooks/useDrops.ts` - Use real API instead of mock
- [ ] `.env` - Add `EXPO_PUBLIC_USE_REAL_API=true`

Files that MUST be created:

- [ ] `backend/src/services/dropVerification.ts`
- [ ] `backend/src/services/rewardSigning.ts`
- [ ] `backend/src/services/eventIndexer.ts`
- [ ] `backend/src/routes/drops.ts`
- [ ] `backend/src/routes/claims.ts`
- [ ] `backend/src/routes/games.ts`
- [ ] `backend/src/routes/leaderboard.ts`

---

## 🎯 **COMPLETION CRITERIA**

The project is "fully connected" when:

1. ✅ User can connect real wallet (Privy)
2. ✅ Game start burns AP on blockchain (not just locally)
3. ✅ Game completion awards MON on blockchain
4. ✅ Drop claims are verified by backend + recorded on-chain
5. ✅ Drops come from backend database (not generated mock)
6. ✅ Leaderboard shows real blockchain data (indexed events)
7. ✅ No `TODO` or `Mock` in critical paths
8. ✅ All transaction hashes are real (not `Math.random()`)

---

## 🚀 **START HERE**

**Recommended Order**:

1. Fix gameStore.startGame() (30 min)
2. Add apTokenService.startGame() (1 hour)
3. Replace wallet mock with Privy (2 hours)
4. Test complete game flow end-to-end
5. Build backend services (1-2 days)
6. Connect drop claiming (2 hours)
7. Replace all mock data sources (1 hour)

**Total Estimated Time**: 2-3 days of focused work

---

**Last Updated**: January 22, 2026
**Status**: 🔴 Multiple Open Connections
**Goal**: 🟢 100% Blockchain Integration
