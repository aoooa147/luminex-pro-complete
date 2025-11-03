'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import HUD from '@/components/game/HUD';

type Beat = { t: number, lane: number };
type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

const DURATION = 45_000;
const LANES = 4;
const SONGS = [
  { id: 's1', title: 'Bangkok Night Ride', bpm: 105, url: '/audio/tuktuk-theme-1.wav' },
  { id: 's2', title: 'Soi Rhythm Rush', bpm: 120, url: '/audio/tuktuk-theme-2.wav' },
  { id: 's3', title: 'Temple Beat Drive', bpm: 135, url: '/audio/tuktuk-theme-3.wav' },
];

function xorshift32(seed: number) {
  let x = seed | 0;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return ((x >>> 0) % 1_000_000) / 1_000_000;
  };
}
function strToSeed(s: string) {
  let h = 2166136261 >>> 0;
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h,16777619); }
  return h >>> 0;
}
function todayKey(){ return new Date().toISOString().slice(0,10); }
function pickDifficulty(rand:()=>number): Difficulty { const r = rand(); return r<0.33?'EASY': r<0.7?'NORMAL':'HARD'; }
function diffParams(d: Difficulty){ if(d==='EASY')return{windowPerfect:120,windowGood:240,density:1.0,scorePerfect:100,scoreGood:40,threshold:1000,rewardMul:1};
 if(d==='NORMAL')return{windowPerfect:90,windowGood:180,density:1.25,scorePerfect:120,scoreGood:50,threshold:1200,rewardMul:2};
 return{windowPerfect:70,windowGood:140,density:1.5,scorePerfect:140,scoreGood:60,threshold:1400,rewardMul:3}; }

