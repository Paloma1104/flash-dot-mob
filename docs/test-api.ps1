# Test Backend API Endpoints

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing Backend API" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "TEST 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
    Write-Host "  ✅ SUCCESS!" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor White
    Write-Host "  Signer: $($health.signer)" -ForegroundColor White
    Write-Host "  Chain ID: $($health.chainId)`n" -ForegroundColor White
} catch {
    Write-Host "  ❌ FAILED: $_`n" -ForegroundColor Red
    exit 1
}

# Test 2: Sign Game Reward
Write-Host "TEST 2: Sign Game Reward" -ForegroundColor Yellow
$body = @{
    sessionId = "test-game-123"
    player = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0"
    score = 85
    difficulty = "medium"
    gameType = "sudoku"
} | ConvertTo-Json

try {
    $reward = Invoke-RestMethod -Uri "http://localhost:3001/api/sign-reward" -Method Post -Body $body -ContentType "application/json"
    Write-Host "  ✅ SUCCESS!" -ForegroundColor Green
    Write-Host "  MON Reward: $($reward.monReward)" -ForegroundColor White
    Write-Host "  Signature: $($reward.signature.Substring(0,30))..." -ForegroundColor White
    Write-Host "  SessionID: $($reward.sessionIdBytes32.Substring(0,20))..." -ForegroundColor White
    Write-Host "  Deadline: $($reward.deadline)`n" -ForegroundColor White
} catch {
    Write-Host "  ❌ FAILED: $_`n" -ForegroundColor Red
    exit 1
}

# Test 3: Sign Drop (In Range)
Write-Host "TEST 3: Sign Drop (In Range)" -ForegroundColor Yellow
$dropBody = @{
    dropId = "drop-123"
    claimer = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0"
    amount = 50
    userLat = 37.7749
    userLon = -122.4194
    dropLat = 37.7749
    dropLon = -122.4194
} | ConvertTo-Json

try {
    $drop = Invoke-RestMethod -Uri "http://localhost:3001/api/sign-drop" -Method Post -Body $dropBody -ContentType "application/json"
    Write-Host "  ✅ SUCCESS!" -ForegroundColor Green
    Write-Host "  Signature: $($drop.signature.Substring(0,30))..." -ForegroundColor White
    Write-Host "  DropID: $($drop.dropIdBytes32.Substring(0,20))..." -ForegroundColor White
    Write-Host "  Deadline: $($drop.deadline)`n" -ForegroundColor White
} catch {
    Write-Host "  ❌ FAILED: $_`n" -ForegroundColor Red
    exit 1
}

# Test 4: Sign Drop (Out of Range)
Write-Host "TEST 4: Sign Drop (Out of Range - Should Fail)" -ForegroundColor Yellow
$farDropBody = @{
    dropId = "drop-456"
    claimer = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0"
    amount = 50
    userLat = 37.7749
    userLon = -122.4194
    dropLat = 37.8749  # ~11km away
    dropLon = -122.4194
} | ConvertTo-Json

try {
    $farDrop = Invoke-RestMethod -Uri "http://localhost:3001/api/sign-drop" -Method Post -Body $farDropBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "  ❌ UNEXPECTED SUCCESS - Should have failed!" -ForegroundColor Red
    exit 1
} catch {
    # Check if it's a 403 error (out of range)
    if ($_.Exception.Response.StatusCode -eq 403 -or $_.Exception.Message -match "403") {
        Write-Host "  ✅ CORRECTLY REJECTED!" -ForegroundColor Green
        Write-Host "  Error: User too far from drop location (403 Forbidden)`n" -ForegroundColor White
    } else {
        Write-Host "  ❌ FAILED WITH UNEXPECTED ERROR: $($_.Exception.Message)`n" -ForegroundColor Red
        exit 1
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All Tests Passed! ✅" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
