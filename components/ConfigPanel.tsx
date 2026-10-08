'use client';

import React from 'react';
import { ModelConfig } from '@/types/chat';
import { Settings, Sparkles, BookOpen } from 'lucide-react';

interface ConfigPanelProps {
  config: ModelConfig;
  onChange: (newConfig: ModelConfig) => void;
}

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-sm">
        <label className="font-medium text-slate-300">{props.label}</label>
        <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-indigo-300">
          {props.value}
        </span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(parseFloat(e.target.value))}
        className="accent-indigo-500 w-full cursor-pointer"
      />
    </div>
  );
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
  const set = <K extends keyof ModelConfig>(key: K, value: ModelConfig[K]) =>
    onChange({ ...config, [key]: value });

  return (
    <aside className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-5 flex flex-col gap-6 text-slate-200 overflow-y-auto h-full">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <Settings className="w-5 h-5 text-indigo-400" />
        <h2 className="font-semibold text-lg text-white">Parámetros del Modelo</h2>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium flex items-center gap-1.5 text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400" /> Modelo
        </label>
        <select
  value={config.modelName}
  onChange={(e) => set('modelName', e.target.value)}
  className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
>
  <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
  <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
  <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (más ligero)</option>
</select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium flex items-center gap-1.5 text-slate-300">
          <BookOpen className="w-4 h-4 text-emerald-400" /> System Prompt (Contexto)
        </label>
        <p className="text-xs text-slate-400">
          Define el rol, tono y restricciones del asistente.
        </p>
        <textarea
          rows={4}
          value={config.systemInstruction}
          onChange={(e) => set('systemInstruction', e.target.value)}
          placeholder="Ej: Eres un tutor universitario de desarrollo de software..."
          className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <Slider
        label="Temperatura (Creatividad)"
        value={config.temperature}
        min={0}
        max={2}
        step={0.1}
        onChange={(v) => set('temperature', v)}
      />
      <Slider
        label="Límite de Tokens (Salida)"
        value={config.maxOutputTokens}
        min={64}
        max={4096}
        step={64}
        onChange={(v) => set('maxOutputTokens', Math.round(v))}
      />
      <Slider
        label="Top-P (Nucleus Sampling)"
        value={config.topP}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => set('topP', v)}
      />
      <Slider
        label="Top-K"
        value={config.topK}
        min={1}
        max={100}
        step={1}
        onChange={(v) => set('topK', Math.round(v))}
      />
    </aside>
  );
};