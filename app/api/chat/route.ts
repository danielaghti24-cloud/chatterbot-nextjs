import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { ChatRequestBody } from '@/types/chat';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Si el modelo elegido está saturado, se prueban estos en orden
const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
];

// Errores que no se arreglan cambiando de modelo: se cortan de inmediato
const FATAL_CODES = ['"code":400', '"code":401', '"code":403'];

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'La API Key de Gemini no está configurada en el servidor.' },
        { status: 500 }
      );
    }

    const { messages, config }: ChatRequestBody = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'El historial de mensajes no puede estar vacío.' },
        { status: 400 }
      );
    }

    const contents = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const primary = config.modelName || 'gemini-3.8-flash';
    const modelsToTry = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];

    let lastError: unknown = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: config.systemInstruction || undefined,
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
            topP: config.topP,
            topK: config.topK,
            httpOptions: { timeout: 15000 },
          },
        });

        const finishReason = response.candidates?.[0]?.finishReason;
        let text = response.text || '';
        if (!text) {
          text =
            finishReason === 'MAX_TOKENS'
              ? '(La respuesta se cortó porque alcanzó el límite de tokens configurado.)'
              : 'Sin respuesta generada por el modelo.';
        }

        console.log(`Respondió el modelo: ${model}`);
        return NextResponse.json({
          text,
          modelUsed: model,
          usageMetadata: response.usageMetadata,
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
    console.error('Error en /api/chat:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Ocurrió un error al procesar la solicitud con Gemini.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}