'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type CoinSide = 'heads' | 'tails';
type GameState = 'idle' | 'playing' | 'flipping' | 'result' | 'gameover' | 'victory';

const MAX_LIVES = 3;
const TARGET_STREAK = 10; // Need 10 correct in a row to win
const FLIP_ANIMATION_DURATION = 1500;
const RESULT_SHOW_DURATION = 1500;
const DIFFICULTY_INCREASE_AT = [3, 6, 9]; // Increase difficulty at these streaks

// Sound effects using Web Audio API
function playSound(frequency: number, duration: number, type: 'sine' | 'square' | 'sawtooth' = 'sine') {
  if (typeof window === 'undefined') return;
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.error('Failed to play sound:', e);
  }
}

function playFlipSound() {
  // Coin flip sound: rising pitch
  playSound(300, 0.1, 'sine');
  setTimeout(() => playSound(400, 0.1, 'sine'), 50);
  setTimeout(() => playSound(500, 0.1, 'sine'), 100);
}

function playCorrectSound() {
  // Success sound: pleasant chord
  playSound(523, 0.2, 'sine'); // C
  setTimeout(() => playSound(659, 0.2, 'sine'), 50); // E
  setTimeout(() => playSound(784, 0.3, 'sine'), 100); // G
}

function playWrongSound() {
  // Error sound: low descending
  playSound(200, 0.3, 'sawtooth');
  setTimeout(() => playSound(150, 0.3, 'sawtooth'), 100);
}

function playVictorySound() {
  // Victory fanfare
  playSound(523, 0.2, 'sine');
  setTimeout(() => playSound(659, 0.2, 'sine'), 150);
  setTimeout(() => playSound(784, 0.2, 'sine'), 300);
  setTimeout(() => playSound(1047, 0.5, 'sine'), 450);
}

function playGameOverSound() {
  // Sad sound
  playSound(200, 0.5, 'sawtooth');
  setTimeout(() => playSound(150, 0.5, 'sawtooth'), 200);
}

