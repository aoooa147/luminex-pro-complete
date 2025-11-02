import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';
import { takeToken } from '../../utils/rateLimit';
import { env } from '../../utils/env';
const BodySchema = z.object({ payload: z.any(), action: z.string() });

export async function POST(request: NextRequest, ) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  const key = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'anon').split(',')[0].trim();
  if (!takeToken(key)) return res.status(429).json({ success: false, error: 'Too many requests' });

  try {
  const { payload, action } = BodySchema.parse(req.body || {});
  const { verifyCloudProof } = await import('@worldcoin/minikit-js');
  if (!env.NEXT_PUBLIC_WORLD_APP_ID) return res.status(500).json({ success: false, error: 'Missing NEXT_PUBLIC_WORLD_APP_ID' });
  const out = await verifyCloudProof(payload, env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`, action);
  return res.status(out.success ? 200 : 400).json({ success: out.success, detail: out });
} catch (e: any) {
  return res.status(400).json({ success: false, error: e?.message || 'Bad request' });
}




}
