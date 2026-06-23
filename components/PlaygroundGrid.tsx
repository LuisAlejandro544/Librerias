'use client';

import React, { useState } from 'react';
import { Copy, Check, Grid as GridIcon, Settings, Layers } from 'lucide-react';

export default function PlaygroundGrid() {
  const [cols, setCols] = useState(3);
  const [gap, setGap] = useState(6); // Tailwind gap-6 (24px)
  const [align, setAlign] = useState('items-stretch');
  const [itemCount, setItemCount] = useState(6);
  const [copied, setCopied] = useState(false);

  const gapMap: { [key: number]: string } = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
    12: 'gap-12',
  };

  const alignMap: { [key: string]: string } = {
    'items-stretch': 'Estirar (stretch)',
    'items-start': 'Inicio (start)',
    'items-center': 'Centrado (center)',
    'items-end': 'Fin (end)',
  };

  const cssClasses = `grid grid-cols-1 sm:grid-cols-${cols} ${gapMap[gap]} ${align} w-full transition-all duration-300`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssClasses);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="playground-tw-flex-grid" className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Controles del Generador */}
        <div className="w-full md:w-80 bg-[#18181B] border border-[#27272A] p-5 rounded-2xl space-y-6">
          <div className="flex items-center gap-2 text-white font-semibold pb-2 border-b border-[#27272A]">
            <Settings className="w-4 h-4 text-indigo-400" />
            <span>Configuración de UI</span>
          </div>

          {/* Columnas */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-[#A1A1AA] font-medium">Columnas (Escritorio)</label>
              <span className="font-mono bg-[#09090B] text-indigo-300 border border-[#27272A]/80 px-1.5 py-0.5 rounded text-[11px] font-bold">
                {cols}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              className="w-full h-1.5 bg-[#09090B] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-[#71717A] font-mono">
              <span>1 col</span>
              <span>6 cols</span>
            </div>
          </div>

          {/* Espaciado (Gap) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-[#A1A1AA] font-medium">Espacio entre Ítems (Gap)</label>
              <span className="font-mono bg-[#09090B] text-indigo-300 border border-[#27272A]/80 px-1.5 py-0.5 rounded text-[11px] font-bold">
                {gapMap[gap]}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[0, 2, 4, 6, 8, 12].map((g) => (
                <button
                  key={g}
                  id={`btn-gap-${g}`}
                  onClick={() => setGap(g)}
                  className={`flex-1 text-center py-1.5 px-1 rounded-lg border text-xs font-mono transition cursor-pointer min-w-[32px] ${
                    gap === g
                      ? 'border-indigo-500 bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/10'
                      : 'border-[#27272A] bg-[#09090B] text-[#71717A] hover:text-white hover:bg-[#18181B]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Alineación Vertical */}
          <div className="space-y-2">
            <label className="block text-xs text-[#A1A1AA] font-medium">Alineación de Ítems (items-*)</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(alignMap).map((alignment) => (
                <button
                  key={alignment}
                  id={`btn-${alignment}`}
                  onClick={() => setAlign(alignment)}
                  className={`text-[11px] text-left px-2.5 py-2 rounded-lg border transition cursor-pointer ${
                    align === alignment
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold shadow-inner'
                      : 'border-[#27272A] bg-[#09090B] text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B]'
                  }`}
                >
                  {alignMap[alignment]}
                </button>
              ))}
            </div>
          </div>

          {/* Cantidad de elementos */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-[#A1A1AA] font-medium">Cantidad de Cajas</label>
              <span className="font-mono bg-[#09090B] text-indigo-300 border border-[#27272A]/80 px-1.5 py-0.5 rounded text-[11px] font-bold">
                {itemCount}
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="12"
              value={itemCount}
              onChange={(e) => setItemCount(Number(e.target.value))}
              className="w-full h-1.5 bg-[#09090B] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {/* Simulador de Grilla Visible */}
        <div className="flex-1 bg-[#121214] border border-[#27272A] rounded-2xl p-6 flex flex-col justify-between shadow-inner relative min-h-[360px]">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <GridIcon className="w-4 h-4 text-[#71717A]" />
                <span className="text-xs text-[#A1A1AA] font-semibold uppercase tracking-wider font-mono">
                  Contenedor de Renderizado ({itemCount} elementos)
                </span>
              </div>
              <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            </div>

            {/* Layout Generado */}
            <div className={cssClasses}>
              {Array.from({ length: itemCount }).map((_, idx) => {
                const colors = [
                  'from-violet-500/10 to-purple-500/10 border-purple-500/30 text-purple-200',
                  'from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-200',
                  'from-cyan-500/10 to-teal-500/10 border-cyan-500/30 text-cyan-200',
                  'from-rose-500/10 to-pink-500/10 border-rose-500/30 text-rose-200',
                  'from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-200',
                  'from-emerald-500/10 to-green-500/10 border-emerald-500/30 text-emerald-200',
                ];
                const selectedStyle = colors[idx % colors.length];

                return (
                  <div
                    key={idx}
                    className={`bg-gradient-to-br ${selectedStyle} border rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-300 shadow-sm relative`}
                    style={{ minHeight: align === 'items-stretch' ? 'auto' : `${80 + (idx % 3) * 20}px` }}
                  >
                    <span className="text-[10px] font-mono opacity-55 absolute top-2 left-2">0{idx + 1}</span>
                    <Layers className="w-5 h-5 mb-1.5 opacity-80 animate-pulse" />
                    <span className="text-xs font-mono font-medium">Box-{idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generador de código visible */}
          <div className="mt-8 bg-[#09090B] border border-[#27272A] rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-[#71717A] font-mono font-medium block uppercase tracking-wider">
                Utilidades de Tailwind CSS Dinámicas
              </span>
              <code className="text-xs font-mono text-indigo-400 break-all select-all">
                {cssClasses}
              </code>
            </div>
            <button
              id="btn-copy-classes"
              onClick={copyToClipboard}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium cursor-pointer transition whitespace-nowrap shadow-lg shadow-indigo-600/10"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Copiar Clases</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
