# Deploy to Anvil Local using YOUR MetaMask private key
# This will use your actual wallet instead of Anvil's default

Write-Host "🚀 Starting Anvil and deploying with YOUR wallet..." -ForegroundColor Cyan
Write-Host ""

# Load your private key
$envContent = Get-Content .env
$privateKey = ($envContent | Select-String "^PRIVATE_KEY=(.+)$").Matches.Groups[1].Value

if (-not $privateKey) {
    Write-Host "❌ PRIVATE_KEY not found in .env!" -ForegroundColor Red
    exit 1
}

Write-Host "Using your wallet private key: $($privateKey.Substring(0,10))..." -ForegroundColor Yellow
Write-Host ""

# Check if Anvil is running
Write-Host "📡 Checking if Anvil is running..." -ForegroundColor Yellow
try {
    $body = @{jsonrpc='2.0';method='eth_blockNumber';params=@();id=1} | ConvertTo-Json
    $response = Invoke-RestMethod -Uri 'http://localhost:8545' -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 2
    Write-Host "✅ Anvil is running!" -ForegroundColor Green
} catch {
    Write-Host "❌ Anvil not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Start Anvil first:" -ForegroundColor Yellow
    Write-Host "  Terminal 1: wsl bash -c 'cd /mnt/c/Users/LENOVO/Desktop/flash.mob/contracts && ~/.foundry/bin/anvil'" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔨 Deploying contracts..." -ForegroundColor Yellow

$cmd = "cd /mnt/c/Users/LENOVO/Desktop/flash.mob/contracts; PRIVATE_KEY=$privateKey ~/.foundry/bin/forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast -vvv"

wsl bash -c $cmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Contract addresses have been deployed" -ForegroundColor White
    Write-Host "2. Update .env with the addresses from output above" -ForegroundColor White
    Write-Host "3. Start backend: cd backend && npm run dev" -ForegroundColor White
    Write-Host "4. Start frontend: npm run dev" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
}
