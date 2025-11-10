import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import crypto from 'crypto';

const FAUCET_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours
const FAUCET_AMOUNT = '1'; // 1 LUX

// In-memory storage (ใน production ควรใช้ database)
const faucetClaims = new Map<string, number>();
const pendingClaims = new Map<string, { address: string; timestamp: number }>();

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

    if (lastClaim) {
      const timeSinceLastClaim = now - lastClaim;
      if (timeSinceLastClaim < FAUCET_COOLDOWN) {
        const remainingTime = FAUCET_COOLDOWN - timeSinceLastClaim;
        const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        
        return NextResponse.json({
          ok: false,
          error: `Please wait ${remainingHours} hours and ${remainingMinutes} minutes before claiming again`,
          remainingHours,
          remainingMinutes
        }, { status: 429 });
      }
    }

    // Generate unique reference
    const reference = crypto.randomUUID();
    
    // Store pending claim
    pendingClaims.set(reference, {
      address: normalizedAddress,
      timestamp: now
    });

    // Clean up old pending claims after 5 minutes
    setTimeout(() => {
      pendingClaims.delete(reference);
    }, 5 * 60 * 1000);

    return NextResponse.json({
      ok: true,
      reference,
      amount: FAUCET_AMOUNT,
      message: 'Faucet claim initiated. Please confirm the transaction.'
    });

  } catch (error: any) {
    console.error('Faucet initiate error:', error);
    return NextResponse.json(
      { 
        ok: false,
        error: error?.message || 'Failed to initiate faucet claim' 
      },
      { status: 500 }
    );
  }
}
