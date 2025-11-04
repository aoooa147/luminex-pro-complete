'use client';
import Link from 'next/link';

const GAMES = [
  {
    id: 'coin-flip',
    name: '🪙 Coin Flip Challenge',
    description: 'เดาเหรียญให้ถูกต้อง 10 ครั้งติดต่อกันเพื่อชนะ!',
    href: '/game/coin-flip',
    color: 'from-yellow-500/10 to-orange-500/10',
    border: 'border-yellow-500/30',
    button: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'memory-match',
    name: '🧠 Color Memory Challenge',
    description: 'จำลำดับสีที่เพิ่มขึ้นเรื่อยๆ - รางวัล 0-5 LUX (เล่นได้ 1 ครั้ง/24 ช.ม.)',
    href: '/game/memory-match',
    color: 'from-purple-500/10 to-pink-500/10',
    border: 'border-purple-500/30',
    button: 'from-purple-500 to-pink-500',
  },
  {
    id: 'number-rush',
    name: '⚡ Speed Reaction',
    description: 'ทดสอบความเร็วในการตอบสนอง - รางวัล 0-5 LUX (เล่นได้ 1 ครั้ง/24 ช.ม.)',
    href: '/game/number-rush',
    color: 'from-blue-500/10 to-cyan-500/10',
    border: 'border-blue-500/30',
    button: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'color-tap',
    name: '🎨 Color Tap',
    description: 'จำลำดับสีแล้วกดตามให้ถูกต้อง!',
    href: '/game/color-tap',
    color: 'from-purple-500/10 to-pink-500/10',
    border: 'border-purple-500/30',
    button: 'from-purple-500 to-pink-500',
  },
  {
    id: 'word-builder',
    name: '📝 Word Builder',
    description: 'สร้างคำจากตัวอักษรที่มีให้!',
    href: '/game/word-builder',
    color: 'from-indigo-500/10 to-purple-500/10',
    border: 'border-indigo-500/30',
    button: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'math-quiz',
    name: '🧩 Pattern Puzzle',
    description: 'แก้ปริศนาลำดับรูปแบบ - รางวัล 0-5 LUX (เล่นได้ 1 ครั้ง/24 ช.ม.)',
    href: '/game/math-quiz',
    color: 'from-orange-500/10 to-red-500/10',
    border: 'border-orange-500/30',
    button: 'from-orange-500 to-red-500',
  },
];

export default function GameLauncherCard() {
  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white mb-1.5">🎮 เลือกเกม</h2>
        <p className="text-white/70 text-xs">เลือกเกมที่คุณชอบและเริ่มเล่นเลย! รางวัลพิเศษ: 0-5 LUX (ยากมากที่จะได้ 5!)</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className={`rounded-2xl p-3 bg-gradient-to-br ${game.color} border ${game.border} flex flex-col shadow-lg relative overflow-hidden group`}
            style={{
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="flex-1 mb-2">
              <div className="text-base font-semibold text-white mb-1">{game.name}</div>
              <div className="text-xs opacity-70 text-white/80">{game.description}</div>
            </div>
            <Link
              href={game.href}
              className={`px-3 py-2 rounded-xl bg-gradient-to-r ${game.button} font-medium text-white text-center shadow-lg transition-all text-sm relative overflow-hidden group-hover:shadow-xl`}
              style={{
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative z-10">เล่นเลย</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
