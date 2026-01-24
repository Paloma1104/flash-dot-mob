# Integration Testing Scenarios

## 🎯 End-to-End User Journeys

### Journey 1: New User First Game

**Objective**: Verify complete onboarding and first game experience

#### Prerequisites

- Fresh wallet (no prior airdrop claim)
- Monad testnet with sufficient gas
- App connected to testnet

#### Steps

1. **Connect Wallet**
   - Open app
   - Navigate to Wallet tab
   - Connect wallet
   - ✅ Wallet address displayed
   - ✅ MON balance = 0 or > 0
   - ✅ AP balance = 0

2. **Claim Initial Airdrop**
   - Contract: APToken.claimInitialAirdrop()
   - Click "Claim 1000 AP" button (if exists in UI)
   - OR call from console/service
   - ✅ Transaction submitted
   - ✅ Transaction confirmed
   - ✅ AP balance updates to 1000
   - ✅ Cannot claim again (hasClaimedInitialAirdrop = true)

3. **View Balance in Wallet**
   - Navigate to Wallet tab
   - ✅ AP balance shows 1000
   - ✅ MON balance unchanged
   - ✅ Cards render correctly

4. **Find Game on Map**
   - Navigate to Map tab
   - ✅ Game drops visible
   - ✅ Can select drop
   - ✅ GameModal opens

5. **Check Game Cost**
   - View game info in modal
   - ✅ Shows AP cost (10/25/50 based on difficulty)
   - ✅ Shows player has enough AP
   - ✅ "Start Game" button enabled

6. **Start Game**
   - Click "Start Game"
   - ✅ Loading indicator
   - ✅ AP deducted from balance
   - ✅ Game session created on-chain
   - ✅ Game screen loads

7. **Play Game**
   - Complete game objective
   - Win game
   - ✅ Game completion detected
   - ✅ Score calculated

8. **Claim Reward**
   - Game calls claimReward()
   - ✅ Transaction submitted with score signature
   - ✅ Transaction confirmed
   - ✅ MON balance increases
   - ✅ Success message shown

9. **Verify Balances**
   - Return to Wallet
   - ✅ AP = 990 (if played easy game)
   - ✅ MON > initial balance
   - ✅ Changes persist after app restart

#### Expected Results

- User can claim airdrop once
- AP deducted correctly
- MON rewarded correctly
- All balances accurate
- No errors or crashes

---

### Journey 2: Buying AP with MON

**Objective**: Test AP purchase flow

#### Prerequisites

- Wallet with >= 100 MON testnet
- AP balance < 1000 (to test purchase)

#### Steps

1. **Open Purchase Modal**
   - Navigate to Wallet tab
   - Click "+ Buy AP" button
   - ✅ APPurchaseModal opens
   - ✅ Current balances displayed

2. **Check Exchange Rate**
   - View exchange rate card
   - ✅ Shows "100 MON = 1000 AP"
   - ✅ Clear and prominent

3. **Try Invalid Amount**
   - Enter 50 (< 100)
   - ✅ Error shown
   - Enter 150 (not multiple of 100)
   - ✅ Error shown
   - Enter "abc" (non-numeric)
   - ✅ Error shown

4. **Use Quick Amount Button**
   - Click "500" button
   - ✅ Input fills with 500
   - ✅ Preview shows: Pay 500 MON, Get 5000 AP
   - ✅ Button highlighted

5. **Check Insufficient Balance**
   - Enter amount > MON balance
   - ✅ "Purchase AP" button disabled
   - ✅ Error message shown

6. **Complete Purchase**
   - Enter valid amount (e.g., 100)
   - ✅ Preview correct: 1000 AP
   - Click "Purchase AP"
   - ✅ Loading spinner
   - ✅ Transaction submitted
   - ✅ Transaction confirmed
   - ✅ Modal closes
   - ✅ Success alert

7. **Verify Balances**
   - Check wallet screen
   - ✅ MON decreased by 100
   - ✅ AP increased by 1000
   - ✅ Changes visible immediately
   - ✅ Persist after refresh

