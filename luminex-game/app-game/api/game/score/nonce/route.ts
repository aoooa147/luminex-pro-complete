import { NextRequest } from 'next/server'; import crypto from 'node:crypto'; import { readJSON, writeJSON } from '@/lib/game/storage';
export async function POST(req: NextRequest){ const body=await req.json().catch(()=>({})); const address=(body?.address||'0x').toLowerCase();
  const ns=readJSON<Record<string,string>>('nonces',{}); const nonce=crypto.randomBytes(16).toString('hex'); ns[address]=nonce; writeJSON('nonces',ns); return Response.json({ok:true,nonce});
}
