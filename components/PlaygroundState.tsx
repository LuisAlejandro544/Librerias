'use client';

import React, { useState } from 'react';
import { Undo2, Redo2, Plus, Minus, RotateCcw, Play, Check, Settings, Code } from 'lucide-react';

interface StateSnapshot {
  count: number;
  items: string[];
  action: string;
}

const PRESET_TUTORIALS = [
  'Tomar Café ☕',
  'Aprender Rust 🦀',
  'Mejorar Perf de CSS ⚡',
  'Escribir Tests Unitarios 🧪',
  'Lanzar a Producción 🚀',
  'Refactorizar Modularmente 🧩',
];

export default function PlaygroundState() {
  const [history, setHistory] = useState<StateSnapshot[]>([
    { count: 0, items: ['Inicializar Store 📦'], action: 'INITIAL_STATE' }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentState = history[currentIndex];

  const dispatchAction = (newCount: number, newItems: string[], actionName: string) => {
    // Si estamos en medio del viaje en el tiempo (index < history.length - 1), 
    // cortamos la rama futura antes de añadir la nueva acción (comportamiento estándar Redux/Git)
    const activeHistory = history.slice(0, currentIndex + 1);
    
    const newSnapshot: StateSnapshot = {
      count: newCount,
      items: newItems,
      action: actionName
    };

    const updatedHistory = [...activeHistory, newSnapshot].slice(-10); // Límite de 10 estados para RAM inteligente
    setHistory(updatedHistory);
    setCurrentIndex(updatedHistory.length - 1);
  };

  const handleIncrement = () => {
    dispatchAction(currentState.count + 1, currentState.items, 'INCREMENTAR_CONTADOR (+1)');
  };

  const handleDecrement = () => {
    dispatchAction(currentState.count - 1, currentState.items, 'DECREMENTAR_CONTADOR (-1)');
  };

  const handleAddItem = () => {
    const randomItem = PRESET_TUTORIALS[Math.floor(Math.random() * PRESET_TUTORIALS.length)];
    const idItem = `${randomItem} (#${currentState.items.length + 1})`;
    dispatchAction(currentState.count, [...currentState.items, idItem], `AÑADIR_ITEM ("${randomItem}")`);
  };

  const handleClear = () => {
    dispatchAction(0, [], 'LIMPIAR_TODO 🧹');
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleRedo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div id="playground-state-flow" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lado izquierdo: consola de acciones y controles */}
        <div className="lg:col-span-5 bg-[#18181B] border border-[#27272A] p-5 rounded-2xl flex flex-col justify-between space-y-6 text-white">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272A]">
              <span className="text-white font-semibold flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4 text-indigo-400" />
                Despachar Acciones
              </span>
              <button
                id="btn-clear-state"
                onClick={handleClear}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" />
                Limpiar Todo
              </button>
            </div>

            {/* Mutadores de Estado directos */}
            <div className="space-y-4">
              {/* Contador */}
              <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-3 flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-xs font-semibold text-white">Contador Sincrónico</h4>
                  <p className="text-[10px] text-[#71717A]">Muta el state numérico reactivo</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-state-decrement"
                    onClick={handleDecrement}
                    className="p-1.5 rounded-lg border border-[#27272A] bg-[#18181B] hover:bg-[#27272A] transition cursor-pointer text-[#A1A1AA]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-sm text-indigo-300">
                    {currentState.count}
                  </span>
                  <button
                    id="btn-state-increment"
                    onClick={handleIncrement}
                    className="p-1.5 rounded-lg border border-[#27272A] bg-[#18181B] hover:bg-[#27272A] transition cursor-pointer text-[#A1A1AA]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-3 flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-xs font-semibold text-white">Array Inmutable: Items</h4>
                  <p className="text-[10px] text-[#71717A]">Añade hilos e ítems a la cola</p>
                </div>
                <button
                  id="btn-state-add-item"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-2 rounded-lg cursor-pointer transition shadow-md shadow-indigo-650/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Ítem</span>
                </button>
              </div>
            </div>

            {/* Time Travel Controls */}
            <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-4 space-y-4">
              <span className="text-[10px] text-[#71717A] font-mono font-semibold block uppercase tracking-wider">
                Control de Historial (Time Travel)
              </span>

              <div className="flex items-center justify-between">
                <button
                  id="btn-state-undo"
                  onClick={handleUndo}
                  disabled={currentIndex === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-[#27272A] rounded-lg text-xs font-medium bg-[#18181B] hover:bg-[#27272A] disabled:opacity-20 cursor-pointer transition text-white"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Deshacer</span>
                </button>
                <div className="w-4" />
                <button
                  id="btn-state-redo"
                  onClick={handleRedo}
                  disabled={currentIndex === history.length - 1}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-[#27272A] rounded-lg text-xs font-medium bg-[#18181B] hover:bg-[#27272A] disabled:opacity-20 cursor-pointer transition text-white"
                >
                  <span>Rehacer</span>
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Slider de viaje en el tiempo */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-[#A1A1AA]">
                  <span>Paso {currentIndex + 1} de {history.length}</span>
                  <span className="text-indigo-400 font-semibold">{currentState.action}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={history.length - 1}
                  value={currentIndex}
                  onChange={(e) => setCurrentIndex(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#18181B] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Historial de logs */}
          <div className="space-y-2 pt-2 border-t border-[#27272A]">
            <span className="text-[10px] text-[#71717A] font-semibold uppercase tracking-wider block">
              Pila de Estados (Recientes primero)
            </span>
            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
              {[...history].reverse().map((snap, revIdx) => {
                const origIdx = history.length - 1 - revIdx;
                const isActive = origIdx === currentIndex;

                return (
                  <button
                    key={origIdx}
                    id={`btn-history-snap-${origIdx}`}
                    onClick={() => setCurrentIndex(origIdx)}
                    className={`w-full text-left p-2 rounded-lg border text-xs flex items-center justify-between transition cursor-pointer ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-medium'
                        : 'border-[#27272A] bg-[#09090B] text-[#71717A] hover:text-white hover:bg-[#18181B]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] bg-[#18181B] border border-[#27272A] px-1 py-0.5 rounded text-[#A1A1AA]">
                        t-{origIdx}
                      </span>
                      <span className="truncate">{snap.action}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lado derecho: renderizador visual del estado y renderizador de código */}
        <div className="lg:col-span-7 bg-[#121214] border border-[#27272A] text-[#FAFAFA] rounded-2xl p-6 flex flex-col justify-between shadow-lg relative min-h-[440px]">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="text-xs text-[#A1A1AA] font-bold uppercase tracking-wider font-mono">
                  Estado Activo en Producción (state-flow)
                </span>
              </div>
              <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded font-mono font-semibold">
                HISTORIAL HABILITADO
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vista visual de la UI mutada */}
              <div className="bg-[#09090B]/60 p-4 border border-[#27272A] rounded-xl space-y-4">
                <span className="text-[10px] text-[#71717A] font-mono font-semibold block uppercase">
                  UI Renderizada React
                </span>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#18181B] border border-[#27272A] rounded-xl">
                    <span className="text-xs text-[#71717A]">Contador</span>
                    <span className="text-2xl font-bold font-mono text-white">{currentState.count}</span>
                  </div>

                  <div className="space-y-1.5 h-[180px] overflow-y-auto pr-1">
                    <span className="text-[10px] text-[#71717A] font-mono block">Items del Array</span>
                    {currentState.items.length === 0 ? (
                      <div className="text-center py-8 text-[#71717A] text-xs italic">
                        Array vacío. Añade algún elemento.
                      </div>
                    ) : (
                      currentState.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-[#18181B] px-3 py-1.5 rounded-lg border border-[#27272A] text-[11px] font-mono flex items-center justify-between animate-fade-in"
                        >
                          <span className="text-[#A1A1AA]">{item}</span>
                          <span className="text-[9px] text-[#71717A]">idx: {idx}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Vista técnica de los datos del State JSON */}
              <div className="bg-[#09090B]/60 p-4 border border-[#27272A] rounded-xl flex flex-col justify-between h-full">
                <div className="space-y-2">
                  <span className="text-[10px] text-[#71717A] font-mono font-semibold block uppercase flex items-center gap-1">
                    <Code className="w-3 h-3" />
                    Store State JSON (Inmutable)
                  </span>
                  <pre className="text-xs text-indigo-300 font-mono p-2.5 rounded-lg bg-[#18181B]/80 border border-[#27272A] overflow-x-auto select-all max-h-[190px] leading-relaxed">
                    {JSON.stringify(
                      {
                        count: currentState.count,
                        items: currentState.items,
                        metaCount: currentState.items.length,
                        lastAction: currentState.action,
                        historyStepsLeft: history.length - 1 - currentIndex,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
                <div className="text-[10px] text-[#71717A] font-mono pt-3 border-t border-[#27272A]">
                  *Cada dispatch genera un clon inmutable, guardando la diferencia en la pila.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-[10px] text-[#71717A] text-center font-mono">
            ¿Quieres probar el viaje en el tiempo? Muta la pila de arriba, luego desliza el control.
          </div>
        </div>
      </div>
    </div>
  );
}
