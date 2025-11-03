'use client';
import { useEffect, useState } from 'react';
export default function HUD({ energy, score, secondsRemain, songTitle, difficultyLabel, audioRef }:{ energy:number; score:number; secondsRemain:number; songTitle:string; difficultyLabel:string; audioRef: React.RefObject<HTMLAudioElement|null>;}){
  const [muted,setMuted]=useState(false);
  useEffect(()=>{ const a=audioRef.current; if(a) a.muted=muted; },[muted,audioRef]);
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex gap-3">
        <span>Energy: <b>{energy}</b></span>
        <span>Score: <b>{score}</b></span>
        <span>Time: <b>{secondsRemain}</b>s</span>
      </div>
      <div className="flex items-center gap-3 opacity-80">
        <span className="hidden md:inline">{songTitle}</span>
        <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">{difficultyLabel}</span>
        <button onClick={()=>setMuted(m=>!m)} className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700" aria-label="toggle-sound">{muted?'🔇':'🔊'}</button>
      </div>
    </div>
  );}
