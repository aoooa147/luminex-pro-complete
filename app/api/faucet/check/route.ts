import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const FAUCET_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const FAUCET_AMOUNT = '1000000000000000000'; // 1 LUX (18 decimals)

// In-memory storage (ใน production ควรใช้ database)
const faucetClaims = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid address' },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();
    const lastClaim = faucetClaims.get(normalizedAddress);
    const now = Date.now();

    if (!lastClaim) {
      // Never claimed before
      return NextResponse.json({
        ok: true,
        canClaim: true,
        remainingHours: 0,
        remainingMinutes: 0,
        lastClaimTime: null
      });
    }

    const timeSinceLastClaim = now - lastClaim;
    const canClaim = timeSinceLastClaim >= FAUCET_COOLDOWN;

    let remainingHours = 0;
    let remainingMinutes = 0;

    if (!canClaim) {
      const remainingTime = FAUCET_COOLDOWN - timeSinceLastClaim;
      remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
      remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    }

    return NextResponse.json({
      ok: true,
      canClaim,
      remainingHours,
      remainingMinutes,
      lastClaimTime: lastClaim
    });

  } catch (error: any) {
    console.error('Faucet check error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to check faucet status' },
      { status: 500 }
    );
  }
}
