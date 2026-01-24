# Deploy Flash.Mob contracts to Monad Testnet
# Run with: .\scripts\deploy-testnet.ps1

Write-Host "🚀 Deploying Flash.Mob to Monad Testnet..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with PRIVATE_KEY" -ForegroundColor Yellow
    exit 1
}

# Load .env file
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Check if PRIVATE_KEY is set
$privateKey = $env:PRIVATE_KEY
if (-not $privateKey -or $privateKey -eq "YOUR_BACKEND_WALLET_PRIVATE_KEY_HERE") {
    Write-Host "❌ Error: PRIVATE_KEY not set in .env!" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need a wallet with testnet MON to deploy!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Yellow
    Write-Host "1. Create a new MetaMask wallet (or use existing)" -ForegroundColor White
    Write-Host "2. Get testnet MON from faucet: https://faucet.monad.xyz" -ForegroundColor White
    Write-Host "3. Export private key from MetaMask" -ForegroundColor White
    Write-Host "4. Add to .env:" -ForegroundColor White
    Write-Host "   PRIVATE_KEY=0x..." -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "📝 Configuration:" -ForegroundColor Yellow
Write-Host "  Network: Monad Testnet"
Write-Host "  RPC: https://testnet-rpc.monad.xyz"
Write-Host "  Chain ID: 10143"
Write-Host ""

# Test RPC connection
Write-Host "🔌 Testing RPC connection..." -ForegroundColor Yellow
try {
    $body = @{
        jsonrpc = "2.0"
        method = "eth_blockNumber"
        params = @()
        id = 1
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "https://testnet-rpc.monad.xyz" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10
    $blockNumber = [Convert]::ToInt32($response.result, 16)
    Write-Host "  ✅ Connected! Current block: $blockNumber" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed to connect to RPC!" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "  - Monad testnet might be down" -ForegroundColor White
    Write-Host "  - Network connectivity issues" -ForegroundColor White
    Write-Host "  - Check Monad Discord for updates: https://discord.gg/monad" -ForegroundColor White
    exit 1
}

Write-Host ""

# Check deployer balance
Write-Host "💰 Checking deployer balance..." -ForegroundColor Yellow
Set-Location contracts

# Deploy using WSL
Write-Host ""
Write-Host "🔨 Deploying contracts (this may take a few minutes)..." -ForegroundColor Yellow
Write-Host ""

# Properly escape the private key for bash
$deployCommand = "cd /mnt/c/Users/LENOVO/Desktop/flash.mob/contracts; PRIVATE_KEY='$privateKey' ~/.foundry/bin/forge script script/Deploy.s.sol:DeployScript --rpc-url https://testnet-rpc.monad.xyz --broadcast --legacy -vvv"

try {
    wsl bash -c $deployCommand
    Write-Host ""
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Yellow
        Write-Host "1. Copy the deployed contract addresses from output above" -ForegroundColor White
        Write-Host "2. Update .env file:" -ForegroundColor White
        Write-Host "   EXPO_PUBLIC_MOCK_MON_ADDRESS=0x..." -ForegroundColor Gray
        Write-Host "   EXPO_PUBLIC_AP_TOKEN_ADDRESS=0x..." -ForegroundColor Gray
        Write-Host "   EXPO_PUBLIC_GAME_REWARDS_ADDRESS=0x..." -ForegroundColor Gray
        Write-Host "   EXPO_PUBLIC_FLASH_MOB_ADDRESS=0x..." -ForegroundColor Gray
        Write-Host "3. Update backend/.env with same addresses" -ForegroundColor White
        Write-Host "4. Fund backend wallet with testnet MON" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  - Insufficient testnet MON (need ~0.5 MON)" -ForegroundColor White
        Write-Host "  - Network timeout (try again)" -ForegroundColor White
        Write-Host "  - RPC issues (check Monad Discord)" -ForegroundColor White
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "❌ Deployment error: $($_.Exception.Message)" -ForegroundColor Red
}

Set-Location ..