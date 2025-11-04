'use client';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

const COLORS = [
  { name: 'แดง', emoji: '🔴', bg: 'from-red-500 to-red-600', border: 'border-red-400' },
  { name: 'น้ำเงิน', emoji: '🔵', bg: 'from-blue-500 to-blue-600', border: 'border-blue-400' },
  { name: 'เขียว', emoji: '🟢', bg: 'from-green-500 to-green-600', border: 'border-green-400' },
  { name: 'เหลือง', emoji: '🟡', bg: 'from-yellow-500 to-yellow-600', border: 'border-yellow-400' },
  { name: 'ม่วง', emoji: '🟣', bg: 'from-purple-500 to-purple-600', border: 'border-purple-400' },
  { name: 'ส้ม', emoji: '🟠', bg: 'from-orange-500 to-orange-600', border: 'border-orange-400' },
];

const INITIAL_SEQUENCE_LENGTH = 3;
const SHOW_DURATION = 1000;

export default function ColorTapPage() {
  const [address, setAddress] = useState('');
  const [energy, setEnergy] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'showing' | 'playing' | 'gameover'>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highlightedColor, setHighlightedColor] = useState<number | null>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  function generateSequence(length: number): number[] {
    return Array.from({ length }, () => Math.floor(Math.random() * COLORS.length));
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
    
    setLevel(1);
    setScore(0);
    const newSequence = generateSequence(INITIAL_SEQUENCE_LENGTH);
    setSequence(newSequence);
    setPlayerSequence([]);
    showSequence(newSequence);
  }

  function showSequence(seq: number[]) {
    setGameState('showing');
    let index = 0;
    
    function showNext() {
      if (index >= seq.length) {
        setGameState('playing');
        setHighlightedColor(null);
        return;
      }
      
      setHighlightedColor(seq[index]);
      
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = setTimeout(() => {
        setHighlightedColor(null);
        index++;
        setTimeout(() => showNext(), 200);
      }, SHOW_DURATION);
    }
    
    showNext();
  }

  function handleColorClick(colorIndex: number) {
    if (gameState !== 'playing') return;
    
    const newPlayerSeq = [...playerSequence, colorIndex];
    setPlayerSequence(newPlayerSeq);
    
    // Check if correct
    if (newPlayerSeq[newPlayerSeq.length - 1] !== sequence[newPlayerSeq.length - 1]) {
      // Wrong!
      handleGameOver();
      return;
    }
    
    // Check if sequence complete
    if (newPlayerSeq.length === sequence.length) {
      // Level complete!
      setLevel(prev => prev + 1);
      setScore(prev => prev + 100 * level);
      setPlayerSequence([]);
      
      // Generate longer sequence
      const newSequence = generateSequence(INITIAL_SEQUENCE_LENGTH + level);
      setSequence(newSequence);
      showSequence(newSequence);
    }
  }

  async function handleGameOver() {
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
      localStorage.setItem(key, String(cur + 4));
      loadEnergy(address);
    } catch (e) {
      console.error('Failed to submit score:', e);
    }
  }

  function resetGame() {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    setGameState('idle');
    setSequence([]);
    setPlayerSequence([]);
    setLevel(1);
    setScore(0);
    setHighlightedColor(null);
  }

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-purple-950 to-zinc-950 text-white p-4 pb-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent text-center">
          🎨 Color Tap
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">⚡ Energy</div>
            <div className="text-xl font-bold text-yellow-400">{energy}</div>
          </div>
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">📊 Level</div>
            <div className="text-xl font-bold text-purple-400">{level}</div>
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
            className="rounded-2xl p-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 text-center"
          >
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-3xl font-bold mb-4 text-white">พร้อมเล่นแล้ว!</h2>
            <p className="text-white/80 mb-6">
              จำลำดับสีที่แสดง แล้วกดตามลำดับให้ถูกต้อง!
            </p>
            <div className="space-y-2 text-sm text-white/70 mb-6">
              <p>✨ แต่ละ Level จะยาวขึ้นเรื่อยๆ</p>
              <p>🎯 ผ่าน Level ได้คะแนนเพิ่มขึ้น</p>
              <p>❌ กดผิดเกมจบ!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 font-bold text-xl shadow-2xl shadow-purple-500/50"
            >
              ▶ เริ่มเล่น
            </motion.button>
          </motion.div>
        )}

        {(gameState === 'showing' || gameState === 'playing') && (
          <div className="space-y-6">
            {gameState === 'showing' && (
              <div className="text-center text-lg font-bold text-yellow-300">
                ⏳ ดูลำดับสีให้ดี...
              </div>
            )}
            {gameState === 'playing' && (
              <div className="text-center text-lg font-bold text-green-300">
                ✨ ตอนนี้เป็นตาของคุณ!
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4">
              {COLORS.map((color, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: gameState === 'playing' ? 1.05 : 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleColorClick(idx)}
                  disabled={gameState === 'showing'}
                  className={`aspect-square rounded-2xl border-4 flex flex-col items-center justify-center text-4xl transition-all ${
                    highlightedColor === idx
                      ? `bg-gradient-to-br ${color.bg} ${color.border} scale-110 shadow-2xl`
                      : gameState === 'playing'
                      ? `bg-gradient-to-br ${color.bg} ${color.border} opacity-70 hover:opacity-100`
                      : `bg-gradient-to-br ${color.bg} ${color.border} opacity-50`
                  }`}
                >
                  <span>{color.emoji}</span>
                  <span className="text-xs mt-2">{color.name}</span>
                </motion.button>
              ))}
            </div>
            
            <div className="text-center text-sm text-white/60">
              ความยาวลำดับ: {sequence.length} สี
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-8 bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-500/50 text-center space-y-6"
          >
            <div className="text-7xl mb-4">😢</div>
            <h2 className="text-4xl font-bold text-white mb-4">เกมจบ!</h2>
            <div className="space-y-3 text-lg">
              <p className="text-white/90">🎯 คะแนนสุดท้าย: <b className="text-yellow-300">{score.toLocaleString()}</b></p>
              <p className="text-white/90">📊 Level ที่ไปถึง: <b className="text-purple-300">{level}</b></p>
              <p className="text-green-400 font-bold">💰 ได้รับ 4 Tokens!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 font-bold text-xl"
            >
              เล่นอีกครั้ง
            </motion.button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
