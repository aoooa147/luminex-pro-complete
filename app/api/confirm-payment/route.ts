import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';
import { takeToken } from '../../utils/rateLimit';
import { env } from '../../utils/env';
import { requestId } from '../../utils/requestId';

const BodySchema = z.object({ payload: z.object({ transaction_id: z.string(), reference: z.string() }) });

export async function POST(request: NextRequest, ) {
  const rid = requestId();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed', rid });
  const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'anon').split(',')[0].trim();
  if (!takeToken(ip)) return res.status(429).json({ success: false, error: 'Too many requests', rid });

  try {
    const { payload } = BodySchema.parse(req.body || {});
    if (!env.WORLD_API_KEY || !env.NEXT_PUBLIC_WORLD_APP_ID) {
      return res.status(500).json({ success: false, error: 'Server missing WORLD_API_KEY or NEXT_PUBLIC_WORLD_APP_ID', rid });
    }

    const url = `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${encodeURIComponent(env.NEXT_PUBLIC_WORLD_APP_ID)}&type=miniapp`;

    const controller = () => {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 10000);
      return { signal: ac.signal, cancel: () => clearTimeout(t) };
    };

    const maxAttempts = 3;
    let attempt = 0;
    let lastErr: any = null;
    while (attempt < maxAttempts) {
      attempt++;
      const c = controller();
      try {
        const r = await fetch(url, { headers: { Authorization: `Api-Key ${env.WORLD_API_KEY}` }, signal: c.signal });
        c.cancel();
        if (r.ok) {
          const data = await r.json();
          console.log(`[confirm-payment] rid=%s ip=%s tx=%s ref=%s status=%s attempt=%d`, rid, ip, payload.transaction_id, payload.reference, data?.transaction_status || data?.status, attempt);
          return res.status(200).json({ success: true, transaction: data, rid });
        } else if (r.status >= 400 && r.status < 500) {
          const text = await r.text();
          console.warn(`[confirm-payment] client_error rid=%s status=%d body=%s`, rid, r.status, text);
          return res.status(r.status).json({ success: false, error: 'Developer API 4xx', status: r.status, body: text, rid });
        } else {
          lastErr = new Error(`Developer API ${r.status}`);
        }
      } catch (e: any) {
        lastErr = e;
        console.warn(`[confirm-payment] attempt=%d error rid=%s %s`, attempt, rid, e?.message);
      }
      await new Promise(r => setTimeout(r, attempt * 500));
    }
    console.error(`[confirm-payment] failed rid=%s tx=%s ref=%s err=%s`, rid, payload.transaction_id, payload.reference, lastErr?.message);
    return res.status(502).json({ success: false, error: 'Developer API error or timeout', rid });
  } catch (e: any) {
    console.error(`[confirm-payment] bad_request rid=%s err=%s`, rid, e?.message);
    return res.status(400).json({ success: false, error: e?.message || 'Bad request', rid });
  }
}