8. **Purchase Again**
   - Repeat purchase
   - ✅ Can purchase multiple times
   - ✅ Each purchase works correctly

#### Expected Results

- Validation prevents invalid inputs
- Purchase flow smooth
- Balances update correctly
- Can purchase multiple times
- No double-spending

---

### Journey 3: Running Out of AP

**Objective**: Test insufficient AP handling

#### Prerequisites

- AP balance = 20 (enough for 2 easy or 0 medium/hard)

#### Steps

1. **Play Easy Game**
   - Select easy game (10 AP)
   - ✅ Can start game
   - ✅ AP deducted (now 10)
   - Complete game

2. **Play Another Easy Game**
   - Select easy game (10 AP)
   - ✅ Can start game
   - ✅ AP deducted (now 0)
   - Complete game

3. **Try to Play with 0 AP**
   - Select any game
   - Click "Start Game"
   - ✅ Alert shown
   - ✅ Message: "Insufficient AP"
   - ✅ Suggests buying more
   - ✅ "Buy AP" button in alert

4. **Buy AP from Alert**
   - Click "Buy AP" in alert
   - ✅ Opens APPurchaseModal
   - Purchase AP
   - ✅ Can now play games

5. **Try Medium Game with 10 AP**
   - Set AP to 10
   - Select medium game (25 AP)
   - ✅ Button disabled OR alert on click
   - ✅ Clear message about needed AP

#### Expected Results

- Cannot play without sufficient AP
- Clear error messages
- Easy path to purchase more AP
- UI updates prevent confusion

---

### Journey 4: Rate Limiting

**Objective**: Test anti-cheat rate limiting (20 games/hour)

#### Prerequisites

- Wallet with sufficient AP (200+)
- Fresh hour (no games played yet)

#### Steps

1. **Play 20 Games Rapidly**
   - Loop: Start and complete game 20 times
   - ✅ All 20 games work
   - ✅ AP deducted each time
   - ✅ Rewards claimable

2. **Try 21st Game**
   - Attempt to start 21st game in same hour
   - ✅ Transaction reverts
   - ✅ Error: "Rate limit exceeded"
   - ✅ AP not deducted
   - ✅ Error shown to user

3. **Wait for Next Hour**
   - Wait until next hour period
   - Try starting game
   - ✅ Works again
   - ✅ Rate limit reset

4. **Check User Stats**
   - Call getUserGameStats()
   - ✅ Shows total games: 20
   - ✅ Shows last game timestamp

#### Expected Results

- Rate limiting enforces 20 games/hour
- Clear error when limit reached
- Resets properly each hour
- Cannot bypass with multiple transactions

---

### Journey 5: Multiple Games in Session

**Objective**: Test playing various game difficulties

#### Prerequisites

- AP balance >= 100
- Access to all game difficulties

#### Steps

1. **Play Easy Game**
   - Cost: 10 AP
   - ✅ Start successful
   - ✅ Balance: -10 AP
   - Complete and claim
   - ✅ Reward: ~50 MON

2. **Play Medium Game**
   - Cost: 25 AP
   - ✅ Start successful
   - ✅ Balance: -25 AP
   - Complete and claim
   - ✅ Reward: ~125 MON

3. **Play Hard Game**
   - Cost: 50 AP
   - ✅ Start successful
   - ✅ Balance: -50 AP
   - Complete and claim
   - ✅ Reward: ~250 MON

4. **Verify Economics**
   - Total AP spent: 85
   - Total MON earned: ~425
   - ✅ Rewards proportional to difficulty
   - ✅ Economics sustainable

5. **Check History**
   - View game history (if exists)
   - ✅ All 3 games recorded
   - ✅ Timestamps correct
   - ✅ Scores saved

#### Expected Results

- All difficulties work correctly
- Costs match defined amounts
- Rewards scale with difficulty
- History tracked accurately

---

## 🔗 Blockchain Integration Tests

### Test 1: Smart Contract Interactions

#### APToken Contract

