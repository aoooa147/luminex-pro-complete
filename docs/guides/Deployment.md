# Deployment

This is the canonical deployment guide for Luminex.

Prerequisites
- Node.js 18+
- Hardhat installed via project devDependencies
- A funded deployer account (PRIVATE_KEY)
- RPC URLs configured for your target network

Environment
- Copy `.env.example` to `.env` or `.env.local` and set:
  - `PRIVATE_KEY`
  - `WORLDCHAIN_RPC_URL` (or use `NEXT_PUBLIC_WALLET_RPC_URL`)
  - `LUX_TOKEN_ADDRESS`
  - `TREASURY_ADDRESS`

Commands
- Mainnet-like deploy: `npm run deploy:worldchain`
- Testnet deploy: `npm run deploy:worldchain:testnet`
- Validate setup: `npm run deploy:check`

Troubleshooting
- See `docs/TROUBLESHOOTING.md`

