import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
const FATAL_CODES = ['"code":400', '"code":401', '"code":403'];

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'La API Key de Gemini no está configurada en el servidor.' },
        { status: 500 }
      );
    }

    const { board, modelName }: { board: number[]; modelName?: string } = await req.json();

    const valid =
      Array.isArray(board) &&
      board.length === 9 &&
      [0, 1, 2, 3, 4, 5, 6, 7, 8].every((n) => board.includes(n));
    if (!valid) {
      return NextResponse.json({ error: 'Tablero inválido.' }, { status: 400 });
    }

    const rows = [0, 1, 2]
      .map((r) =>
        board
          .slice(r * 3, r * 3 + 3)
          .map((n) => (n === 0 ? '_' : String(n)))
          .join(' ')
      )
      .join('\n');

    const prompt = `Resuelve este puzzle deslizante 3x3 (8-puzzle).

Tablero actual (por filas, "_" es el hueco):
${rows}

Tablero meta:
1 2 3
4 5 6
7 8 _

Un movimiento consiste en deslizar al hueco una ficha que esté justo arriba, abajo, a la izquierda o a la derecha de él. Cada movimiento se expresa con el NÚMERO de la ficha que se mueve.
Verifica cada movimiento antes de escribirlo y busca una solución corta.

Responde SOLO con JSON con este formato:
{"moves":[3,6,2],"explanation":"explicación breve en español de la estrategia, máximo 2 frases"}`;

    const primary = modelName || 'gemini-3.8-flash';
    const modelsToTry = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
    let lastError: unknown = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
            httpOptions: { timeout: 40000 },
          },
        });

        const raw = (response.text || '').replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed.moves)) throw new Error('Respuesta sin movimientos');

        console.log(`Puzzle resuelto con: ${model}`);
        return NextResponse.json({
          moves: parsed.moves,
          explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
          modelUsed: model,
        });
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Falló ${model}: ${msg.slice(0, 120)}`);
        if (FATAL_CODES.some((c) => msg.includes(c))) throw err;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    throw lastError ?? new Error('Todos los modelos fallaron.');
  } catch (error: unknown) {
    console.error('Error en /api/puzzle:', error);
    const message = error instanceof Error ? error.message : 'Error al resolver el puzzle.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}