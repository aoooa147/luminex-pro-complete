'use client'; import Link from 'next/link';
export default function GameLauncherCard(){
  return (<div className="rounded-2xl p-4 bg-zinc-900 border border-zinc-800 flex items-center justify-between">
    <div><div className="text-lg font-semibold">TukTuk Beat</div><div className="text-sm opacity-70">แตะตามจังหวะ • สะสมคะแนน • ลุ้นรางวัล</div></div>
    <Link href="/game/tuktuk-beat" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-medium">เล่นเลย</Link>
  </div>);
}
