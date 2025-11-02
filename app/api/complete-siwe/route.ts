import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';
import { takeToken } from '../../utils/rateLimit';
import { env } from '../../utils/env';
const BodySchema = z.object({ payload: z.any(), nonce: z.string().optional() });

export async function POST(request: NextRequest, ) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const key = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'anon').split(',')[0].trim();
  if (!takeToken(key)) return res.status(429).json({ success: false, error: 'Too many requests' });

  try {
  const { payload, nonce } = BodySchema.parse(req.body || {});
  const { verifySiweMessage } = await import('@worldcoin/minikit-js');
  const result = await verifySiweMessage(payload, nonce);
  return res.status(200).json({ status: 'ok', isValid: result.isValid, address: result.address, chainId: result.chainId });
} catch (e: any) {
  return res.status(400).json({ status: 'error', isValid: false, message: e?.message || 'Verification failed' });
}




}
