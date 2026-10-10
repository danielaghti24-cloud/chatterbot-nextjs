'use client';

import React, { useEffect, useState } from 'react';
import { ModelConfig } from '@/types/chat';
import { SOLVED, isSolved, applyMove, shuffle, validate, solve } from '@/lib/puzzle';
import {
  Timer,
  Footprints,
  Trophy,
  Shuffle,
  RotateCcw,
  Lightbulb,
  Sparkles,
  Cpu,
  Loader2,
} from 'lucide-react';

interface PuzzleBoardProps {
  config: ModelConfig;
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({ config }) => {
  const [tiles, setTiles] = useState<number[]>(SOLVED);
  const [initial, setInitial] = useState<number[]>(SOLVED);
  const [ready, setReady] = useState(false);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const [queue, setQueue] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const solved = ready && isSolved(tiles);
  const locked = busy || queue.length > 0;

  const startGame = (board: number[]) => {
    setTiles(board);
    setInitial(board);
    setMoves(0);
    setSeconds(0);
    setRunning(false);
    setQueue([]);
    setHint(null);
    setMessage('');
    setReady(true);
  };

  // Mezcla inicial en el cliente (evita errores de hidratación)
  useEffect(() => {
    const id = setTimeout(() => startGame(shuffle()), 0);
    return () => clearTimeout(id);
  }, []);

  // Cronómetro
  useEffect(() => {
    if (!running || solved) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running, solved]);

  // Reproduce la solución paso a paso con animación
  useEffect(() => {
    if (queue.length === 0) return;
    const id = setTimeout(() => {
      const next = applyMove(tiles, queue[0]);
      if (next) {
        setTiles(next);
        setMoves((m) => m + 1);
        if (isSolved(next)) setRunning(false);
      }
      setQueue((q) => q.slice(1));
    }, 450);
    return () => clearTimeout(id);
  }, [queue, tiles]);

  const handleTile = (n: number) => {
    if (!ready || locked || solved) return;
    const next = applyMove(tiles, n);
    if (!next) return;
    const newMoves = moves + 1;
    setTiles(next);
    setMoves(newMoves);
    setRunning(true);
    setHint(null);
    if (isSolved(next)) {
      setRunning(false);
      setBest((b) => (b === null || newMoves < b ? newMoves : b));
      setMessage('🎉 ¡Lo resolviste tú!');
    }
  };

  const showHint = () => {
    if (!ready || locked || solved) return;
    const sol = solve(tiles);
    if (sol && sol.length > 0) {
      setHint(sol[0]);
      setMessage(`💡 Pista: mueve la ficha ${sol[0]} (faltan ${sol.length} movimientos como mínimo).`);
    }
  };

  const solveLocal = () => {
    if (!ready || locked || solved) return;
    const sol = solve(tiles);
    if (sol) {
      setHint(null);
      setQueue(sol);
      setMessage(`⚙️ Solucionador local (BFS): solución óptima de ${sol.length} movimientos.`);
    }
  };

  const solveWithAI = async () => {
    if (!ready || locked || solved) return;
    setBusy(true);
    setHint(null);
    setMessage('🤖 Consultando a Gemini...');
    const snapshot = tiles;

    try {
      const res = await fetch('/api/puzzle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: snapshot, modelName: config.modelName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error del servidor');

      if (validate(snapshot, data.moves)) {
        setQueue(data.moves);
        setMessage(
          `✅ Gemini (${data.modelUsed}) dio una solución válida de ${data.moves.length} movimientos. ${data.explanation}`
        );
      } else {
        const sol = solve(snapshot);
        if (sol) {
          setQueue(sol);
          setMessage(
            `⚠️ La solución de Gemini no era válida, así que usé el solucionador local (BFS): ${sol.length} movimientos.`
          );
        }
      }
    } catch (e: unknown) {
      const sol = solve(snapshot);
      if (sol) {
        setQueue(sol);
        setMessage(
          `⚠️ No pude consultar a Gemini (${e instanceof Error ? e.message.slice(0, 80) : 'error'}). Usé el solucionador local: ${sol.length} movimientos.`
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const btn =
    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center gap-5">
      {/* Estadísticas */}
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-100">
          <Timer className="w-4 h-4 text-indigo-400" /> {fmt(seconds)}
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-100">
          <Footprints className="w-4 h-4 text-indigo-400" /> {moves}
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 text-amber-300">
          <Trophy className="w-4 h-4" /> Mejor: {best ?? '--'}
        </div>
      </div>

      {/* Tablero */}
      <div className="relative w-full max-w-sm aspect-square bg-slate-800 border border-slate-700 rounded-2xl p-2 shadow-xl">
        <div className="relative w-full h-full">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
            const i = tiles.indexOf(n);
            const inPlace = SOLVED[i] === n;
            return (
              <div
                key={n}
                className="absolute p-1 transition-all duration-300 ease-in-out"
                style={{
                  width: '33.3333%',
                  height: '33.3333%',
                  left: `${(i % 3) * 33.3333}%`,
                  top: `${Math.floor(i / 3) * 33.3333}%`,
                }}
              >
                <button
                  onClick={() => handleTile(n)}
                  className={`w-full h-full rounded-xl text-4xl font-bold text-white shadow-md transition-colors ${
                    solved
                      ? 'bg-emerald-600'
                      : inPlace
                      ? 'bg-indigo-500'
                      : 'bg-indigo-700 hover:bg-indigo-600'
                  } ${hint === n ? 'ring-4 ring-amber-400 animate-pulse' : ''}`}
                >
                  {n}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={solveWithAI}
          disabled={locked || solved || !ready}
          className={`${btn} bg-indigo-600 hover:bg-indigo-500 text-white`}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Resolver con Gemini
        </button>
        <button
          onClick={solveLocal}
          disabled={locked || solved || !ready}
          className={`${btn} bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700`}
        >
          <Cpu className="w-4 h-4" /> Solucionador local
        </button>
        <button
          onClick={showHint}
          disabled={locked || solved || !ready}
          className={`${btn} bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700`}
        >
          <Lightbulb className="w-4 h-4" /> Pista
        </button>
        <button
          onClick={() => startGame(shuffle())}
          disabled={busy}
          className={`${btn} bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700`}
        >
          <Shuffle className="w-4 h-4" /> Nuevo juego
        </button>
        <button
          onClick={() => startGame(initial)}
          disabled={busy}
          className={`${btn} bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700`}
        >
          <RotateCcw className="w-4 h-4" /> Reiniciar
        </button>
      </div>

      {solved && !message.includes('tú') && (
        <p className="text-emerald-400 font-semibold">🎉 ¡Puzzle resuelto!</p>
      )}
      {message && (
        <p className="max-w-md text-center text-sm text-slate-300 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          {message}
        </p>
      )}
    </div>
  );
};