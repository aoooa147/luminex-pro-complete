import { NextRequest } from 'next/server'; import { readJSON } from '@/lib/game/storage';

export const runtime = 'nodejs';

export async function GET(req: NextRequest){ const period=req.nextUrl.searchParams.get('period')||new Date().toISOString().slice(0,10); const limit=Number(req.nextUrl.searchParams.get('limit')||20);
  const board=readJSON<Record<string,Record<string,number>>>('leaderboards',{}); const row=Object.entries(board[period]||{}).map(([address,total])=>({address,total})); row.sort((a,b)=>b.total-a.total); return Response.json({ok:true,period,top:row.slice(0,limit)});
}
