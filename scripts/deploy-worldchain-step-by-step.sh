#!/bin/bash

# 🚀 World Chain Deployment Script - Step by Step
# 
# Usage:
#   chmod +x scripts/deploy-worldchain-step-by-step.sh
#   ./scripts/deploy-worldchain-step-by-step.sh

set -e  # Exit on error

echo "🚀 World Chain Deployment - Step by Step Guide"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo "📋 Step 1: Checking prerequisites..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js installed${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm installed${NC}"

# Check Hardhat
if ! command -v npx hardhat &> /dev/null; then
    echo -e "${YELLOW}⚠️  Hardhat not found, installing...${NC}"
    npm install
fi
echo -e "${GREEN}✅ Hardhat ready${NC}"
echo ""

# Step 2: Check environment variables
echo "📋 Step 2: Checking environment variables..."
echo ""

if [ -z "$LUX_TOKEN_ADDRESS" ]; then
    echo -e "${YELLOW}⚠️  LUX_TOKEN_ADDRESS not set${NC}"
    echo "Please set LUX_TOKEN_ADDRESS environment variable:"
    echo "  export LUX_TOKEN_ADDRESS=0x6289D5B756982bbc2535f345D9D68Cb50c853F35"
    exit 1
fi
echo -e "${GREEN}✅ LUX_TOKEN_ADDRESS: $LUX_TOKEN_ADDRESS${NC}"

if [ -z "$TREASURY_ADDRESS" ]; then
    echo -e "${YELLOW}⚠️  TREASURY_ADDRESS not set${NC}"
    echo "Please set TREASURY_ADDRESS environment variable:"
    echo "  export TREASURY_ADDRESS=0xdc6c9ac4c8ced68c9d8760c501083cd94dcea4e8"
    exit 1
fi
echo -e "${GREEN}✅ TREASURY_ADDRESS: $TREASURY_ADDRESS${NC}"

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${YELLOW}⚠️  PRIVATE_KEY not set${NC}"
    echo "Please set PRIVATE_KEY environment variable:"
    echo "  export PRIVATE_KEY=your_private_key_here"
    exit 1
fi
echo -e "${GREEN}✅ PRIVATE_KEY set${NC}"
echo ""

# Step 3: Compile contract
echo "📋 Step 3: Compiling contract..."
echo ""

if npm run compile; then
    echo -e "${GREEN}✅ Contract compiled successfully${NC}"
else
    echo -e "${RED}❌ Contract compilation failed${NC}"
    exit 1
fi
echo ""

# Step 4: Run tests (optional)
echo "📋 Step 4: Running tests (optional)..."
echo ""

read -p "Do you want to run tests? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if npm run test:contract; then
        echo -e "${GREEN}✅ Tests passed${NC}"
    else
        echo -e "${RED}❌ Tests failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Skipping tests${NC}"
fi
echo ""

# Step 5: Deploy contract
echo "📋 Step 5: Deploying contract to World Chain..."
echo ""

read -p "Are you ready to deploy to World Chain? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Deployment cancelled${NC}"
    exit 0
fi

echo "Deploying contract..."
if LUX_TOKEN_ADDRESS=$LUX_TOKEN_ADDRESS TREASURY_ADDRESS=$TREASURY_ADDRESS npx hardhat run scripts/deploy-worldchain.js --network worldchain; then
    echo -e "${GREEN}✅ Contract deployed successfully${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
echo ""

# Step 6: Verify contract (optional)
echo "📋 Step 6: Verifying contract (optional)..."
echo ""

read -p "Do you want to verify the contract? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter contract address: " CONTRACT_ADDRESS
    if [ -z "$CONTRACT_ADDRESS" ]; then
        echo -e "${YELLOW}⚠️  Contract address not provided${NC}"
    else
        echo "Verifying contract..."
        if npx hardhat verify --network worldchain $CONTRACT_ADDRESS $LUX_TOKEN_ADDRESS $TREASURY_ADDRESS; then
            echo -e "${GREEN}✅ Contract verified successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  Verification failed (may already be verified)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Skipping verification${NC}"
fi
echo ""

# Step 7: Summary
echo "📋 Step 7: Deployment Summary"
echo "=============================="
echo ""
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Update STAKING_CONTRACT_ADDRESS in lib/utils/constants.ts"
echo "  2. Update STAKING_CONTRACT_ADDRESS in .env.local"
echo "  3. Test contract functions on World Chain"
echo "  4. Monitor contract activity"
echo ""

