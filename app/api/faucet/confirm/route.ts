import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (ใน production ควรใช้ database)
const faucetClaims = new Map<string, number>();
const pendingClaims = new Map<string, { address: string; timestamp: number }>();

export async function POST(request: NextRequest) {
  try {
    const { payload } = await request.json();

    if (!payload || !payload.reference) {
      return NextResponse.json(
        { 
          ok: false,
          error: 'Invalid payload: missing reference' 
        },
        { status: 400 }
      );
    }

    const { reference, transaction_id } = payload;
    const pendingClaim = pendingClaims.get(reference);

    if (!pendingClaim) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid or expired reference. Please try again.'
      }, { status: 400 });
    }

    const { address, timestamp } = pendingClaim;
    const now = Date.now();

    // Check if claim is not too old (5 minutes max)
    if (now - timestamp > 5 * 60 * 1000) {
      pendingClaims.delete(reference);
      return NextResponse.json({
        ok: false,
        error: 'Claim expired. Please try again.'
      }, { status: 400 });
    }

    // Mark as claimed
    faucetClaims.set(address, now);
    pendingClaims.delete(reference);

    // In production, here you would:
    // 1. Verify the transaction on-chain
    // 2. Store the claim in a database
    // 3. Potentially trigger actual token distribution

    return NextResponse.json({
      ok: true,
      message: 'Faucet claim confirmed successfully',
      transaction_id,
      address,
      claimedAt: new Date(now).toISOString()
    });

  } catch (error: any) {
    console.error('Faucet confirm error:', error);
    return NextResponse.json(
      { 
        ok: false,
        error: error?.message || 'Failed to confirm faucet claim' 
      },
      { status: 500 }
    );
  }
}
