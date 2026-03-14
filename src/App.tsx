import React, { useState, useEffect } from 'react';
import { GameEngine } from './game/GameEngine';
import { Question } from './game/questions';
import { Heart, Coins, Trophy, Clock, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameState {
  score: number;
  lives: number;
  coins: number;
  time: number;
  isGameOver: boolean;
  currentQuestion: Question | null;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    coins: 0,
    time: 0,
    isGameOver: false,
    currentQuestion: null
  });

  const [gameStarted, setGameStarted] = useState(() => {
    const autoStart = sessionStorage.getItem('eduquest_autostart');
    if (autoStart === 'true') {
      sessionStorage.removeItem('eduquest_autostart');
      return true;
    }
    return false;
  });
  const [timer, setTimer] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    let interval: any;
    if (gameStarted && !gameState.isGameOver && !gameState.currentQuestion) {
      interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            setGameState(prev => ({ ...prev, isGameOver: true }));
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameState.isGameOver, !!gameState.currentQuestion]);

  const handleStateChange = (newState: GameState) => {
    setGameState(prev => ({ ...prev, ...newState }));
  };

  const handleAnswer = (index: number) => {
    const isCorrect = index === gameState.currentQuestion?.correctIndex;
    (window as any).answerQuestion(isCorrect);
  };

  const [ranking, setRanking] = useState<{name: string, score: number}[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('eduquest_ranking');
    if (saved) setRanking(JSON.parse(saved));
  }, []);

  const saveScore = (name: string) => {
    const newRanking = [...ranking, { name, score: gameState.score }]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    setRanking(newRanking);
    localStorage.setItem('eduquest_ranking', JSON.stringify(newRanking));
  };

  const restartLevel = () => {
    sessionStorage.setItem('eduquest_autostart', 'true');
    window.location.reload(); 
  };

  const goToMainMenu = () => {
    sessionStorage.removeItem('eduquest_autostart');
    window.location.reload();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-sky-400 font-sans text-white">
      {!gameStarted ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center p-8 bg-white/10 rounded-3xl border border-white/20 shadow-2xl"
          >
            <h1 className="text-6xl font-black mb-4 tracking-tighter uppercase italic">EduQuest 3D</h1>
            <p className="text-xl mb-8 opacity-80">Aprenda Matemática e Português em uma aventura épica!</p>
            <button 
              onClick={() => setGameStarted(true)}
              className="group relative px-12 py-4 bg-emerald-500 hover:bg-emerald-400 rounded-full font-bold text-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
            >
              <Play fill="currentColor" /> JOGAR AGORA
            </button>
            <div className="mt-12 grid grid-cols-2 gap-4 text-sm opacity-60">
              <div>SETAS: Mover</div>
              <div>ESPAÇO: Pular</div>
              <div>F: Atirar Fogo</div>
              <div>BOX: Desafio</div>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          <GameEngine onStateChange={handleStateChange} />

          {/* HUD */}
          <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4 bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <div className="flex items-center gap-1 text-red-400">
                  <AnimatePresence mode="popLayout">
                    {Array.from({ length: gameState.lives }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <Heart size={24} fill="currentColor" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {gameState.lives === 0 && <span className="text-xs font-bold uppercase tracking-tighter opacity-50">Sem Vidas</span>}
                </div>
                <div className="w-px h-6 bg-white/20" />
                <div className="flex items-center gap-2 text-yellow-400 font-bold text-xl">
                  <Coins size={24} /> {gameState.coins}
                </div>
              </div>
              <div className="bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 inline-flex items-center gap-2">
                <Trophy size={20} className="text-emerald-400" />
                <span className="font-mono text-xl">{gameState.score.toLocaleString().padStart(8, '0')}</span>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <Clock size={24} className="text-sky-300" />
              <span className="font-mono text-2xl font-bold">
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Question Modal (Balloon Style) */}
          <AnimatePresence>
            {gameState.currentQuestion && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              >
                <motion.div 
                  initial={{ y: 100, scale: 0.5, rotate: -5 }}
                  animate={{ y: 0, scale: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  className="relative bg-white text-black p-8 rounded-[3rem] max-w-xl w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-emerald-500"
                >
                  {/* Balloon Tail */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-emerald-500" />
                  
                  <div className="flex justify-between items-center mb-6">
                    <span className="px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold uppercase tracking-widest">
                      {gameState.currentQuestion.category}
                    </span>
                    <span className="text-zinc-500 font-mono">DESAFIO # {gameState.currentQuestion.id}</span>
                  </div>
                  
                  <h2 className="text-4xl font-black mb-8 text-center leading-tight">
                    {gameState.currentQuestion.question}
                  </h2>

                  <div className="grid grid-cols-1 gap-4">
                    {gameState.currentQuestion.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className="w-full p-5 text-left bg-zinc-100 hover:bg-emerald-50 border-2 border-zinc-200 hover:border-emerald-300 rounded-2xl text-xl font-bold transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-4 group text-black"
                      >
                        <span className="w-10 h-10 flex items-center justify-center bg-zinc-200 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {option}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Over Modal */}
          <AnimatePresence>
            {gameState.isGameOver && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-red-950/90 backdrop-blur-xl p-4"
              >
                <motion.div 
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="bg-black/40 p-10 rounded-[3rem] border border-white/10 max-w-2xl w-full"
                >
                  <h2 className="text-7xl font-black mb-4 tracking-tighter italic uppercase text-center">FIM DE JOGO</h2>
                  <div className="text-3xl mb-8 opacity-80 text-center">Sua pontuação final: <span className="text-yellow-400 font-bold">{gameState.score}</span></div>
                  
                  <div className="mb-8 bg-white/5 p-6 rounded-3xl border border-white/5">
                    <h3 className="text-xl font-bold mb-4 uppercase tracking-widest text-emerald-400">Top 5 Ranking</h3>
                    <div className="space-y-2">
                      {ranking.map((r, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                          <span className="font-bold">{i + 1}. {r.name}</span>
                          <span className="font-mono text-yellow-400">{r.score}</span>
                        </div>
                      ))}
                      {ranking.length === 0 && <div className="opacity-40 italic">Nenhum recorde ainda...</div>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <input 
                      type="text" 
                      placeholder="Seu nome para o ranking..." 
                      className="w-full px-6 py-4 bg-white/10 rounded-full border border-white/20 text-xl text-center outline-none focus:border-emerald-500 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveScore((e.target as HTMLInputElement).value || 'Anônimo');
                          (e.target as HTMLInputElement).disabled = true;
                        }
                      }}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={restartLevel}
                        className="px-6 py-4 bg-emerald-500 text-white rounded-full font-bold text-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={20} /> REINICIAR
                      </button>
                      <button 
                        onClick={goToMainMenu}
                        className="px-6 py-4 bg-white text-black rounded-full font-bold text-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                      >
                        MENU PRINCIPAL
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