export default function CoinFlipPage() {
  const [address, setAddress] = useState('');
  const [energy, setEnergy] = useState(0);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [lives, setLives] = useState(MAX_LIVES);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [currentCoin, setCurrentCoin] = useState<CoinSide>('heads');
  const [flipResult, setFlipResult] = useState<CoinSide | null>(null);
  const [playerGuess, setPlayerGuess] = useState<CoinSide | null>(null);
  const [flipRotation, setFlipRotation] = useState(0);
  const [difficulty, setDifficulty] = useState(1); // 1 = normal, 2 = fast, 3 = very fast
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const flipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scoreMultiplier = Math.floor(streak / 3) + 1;

  useEffect(() => {
    const a = sessionStorage.getItem('verifiedAddress') || localStorage.getItem('user_address') || '';
    setAddress(a);
    if (a) loadEnergy(a);
    
    // Check sound preference
    const soundPref = localStorage.getItem('game_sound_enabled');
    if (soundPref !== null) {
      setSoundEnabled(soundPref === 'true');
    }
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

  function toggleSound() {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('game_sound_enabled', String(newState));
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
    setLives(MAX_LIVES);
    setStreak(0);
    setScore(0);
    setConsecutiveCorrect(0);
    setDifficulty(1);
    generateNewCoin();
  }

  function generateNewCoin(): CoinSide {
    const side = Math.random() < 0.5 ? 'heads' : 'tails';
    setCurrentCoin(side);
    return side;
  }

  function guessCoin(side: CoinSide) {
    if (gameState !== 'playing') return;
    
    setPlayerGuess(side);
    setGameState('flipping');
    setFlipRotation(0);
    
    // Play flip sound
    if (soundEnabled) {
      playFlipSound();
    }
    
    // Start flip animation
    let rotation = 0;
    const interval = setInterval(() => {
      rotation += 15;
      setFlipRotation(rotation);
      if (rotation >= 1440) { // 4 full rotations
        clearInterval(interval);
      }
    }, 10);

    // Generate result after animation
    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
    flipTimeoutRef.current = setTimeout(() => {
      clearInterval(interval);
      const result = generateNewCoin();
      setFlipResult(result);
      checkResult(side, result);
    }, FLIP_ANIMATION_DURATION);
  }

  function checkResult(guess: CoinSide, result: CoinSide) {
    setGameState('result');
    
    if (guess === result) {
      // Correct!
      if (soundEnabled) {
        playCorrectSound();
      }
      
      const newStreak = streak + 1;
      const newConsecutive = consecutiveCorrect + 1;
      setStreak(newStreak);
      setConsecutiveCorrect(newConsecutive);
      
      // Calculate score with multiplier
      const baseScore = 100;
      const streakBonus = Math.floor(newStreak / 2) * 50;
      const multiplierBonus = baseScore * (scoreMultiplier - 1);
      const points = baseScore + streakBonus + multiplierBonus;
      setScore(prev => prev + points);
      
      // Increase difficulty at certain streaks
      if (DIFFICULTY_INCREASE_AT.includes(newStreak)) {
        setDifficulty(prev => Math.min(prev + 1, 3));
      }
      
      // Check for victory
      if (newStreak >= TARGET_STREAK) {
        if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = setTimeout(() => {
          if (soundEnabled) {
            playVictorySound();
          }
          handleVictory();
        }, RESULT_SHOW_DURATION);
        return;
      }
      
      // Continue to next round
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
      resultTimeoutRef.current = setTimeout(() => {
        setGameState('playing');
        setFlipResult(null);
        setPlayerGuess(null);
      }, RESULT_SHOW_DURATION);
    } else {
      // Wrong!
      if (soundEnabled) {
        playWrongSound();
      }
      
      const newLives = lives - 1;
      setLives(newLives);
      setConsecutiveCorrect(0);
      
      if (newLives <= 0) {
        // Game over
        if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = setTimeout(() => {
          if (soundEnabled) {
            playGameOverSound();
          }
          handleGameOver();
        }, RESULT_SHOW_DURATION);
      } else {
        // Continue with less lives
        if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = setTimeout(() => {
          setGameState('playing');
          setFlipResult(null);
          setPlayerGuess(null);
          setStreak(0); // Reset streak on wrong guess
        }, RESULT_SHOW_DURATION);
      }
    }
  }

  async function handleVictory() {
    setGameState('victory');
    try {
      const base = { address, score, ts: Date.now() };
      const { nonce } = await fetch('/api/game/score/nonce', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address })
      }).then(r => r.json());
      
      const payload = { ...base, nonce };
      await fetch('/api/game/score/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address, payload, sig: '0x' })
      });
      
      // Reward
      const key = 'luminex_tokens';
      const cur = Number(localStorage.getItem(key) || '0');
      localStorage.setItem(key, String(cur + 10)); // 10 tokens reward
      
      loadEnergy(address);
    } catch (e) {
      console.error('Failed to submit score:', e);
    }
  }

  function handleGameOver() {
    setGameState('gameover');
  }

  function resetGame() {
    setGameState('idle');
    setFlipResult(null);
    setPlayerGuess(null);
    setFlipRotation(0);
    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
  }

  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    };
  }, []);

  const isCorrect = flipResult !== null && playerGuess === flipResult;
  const showResult = gameState === 'result' || gameState === 'flipping';

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-purple-950 to-zinc-950 text-white p-4 pb-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            🪙 Coin Flip Challenge
          </h1>
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 transition-colors"
            aria-label="Toggle sound"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">⚡ Energy</div>
            <div className="text-xl font-bold text-yellow-400">{energy}</div>
          </div>
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">🔥 Streak</div>
            <div className="text-xl font-bold text-orange-400">{streak}/{TARGET_STREAK}</div>
          </div>
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">❤️ Lives</div>
            <div className="text-xl font-bold text-red-400">{lives}/{MAX_LIVES}</div>
          </div>
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">🎯 Score</div>
            <div className="text-xl font-bold text-purple-400">{score.toLocaleString()}</div>
          </div>
        </div>

        {gameState === 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="rounded-2xl p-8 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 text-center">
              <div className="text-6xl mb-4">🪙</div>
              <h2 className="text-3xl font-bold mb-4 text-white">พร้อมท้าทายแล้ว!</h2>
              <p className="text-white/80 mb-6">
                เดาเหรียญให้ถูกต้อง <b className="text-yellow-300">{TARGET_STREAK} ครั้งติดต่อกัน</b> เพื่อชนะ!
              </p>
              <div className="space-y-2 text-sm text-white/70 mb-6">
                <p>✨ คุณมี {MAX_LIVES} ชีวิต</p>
                <p>🔥 ทำ Streak เพื่อคะแนนเพิ่มขึ้น</p>
                <p>⚡ คะแนนจะเพิ่มตาม Multiplier!</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 font-bold text-xl shadow-2xl shadow-yellow-500/50"
              >
                ▶ เริ่มเล่น
              </motion.button>
            </div>
          </motion.div>
        )}

        {(gameState === 'playing' || gameState === 'flipping' || gameState === 'result') && (
          <div className="space-y-6">
            {/* Coin Display */}
            <div className="relative h-64 flex items-center justify-center">
              <motion.div
                animate={{
                  rotateY: showResult ? flipRotation : 0,
                  scale: showResult ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: showResult ? FLIP_ANIMATION_DURATION / 1000 : 0.3,
                  ease: 'easeInOut',
                }}
                className="relative w-48 h-48"
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1000px',
                }}
              >
                {/* Coin */}
                <div
                  className="absolute inset-0 rounded-full border-4 border-yellow-400 shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${
                      (showResult && flipResult) ? (flipResult === 'heads' ? '#FFD700, #FFA500' : '#C0C0C0, #808080') : '#FFD700, #FFA500'
                    })`,
                    transform: `rotateY(${flipRotation}deg)`,
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl">
                      {showResult && flipResult
                        ? flipResult === 'heads' ? '👑' : '⚜️'
                        : '🪙'}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Result Message */}
            <AnimatePresence>
              {gameState === 'result' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={`text-center py-4 rounded-xl font-bold text-2xl ${
                    isCorrect
                      ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
                      : 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
                  }`}
                >
                  {isCorrect ? (
                    <span>✅ ถูกต้อง! +{100 * scoreMultiplier} คะแนน</span>
                  ) : (
                    <span>❌ ผิด! -1 ชีวิต</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Guess Buttons */}
            {gameState === 'playing' && (
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => guessCoin('heads')}
                  className="py-8 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 font-bold text-2xl shadow-2xl shadow-yellow-500/50 border-2 border-yellow-300/50"
                >
                  👑 Heads
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => guessCoin('tails')}
                  className="py-8 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 hover:from-gray-300 hover:to-gray-500 font-bold text-2xl shadow-2xl shadow-gray-400/50 border-2 border-gray-300/50"
                >
                  ⚜️ Tails
                </motion.button>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/70">
                <span>ความคืบหน้า</span>
                <span>{streak}/{TARGET_STREAK}</span>
              </div>
              <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(streak / TARGET_STREAK) * 100}%` }}
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                />
              </div>
            </div>

            {/* Lives Display */}
            <div className="flex justify-center gap-2">
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <div
                  key={i}
                  className={`text-3xl transition-all ${
                    i < lives ? 'opacity-100 scale-100' : 'opacity-30 scale-75 grayscale'
                  }`}
                >
                  ❤️
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'victory' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-8 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500/50 text-center space-y-6"
          >
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-4">คุณชนะแล้ว!</h2>
            <div className="space-y-3 text-lg">
              <p className="text-white/90">🎯 คะแนนสุดท้าย: <b className="text-yellow-300">{score.toLocaleString()}</b></p>
              <p className="text-white/90">🔥 Streak สูงสุด: <b className="text-orange-300">{streak}</b></p>
              <p className="text-green-400 font-bold">💰 ได้รับ 10 Tokens!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 font-bold text-xl"
            >
              เล่นอีกครั้ง
            </motion.button>
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-8 bg-gradient-to-br from-red-500/20 to-pink-500/20 border-2 border-red-500/30 text-center space-y-6"
          >
            <div className="text-7xl mb-4">😢</div>
            <h2 className="text-4xl font-bold text-white mb-4">เกมจบ!</h2>
            <div className="space-y-3 text-lg">
              <p className="text-white/90">🎯 คะแนนสุดท้าย: <b className="text-yellow-300">{score.toLocaleString()}</b></p>
              <p className="text-white/90">🔥 Streak สูงสุด: <b className="text-orange-300">{streak}</b></p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 font-bold text-xl"
            >
              ลองอีกครั้ง
            </motion.button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