export default function TukTukBeatPage(){
  const [address,setAddress]=useState('');
  const [energy,setEnergy]=useState(0);
  const [score,setScore]=useState(0);
  const [playing,setPlaying]=useState(false);
  const startedAt=useRef(0);

  const bgmRef=useRef<HTMLAudioElement|null>(null);
  const hitRef=useRef<HTMLAudioElement|null>(null);
  const finishRef=useRef<HTMLAudioElement|null>(null);

  const seedKey = useMemo(()=>`${(address||'guest')}-${todayKey()}`,[address]);
  const rng = useMemo(()=>xorshift32(strToSeed(seedKey)),[seedKey]);
  const song = useMemo(()=>SONGS[Math.floor(rng()*SONGS.length)%SONGS.length],[rng]);
  const difficulty: Difficulty = useMemo(()=>pickDifficulty(rng),[rng]);
  const P = useMemo(()=>diffParams(difficulty),[difficulty]);

  const beats = useMemo<Beat[]>(()=>{
    const arr:Beat[]=[]; const step = Math.round(60_000/song.bpm/2); const end=DURATION-800;
    for(let t=1000;t<end;t+=step){
      if(rng()<(0.85*P.density)) arr.push({t, lane: Math.floor(rng()*LANES)});
      if(rng()<(0.15*P.density)) arr.push({t:t+Math.round(step/2), lane: Math.floor(rng()*LANES)});
    }
    return arr.slice(0, 120*P.density);
  },[song,rng,P]);

  const [secondsRemain,setSecondsRemain]=useState(Math.floor(DURATION/1000));
  useEffect(()=>{
    let raf=0;
    const loop=()=>{
      if(!playing) return;
      const elapsed=performance.now()-startedAt.current;
      setSecondsRemain(Math.max(0,Math.floor((DURATION-elapsed)/1000)));
      if(elapsed<DURATION) raf=requestAnimationFrame(loop); else finish();
    };
    if(playing) raf=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(raf);
  },[playing]);

  useEffect(()=>{
    const a=localStorage.getItem('user_address')||localStorage.getItem('demo_address')||'';
    setAddress(a);
    if(a) loadEnergy(a);
  },[]);
  async function loadEnergy(addr:string){
    const r=await fetch(`/api/game/energy/get?address=${addr}`);
    const j=await r.json(); if(j.ok) setEnergy(j.energy);
  }

  function start(){
    if(!address) return alert('กรุณาเชื่อม Wallet ก่อน (ไปที่ /connect)');
    if(energy<=0) return alert('พลังงานหมด');
    setScore(0); setSecondsRemain(Math.floor(DURATION/1000));
    startedAt.current=performance.now(); setPlaying(true);
    if(!bgmRef.current){ bgmRef.current=new Audio(song.url); bgmRef.current.loop=false; bgmRef.current.volume=0.9; }
    bgmRef.current.currentTime=0; bgmRef.current.play().catch(()=>{});
    if(!hitRef.current) hitRef.current=new Audio('/audio/tap.wav');
    if(!finishRef.current) finishRef.current=new Audio('/audio/finish.wav');
  }

  function onTap(lanePressed?:number){
    if(!playing) return;
    try{ if(hitRef.current){ hitRef.current.currentTime=0; hitRef.current.play(); } }catch{}
    const elapsed=performance.now()-startedAt.current;
    let best=Infinity, laneBonus=0;
    for(const b of beats){ const d=Math.abs(b.t-elapsed); if(d<best){ best=d; laneBonus=(lanePressed!=null&&lanePressed===b.lane)?1:0; } }
    if(best<=P.windowPerfect) setScore(s=>s+P.scorePerfect+laneBonus*10);
    else if(best<=P.windowGood) setScore(s=>s+P.scoreGood+laneBonus*5);
    else setScore(s=>Math.max(0,s-10));
  }

  async function finish(){
    if(!playing) return; setPlaying(false);
    try{ if(finishRef.current) finishRef.current.play(); if(bgmRef.current) bgmRef.current.pause(); }catch{}
    const base={ address, score, ts: Date.now() };
    const {nonce}=await fetch('/api/game/score/nonce',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({address})}).then(r=>r.json());
    const payload={...base, nonce};
    // TODO: ใช้ MiniKit.signMessage จริง
    // const { finalPayload } = await MiniKit.commandsAsync.signMessage({ message: JSON.stringify(payload) });
    // const sig = finalPayload?.signature as `0x${string}`;
    const sig='0x';
    await fetch('/api/game/score/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({address,payload,sig})});
    const earned = score>=P.threshold ? P.rewardMul : 0;
    if(earned>0){ const key='luminex_tokens'; const cur=Number(localStorage.getItem(key)||'0'); localStorage.setItem(key,String(cur+earned)); }
    loadEnergy(address);
    alert(`จบเกม! คะแนน: ${score}\nเพลง: ${song.title}\nความยาก: ${difficulty}\nรางวัล: ${earned} token (local)`);
  }

  function LaneButtons(){
    return (
      <div className="grid grid-cols-4 gap-2">
        {Array.from({length:LANES}).map((_,i)=>(
          <button key={i} className="w-full py-6 rounded bg-indigo-700/80 hover:bg-indigo-600/80 active:scale-[0.98] transition" onClick={()=>onTap(i)}>
            L{i+1}
          </button>
        ))}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black text-white p-6">
      <div className="max-w-xl mx-auto space-y-5">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">TukTuk Beat</h1>
        <HUD energy={energy} score={score} secondsRemain={secondsRemain} songTitle={`${song.title} · ${song.bpm} BPM`} difficultyLabel={difficulty} audioRef={bgmRef} />
        {!playing ? (
          <div className="space-y-4">
            <div className="rounded-2xl p-4 bg-zinc-900/60 border border-zinc-800">
              <div className="text-sm opacity-80">
                วันนี้ของคุณ: <b>{todayKey()}</b><br/>
                เพลง: <b>{song.title}</b> · {song.bpm} BPM<br/>
                ความยาก: <b>{difficulty}</b>
              </div>
            </div>
            <button className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-medium" onClick={start}>เริ่มเล่น</button>
          </div>
        ) : (
          <div className="space-y-3">
            <button className="w-full py-10 rounded-2xl bg-indigo-700 hover:bg-indigo-600 active:scale-[0.99] transition shadow-lg shadow-indigo-900/20" onClick={()=>onTap()}>
              TAP!
            </button>
            <LaneButtons />
            <button className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-600" onClick={finish}>จบเกม</button>
          </div>
        )}
      </div>
    </main>
  );
}
