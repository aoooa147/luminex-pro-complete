'use client';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

type Operation = '+' | '-' | '*' | '/';

const QUESTIONS_PER_ROUND = 10;
const TIME_LIMIT = 30;

export default function MathQuizPage() {
  const [address, setAddress] = useState('');
  const [energy, setEnergy] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [question, setQuestion] = useState<{ num1: number; num2: number; op: Operation; answer: number } | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
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

  function generateQuestion(): { num1: number; num2: number; op: Operation; answer: number } {
    const ops: Operation[] = level <= 2 ? ['+', '-'] : ['+', '-', '*', '/'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    
    let num1: number, num2: number, answer: number;
    
    if (op === '+') {
      num1 = Math.floor(Math.random() * (10 * level)) + 1;
      num2 = Math.floor(Math.random() * (10 * level)) + 1;
      answer = num1 + num2;
    } else if (op === '-') {
      num1 = Math.floor(Math.random() * (10 * level)) + 5;
      num2 = Math.floor(Math.random() * num1) + 1;
      answer = num1 - num2;
    } else if (op === '*') {
      num1 = Math.floor(Math.random() * (5 * level)) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = num1 * num2;
    } else {
      // Division
      num2 = Math.floor(Math.random() * 5) + 2;
      const quotient = Math.floor(Math.random() * 10) + 1;
      num1 = num2 * quotient;
      answer = quotient;
    }
    
    return { num1, num2, op, answer };
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
    setScore(0);
    setCorrect(0);
    setQuestionsAnswered(0);
    setTimeLeft(TIME_LIMIT);
    setUserAnswer('');
    setQuestion(generateQuestion());
    
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

  function handleSubmit() {
    if (!question || !userAnswer) return;
    
    const userNum = parseInt(userAnswer);
    if (isNaN(userNum)) return;
    
    setQuestionsAnswered(prev => prev + 1);
    
    if (userNum === question.answer) {
      // Correct!
      const timeBonus = Math.floor(timeLeft / 5) * 10;
      const levelBonus = level * 20;
      const points = 100 + timeBonus + levelBonus;
      
      setScore(prev => prev + points);
      setCorrect(prev => prev + 1);
      
      // Check if round complete
      if (questionsAnswered + 1 >= QUESTIONS_PER_ROUND) {
        setLevel(prev => prev + 1);
        setQuestionsAnswered(0);
        setTimeLeft(TIME_LIMIT);
      }
    }
    
    // Next question
    setUserAnswer('');
    setQuestion(generateQuestion());
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
      localStorage.setItem(key, String(cur + 6));
      loadEnergy(address);
    } catch (e) {
      console.error('Failed to submit score:', e);
    }
  }

  function resetGame() {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameState('idle');
    setQuestion(null);
    setUserAnswer('');
    setScore(0);
    setCorrect(0);
    setLevel(1);
    setTimeLeft(TIME_LIMIT);
    setQuestionsAnswered(0);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const getOpSymbol = (op: Operation) => {
    switch (op) {
      case '+': return '+';
      case '-': return '-';
      case '*': return '×';
      case '/': return '÷';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-orange-950 to-zinc-950 text-white p-4 pb-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent text-center">
          🧮 Math Quiz
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
            <div className="text-xs text-white/60 mb-1">✅ Correct</div>
            <div className="text-xl font-bold text-green-400">{correct}/{questionsAnswered}</div>
          </div>
          <div className="bg-zinc-900/60 rounded-xl p-3 text-center border border-zinc-800">
            <div className="text-xs text-white/60 mb-1">🎯 Score</div>
            <div className="text-xl font-bold text-orange-400">{score.toLocaleString()}</div>
          </div>
        </div>

        {gameState === 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-8 bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/30 text-center"
          >
            <div className="text-6xl mb-4">🧮</div>
            <h2 className="text-3xl font-bold mb-4 text-white">พร้อมเล่นแล้ว!</h2>
            <p className="text-white/80 mb-6">
              แก้โจทย์คณิตศาสตร์ให้เร็วที่สุด! ถูกมากได้คะแนนมาก
            </p>
            <div className="space-y-2 text-sm text-white/70 mb-6">
              <p>✨ ตอบถูก: 100+ คะแนน</p>
              <p>⚡ Bonus ตามเวลาที่เหลือ</p>
              <p>📊 Level สูงขึ้น ยากขึ้น!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 font-bold text-xl shadow-2xl shadow-orange-500/50"
            >
              ▶ เริ่มเล่น
            </motion.button>
          </motion.div>
        )}

        {gameState === 'playing' && question && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-sm text-white/60 mb-2">
                Level {level} • คำถามที่ {questionsAnswered + 1}/{QUESTIONS_PER_ROUND}
              </div>
              <div className="text-6xl font-bold text-white mb-6">
                {question.num1} {getOpSymbol(question.op)} {question.num2} = ?
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="คำตอบ..."
                className="w-full px-6 py-4 rounded-xl bg-zinc-900/60 border-2 border-orange-500/50 text-white text-3xl text-center font-bold focus:outline-none focus:border-orange-400"
                autoFocus
              />
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 font-bold text-xl"
              >
                ✓ ส่งคำตอบ
              </motion.button>
            </div>

            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
                className="h-full bg-gradient-to-r from-orange-500 to-red-500"
              />
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-8 bg-gradient-to-br from-orange-500/30 to-red-500/30 border-2 border-orange-500/50 text-center space-y-6"
          >
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-4">เกมจบ!</h2>
            <div className="space-y-3 text-lg">
              <p className="text-white/90">🎯 คะแนนสุดท้าย: <b className="text-yellow-300">{score.toLocaleString()}</b></p>
              <p className="text-white/90">✅ ตอบถูก: <b className="text-green-300">{correct}/{questionsAnswered}</b></p>
              <p className="text-white/90">📊 Level ที่ไปถึง: <b className="text-orange-300">{level}</b></p>
              <p className="text-green-400 font-bold">💰 ได้รับ 6 Tokens!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 font-bold text-xl"
            >
              เล่นอีกครั้ง
            </motion.button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
