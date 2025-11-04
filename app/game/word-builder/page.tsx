'use client';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

const WORDS = [
  ['G', 'A', 'M', 'E'], // GAME
  ['W', 'O', 'R', 'D'], // WORD
  ['P', 'L', 'A', 'Y'], // PLAY
  ['F', 'U', 'N'], // FUN
  ['W', 'I', 'N'], // WIN
  ['L', 'O', 'V', 'E'], // LOVE
  ['C', 'O', 'D', 'E'], // CODE
  ['H', 'A', 'P', 'P', 'Y'], // HAPPY
  ['S', 'T', 'A', 'R'], // STAR
  ['M', 'O', 'O', 'N'], // MOON
];

const TIME_LIMIT = 60;

export default function WordBuilderPage() {
  const [address, setAddress] = useState('');
  const [energy, setEnergy] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [currentWord, setCurrentWord] = useState<string[]>([]);
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
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

  function getNewWord() {
    const unused = WORDS.filter(w => !usedWords.has(w.join('')));
    if (unused.length === 0) {
      // Reset if all words used
      setUsedWords(new Set());
      return WORDS[Math.floor(Math.random() * WORDS.length)];
    }
    return unused[Math.floor(Math.random() * unused.length)];
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
    setScore(0);
    setTimeLeft(TIME_LIMIT);
    setUsedWords(new Set());
    setCurrentWord([]);
    
    const word = getNewWord();
    setAvailableLetters(shuffleArray([...word]));
    
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

  function addLetter(letter: string, index: number) {
    if (gameState !== 'playing') return;
    
    setCurrentWord(prev => [...prev, letter]);
    setAvailableLetters(prev => prev.filter((_, i) => i !== index));
  }

  function removeLetter(index: number) {
    if (gameState !== 'playing') return;
    
    const removed = currentWord[index];
    setCurrentWord(prev => prev.filter((_, i) => i !== index));
    setAvailableLetters(prev => [...prev, removed]);
  }

  function checkWord() {
    if (currentWord.length < 3) return;
    
    const word = currentWord.join('');
    const foundWord = WORDS.find(w => w.join('') === word.toUpperCase());
    
    if (foundWord && !usedWords.has(word.toUpperCase())) {
      // Correct word!
      const points = word.length * 50 + Math.floor(timeLeft / 5) * 10;
      setScore(prev => prev + points);
      setUsedWords(prev => new Set([...prev, word.toUpperCase()]));
      setCurrentWord([]);
      
      // Get new word
      const newWord = getNewWord();
      const usedLetters = foundWord.length;
      const remainingLetters = availableLetters.length - usedLetters;
      
      // Add back unused letters and new word letters
      const newLetters = [...availableLetters.slice(usedLetters), ...newWord];
      setAvailableLetters(shuffleArray(newLetters));
    } else {
      // Wrong word - clear
      const letters = [...currentWord];
      setCurrentWord([]);
      setAvailableLetters(prev => [...prev, ...letters]);
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
      localStorage.setItem(key, String(cur + 5));
      loadEnergy(address);
    } catch (e) {
      console.error('Failed to submit score:', e);
    }
  }

  function resetGame() {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('idle');
    setCurrentWord([]);
    setAvailableLetters([]);
    setScore(0);
    setTimeLeft(TIME_LIMIT);
    setUsedWords(new Set());
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-indigo-950 to-zinc-950 text-white p-4 pb-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent text-center">
          📝 Word Builder
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">⚡ Energy</div>
            <div className="text-xl font-bold text-yellow-400">{energy}</div>
          </div>
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">⏱️ Time</div>
            <div className="text-xl font-bold text-red-400">{timeLeft}s</div>
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
            className="rounded-2xl p-8 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/30 text-center"
          >
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-3xl font-bold mb-4 text-white">พร้อมเล่นแล้ว!</h2>
            <p className="text-white/80 mb-6">
              สร้างคำจากตัวอักษรที่มีให้! ยิ่งคำยาวยิ่งได้คะแนนมาก
            </p>
            <div className="space-y-2 text-sm text-white/70 mb-6">
              <p>✨ คำ 3 ตัวอักษร: 150 คะแนน</p>
              <p>✨ คำ 4 ตัวอักษร: 200 คะแนน</p>
              <p>✨ คำ 5 ตัวอักษร: 250 คะแนน</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 font-bold text-xl shadow-2xl shadow-indigo-500/50"
            >
              ▶ เริ่มเล่น
            </motion.button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-6">
            {/* Current Word */}
            <div className="rounded-2xl p-6 bg-zinc-900/60 border border-zinc-800">
              <div className="text-sm text-white/60 mb-2">คำที่กำลังสร้าง:</div>
              <div className="flex flex-wrap gap-2 min-h-[60px] items-center">
                {currentWord.length === 0 ? (
                  <span className="text-white/30">กดตัวอักษรเพื่อสร้างคำ...</span>
                ) : (
                  currentWord.map((letter, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeLetter(idx)}
                      className="px-4 py-2 rounded-lg bg-indigo-500 text-white font-bold text-xl"
                    >
                      {letter}
                    </motion.button>
                  ))
                )}
              </div>
              {currentWord.length >= 3 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={checkWord}
                  className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 font-bold text-lg"
                >
                  ✓ ตรวจคำ
                </motion.button>
              )}
            </div>

            {/* Available Letters */}
            <div className="rounded-2xl p-6 bg-zinc-900/60 border border-zinc-800">
              <div className="text-sm text-white/60 mb-4">ตัวอักษรที่มี:</div>
              <div className="flex flex-wrap gap-3">
                {availableLetters.map((letter, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addLetter(letter, idx)}
                    className="px-6 py-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-2xl shadow-lg"
                  >
                    {letter}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Used Words */}
            {usedWords.size > 0 && (
              <div className="rounded-2xl p-4 bg-green-500/10 border border-green-500/30">
                <div className="text-sm text-green-400 mb-2">คำที่สร้างแล้ว:</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(usedWords).map((word, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-lg bg-green-500/20 text-green-300 text-sm">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {gameState === 'gameover' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-8 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-2 border-indigo-500/50 text-center space-y-6"
          >
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-4">เกมจบ!</h2>
            <div className="space-y-3 text-lg">
              <p className="text-white/90">🎯 คะแนนสุดท้าย: <b className="text-yellow-300">{score.toLocaleString()}</b></p>
              <p className="text-white/90">📝 คำที่สร้างได้: <b className="text-indigo-300">{usedWords.size}</b> คำ</p>
              <p className="text-green-400 font-bold">💰 ได้รับ 5 Tokens!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 font-bold text-xl"
            >
              เล่นอีกครั้ง
            </motion.button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
