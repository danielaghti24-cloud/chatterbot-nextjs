export const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 0]; // 0 = hueco

export function isSolved(t: number[]): boolean {
  return t.every((v, i) => v === SOLVED[i]);
}

function adjacent(a: number, b: number): boolean {
  const ra = Math.floor(a / 3), ca = a % 3;
  const rb = Math.floor(b / 3), cb = b % 3;
  return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
}

// Desliza la ficha `tile` al hueco. Devuelve el nuevo tablero o null si no es válido.
export function applyMove(t: number[], tile: number): number[] | null {
  const i = t.indexOf(tile);
  const blank = t.indexOf(0);
  if (tile === 0 || i === -1 || !adjacent(i, blank)) return null;
  const next = [...t];
  next[blank] = tile;
  next[i] = 0;
  return next;
}

// Mezcla con movimientos aleatorios válidos: siempre queda resoluble
export function shuffle(steps = 80): number[] {
  let board = [...SOLVED];
  let last = -1;
  for (let s = 0; s < steps; s++) {
    const blank = board.indexOf(0);
    const options = board.filter(
      (v, i) => v !== 0 && v !== last && adjacent(i, blank)
    );
    const tile = options[Math.floor(Math.random() * options.length)];
    board = applyMove(board, tile)!;
    last = tile;
  }
  return isSolved(board) ? shuffle(steps) : board;
}

// Comprueba que una lista de movimientos resuelva el tablero
export function validate(board: number[], moves: unknown): boolean {
  if (!Array.isArray(moves) || moves.length === 0 || moves.length > 60) return false;
  let cur: number[] | null = board;
  for (const m of moves) {
    if (typeof m !== 'number') return false;
    cur = applyMove(cur, m);
    if (!cur) return false;
  }
  return isSolved(cur);
}

// Solucionador óptimo (BFS). Devuelve la lista de fichas a mover.
export function solve(board: number[]): number[] | null {
  const target = SOLVED.join('');
  const start = board.join('');
  if (start === target) return [];

  const parent = new Map<string, { prev: string; tile: number }>();
  parent.set(start, { prev: '', tile: -1 });
  const queue: string[] = [start];
  let head = 0;

  while (head < queue.length) {
    const s = queue[head++];
    const blank = s.indexOf('0');
    for (let n = 0; n < 9; n++) {
      if (!adjacent(n, blank)) continue;
      const arr = s.split('');
      const tile = Number(arr[n]);
      arr[blank] = arr[n];
      arr[n] = '0';
      const key = arr.join('');
      if (parent.has(key)) continue;
      parent.set(key, { prev: s, tile });
      if (key === target) {
        const path: number[] = [];
        let cur = key;
        while (cur !== start) {
          const p = parent.get(cur)!;
          path.push(p.tile);
          cur = p.prev;
        }
        return path.reverse();
      }
      queue.push(key);
    }
  }
  return null;
}