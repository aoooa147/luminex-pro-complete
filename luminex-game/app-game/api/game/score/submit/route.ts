import { NextRequest } from 'next/server'; import { readJSON, writeJSON } from '@/lib/game/storage'; import { verifyScoreSignature } from '@/lib/game/verify';
const WINDOW_MS=Number(process.env.GAME_SCORE_WINDOW_MS ?? 60000);
export async function POST(req: NextRequest){ const { address, payload, sig } = await req.json();
  if(!address||!payload?.nonce) return Response.json({ok:false,error:'bad_payload'},{status:400});
  const { score, ts, nonce } = payload; if(typeof score!=='number'||!ts||!nonce) return Response.json({ok:false,error:'bad_payload'},{status:400});
  const nonces=readJSON<Record<string,string>>('nonces',{}); const expected=nonces[(address as string).toLowerCase()]; if(!expected||expected!==nonce) return Response.json({ok:false,error:'nonce_invalid'},{status:400});
  const ok=await verifyScoreSignature({ address, payload:{ address, score, ts, nonce }, signature:sig }); if(!ok) return Response.json({ok:false,error:'sig_invalid'},{status:400});
  const now=Date.now(); if(Math.abs(now-Number(ts))>WINDOW_MS) return Response.json({ok:false,error:'stale'},{status:400});
  const energies=readJSON<Record<string,{energy:number;max:number;day:string}>>('energies',{}); const today=new Date().toISOString().slice(0,10);
  if(!energies[address.toLowerCase()]||energies[address.toLowerCase()].day!==today){ const freePerDay=Number(process.env.GAME_ENERGY_FREE_PER_DAY ?? 5); energies[address.toLowerCase()]={energy:freePerDay,max:freePerDay,day:today}; }
  if(energies[address.toLowerCase()].energy<=0) return Response.json({ok:false,error:'no_energy'},{status:400});
  energies[address.toLowerCase()].energy-=1; writeJSON('energies',energies);
  const capped=Math.max(0,Math.min(score,100000)); const period=today;
  const scores=readJSON<any[]>('scores',[]); scores.push({address:address.toLowerCase(),score:capped,period,ts:Date.now()}); writeJSON('scores',scores);
  const board=readJSON<Record<string,Record<string,number>>>('leaderboards',{}); if(!board[period]) board[period]={}; board[period][address.toLowerCase()]=(board[period][address.toLowerCase()]||0)+capped; writeJSON('leaderboards',board);
  delete nonces[address.toLowerCase()]; writeJSON('nonces',nonces);
  return Response.json({ok:true,newEnergy:energies[address.toLowerCase()].energy});
}
