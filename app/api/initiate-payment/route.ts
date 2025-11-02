import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';
import { takeToken } from '../../utils/rateLimit';
import { requestId } from '../../utils/requestId';

const BodySchema = z.object({
  amount: z.string().or(z.number()).transform((v) => Number(v)).refine((n) => !isNaN(n), 'amount must be a number').refine((n) => n > 0, 'amount must be positive').refine((n)=> n >= 0.01, 'amount too small (>= 0.01)'),
  symbol: z.enum(['WLD','USDC']).optional().default('WLD')
});

export async function POST(request: NextRequest, ) {
  const rid = requestId();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed', rid });
  const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'anon').split(',')[0].trim();
  if (!takeToken(ip)) return res.status(429).json({ success: false, error: 'Too many requests', rid });

  try {
    const { amount, symbol } = BodySchema.parse(req.body || {});
    const uuid = (globalThis.crypto || require('crypto').webcrypto).randomUUID().replace(/-/g, '');
    console.log(`[initiate-payment] rid=%s ip=%s amount=%s symbol=%s ref=%s`, rid, ip, amount, symbol, uuid);
    return res.status(200).json({ id: uuid, amount, symbol, message: 'Payment reference created successfully', rid });
  } catch (e: any) {
    console.warn(`[initiate-payment] bad_request rid=%s err=%s`, rid, e?.message);
    return res.status(400).json({ success: false, error: e?.message || 'Bad request', rid });
  }
}
