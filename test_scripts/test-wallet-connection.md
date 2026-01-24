# Wallet Connection Test Plan

## Test Scenarios

### 1. Fresh Connection Test
**Steps:**
1. Clear app data (uninstall/reinstall or clear storage)
2. Open app
3. Tap "Connect Wallet"
4. Approve in MetaMask
5. Return to app

**Expected:**
- ✅ Single WalletConnect initialization log
- ✅ MetaMask opens automatically
- ✅ Connection completes without errors
- ✅ Wallet address displayed
- ✅ Balance loaded

### 2. Session Persistence Test
**Steps:**
1. Connect wallet (as above)
2. Close app completely
3. Reopen app

**Expected:**
- ✅ Wallet stays connected
- ✅ No repeated "App became active" logs
- ✅ No WalletConnect re-initialization
- ✅ Session restored from storage

### 3. Transaction Flow Test
**Steps:**
1. Connect wallet
2. Navigate to wallet tab
3. Attempt to purchase AP
4. Approve MON approval in MetaMask
5. Approve AP purchase in MetaMask

**Expected:**
- ✅ Network switches to Monad (if needed)
- ✅ MON approval completes
- ✅ AP purchase completes
- ✅ No relay message errors
- ✅ Balance updates

### 4. User Rejection Test
**Steps:**
1. Connect wallet
2. Try to purchase AP
3. Reject the MON approval in MetaMask

**Expected:**
- ✅ No error alert shown
- ✅ App logs "User cancelled"
- ✅ App remains functional
- ✅ Can retry transaction

### 5. Session Recovery Test
**Steps:**
1. Connect wallet
2. Force close MetaMask
3. Try to send transaction
4. Reopen MetaMask when prompted

**Expected:**
- ✅ App detects session is active
- ✅ Transaction proceeds
- ✅ No "session not active" errors

## Known Issues Fixed

1. **Multiple Initialization** - Fixed with better singleton pattern
2. **Relay Message Errors** - Fixed by preventing concurrent initialization
3. **Session Loss** - Fixed by proper AsyncStorage restoration
4. **Excessive Logging** - Fixed by removing AppState listener
5. **User Rejection Errors** - Fixed with better error code handling

## Metrics to Monitor

- Number of "Starting new WalletConnect provider initialization" logs (should be 1)
- Number of "App became active" logs (should be minimal)
- Number of relay message errors (should be 0)
- Time to connect wallet (should be < 10 seconds)
- Session persistence success rate (should be 100%)
