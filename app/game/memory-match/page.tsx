'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Card = { id: number; emoji: string; flipped: boolean; matched: boolean };

const EMOJIS = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎬', '🎤', '🎧', '🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🥁', '🎲'];
const GRID_SIZES = [
  { size: 4, name: 'ง่าย', pairs: 8 },
  { size: 6, name: 'กลาง', pairs: 18 },
  { size: 8, name: 'ยาก', pairs: 32 },
];

export default function MemoryMatchPage() {
  const [address, setAddress] = useState('');
  const [energy, setEnergy] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'victory'>('idle');
  const [difficulty, setDifficulty] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
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

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function createCards(): Card[] {
    const gridSize = GRID_SIZES[difficulty].size;
    const pairs = GRID_SIZES[difficulty].pairs;
    const selectedEmojis = shuffleArray(EMOJIS).slice(0, pairs);
    const cardPairs = [...selectedEmojis, ...selectedEmojis];
    const shuffled = shuffleArray(cardPairs);
    
    return shuffled.map((emoji, index) => ({
      id: index,
      emoji,
      flipped: false,
      matched: false,
    }));
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
    setCards(createCards());
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setScore(0);
    setTime(0);
    
    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
  }

  function flipCard(id: number) {
    if (gameState !== 'playing') return;
    const card = cards[id];
    if (card.flipped || card.matched || flippedCards.length >= 2) return;
    
    const newCards = [...cards];
    newCards[id].flipped = true;
    setCards(newCards);
    
    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);
    
    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      checkMatch(newFlipped);
    }
  }

  function checkMatch(flipped: number[]) {
    setTimeout(() => {
      const [id1, id2] = flipped;
      const card1 = cards[id1];
      const card2 = cards[id2];
      
      if (card1.emoji === card2.emoji) {
        // Match!
        const newCards = [...cards];
        newCards[id1].matched = true;
        newCards[id2].matched = true;
        setCards(newCards);
        setMatches(prev => {
          const newMatches = prev + 1;
          const pairs = GRID_SIZES[difficulty].pairs;
          
          // Calculate score
          const timeBonus = Math.max(0, 1000 - time * 10);
          const movesBonus = Math.max(0, 500 - moves * 5);
          const matchBonus = newMatches * 100;
          setScore(timeBonus + movesBonus + matchBonus);
          
          // Check victory
          if (newMatches >= pairs) {
            if (timerRef.current) clearInterval(timerRef.current);
            setGameState('victory');
            handleVictory();
          }
          
          return newMatches;
        });
      } else {
        // No match, flip back
        const newCards = [...cards];
        newCards[id1].flipped = false;
        newCards[id2].flipped = false;
        setCards(newCards);
      }
      
      setFlippedCards([]);
    }, 1000);
  }

  async function handleVictory() {
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
      localStorage.setItem(key, String(cur + 5));
      loadEnergy(address);
    } catch (e) {
      console.error('Failed to submit score:', e);
    }
  }

  function resetGame() {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('idle');
    setCards([]);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setScore(0);
    setTime(0);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const gridSize = GRID_SIZES[difficulty].size;
  const pairs = GRID_SIZES[difficulty].pairs;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-blue-950 to-zinc-950 text-white p-4 pb-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent text-center">
          🧠 Memory Match
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">⚡ Energy</div>
            <div className="text-xl font-bold text-yellow-400">{energy}</div>
          </div>
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">⏱️ Time</div>
            <div className="text-xl font-bold text-blue-400">{time}s</div>
          </div>
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">🎯 Moves</div>
            <div className="text-xl font-bold text-purple-400">{moves}</div>
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
            className="space-y-6"
          >
            <div className="rounded-2xl p-8 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/30 text-center">
              <div className="text-6xl mb-4">🧠</div>
              <h2 className="text-3xl font-bold mb-4 text-white">เลือกความยาก</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {GRID_SIZES.map((size, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDifficulty(idx)}
                    className={`p-4 rounded-xl border-2 ${
                      difficulty === idx
                        ? 'bg-blue-500/30 border-blue-400'
                        : 'bg-zinc-900/60 border-zinc-800'
                    }`}
                  >
                    <div className="text-2xl mb-2">{size.name}</div>
                    <div className="text-sm opacity-70">{size.size}x{size.size}</div>
                    <div className="text-xs opacity-50">{size.pairs} คู่</div>
                  </motion.button>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 font-bold text-xl shadow-2xl shadow-blue-500/50"
              >
                ▶ เริ่มเล่น
              </motion.button>
            </div>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-bold text-white/80 mb-2">
                จับคู่: {matches}/{pairs}
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(matches / pairs) * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                />
              </div>
            </div>
            
            <div
              className="grid gap-3 mx-auto"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                maxWidth: `${gridSize * 80}px`,
              }}
            >
              {cards.map((card, idx) => (
                <motion.button
                  key={card.id}
                  whileHover={{ scale: card.flipped || card.matched ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => flipCard(idx)}
                  disabled={card.flipped || card.matched}
                  className={`aspect-square rounded-xl border-2 flex items-center justify-center text-4xl transition-all ${
                    card.matched
                      ? 'bg-green-500/30 border-green-400'
                      : card.flipped
                      ? 'bg-blue-500/30 border-blue-400'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-blue-500/50'
                  }`}
                >
                  {card.flipped || card.matched ? card.emoji : '❓'}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'victory' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-8 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-2 border-blue-500/50 text-center space-y-6"
          >
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-4">คุณชนะแล้ว!</h2>
            <div className="space-y-3 text-lg">
              <p className="text-white/90">🎯 คะแนน: <b className="text-yellow-300">{score.toLocaleString()}</b></p>
              <p className="text-white/90">⏱️ เวลา: <b className="text-blue-300">{time} วินาที</b></p>
              <p className="text-white/90">🎯 จำนวนการพลิก: <b className="text-purple-300">{moves}</b></p>
              <p className="text-green-400 font-bold">💰 ได้รับ 5 Tokens!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 font-bold text-xl"
            >
              เล่นอีกครั้ง
            </motion.button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
