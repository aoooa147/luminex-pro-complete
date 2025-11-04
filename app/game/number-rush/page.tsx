'use client';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

const ROUND_TIME = 30; // 30 seconds per round
const NUMBERS_PER_ROUND = 20;

export default function NumberRushPage() {
  const [address, setAddress] = useState('');
  const [energy, setEnergy] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [numbers, setNumbers] = useState<number[]>([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [level, setLevel] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const a = sessionStorage.getItem('verifiedAddress') || '';
    setAddress(a);
    if (a) loadEnergy(a);
  }, []);

  async function loadEnergy(addr: string) {
    try {
      const r = await fetch(`/api/game/energy/get?address=${addr}`);
      const j = await r.json();
      if (j.ok) setEnergy(j.energy);
    } catch (e) {
      console.error('Failed to load energy:', e);
    }
  }

  function generateNumbers(count: number, max: number): number[] {
    const nums: number[] = [];
    while (nums.length < count) {
      const num = Math.floor(Math.random() * max) + 1;
      if (!nums.includes(num)) {
        nums.push(num);
      }
    }
    return nums.sort((a, b) => a - b);
  }

  function startGame() {
    if (!address) {
      alert('กรุณาเชื่อม Wallet ก่อน');
      return;
    }
    if (energy <= 0) {
      alert('พลังงานหมด');
      return;
    }
    
    setGameState('playing');
    setLevel(1);
    setNextNumber(1);
    setScore(0);
    setTimeLeft(ROUND_TIME);
    
    const maxNum = 10 + level * 5;
    setNumbers(generateNumbers(NUMBERS_PER_ROUND, maxNum));
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleNumberClick(num: number) {
    if (gameState !== 'playing') return;
    if (num !== nextNumber) {
      // Wrong number - lose points
      setScore(prev => Math.max(0, prev - 50));
      return;
    }
    
    // Correct!
    setNextNumber(prev => prev + 1);
    setScore(prev => prev + 100);
    
    // Remove clicked number
    setNumbers(prev => prev.filter(n => n !== num));
    
    // Check if round complete
    if (nextNumber >= NUMBERS_PER_ROUND) {
      // Next level
      setLevel(prev => prev + 1);
      setNextNumber(1);
      setTimeLeft(ROUND_TIME);
      const maxNum = 10 + (level + 1) * 5;
      setNumbers(generateNumbers(NUMBERS_PER_ROUND, maxNum));
      setScore(prev => prev + 500); // Level bonus
    }
  }

  async function handleGameOver() {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('gameover');
    
    try {
      const base = { address, score, ts: Date.now() };
      const { nonce } = await fetch('/api/game/score/nonce', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address })
      }).then(r => r.json());
      
      await fetch('/api/game/score/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address, payload: { ...base, nonce }, sig: '0x' })
      });
      
      const key = 'luminex_tokens';
      const cur = Number(localStorage.getItem(key) || '0');
      localStorage.setItem(key, String(cur + 3));
      loadEnergy(address);
    } catch (e) {
      console.error('Failed to submit score:', e);
    }
  }

  function resetGame() {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('idle');
    setNumbers([]);
    setNextNumber(1);
    setScore(0);
    setTimeLeft(ROUND_TIME);
    setLevel(1);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-green-950 to-zinc-950 text-white p-4 pb-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-transparent text-center">
          🔢 Number Rush
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">⚡ Energy</div>
            <div className="text-xl font-bold text-yellow-400">{energy}</div>
          </div>
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">⏱️ Time</div>
            <div className="text-xl font-bold text-red-400">{timeLeft}s</div>
          </div>
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">📊 Level</div>
            <div className="text-xl font-bold text-blue-400">{level}</div>
          </div>
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">🎯 Score</div>
            <div className="text-xl font-bold text-green-400">{score.toLocaleString()}</div>
          </div>
        </div>

        {gameState === 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30 text-center"
          >
            <div className="text-6xl mb-4">🔢</div>
            <h2 className="text-3xl font-bold mb-4 text-white">พร้อมเล่นแล้ว!</h2>
            <p className="text-white/80 mb-6">
              กดตัวเลขตามลำดับจากน้อยไปมากให้เร็วที่สุด!
            </p>
            <div className="space-y-2 text-sm text-white/70 mb-6">
              <p>✨ กดถูกได้ 100 คะแนน</p>
              <p>❌ กดผิดเสีย 50 คะแนน</p>
              <p>🎯 ผ่าน Level ได้ 500 คะแนนโบนัส!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 font-bold text-xl shadow-2xl shadow-green-500/50"
            >
              ▶ เริ่มเล่น
            </motion.button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">
                กดเลข: <span className="text-green-400 text-4xl">{nextNumber}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-3 max-w-2xl mx-auto">
              {numbers.map((num) => (
                <motion.button
                  key={num}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleNumberClick(num)}
                  className={`py-6 rounded-xl font-bold text-2xl transition-all ${
                    num === nextNumber
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/50 border-2 border-green-300'
                      : 'bg-zinc-900/60 text-white/80 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {num}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-8 bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-500/50 text-center space-y-6"
          >
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-4">เกมจบ!</h2>
            <div className="space-y-3 text-lg">
              <p className="text-white/90">🎯 คะแนนสุดท้าย: <b className="text-yellow-300">{score.toLocaleString()}</b></p>
              <p className="text-white/90">📊 Level ที่ไปถึง: <b className="text-green-300">{level}</b></p>
              <p className="text-green-400 font-bold">💰 ได้รับ 3 Tokens!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 font-bold text-xl"
            >
              เล่นอีกครั้ง
            </motion.button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
