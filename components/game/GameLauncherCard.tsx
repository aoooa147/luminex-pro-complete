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
    name: '🧠 Memory Match',
    description: 'จับคู่การ์ดให้ถูกต้อง ฝึกความจำ!',
    href: '/game/memory-match',
    color: 'from-blue-500/10 to-cyan-500/10',
    border: 'border-blue-500/30',
    button: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'number-rush',
    name: '🔢 Number Rush',
    description: 'กดตัวเลขตามลำดับให้เร็วที่สุด!',
    href: '/game/number-rush',
    color: 'from-green-500/10 to-emerald-500/10',
    border: 'border-green-500/30',
    button: 'from-green-500 to-emerald-500',
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
    name: '🧮 Math Quiz',
    description: 'แก้โจทย์คณิตศาสตร์ให้เร็วที่สุด!',
    href: '/game/math-quiz',
    color: 'from-orange-500/10 to-red-500/10',
    border: 'border-orange-500/30',
    button: 'from-orange-500 to-red-500',
  },
];

export default function GameLauncherCard() {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🎮 เลือกเกม</h2>
        <p className="text-white/70 text-sm">เลือกเกมที่คุณชอบและเริ่มเล่นเลย!</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className={`rounded-2xl p-4 bg-gradient-to-br ${game.color} border ${game.border} flex flex-col shadow-lg`}
          >
            <div className="flex-1 mb-3">
              <div className="text-lg font-semibold text-white mb-1">{game.name}</div>
              <div className="text-sm opacity-70 text-white/80">{game.description}</div>
            </div>
            <Link
              href={game.href}
              className={`px-4 py-2 rounded-xl bg-gradient-to-r ${game.button} hover:opacity-90 font-medium text-white text-center shadow-lg transition-all`}
            >
              เล่นเลย
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
