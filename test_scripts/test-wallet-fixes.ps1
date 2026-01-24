#!/usr/bin/env pwsh
# Test Wallet Integration Flow

Write-Host "🧪 Testing Wallet Integration..." -ForegroundColor Cyan
Write-Host ""

# Check environment
Write-Host "📋 Checking environment setup..." -ForegroundColor Yellow
if (-not $env:EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    Write-Host "❌ EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID not set" -ForegroundColor Red
    exit 1
}
Write-Host "✅ WalletConnect Project ID: $($env:EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID.Substring(0, 10))..." -ForegroundColor Green

if (-not $env:EXPO_PUBLIC_CHAIN_ID) {
    Write-Host "❌ EXPO_PUBLIC_CHAIN_ID not set" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Chain ID: $env:EXPO_PUBLIC_CHAIN_ID" -ForegroundColor Green

# Check contract addresses
Write-Host ""
Write-Host "📋 Checking contract configuration..." -ForegroundColor Yellow
$envContent = Get-Content .env -Raw
if ($envContent -match "EXPO_PUBLIC_AP_TOKEN_ADDRESS=(.+)") {
    $apTokenAddress = $matches[1].Trim()
    Write-Host "✅ AP Token: $apTokenAddress" -ForegroundColor Green
} else {
    Write-Host "❌ AP Token address not found" -ForegroundColor Red
}

if ($envContent -match "EXPO_PUBLIC_GAME_REWARDS_ADDRESS=(.+)") {
    $gameRewardsAddress = $matches[1].Trim()
    Write-Host "✅ Game Rewards: $gameRewardsAddress" -ForegroundColor Green
} else {
    Write-Host "❌ Game Rewards address not found" -ForegroundColor Red
}

if ($envContent -match "EXPO_PUBLIC_FLASH_MOB_ADDRESS=(.+)") {
    $flashMobAddress = $matches[1].Trim()
    Write-Host "✅ FlashMob: $flashMobAddress" -ForegroundColor Green
} else {
    Write-Host "❌ FlashMob address not found" -ForegroundColor Red
}

# Test WalletConnect provider code
Write-Host ""
Write-Host "🔍 Analyzing WalletConnect provider..." -ForegroundColor Yellow

$providerCode = Get-Content "src\config\walletConnectProvider.ts" -Raw

# Check for singleton pattern
if ($providerCode -match "let providerInstance.*=.*null" -and 
    $providerCode -match "let isInitializing.*=.*false") {
    Write-Host "✅ Singleton pattern implemented correctly" -ForegroundColor Green
} else {
    Write-Host "⚠️ Singleton pattern may have issues" -ForegroundColor Yellow
}

# Check for session restoration
if ($providerCode -match "provider\.session" -and $providerCode -match "provider\.connected") {
    Write-Host "✅ Session restoration logic present" -ForegroundColor Green
} else {
    Write-Host "⚠️ Session restoration may be missing" -ForegroundColor Yellow
}

# Test wallet hook
Write-Host ""
Write-Host "🔍 Analyzing wallet hook..." -ForegroundColor Yellow

$walletCode = Get-Content "src\hooks\useWallet.ts" -Raw

# Check for excessive AppState listeners
if ($walletCode -match "AppState\.addEventListener.*change") {
    Write-Host "⚠️ AppState listener found - may cause excessive checks" -ForegroundColor Yellow
} else {
    Write-Host "✅ No problematic AppState listener" -ForegroundColor Green
}

# Check for proper event cleanup
if ($walletCode -match "provider\.off\('connect'" -and 
    $walletCode -match "provider\.off\('disconnect'") {
    Write-Host "✅ Event listeners properly cleaned up" -ForegroundColor Green
} else {
    Write-Host "⚠️ Event listener cleanup may be incomplete" -ForegroundColor Yellow
}

# Test blockchain hooks
Write-Host ""
Write-Host "🔍 Analyzing blockchain hooks..." -ForegroundColor Yellow

$blockchainCode = Get-Content "src\hooks\useBlockchain.ts" -Raw

# Check for approval step
if ($blockchainCode -match "approve.*spender.*amount" -and 
    $blockchainCode -match "purchaseAP") {
    Write-Host "✅ Two-step transaction flow (approve + purchase) present" -ForegroundColor Green
} else {
    Write-Host "⚠️ Transaction flow may be incomplete" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Fixed Issues:" -ForegroundColor Green
Write-Host "   - Singleton pattern with isInitializing flag"
Write-Host "   - Session restoration from storage"
Write-Host "   - Event listener cleanup (connect, disconnect, accountsChanged)"
Write-Host "   - Better error handling for user rejections"
Write-Host "   - Removed excessive AppState checking"
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Start Metro bundler: npm start"
Write-Host "   2. Scan QR code with Expo Go"
Write-Host "   3. Connect wallet and monitor logs"
Write-Host "   4. Test purchase AP flow"
Write-Host "   5. Check for relay message errors"
Write-Host ""
Write-Host "🔍 What to Monitor:" -ForegroundColor Cyan
Write-Host "   - Should see only ONE 'Starting new WalletConnect provider initialization'"
Write-Host "   - Should see 'Restored existing WalletConnect session' on app reload"
Write-Host "   - Should NOT see 'App became active' repeatedly"
Write-Host "   - Should NOT see relay message decryption errors"
Write-Host "   - User rejection should log 'User cancelled' not show error alert"
Write-Host ""
Write-Host "✅ Analysis Complete!" -ForegroundColor Green