- [ ] **getAPBalance()**
  - Returns correct balance
  - Updates after transactions
- [ ] **claimInitialAirdrop()**
  - Gives 1000 AP first time
  - Reverts on second attempt
  - Emits event
- [ ] **purchaseAP()**
  - Requires MON approval first
  - Burns MON correctly
  - Mints AP correctly
  - Calculates 1000 AP per 100 MON
- [ ] **burnFrom()**
  - Only callable by GameRewards
  - Burns specified amount
  - Reverts if insufficient balance

#### GameRewards Contract

- [ ] **startGame()**
  - Burns AP from user
  - Creates game session
  - Increments session counter
  - Enforces rate limiting
  - Reverts if insufficient AP
- [ ] **claimReward()**
  - Verifies EIP-712 signature
  - Distributes MON based on score
  - Marks session as claimed
  - Cannot claim twice
  - Cannot claim with invalid signature
- [ ] **getUserGameStats()**
  - Returns accurate stats
  - Shows games in current hour
  - Shows total games
  - Shows last game timestamp

### Test 2: Transaction Error Handling

- [ ] **Insufficient Gas**
  - App detects low gas
  - Shows error message
  - Suggests increasing gas
- [ ] **Transaction Rejected**
  - User rejects in wallet
  - App handles gracefully
  - No state corruption
- [ ] **Transaction Failed**
  - On-chain revert
  - Error propagated to UI
  - Balances not updated
- [ ] **Pending Transaction**
  - Shows loading state
  - Cannot submit duplicate
  - Can cancel if supported

### Test 3: Network Issues

- [ ] **RPC Timeout**
  - Retry logic works
  - Shows timeout error
  - Doesn't hang forever
- [ ] **RPC Error**
  - Falls back to backup RPC (if configured)
  - Shows network error
  - Can retry manually
- [ ] **Wrong Network**
  - Detects network mismatch
  - Prompts to switch to Monad testnet
  - Blocks transactions until switched

---

## 🔄 State Management Tests

### Test 1: Store Synchronization

- [ ] **userStore**
  - AP balance syncs with blockchain
  - Updates persist in AsyncStorage
  - Loads on app startup
  - Handles concurrent updates
- [ ] **gameStore**
  - Active game state correct
  - Session data persists
  - Clears after game ends
- [ ] **dropStore**
  - Drop data includes AP costs
  - Filters work correctly

### Test 2: Cross-Tab/Device Sync

- [ ] **Same Wallet, Different Device**
  - Open app on two devices
  - Make purchase on device A
  - ✅ Balance updates on device B after refresh
- [ ] **State Conflicts**
  - Simultaneous purchases
  - ✅ Final state correct
  - ✅ No duplicate charges

---

## 📊 Performance Tests

### Load Times

- [ ] App startup < 3 seconds
- [ ] Wallet screen renders < 500ms
- [ ] Balance fetch < 1 second
- [ ] Transaction submit < 2 seconds

### Memory Usage

- [ ] No memory leaks
- [ ] Stable during long sessions
- [ ] Handles 100+ games without crash

### Battery Impact

- [ ] Reasonable battery drain
- [ ] No excessive polling
- [ ] Efficient blockchain queries

---

## ✅ Test Execution Summary

| Journey             | Status     | Notes |
| ------------------- | ---------- | ----- |
| New User First Game | ⏳ Pending |       |
| Buying AP with MON  | ⏳ Pending |       |
| Running Out of AP   | ⏳ Pending |       |
| Rate Limiting       | ⏳ Pending |       |
| Multiple Games      | ⏳ Pending |       |

| Integration Test            | Status     | Notes |
| --------------------------- | ---------- | ----- |
| Smart Contract Interactions | ⏳ Pending |       |
| Transaction Error Handling  | ⏳ Pending |       |
| Network Issues              | ⏳ Pending |       |
| State Management            | ⏳ Pending |       |
| Performance                 | ⏳ Pending |       |

## 🐛 Issues Discovered

_None yet - testing in progress_

## 💡 Optimization Opportunities

_To be filled during testing_
