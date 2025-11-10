# 🚀 World Chain Deployment Script - Step by Step (PowerShell)
# 
# Usage:
#   .\scripts\deploy-worldchain-step-by-step.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 World Chain Deployment - Step by Step Guide" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check prerequisites
Write-Host "📋 Step 1: Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed" -ForegroundColor Red
    exit 1
}

# Check Hardhat
try {
    npx hardhat --version | Out-Null
    Write-Host "✅ Hardhat ready" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Hardhat not found, installing..." -ForegroundColor Yellow
    npm install
}
Write-Host ""

# Step 2: Check environment variables
Write-Host "📋 Step 2: Checking environment variables..." -ForegroundColor Yellow
Write-Host ""

if (-not $env:LUX_TOKEN_ADDRESS) {
    Write-Host "⚠️  LUX_TOKEN_ADDRESS not set" -ForegroundColor Yellow
    Write-Host "Please set LUX_TOKEN_ADDRESS environment variable:"
    Write-Host "  `$env:LUX_TOKEN_ADDRESS = '0x6289D5B756982bbc2535f345D9D68Cb50c853F35'"
    exit 1
}
Write-Host "✅ LUX_TOKEN_ADDRESS: $env:LUX_TOKEN_ADDRESS" -ForegroundColor Green

if (-not $env:TREASURY_ADDRESS) {
    Write-Host "⚠️  TREASURY_ADDRESS not set" -ForegroundColor Yellow
    Write-Host "Please set TREASURY_ADDRESS environment variable:"
    Write-Host "  `$env:TREASURY_ADDRESS = '0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8'"
    exit 1
}
Write-Host "✅ TREASURY_ADDRESS: $env:TREASURY_ADDRESS" -ForegroundColor Green

if (-not $env:PRIVATE_KEY) {
    Write-Host "⚠️  PRIVATE_KEY not set" -ForegroundColor Yellow
    Write-Host "Please set PRIVATE_KEY environment variable:"
    Write-Host "  `$env:PRIVATE_KEY = 'your_private_key_here'"
    exit 1
}
Write-Host "✅ PRIVATE_KEY set" -ForegroundColor Green
Write-Host ""

# Step 3: Compile contract
Write-Host "📋 Step 3: Compiling contract..." -ForegroundColor Yellow
Write-Host ""

try {
    npm run compile
    Write-Host "✅ Contract compiled successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Contract compilation failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Run tests (optional)
Write-Host "📋 Step 4: Running tests (optional)..." -ForegroundColor Yellow
Write-Host ""

$runTests = Read-Host "Do you want to run tests? (y/n)"
if ($runTests -eq "y" -or $runTests -eq "Y") {
    try {
        npm run test:contract
        Write-Host "✅ Tests passed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Tests failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  Skipping tests" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Deploy contract
Write-Host "📋 Step 5: Deploying contract to World Chain..." -ForegroundColor Yellow
Write-Host ""

$deploy = Read-Host "Are you ready to deploy to World Chain? (y/n)"
if ($deploy -ne "y" -and $deploy -ne "Y") {
    Write-Host "⚠️  Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host "Deploying contract..."
try {
    $env:LUX_TOKEN_ADDRESS = $env:LUX_TOKEN_ADDRESS
    $env:TREASURY_ADDRESS = $env:TREASURY_ADDRESS
    npx hardhat run scripts/deploy-worldchain.js --network worldchain
    Write-Host "✅ Contract deployed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: Verify contract (optional)
Write-Host "📋 Step 6: Verifying contract (optional)..." -ForegroundColor Yellow
Write-Host ""

$verify = Read-Host "Do you want to verify the contract? (y/n)"
if ($verify -eq "y" -or $verify -eq "Y") {
    $contractAddress = Read-Host "Enter contract address"
    if ($contractAddress) {
        Write-Host "Verifying contract..."
        try {
            npx hardhat verify --network worldchain $contractAddress $env:LUX_TOKEN_ADDRESS $env:TREASURY_ADDRESS
            Write-Host "✅ Contract verified successfully" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Verification failed (may already be verified)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Contract address not provided" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Skipping verification" -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Summary
Write-Host "📋 Step 7: Deployment Summary" -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Update STAKING_CONTRACT_ADDRESS in lib/utils/constants.ts"
Write-Host "  2. Update STAKING_CONTRACT_ADDRESS in .env.local"
Write-Host "  3. Test contract functions on World Chain"
Write-Host "  4. Monitor contract activity"
Write-Host ""

