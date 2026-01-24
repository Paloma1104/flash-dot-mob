# Simple deployment script for Monad Testnet
Write-Host "🚀 Deploying to Monad Testnet..." -ForegroundColor Cyan

# Load private key from .env
$envContent = Get-Content .env
$privateKey = ($envContent | Select-String "^PRIVATE_KEY=(.+)$").Matches.Groups[1].Value

if (-not $privateKey -or $privateKey -eq "YOUR_WALLET_PRIVATE_KEY_WITH_TESTNET_MON") {
    Write-Host ""
    Write-Host "❌ PRIVATE_KEY not set in .env!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Steps to deploy:" -ForegroundColor Yellow
    Write-Host "1. Get testnet MON from: https://faucet.monad.xyz" -ForegroundColor White
    Write-Host "2. Export private key from MetaMask" -ForegroundColor White
    Write-Host "3. Add to .env: PRIVATE_KEY=0x..." -ForegroundColor White
    exit 1
}

Write-Host "Testing RPC..." -ForegroundColor Yellow
$body = @{jsonrpc='2.0';method='eth_blockNumber';params=@();id=1} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri 'https://testnet-rpc.monad.xyz' -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 10
    Write-Host "✅ RPC OK - Block: $([Convert]::ToInt32($response.result, 16))" -ForegroundColor Green
} catch {
    Write-Host "❌ RPC connection failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deploying contracts..." -ForegroundColor Yellow

$cmd = "cd /mnt/c/Users/LENOVO/Desktop/flash.mob/contracts; PRIVATE_KEY=$privateKey ~/.foundry/bin/forge script script/Deploy.s.sol:DeployScript --rpc-url https://testnet-rpc.monad.xyz --broadcast --legacy -vvv"

wsl bash -c $cmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Success! Update .env with contract addresses above" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check error messages above." -ForegroundColor Red
}
