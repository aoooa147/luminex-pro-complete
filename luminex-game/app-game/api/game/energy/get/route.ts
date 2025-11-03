import { NextRequest } from 'next/server'; import { readJSON, writeJSON } from '@/lib/game/storage';
export async function GET(req: NextRequest){ const address=req.nextUrl.searchParams.get('address')?.toLowerCase(); if(!address) return Response.json({ok:false,error:'no_address'},{status:400});
  const freePerDay=Number(process.env.GAME_ENERGY_FREE_PER_DAY ?? 5);
  const energies=readJSON<Record<string,{energy:number;max:number;day:string}>>('energies',{});
  const today=new Date().toISOString().slice(0,10);
  if(!energies[address]||energies[address].day!==today){ energies[address]={energy:freePerDay,max:freePerDay,day:today}; writeJSON('energies',energies); }
  return Response.json({ok:true, ...energies[address]});
}
